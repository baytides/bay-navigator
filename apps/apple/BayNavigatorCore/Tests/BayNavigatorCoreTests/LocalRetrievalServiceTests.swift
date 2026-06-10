import Testing
import GRDB
@testable import BayNavigatorCore

/// Tests for the on-device retrieval layer. This MUST mirror the Phase 1
/// `searchCorpus` contract in scripts/generate/lib/knowledge-pack.cjs:
/// bm25 weights title>keywords>body, category/area filters, OR+prefix tokens,
/// lexical only, blank query -> [].
struct LocalRetrievalServiceTests {

    /// Build an in-memory corpus with the SAME schema the Phase 1 builder emits.
    private func makeCorpus() throws -> DatabaseQueue {
        let dbQueue = try DatabaseQueue()
        try dbQueue.write { db in
            try db.execute(sql: """
                CREATE TABLE resources (
                  id TEXT PRIMARY KEY, type TEXT, title TEXT, body TEXT, category TEXT,
                  area TEXT, city TEXT, keywords TEXT, url TEXT, lat REAL, lon REAL, meta TEXT
                );
                CREATE VIRTUAL TABLE resources_fts USING fts5(
                  id UNINDEXED, title, keywords, body, category
                );
                """)
            let rows: [(String, String, String, String, String, String, String, String)] = [
                // id, type, title, body, category, area, city, keywords
                ("food1", "resource", "Alameda County Food Bank", "free groceries and emergency food", "Food", "Alameda", "Oakland", "food, groceries"),
                ("food2", "resource", "Community Pantry", "food distribution every saturday", "Food", "SF", "San Francisco", "food, pantry"),
                ("rec1", "resource", "Bike Repair Co-op", "fix your bicycle with volunteer help", "Recreation", "SF", "San Francisco", "bike, repair"),
            ]
            for r in rows {
                try db.execute(sql: """
                    INSERT INTO resources (id,type,title,body,category,area,city,keywords,url,lat,lon,meta)
                    VALUES (?,?,?,?,?,?,?,?, '', NULL, NULL, '{}')
                    """, arguments: [r.0, r.1, r.2, r.3, r.4, r.5, r.6, r.7])
                try db.execute(sql: """
                    INSERT INTO resources_fts (id,title,keywords,body,category) VALUES (?,?,?,?,?)
                    """, arguments: [r.0, r.2, r.7, r.3, r.4])
            }
        }
        return dbQueue
    }

    @Test func findsMatchesAndExcludesNonMatches() throws {
        let service = try LocalRetrievalService(dbQueue: makeCorpus())
        let hits = try service.search("food")
        #expect(hits.count >= 2)
        #expect(hits.contains { $0.id == "food1" })
        #expect(!hits.contains { $0.id == "rec1" })
    }

    @Test func ranksTitleMatchAboveBodyMatch() throws {
        let dbQueue = try makeCorpus()
        try dbQueue.write { db in
            // "bank" is in food1's TITLE; add a record where it's only in the body.
            try db.execute(sql: "INSERT INTO resources (id,type,title,body,category,area,city,keywords,url,lat,lon,meta) VALUES ('z','resource','Generic Service','we mention bank in passing','Other','','','', '', NULL, NULL, '{}')")
            try db.execute(sql: "INSERT INTO resources_fts (id,title,keywords,body,category) VALUES ('z','Generic Service','','we mention bank in passing','Other')")
        }
        let service = try LocalRetrievalService(dbQueue: dbQueue)
        let hits = try service.search("bank")
        #expect(hits.first?.id == "food1")
    }

    @Test func honorsCategoryFilter() throws {
        let service = try LocalRetrievalService(dbQueue: makeCorpus())
        #expect(try service.search("food", category: "Recreation").isEmpty)
    }

    @Test func honorsAreaFilterAndLimit() throws {
        let service = try LocalRetrievalService(dbQueue: makeCorpus())
        let alameda = try service.search("food", area: "Alameda")
        #expect(alameda.allSatisfy { $0.area == "Alameda" })
        #expect(try service.search("food", limit: 1).count == 1)
    }

    @Test func blankQueryReturnsEmpty() throws {
        let service = try LocalRetrievalService(dbQueue: makeCorpus())
        #expect(try service.search("   ").isEmpty)
        #expect(try service.search("").isEmpty)
    }

    @Test func toleratesFTS5SpecialCharacters() throws {
        let service = try LocalRetrievalService(dbQueue: makeCorpus())
        // Must not throw on quotes/parens (Phase 1 sanitizes to alphanumeric tokens).
        _ = try service.search("food \"near\" me (oakland)")
    }

    @Test func matchesAnyTokenWithOrSemantics() throws {
        let service = try LocalRetrievalService(dbQueue: makeCorpus())
        let ids = try service.search("bicycle groceries").map { $0.id }
        #expect(ids.contains("rec1"))
        #expect(ids.contains("food1"))
    }
}
