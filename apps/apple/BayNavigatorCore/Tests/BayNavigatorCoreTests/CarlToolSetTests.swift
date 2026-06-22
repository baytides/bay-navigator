import Testing
import GRDB
@testable import BayNavigatorCore

struct CarlToolSetTests {

    @Test func includesSearchAndTransitTools() throws {
        guard #available(iOS 26, macOS 26, visionOS 26, *) else { return }
        let retrieval = try LocalRetrievalService(dbQueue: makeTestCorpus())
        let names = AppleIntelligenceService.shared.carlTools(retrieval: retrieval).map { $0.name }
        #expect(names.contains("searchResources"))
        #expect(names.contains("transitDirections"))
    }
}
