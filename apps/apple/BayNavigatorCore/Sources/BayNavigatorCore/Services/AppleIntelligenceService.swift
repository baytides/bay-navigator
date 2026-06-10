import Foundation
import SwiftUI

#if canImport(FoundationModels)
import FoundationModels
#endif

// MARK: - Apple Intelligence Service

/// Service that leverages Apple Intelligence Foundation Models for on-device AI capabilities.
/// Falls back to cloud API when Foundation Models are unavailable.
///
/// Requirements:
/// - iOS 26+ / macOS 26+ / visionOS 26+ (FoundationModels framework)
/// - A17 Pro, M1, or newer chip
/// - Apple Intelligence enabled in Settings
public final class AppleIntelligenceService {
    public static let shared = AppleIntelligenceService()

    private init() {}

    // MARK: - Availability

    /// Check if Apple Intelligence Foundation Models are available on this device.
    /// FoundationModels (SystemLanguageModel / LanguageModelSession) requires iOS/macOS/visionOS 26+.
    public var isFoundationModelsAvailable: Bool {
        #if canImport(FoundationModels)
        if #available(iOS 26, macOS 26, visionOS 26, *) {
            return SystemLanguageModel.default.isAvailable
        }
        #endif
        return false
    }

    /// Check if the device supports Apple Intelligence (hardware check)
    public var deviceSupportsAppleIntelligence: Bool {
        // Check for A17 Pro, M1, or newer
        #if os(iOS)
        // On iOS, we check the processor
        var size = 0
        sysctlbyname("hw.machine", nil, &size, nil, 0)
        var machine = [CChar](repeating: 0, count: size)
        sysctlbyname("hw.machine", &machine, &size, nil, 0)
        let identifier = String(cString: machine)

        // iPhone 15 Pro and later (A17 Pro+)
        let supportedPrefixes = ["iPhone16", "iPhone17", "iPhone18", "iPhone19", "iPhone20"]
        if supportedPrefixes.contains(where: { identifier.hasPrefix($0) }) {
            return true
        }

        // iPads with M1 or later
        if identifier.hasPrefix("iPad13") || identifier.hasPrefix("iPad14") ||
           identifier.hasPrefix("iPad15") || identifier.hasPrefix("iPad16") {
            return true
        }
        #elseif os(macOS)
        // All Apple Silicon Macs support Apple Intelligence
        var sysInfo = utsname()
        uname(&sysInfo)
        let machine = withUnsafePointer(to: &sysInfo.machine) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) {
                String(cString: $0)
            }
        }
        return machine.contains("arm64")
        #elseif os(visionOS)
        return true // Vision Pro supports Apple Intelligence
        #endif
        return false
    }

    // MARK: - Intent Detection

    /// Detected user intent that can be handled by system actions
    public enum DetectedIntent: Sendable {
        case setReminder(title: String, date: Date?)
        case setTimer(duration: TimeInterval)
        case createCalendarEvent(title: String, date: Date?)
        case makePhoneCall(number: String)
        case sendMessage(to: String?, content: String?)
        case openMaps(query: String)
        case searchPrograms(query: String)
        case none
    }

    /// Detect if the user's message contains an actionable intent
    public func detectIntent(in message: String) -> DetectedIntent {
        let lowercased = message.lowercased()

        // Reminder detection
        if lowercased.contains("remind") || lowercased.contains("reminder") {
            let title = extractReminderTitle(from: message)
            let date = extractDate(from: message)
            return .setReminder(title: title, date: date)
        }

        // Timer detection
        if lowercased.contains("timer") || lowercased.contains("set a timer") {
            if let duration = extractTimerDuration(from: message) {
                return .setTimer(duration: duration)
            }
        }

        // Calendar event detection
        if lowercased.contains("schedule") || lowercased.contains("calendar") ||
           lowercased.contains("appointment") || lowercased.contains("meeting") {
            let title = extractEventTitle(from: message)
            let date = extractDate(from: message)
            return .createCalendarEvent(title: title, date: date)
        }

        // Phone call detection
        if lowercased.contains("call ") {
            if let number = extractPhoneNumber(from: message) {
                return .makePhoneCall(number: number)
            }
        }

        // Maps/directions detection
        if lowercased.contains("directions to") || lowercased.contains("how to get to") ||
           lowercased.contains("navigate to") || lowercased.contains("map") {
            let query = extractLocationQuery(from: message)
            return .openMaps(query: query)
        }

        return .none
    }

    // MARK: - Foundation Models Integration

    #if canImport(FoundationModels)
    @available(iOS 26, macOS 26, visionOS 26, *)
    private var languageSession: LanguageModelSession?

    /// Process a message using on-device Foundation Models
    @available(iOS 26, macOS 26, visionOS 26, *)
    public func processWithFoundationModels(
        message: String,
        systemPrompt: String,
        conversationHistory: [[String: String]] = []
    ) async throws -> String {
        guard SystemLanguageModel.default.isAvailable else {
            throw AppleIntelligenceError.notAvailable
        }

        // Create session if needed
        if languageSession == nil {
            languageSession = LanguageModelSession()
        }

        guard let session = languageSession else {
            throw AppleIntelligenceError.sessionCreationFailed
        }

        // Build the prompt with conversation context
        var fullPrompt = systemPrompt + "\n\n"

        for entry in conversationHistory.suffix(6) { // Keep last 6 messages for context
            if let role = entry["role"], let content = entry["content"] {
                if role == "user" {
                    fullPrompt += "User: \(content)\n"
                } else {
                    fullPrompt += "Carl: \(content)\n"
                }
            }
        }

        fullPrompt += "User: \(message)\nCarl:"

        // Generate response
        let response = try await session.respond(to: fullPrompt)
        return response.content.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    #endif

    /// Summarize text using on-device models (useful for long program descriptions)
    public func summarize(text: String, maxLength: Int = 100) async throws -> String {
        #if canImport(FoundationModels)
        if #available(iOS 26, macOS 26, visionOS 26, *), SystemLanguageModel.default.isAvailable {
            let session = LanguageModelSession()
            let prompt = "Summarize this in \(maxLength) characters or less: \(text)"
            let response = try await session.respond(to: prompt)
            return response.content
        }
        #endif

        // Fallback: simple truncation
        if text.count > maxLength {
            let endIndex = text.index(text.startIndex, offsetBy: maxLength - 3)
            return String(text[..<endIndex]) + "..."
        }
        return text
    }

    // MARK: - Helper Methods

    private func extractReminderTitle(from message: String) -> String {
        // Simple extraction - look for "to" followed by the reminder content
        let patterns = [
            "remind me to ",
            "reminder to ",
            "remind me about ",
            "set a reminder for ",
            "set reminder to "
        ]

        var cleanedMessage = message.lowercased()
        for pattern in patterns {
            if let range = cleanedMessage.range(of: pattern) {
                cleanedMessage = String(cleanedMessage[range.upperBound...])
                // Remove time-related suffixes
                let timePhrases = [" at ", " on ", " tomorrow", " today", " next "]
                for phrase in timePhrases {
                    if let timeRange = cleanedMessage.range(of: phrase) {
                        cleanedMessage = String(cleanedMessage[..<timeRange.lowerBound])
                        break
                    }
                }
                return cleanedMessage.trimmingCharacters(in: .whitespacesAndNewlines).capitalized
            }
        }

        return "Bay Navigator reminder"
    }

    private func extractEventTitle(from message: String) -> String {
        let patterns = [
            "schedule ",
            "add to calendar ",
            "create event ",
            "appointment for ",
            "meeting about "
        ]

        var cleanedMessage = message.lowercased()
        for pattern in patterns {
            if let range = cleanedMessage.range(of: pattern) {
                cleanedMessage = String(cleanedMessage[range.upperBound...])
                let timePhrases = [" at ", " on ", " tomorrow", " today", " for "]
                for phrase in timePhrases {
                    if let timeRange = cleanedMessage.range(of: phrase) {
                        cleanedMessage = String(cleanedMessage[..<timeRange.lowerBound])
                        break
                    }
                }
                return cleanedMessage.trimmingCharacters(in: .whitespacesAndNewlines).capitalized
            }
        }

        return "Event"
    }

    private func extractDate(from message: String) -> Date? {
        let lowercased = message.lowercased()
        let calendar = Calendar.current
        let now = Date()

        // Today
        if lowercased.contains("today") {
            if let time = extractTime(from: message) {
                return calendar.date(bySettingHour: time.hour, minute: time.minute, second: 0, of: now)
            }
            return now
        }

        // Tomorrow
        if lowercased.contains("tomorrow") {
            let tomorrow = calendar.date(byAdding: .day, value: 1, to: now) ?? now
            if let time = extractTime(from: message) {
                return calendar.date(bySettingHour: time.hour, minute: time.minute, second: 0, of: tomorrow)
            }
            return calendar.startOfDay(for: tomorrow)
        }

        // Next week
        if lowercased.contains("next week") {
            return calendar.date(byAdding: .weekOfYear, value: 1, to: now)
        }

        // Specific time without date (assume today)
        if let time = extractTime(from: message) {
            var result = calendar.date(bySettingHour: time.hour, minute: time.minute, second: 0, of: now)
            // If the time has passed, schedule for tomorrow
            if let date = result, date < now {
                result = calendar.date(byAdding: .day, value: 1, to: date)
            }
            return result
        }

        // In X hours/minutes
        if let match = message.range(of: #"in (\d+) (hour|minute)"#, options: .regularExpression) {
            let matchStr = String(message[match])
            let components = matchStr.components(separatedBy: " ")
            if components.count >= 3, let value = Int(components[1]) {
                if components[2].hasPrefix("hour") {
                    return calendar.date(byAdding: .hour, value: value, to: now)
                } else if components[2].hasPrefix("minute") {
                    return calendar.date(byAdding: .minute, value: value, to: now)
                }
            }
        }

        return nil
    }

    private func extractTime(from message: String) -> (hour: Int, minute: Int)? {
        // Match patterns like "at 3pm", "at 3:30 pm", "at 15:00"
        let patterns = [
            #"at (\d{1,2}):(\d{2})\s*(am|pm)?"#,
            #"at (\d{1,2})\s*(am|pm)"#
        ]

        for pattern in patterns {
            if let match = message.range(of: pattern, options: [.regularExpression, .caseInsensitive]) {
                let timeStr = String(message[match]).lowercased()
                let isPM = timeStr.contains("pm")
                let isAM = timeStr.contains("am")

                // Extract numbers
                let numbers = timeStr.components(separatedBy: CharacterSet.decimalDigits.inverted)
                    .filter { !$0.isEmpty }
                    .compactMap { Int($0) }

                if let hour = numbers.first {
                    var adjustedHour = hour
                    if isPM && hour < 12 {
                        adjustedHour += 12
                    } else if isAM && hour == 12 {
                        adjustedHour = 0
                    }
                    let minute = numbers.count > 1 ? numbers[1] : 0
                    return (adjustedHour, minute)
                }
            }
        }

        return nil
    }

    private func extractTimerDuration(from message: String) -> TimeInterval? {
        let lowercased = message.lowercased()

        // Match "X minutes", "X hours", "X seconds"
        let patterns: [(String, TimeInterval)] = [
            (#"(\d+)\s*second"#, 1),
            (#"(\d+)\s*minute"#, 60),
            (#"(\d+)\s*hour"#, 3600)
        ]

        for (pattern, multiplier) in patterns {
            if let match = lowercased.range(of: pattern, options: .regularExpression) {
                let matchStr = String(lowercased[match])
                let numbers = matchStr.components(separatedBy: CharacterSet.decimalDigits.inverted)
                    .filter { !$0.isEmpty }
                    .compactMap { Double($0) }

                if let value = numbers.first {
                    return value * multiplier
                }
            }
        }

        return nil
    }

    private func extractPhoneNumber(from message: String) -> String? {
        // Look for phone number patterns
        let pattern = #"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}"#
        if let match = message.range(of: pattern, options: .regularExpression) {
            return String(message[match])
        }

        // Check for crisis numbers
        let crisisNumbers = [
            ("911", ["911", "emergency"]),
            ("988", ["988", "suicide", "crisis"]),
            ("211", ["211", "community resources"]),
            ("311", ["311", "city services"])
        ]

        let lowercased = message.lowercased()
        for (number, keywords) in crisisNumbers {
            if keywords.contains(where: { lowercased.contains($0) }) {
                return number
            }
        }

        return nil
    }

    private func extractLocationQuery(from message: String) -> String {
        let patterns = [
            "directions to ",
            "how to get to ",
            "navigate to ",
            "find on map ",
            "map of "
        ]

        var cleanedMessage = message.lowercased()
        for pattern in patterns {
            if let range = cleanedMessage.range(of: pattern) {
                cleanedMessage = String(cleanedMessage[range.upperBound...])
                return cleanedMessage.trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }

        return message
    }
}

// MARK: - Errors

public enum AppleIntelligenceError: Error, LocalizedError {
    case notAvailable
    case sessionCreationFailed
    case generationFailed(String)

    public var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "Apple Intelligence is not available on this device."
        case .sessionCreationFailed:
            return "Failed to create language model session."
        case .generationFailed(let reason):
            return "Failed to generate response: \(reason)"
        }
    }
}

// MARK: - Intent Action Handler

/// Handles executing detected intents via system frameworks
public final class IntentActionHandler {
    public static let shared = IntentActionHandler()

    private init() {}

    /// Execute a detected intent, returning a result message
    @MainActor
    public func execute(intent: AppleIntelligenceService.DetectedIntent) async -> IntentActionResult {
        switch intent {
        case .setReminder(let title, let date):
            return await setReminder(title: title, date: date)

        case .setTimer(let duration):
            return setTimer(duration: duration)

        case .createCalendarEvent(let title, let date):
            return await createCalendarEvent(title: title, date: date)

        case .makePhoneCall(let number):
            return makePhoneCall(number: number)

        case .sendMessage(let to, let content):
            return sendMessage(to: to, content: content)

        case .openMaps(let query):
            return openMaps(query: query)

        case .searchPrograms(let query):
            return .searchPrograms(query: query)

        case .none:
            return .noAction
        }
    }

    private func setReminder(title: String, date: Date?) async -> IntentActionResult {
        // Build reminder URL scheme
        // Note: iOS doesn't have a direct URL scheme for reminders
        // We can suggest using Siri or the Shortcuts app
        let dateDescription = date.map { formatDate($0) } ?? "when convenient"

        return .suggestAction(
            message: "I can't directly create reminders, but I can help you set one up!",
            suggestion: "Would you like me to open Siri so you can say: \"Remind me to \(title) \(dateDescription)\"?",
            action: .openSiri
        )
    }

    private func setTimer(duration: TimeInterval) -> IntentActionResult {
        // Use Clock URL scheme for timers
        let minutes = Int(duration / 60)
        let seconds = Int(duration.truncatingRemainder(dividingBy: 60))

        var components = URLComponents()
        components.scheme = "clock-timer"
        components.queryItems = [
            URLQueryItem(name: "duration", value: "\(Int(duration))")
        ]

        if let url = components.url {
            return .openURL(
                url: url,
                message: "Opening timer for \(formatDuration(duration))..."
            )
        }

        return .suggestAction(
            message: "I can help you set a timer!",
            suggestion: "Would you like me to open Siri so you can say: \"Set a timer for \(formatDuration(duration))\"?",
            action: .openSiri
        )
    }

    private func createCalendarEvent(title: String, date: Date?) async -> IntentActionResult {
        // Use calendar URL scheme
        var components = URLComponents()
        components.scheme = "calshow"

        if let date = date {
            // calshow uses Unix timestamp
            components.path = "/\(Int(date.timeIntervalSinceReferenceDate))"
        }

        if let url = components.url {
            return .openURL(
                url: url,
                message: "Opening Calendar to create \"\(title)\"..."
            )
        }

        return .suggestAction(
            message: "I can help you schedule that!",
            suggestion: "Would you like me to open the Calendar app?",
            action: .openCalendar
        )
    }

    private func makePhoneCall(number: String) -> IntentActionResult {
        let cleanNumber = number.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)

        if let url = URL(string: "tel:\(cleanNumber)") {
            return .openURL(
                url: url,
                message: "Calling \(formatPhoneNumber(number))..."
            )
        }

        return .failed(message: "Couldn't format the phone number.")
    }

    private func sendMessage(to: String?, content: String?) -> IntentActionResult {
        var components = URLComponents()
        components.scheme = "sms"

        if let to = to {
            components.path = to.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
        }

        if let content = content {
            components.queryItems = [URLQueryItem(name: "body", value: content)]
        }

        if let url = components.url {
            return .openURL(
                url: url,
                message: "Opening Messages..."
            )
        }

        return .failed(message: "Couldn't open Messages.")
    }

    private func openMaps(query: String) -> IntentActionResult {
        var components = URLComponents()
        components.scheme = "maps"
        components.queryItems = [
            URLQueryItem(name: "q", value: query)
        ]

        if let url = components.url {
            return .openURL(
                url: url,
                message: "Opening Maps for \"\(query)\"..."
            )
        }

        return .failed(message: "Couldn't open Maps.")
    }

    // MARK: - Formatting Helpers

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        let calendar = Calendar.current

        if calendar.isDateInToday(date) {
            formatter.dateFormat = "'today at' h:mm a"
        } else if calendar.isDateInTomorrow(date) {
            formatter.dateFormat = "'tomorrow at' h:mm a"
        } else {
            formatter.dateStyle = .medium
            formatter.timeStyle = .short
        }

        return formatter.string(from: date)
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        let seconds = Int(duration) % 60

        var parts: [String] = []
        if hours > 0 { parts.append("\(hours) hour\(hours == 1 ? "" : "s")") }
        if minutes > 0 { parts.append("\(minutes) minute\(minutes == 1 ? "" : "s")") }
        if seconds > 0 && hours == 0 { parts.append("\(seconds) second\(seconds == 1 ? "" : "s")") }

        return parts.joined(separator: " ")
    }

    private func formatPhoneNumber(_ number: String) -> String {
        let digits = number.filter { $0.isNumber }

        if digits.count == 3 {
            return digits // Emergency numbers like 911, 988
        }

        if digits.count == 10 {
            let start = digits.startIndex
            let areaEnd = digits.index(start, offsetBy: 3)
            let prefixEnd = digits.index(areaEnd, offsetBy: 3)
            return "(\(digits[start..<areaEnd])) \(digits[areaEnd..<prefixEnd])-\(digits[prefixEnd...])"
        }

        return number
    }
}

// MARK: - Intent Action Result

public enum IntentActionResult: Sendable {
    case openURL(url: URL, message: String)
    case suggestAction(message: String, suggestion: String, action: SuggestedAction)
    case searchPrograms(query: String)
    case noAction
    case failed(message: String)

    public enum SuggestedAction: Sendable {
        case openSiri
        case openCalendar
        case openReminders
        case openShortcuts
    }
}
