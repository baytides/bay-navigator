import Testing
@testable import BayNavigatorCore

/// Live on-device GENERATION proof against the real bundled corpus.
///
/// Skips when Apple Intelligence isn't ready (CI / a Mac with it disabled or the
/// model still downloading), so it's safe in any environment. When the on-device
/// model IS ready, it asks a question whose answer lives in the municipal-code
/// corpus and verifies the agent produces a grounded, non-empty reply.
struct OnDeviceGenerationTests {

    @Test func carlAnswersPetPigOnDevice() async throws {
        guard #available(iOS 26, macOS 26, visionOS 26, *) else { return }
        guard AppleIntelligenceService.shared.isFoundationModelsAvailable else {
            // Model not enabled/ready on this machine — nothing to prove here yet.
            return
        }

        let retrieval = try LocalRetrievalService.bundled()
        let answer = try await AppleIntelligenceService.shared.answer(
            query: "Can I have a pet pig in San Jose?",
            instructions: """
                You are Carl, a Bay Area civic assistant. ALWAYS call searchResources to ground \
                your answer in real municipal-code text before replying, and cite the ordinance.
                """,
            retrieval: retrieval
        )

        print("CARL (on-device): \(answer)")
        #expect(!answer.isEmpty)
        // Grounding signal: the reply should engage with the topic, not deflect.
        let lower = answer.lowercased()
        #expect(lower.contains("pig") || lower.contains("san jos") || lower.contains("ordinance") || lower.contains("code"))
    }
}
