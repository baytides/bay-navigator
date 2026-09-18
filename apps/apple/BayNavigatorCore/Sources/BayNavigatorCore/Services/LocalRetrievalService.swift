import Foundation
import GRDB

/// A single retrieved record from the on-device corpus.
public struct RetrievedResource: Sendable, Equatable {
    public let id: String
    public let type: String
    public let title: String
    public let body: String
    public let category: String
    public let area: String
    public let city: String
    public let url: String
    public let metaJSON: String
}

/// On-device retrieval over the bundled Knowledge Pack corpus (SQLite + FTS5).
///
/// This is the Swift twin of the Phase 1 `searchCorpus` contract in
/// `scripts/generate/lib/knowledge-pack.cjs`. Keep the behavior identical:
///   - search fields ranked title > keywords > body (bm25 column weights)
///   - optional category / area filters
///   - OR + prefix token matching, lexical only (typos handled by the LLM step)
///   - blank query returns []
/// If the weights or tokenization drift from the JS builder, the two platforms
/// will retrieve differently — they must stay in sync.
public final class LocalRetrievalService: Sendable {
    private let dbQueue: DatabaseQueue
    /// SQLite schema names of attached ordinance packs, with the jurisdiction
    /// slug each one covers, so a city-scoped search can skip the rest.
    private let attached: [(schema: String, slug: String)]

    // Column order in `resources_fts`: id(UNINDEXED), title, keywords, body, category.
    // Higher weight => stronger contribution. Mirrors BM25_WEIGHTS in the JS builder.
    private static let bm25Weights = "0.0, 10.0, 5.0, 1.0, 1.0"

    /// Inject a database (used in tests and for in-memory corpora).
    public init(dbQueue: DatabaseQueue, attached: [(schema: String, slug: String)] = []) throws {
        self.dbQueue = dbQueue
        self.attached = attached
    }

    /// Open the core corpus read-only, with the ordinance packs the person chose
    /// to download attached alongside it.
    ///
    /// A pack that cannot be opened (deleted mid-session, half-finished
    /// download, corrupt file) is dropped before it is ever attached: losing one
    /// city's ordinances should degrade that one answer, not take the whole
    /// assistant down with it.
    ///
    /// ATTACH runs in `prepareDatabase` rather than through `write`, because the
    /// connection is read-only and GRDB refuses writes on it — the attach has to
    /// happen as part of opening the connection, not as a statement against it.
    public convenience init(databaseURL: URL, ordinancePacks: [URL] = []) throws {
        let usable = ordinancePacks.filter { Self.isReadableCorpus($0) }
        let attached = usable.enumerated().map { (i, pack) in
            (schema: "ord_\(i)", slug: pack.deletingPathExtension().lastPathComponent)
        }

        var config = Configuration()
        config.readonly = true
        config.prepareDatabase { db in
            for (pair, pack) in zip(attached, usable) {
                try db.execute(sql: "ATTACH DATABASE ? AS \(pair.schema)", arguments: [pack.path])
            }
        }
        let queue = try DatabaseQueue(path: databaseURL.path, configuration: config)
        try self.init(dbQueue: queue, attached: attached)
    }

    /// Can this file be opened as a corpus pack? Guards the attach list so a
    /// truncated download cannot make every later query fail with a missing
    /// schema.
    static func isReadableCorpus(_ url: URL) -> Bool {
        guard FileManager.default.fileExists(atPath: url.path) else { return false }
        var config = Configuration()
        config.readonly = true
        do {
            let probe = try DatabaseQueue(path: url.path, configuration: config)
            return try probe.read { db in
                try db.tableExists("resources")
            }
        } catch {
            return false
        }
    }

    public enum RetrievalError: Error { case corpusNotFound }

    /// Open the corpus.sqlite bundled in the package resources.
    public static func bundled() throws -> LocalRetrievalService {
        guard let url = Bundle.module.url(forResource: "corpus", withExtension: "sqlite") else {
            throw RetrievalError.corpusNotFound
        }
        return try LocalRetrievalService(databaseURL: url)
    }

    /// Sanitize free text into a safe FTS5 MATCH expression (lexical, OR + prefix).
    /// Returns nil for a blank/non-alphanumeric query.
    static func matchExpression(for query: String) -> String? {
        let tokens = query
            .lowercased()
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { !$0.isEmpty }
        guard !tokens.isEmpty else { return nil }
        return tokens.map { "\($0)*" }.joined(separator: " OR ")
    }

    public func search(
        _ query: String,
        category: String? = nil,
        area: String? = nil,
        city: String? = nil,
        limit: Int = 10
    ) throws -> [RetrievedResource] {
        guard let match = Self.matchExpression(for: query) else { return [] }

        // A city filter means no other jurisdiction's pack can contribute a row,
        // so don't pay to query them. This is what keeps "I downloaded the whole
        // Bay Area" from costing 100+ subqueries to answer one city's question.
        let wanted = (city?.isEmpty == false) ? OrdinanceCatalog.slugify(city!) : nil
        let schemas = ["main"] + attached.filter { wanted == nil || $0.slug == wanted }.map(\.schema)

        var branches: [String] = []
        var args: [DatabaseValueConvertible] = []
        for schema in schemas {
            var clauses = ["resources_fts MATCH ?"]
            args.append(match)
            if let category {
                clauses.append("r.category = ?")
                args.append(category)
            }
            if let area {
                clauses.append("r.area = ?")
                args.append(area)
            }
            // Jurisdiction scoping: municipal codes are city-specific, so they
            // must match the requested city; resources and state codes stay
            // city-agnostic.
            if let city, !city.isEmpty {
                clauses.append("(r.type != 'muni_code' OR LOWER(r.city) = LOWER(?))")
                args.append(city)
            }
            // NOTE: the FTS table is qualified in FROM/JOIN but bare in MATCH and
            // bm25() — FTS5 resolves those against the FROM item's name, and a
            // qualified or aliased form there is a "no such column" error.
            branches.append("""
                SELECT r.id, r.type, r.title, r.body, r.category, r.area, r.city, r.url, r.meta,
                       bm25(resources_fts, \(Self.bm25Weights)) AS score
                FROM \(schema).resources_fts
                JOIN \(schema).resources r ON r.id = \(schema).resources_fts.id
                WHERE \(clauses.joined(separator: " AND "))
                """)
        }
        args.append(limit)

        let sql = branches.joined(separator: "\nUNION ALL\n") + "\nORDER BY score LIMIT ?"

        return try dbQueue.read { db in
            try Row.fetchAll(db, sql: sql, arguments: StatementArguments(args)).map { row in
                RetrievedResource(
                    id: row["id"],
                    type: row["type"] ?? "",
                    title: row["title"] ?? "",
                    body: row["body"] ?? "",
                    category: row["category"] ?? "",
                    area: row["area"] ?? "",
                    city: row["city"] ?? "",
                    url: row["url"] ?? "",
                    metaJSON: row["meta"] ?? "{}"
                )
            }
        }
    }
}
