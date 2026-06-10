import Foundation
import GRDB

/// Shared in-memory corpus for tests, using the SAME schema the Phase 1 builder emits.
func makeTestCorpus() throws -> DatabaseQueue {
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
        let rows: [(String, String, String, String, String, String, String, String, String)] = [
            // id, type, title, body, category, area, city, keywords, url
            ("food1", "resource", "Alameda County Food Bank", "free groceries and emergency food", "Food", "Alameda", "Oakland", "food, groceries", "https://accfb.org"),
            ("food2", "resource", "Community Pantry", "food distribution every saturday", "Food", "SF", "San Francisco", "food, pantry", ""),
            ("rec1", "resource", "Bike Repair Co-op", "fix your bicycle with volunteer help", "Recreation", "SF", "San Francisco", "bike, repair", ""),
        ]
        for r in rows {
            try db.execute(sql: """
                INSERT INTO resources (id,type,title,body,category,area,city,keywords,url,lat,lon,meta)
                VALUES (?,?,?,?,?,?,?,?,?, NULL, NULL, '{}')
                """, arguments: [r.0, r.1, r.2, r.3, r.4, r.5, r.6, r.7, r.8])
            try db.execute(sql: """
                INSERT INTO resources_fts (id,title,keywords,body,category) VALUES (?,?,?,?,?)
                """, arguments: [r.0, r.2, r.7, r.3, r.4])
        }
    }
    return dbQueue
}
