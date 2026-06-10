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
public final class LocalRetrievalService {
    private let dbQueue: DatabaseQueue

    // Column order in `resources_fts`: id(UNINDEXED), title, keywords, body, category.
    // Higher weight => stronger contribution. Mirrors BM25_WEIGHTS in the JS builder.
    private static let bm25Weights = "0.0, 10.0, 5.0, 1.0, 1.0"

    /// Inject a database (used in tests and for in-memory corpora).
    public init(dbQueue: DatabaseQueue) throws {
        self.dbQueue = dbQueue
    }

    /// Open the bundled corpus.sqlite read-only.
    public convenience init(databaseURL: URL) throws {
        var config = Configuration()
        config.readonly = true
        let queue = try DatabaseQueue(path: databaseURL.path, configuration: config)
        try self.init(dbQueue: queue)
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
        limit: Int = 10
    ) throws -> [RetrievedResource] {
        guard let match = Self.matchExpression(for: query) else { return [] }

        var clauses = ["resources_fts MATCH ?"]
        var args: [DatabaseValueConvertible] = [match]
        if let category {
            clauses.append("r.category = ?")
            args.append(category)
        }
        if let area {
            clauses.append("r.area = ?")
            args.append(area)
        }
        args.append(limit)

        let sql = """
            SELECT r.id, r.type, r.title, r.body, r.category, r.area, r.city, r.url, r.meta
            FROM resources_fts
            JOIN resources r ON r.id = resources_fts.id
            WHERE \(clauses.joined(separator: " AND "))
            ORDER BY bm25(resources_fts, \(Self.bm25Weights))
            LIMIT ?
            """

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
