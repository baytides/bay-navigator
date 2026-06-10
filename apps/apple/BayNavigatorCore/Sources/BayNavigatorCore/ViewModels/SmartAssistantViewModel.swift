import Foundation
import SwiftUI

/// View model for Smart Assistant chat functionality
@Observable
public final class SmartAssistantViewModel {
    private let assistantService = SmartAssistantService.shared
    private let safetyService = SafetyService.shared
    private let appleIntelligence = AppleIntelligenceService.shared
    private let intentHandler = IntentActionHandler.shared

    public var messages: [ChatMessage] = []
    public var inputText: String = ""
    public var isLoading: Bool = false
    public var showCrisisAlert: Bool = false
    public var detectedCrisisType: CrisisType?
    public var useTor: Bool = false  // Whether to route requests through Tor

    // Apple Intelligence state
    public var useOnDeviceAI: Bool = true  // Prefer on-device when available
    public var pendingIntentAction: IntentActionResult?
    public var showIntentConfirmation: Bool = false

    // Profile context for personalized responses
    private var userPrefs: UserPrefsViewModel?

    private var conversationHistory: [[String: String]] = []

    /// Whether Apple Intelligence Foundation Models are available
    public var isAppleIntelligenceAvailable: Bool {
        appleIntelligence.isFoundationModelsAvailable
    }

    public init() {
        // Add welcome message with device-appropriate greeting
        let welcomeMessage: String
        if appleIntelligence.isFoundationModelsAvailable {
            welcomeMessage = "Hi! I'm Carl, your Bay Area benefits guide. I can help you find programs for food, healthcare, housing, utilities, and more.\n\nI'm running with Apple Intelligence for faster, more private responses. What can I help you with today?"
        } else {
            welcomeMessage = "Hi! I'm Carl, your Bay Area benefits guide. I can help you find programs for food, healthcare, housing, utilities, and more.\n\nWhat can I help you with today?"
        }

        messages.append(ChatMessage(
            role: .assistant,
            content: welcomeMessage
        ))
    }

    /// Set user preferences for personalized context
    public func setUserPreferences(_ prefs: UserPrefsViewModel) {
        self.userPrefs = prefs
    }

    public var quickPrompts: [String] {
        ["Food assistance", "Utility bill help", "Healthcare"]
    }

    /// Configure Tor for Ask Carl
    public func configureTor(enabled: Bool, host: String = "127.0.0.1", port: Int = 9050) async {
        useTor = enabled
        if enabled {
            await assistantService.configureTorProxy(host: host, port: port)
        } else {
            await assistantService.disableTorProxy()
        }
    }

    @MainActor
    public func sendMessage(_ overrideMessage: String? = nil) async {
        let message = overrideMessage ?? inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !message.isEmpty, !isLoading else { return }

        inputText = ""

        // Check for crisis keywords
        if let crisisType = await assistantService.detectCrisis(message) {
            detectedCrisisType = crisisType
            showCrisisAlert = true
        }

        // Check for system action intents (reminders, timers, etc.)
        let detectedIntent = appleIntelligence.detectIntent(in: message)
        if case .none = detectedIntent {
            // No system intent, proceed with normal flow
        } else {
            // Handle the system intent
            await handleSystemIntent(detectedIntent, originalMessage: message)
            return
        }

        // Add user message
        messages.append(ChatMessage(role: .user, content: message))
        isLoading = true

        // Build profile context if user has opted in
        let profileContext = await buildProfileContext()

        // 1) Prefer the on-device agent (no network: privacy + latency). Falls
        //    through to the remote pipeline if unavailable or it fails.
        if let onDeviceAnswer = await tryOnDeviceAnswer(message, profileContext: profileContext) {
            recordHistory(user: message, assistant: onDeviceAnswer)
            messages.append(ChatMessage(
                role: .assistant,
                content: onDeviceAnswer,
                tier: "apple_intelligence"
            ))
            isLoading = false
            return
        }

        // 2) Remote fallback (existing tiered pipeline; Tor/domain-fronting preserved)
        do {
            let result = try await assistantService.search(
                query: message,
                conversationHistory: conversationHistory,
                useTor: useTor,
                profileContext: profileContext
            )

            recordHistory(user: message, assistant: result.message)

            // Add assistant response with programs (genuine remote tier)
            messages.append(ChatMessage(
                role: .assistant,
                content: result.message,
                programs: result.programs,
                tier: result.tier
            ))
        } catch SmartAssistantError.torNotConfigured {
            messages.append(ChatMessage(
                role: .assistant,
                content: "Tor is enabled but not configured. Please check that Tor is running on your device, or disable Tor in Privacy settings to use standard connection.",
                isError: true
            ))
        } catch {
            messages.append(ChatMessage(
                role: .assistant,
                content: "I'm sorry, I'm having trouble connecting right now. Please try searching the programs directly or try again later.",
                isError: true
            ))
        }

        isLoading = false
    }

