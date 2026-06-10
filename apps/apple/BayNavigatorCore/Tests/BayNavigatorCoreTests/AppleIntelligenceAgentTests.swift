import Testing
@testable import BayNavigatorCore

struct AppleIntelligenceAgentTests {

    /// Verifies the on-device agent is wired end-to-end. Robust to both states:
    /// - Apple Intelligence enabled -> returns a non-empty grounded answer.
    /// - Apple Intelligence disabled (e.g. CI / this dev Mac) -> throws .notAvailable
    ///   so the caller can fall back to the remote pipeline.
    @Test func answerEitherGeneratesOrSignalsUnavailable() async throws {
        guard #available(iOS 26, macOS 26, visionOS 26, *) else { return }
        let service = try LocalRetrievalService(dbQueue: makeTestCorpus())
        do {
            let out = try await AppleIntelligenceService.shared.answer(
                query: "food bank",
                instructions: "Answer concisely using the search tool.",
                retrieval: service
            )
            #expect(!out.isEmpty)
        } catch let error as AppleIntelligenceError {
            #expect({ if case .notAvailable = error { return true } else { return false } }(),
                    "expected .notAvailable, got \(error)")
        }
    }
}
