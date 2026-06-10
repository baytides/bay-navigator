import Testing
import GRDB
@testable import BayNavigatorCore

struct SearchResourcesToolTests {

    @Test func returnsMatchingResourcesAsCitableText() async throws {
        guard #available(iOS 26, macOS 26, visionOS 26, *) else { return }
        let service = try LocalRetrievalService(dbQueue: makeTestCorpus())
        let tool = SearchResourcesTool(retrieval: service)
        let output = try await tool.call(arguments: .init(query: "food", category: nil))
        #expect(output.contains("Alameda County Food Bank"))
        #expect(!output.contains("Bike Repair Co-op"))
    }

    @Test func honorsCategoryArgument() async throws {
        guard #available(iOS 26, macOS 26, visionOS 26, *) else { return }
        let service = try LocalRetrievalService(dbQueue: makeTestCorpus())
        let tool = SearchResourcesTool(retrieval: service)
        let output = try await tool.call(arguments: .init(query: "food", category: "Recreation"))
        // No "food" match within Recreation -> must not surface a food result.
        #expect(!output.contains("Alameda County Food Bank"))
    }

    @Test func exposesNameAndDescription() throws {
        guard #available(iOS 26, macOS 26, visionOS 26, *) else { return }
        let service = try LocalRetrievalService(dbQueue: makeTestCorpus())
        let tool = SearchResourcesTool(retrieval: service)
        #expect(tool.name == "searchResources")
        #expect(!tool.description.isEmpty)
    }
}