    // MARK: - On-device agent

    /// Attempt a grounded answer from the on-device FoundationModels agent.
    /// Returns nil when on-device AI is unavailable or generation fails, so the
    /// caller falls back to the remote pipeline. No network is used on this path.
    @MainActor
    private func tryOnDeviceAnswer(_ message: String, profileContext: ProfileContext?) async -> String? {
        guard useOnDeviceAI else { return nil }
        guard #available(iOS 26, macOS 26, visionOS 26, *),
              appleIntelligence.isFoundationModelsAvailable else { return nil }
        do {
            let retrieval = try LocalRetrievalService.bundled()
            let instructions = Self.onDeviceInstructions(profileContext: profileContext)
            return try await appleIntelligence.answer(
                query: message,
                instructions: instructions,
                retrieval: retrieval
            )
        } catch {
            // Any failure (model not ready, corpus missing, generation error) -> fall back.
            return nil
        }
    }

    /// Append a turn to the rolling conversation history (capped at 10 entries).
    private func recordHistory(user: String, assistant: String) {
        conversationHistory.append(["role": "user", "content": user])
        conversationHistory.append(["role": "assistant", "content": assistant])
        if conversationHistory.count > 10 {
            conversationHistory = Array(conversationHistory.suffix(10))
        }
    }

    /// Instructions for the on-device agent. (Follow-up: load the synced prompt
    /// from the Knowledge Pack instead of this inline baseline.)
    private static func onDeviceInstructions(profileContext: ProfileContext?) -> String {
        var instructions = """
            You are Carl, a friendly Bay Area benefits and civic assistant. Answer questions \
            about local resources, programs, benefits, and city/state codes. ALWAYS call the \
            searchResources tool to ground your answer in real entries before responding, and \
            cite specifics (program names, ordinance sections) from what it returns. If nothing \
            relevant is found, say so plainly and suggest calling 2-1-1. Keep answers concise.
            """
        if let ctx = profileContext {
            var bits: [String] = []
            if let county = ctx.county { bits.append("county: \(county)") }
            if let city = ctx.city { bits.append("city: \(city)") }
            if let age = ctx.ageRange { bits.append("age range: \(age)") }
            if ctx.isMilitaryOrVeteran { bits.append("military/veteran") }
            if !bits.isEmpty {
                instructions += "\n\nThe person sharing context (use only if relevant): " + bits.joined(separator: ", ") + "."
            }
        }
        return instructions
    }

    // MARK: - System Intent Handling

    /// Handle detected system intents (reminders, timers, calls, etc.)
    @MainActor
    private func handleSystemIntent(_ intent: AppleIntelligenceService.DetectedIntent, originalMessage: String) async {
        // Add user message
        messages.append(ChatMessage(role: .user, content: originalMessage))
        isLoading = true

        // Execute the intent
        let result = await intentHandler.execute(intent: intent)

        switch result {
        case .openURL(let url, let message):
            messages.append(ChatMessage(
                role: .assistant,
                content: message,
                systemAction: .openURL(url)
            ))

        case .suggestAction(let message, let suggestion, let action):
            messages.append(ChatMessage(
                role: .assistant,
                content: "\(message)\n\n\(suggestion)",
                systemAction: .suggestion(action)
            ))
            pendingIntentAction = result
            showIntentConfirmation = true

        case .searchPrograms(let query):
            // Fall through to regular search
            isLoading = false
            await sendMessage(query)
            return

        case .noAction:
            // Fall through to regular processing
            isLoading = false
            await sendMessage(originalMessage)
            return

        case .failed(let message):
            messages.append(ChatMessage(
                role: .assistant,
                content: message,
                isError: true
            ))
        }

        isLoading = false
    }

