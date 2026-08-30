// AppleIntelligenceServiceTests
//
// Regression tests for the pure, deterministic logic in AppleIntelligenceService.
// These guard the intent-detection contract while the FoundationModels integration
// is migrated to the OS 26/27 API generation. The model-backed paths
// (processWithFoundationModels / summarize-via-model) are hardware/OS dependent and
// are covered by compilation here; deterministic unit coverage for them requires
// dependency injection (roadmap Track A).

import Testing
import Foundation
@testable import BayNavigatorCore

@Suite("AppleIntelligenceService intent detection")
struct AppleIntelligenceServiceTests {

    @Test("detects a reminder intent")
    func detectsReminder() {
        let intent = AppleIntelligenceService.shared.detectIntent(in: "remind me to call mom")
        guard case .setReminder = intent else {
            Issue.record("expected .setReminder, got \(intent)")
            return
        }
    }

    @Test("detects a timer intent and parses its duration")
    func detectsTimerDuration() {
        let intent = AppleIntelligenceService.shared.detectIntent(in: "set a timer for 5 minutes")
        guard case let .setTimer(duration) = intent else {
            Issue.record("expected .setTimer, got \(intent)")
            return
        }
        #expect(duration == 300)
    }

    @Test("returns .none for a plain civic question")
    func returnsNoneForCivicQuestion() {
        let intent = AppleIntelligenceService.shared.detectIntent(in: "what programs help with rent?")
        guard case .none = intent else {
            Issue.record("expected .none, got \(intent)")
            return
        }
    }

    @Test("availability accessor is total and does not crash")
    func availabilityAccessorIsTotal() {
        // Exercises the modernized FoundationModels availability path; the value is
        // hardware/OS dependent, so we only assert the call returns without trapping.
        _ = AppleIntelligenceService.shared.isFoundationModelsAvailable
    }
}
