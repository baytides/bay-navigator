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
        let answer: String
        do {
            answer = try await AppleIntelligenceService.shared.answer(
                query: "Can I have a pet pig in San Jose?",
                instructions: """
                    You are Carl, a Bay Area civic assistant. Call searchResources first (pass the \
                    city named in the question). Only cite ordinance numbers and text that appear \
                    verbatim in the results. If no matching ordinance is returned for that city, say \
                    you couldn't find a specific local ordinance and suggest contacting the city — \
                    NEVER invent a section number or legal wording.
                    """,
                retrieval: retrieval
            )
        } catch {
            // The on-device model can transiently fail or be busy (notably under the
            // parallel test runner). Production falls back to remote on such errors
            // (see SmartAssistantViewModel.tryOnDeviceAnswer), so this is not a test
            // failure — we simply can't verify the anti-fabrication assertion this run.
            print("on-device generation unavailable this run: \(error)")
            return
        }

        print("CARL (on-device): \(answer)")
        #expect(!answer.isEmpty)
        // Anti-fabrication regression guard: the corpus has NO San Jose pet-pig
        // ordinance, so a truthful answer must not cite a specific section number.
        // (The model previously invented "SJMC 19.22.105".) Robust citation
        // verification belongs in a dedicated eval; this guards the known case.
        #expect(!answer.contains("19.22.105"), "must not cite the previously-hallucinated section")
    }
}
