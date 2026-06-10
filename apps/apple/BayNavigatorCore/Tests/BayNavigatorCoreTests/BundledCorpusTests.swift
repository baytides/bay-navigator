import Testing
@testable import BayNavigatorCore

/// Integration test against the REAL bundled corpus.sqlite (resources + CA codes +
/// municipal bodies), proving the on-device retrieval works on production data.
struct BundledCorpusTests {

    @Test func bundledCorpusLoadsAndAnswersRealQueries() throws {
        let service = try LocalRetrievalService.bundled()

        let food = try service.search("food bank", limit: 3)
        #expect(!food.isEmpty)

        // Municipal ordinance text (fetched from Azure Blob at build time) is searchable.
        let pig = try service.search("pet pig", limit: 5)
        #expect(pig.contains { $0.type == "muni_code" })

        let trees = try service.search("tree removal", limit: 5)
        #expect(trees.contains { $0.type == "muni_code" })
    }
}