    /// Execute a pending system action (called when user confirms)
    @MainActor
    public func executePendingAction() async {
        guard let action = pendingIntentAction else { return }
        showIntentConfirmation = false

        switch action {
        case .openURL(let url, _):
            #if os(iOS)
            await UIApplication.shared.open(url)
            #elseif os(macOS)
            NSWorkspace.shared.open(url)
            #endif

        case .suggestAction(_, _, let suggestion):
            switch suggestion {
            case .openSiri:
                // Open Siri via URL scheme (limited, but works for basic activation)
                if let url = URL(string: "siri://") {
                    #if os(iOS)
                    await UIApplication.shared.open(url)
                    #endif
                }
            case .openCalendar:
                if let url = URL(string: "calshow://") {
                    #if os(iOS)
                    await UIApplication.shared.open(url)
                    #elseif os(macOS)
                    NSWorkspace.shared.open(url)
                    #endif
                }
            case .openReminders:
                if let url = URL(string: "x-apple-reminderkit://") {
                    #if os(iOS)
                    await UIApplication.shared.open(url)
                    #elseif os(macOS)
                    NSWorkspace.shared.open(url)
                    #endif
                }
            case .openShortcuts:
                if let url = URL(string: "shortcuts://") {
                    #if os(iOS)
                    await UIApplication.shared.open(url)
                    #elseif os(macOS)
                    NSWorkspace.shared.open(url)
                    #endif
                }
            }

        default:
            break
        }

        pendingIntentAction = nil
    }

    /// Cancel a pending system action
    public func cancelPendingAction() {
        showIntentConfirmation = false
        pendingIntentAction = nil
    }

    public func clearConversation() {
        messages = [ChatMessage(
            role: .assistant,
            content: "Hi! I'm Carl, your Bay Area benefits guide. I can help you find programs for food, healthcare, housing, utilities, and more.\n\nWhat can I help you with today?"
        )]
        conversationHistory = []
    }

    // MARK: - Profile Context

    /// Build profile context if user has opted in to sharing with Carl
    private func buildProfileContext() async -> ProfileContext? {
        // Check if user has opted in
        let isEnabled = await safetyService.isShareProfileWithCarlEnabled()
        guard isEnabled, let prefs = userPrefs else { return nil }

        // Convert birth year to age range for privacy
        let ageRange: String? = {
            guard let birthYear = prefs.birthYear else { return nil }
            let currentYear = Calendar.current.component(.year, from: Date())
            let age = currentYear - birthYear
            switch age {
            case 0..<18: return "under 18"
            case 18..<25: return "18-24"
            case 25..<35: return "25-34"
            case 35..<45: return "35-44"
            case 45..<55: return "45-54"
            case 55..<62: return "55-61"
            case 62..<65: return "62-64"
            case 65...: return "65+"
            default: return nil
            }
        }()

        return ProfileContext(
            county: prefs.selectedCounty,
            city: prefs.city,
            ageRange: ageRange,
            isMilitaryOrVeteran: prefs.isMilitaryOrVeteran ?? false,
            qualifications: prefs.qualifications
        )
    }
}

// MARK: - Chat Message Model

public struct ChatMessage: Identifiable, Sendable {
    public let id = UUID()
    public let role: MessageRole
    public let content: String
    public var programs: [AIProgram]?
    public var isError: Bool = false
    public var tier: String?  // "quick_answer", "llm", "llm_tor", "apple_intelligence"
    public var systemAction: SystemAction?
    public let timestamp = Date()

    public enum MessageRole: Sendable {
        case user
        case assistant
    }

    /// System actions that Carl can suggest or execute
    public enum SystemAction: Sendable {
        case openURL(URL)
        case suggestion(IntentActionResult.SuggestedAction)
    }

    public init(
        role: MessageRole,
        content: String,
        programs: [AIProgram]? = nil,
        isError: Bool = false,
        tier: String? = nil,
        systemAction: SystemAction? = nil
    ) {
        self.role = role
        self.content = content
        self.programs = programs
        self.isError = isError
        self.tier = tier
        self.systemAction = systemAction
    }
}
