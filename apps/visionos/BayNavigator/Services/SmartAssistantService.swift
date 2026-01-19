import Foundation

/// Service for AI-powered smart search functionality
actor SmartAssistantService {
    static let shared = SmartAssistantService()

    private let assistantEndpoint = "https://baytides-link-checker.azurewebsites.net/api/assistant"
    private let session: URLSession
    private let requestTimeout: TimeInterval = 30

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = requestTimeout
        config.timeoutIntervalForResource = requestTimeout
        self.session = URLSession(configuration: config)
    }

    // MARK: - AI Search

    /// Perform an AI-powered search using the Smart Assistant
    /// May include quickAnswer for cached responses (Tier 1)
    func performAISearch(
        query: String,
        conversationHistory: [[String: String]] = [],
        location: String? = nil,
        county: String? = nil
    ) async throws -> AISearchResult {
        guard let url = URL(string: assistantEndpoint) else {
            throw SmartAssistantError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        var body: [String: Any] = [
            "message": query,
            "conversationHistory": Array(conversationHistory.prefix(6)),
            "mode": "filter"
        ]

        if let location = location {
            body["location"] = location
        }
        if let county = county {
            body["county"] = county
        }

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SmartAssistantError.networkError
        }

        guard httpResponse.statusCode == 200 else {
            if let errorData = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                throw SmartAssistantError.serverError(errorData.error)
            }
            throw SmartAssistantError.httpError(httpResponse.statusCode)
        }

        let result = try JSONDecoder().decode(AISearchResponse.self, from: data)

        return AISearchResult(
            message: result.message ?? "Here are some programs that might help:",
            programs: result.programs ?? [],
            programsFound: result.programsFound ?? 0,
            location: result.location,
            quickAnswer: result.quickAnswer,
            tier: result.tier
        )
    }

    // MARK: - Crisis Detection

    /// Check if a query contains crisis keywords
    func detectCrisis(_ query: String) -> CrisisType? {
        let lowerQuery = query.lowercased()

        // Emergency keywords
        let emergencyKeywords = [
            "emergency", "danger", "hurt", "attack", "abuse",
            "violence", "domestic violence", "unsafe", "threatened"
        ]

        // Mental health crisis keywords
        let mentalHealthKeywords = [
            "suicide", "suicidal", "kill myself", "end my life",
            "don't want to live", "want to die", "self-harm",
            "cutting", "hurting myself", "crisis", "desperate"
        ]

        for keyword in emergencyKeywords {
            if lowerQuery.contains(keyword) {
                return .emergency
            }
        }

        for keyword in mentalHealthKeywords {
            if lowerQuery.contains(keyword) {
                return .mentalHealth
            }
        }

        return nil
    }

    // MARK: - Query Classification

    /// Check if a query should use AI search (complex/natural language queries)
    func shouldUseAISearch(_ query: String) -> Bool {
        guard query.count >= 10 else { return false }

        // Demographic/eligibility terms that suggest complex queries
        let demographicTerms = [
            "senior", "elderly", "veteran", "disabled", "disability",
            "student", "low-income", "homeless", "immigrant", "lgbtq",
            "family", "child", "parent", "youth", "teen"
        ]

        // Natural language patterns
        let naturalPatterns = [
            "i need", "i'm looking", "help with", "how can i", "where can i",
            "looking for", "need help", "can you help", "what programs",
            "i am a", "i'm a", "my family", "we need"
        ]

        let lowerQuery = query.lowercased()

        // Check for demographic terms
        for term in demographicTerms {
            if lowerQuery.contains(term) { return true }
        }

        // Check for natural language patterns
        for pattern in naturalPatterns {
            if lowerQuery.contains(pattern) { return true }
        }

        // Multiple words with spaces suggest natural language
        let wordCount = query.split(separator: " ").filter { $0.count > 2 }.count
        if wordCount >= 4 { return true }

        return false
    }
}

// MARK: - Types

enum CrisisType {
    case emergency
    case mentalHealth
}

enum SmartAssistantError: LocalizedError {
    case invalidURL
    case networkError
    case httpError(Int)
    case serverError(String)
    case decodingError

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .networkError:
            return "Network error"
        case .httpError(let code):
            return "HTTP Error: \(code)"
        case .serverError(let message):
            return message
        case .decodingError:
            return "Failed to decode response"
        }
    }
}

struct AISearchResult {
    let message: String
    let programs: [AIProgram]
    let programsFound: Int
    let location: LocationInfo?
    let quickAnswer: QuickAnswer?
    let tier: String?
}

struct AISearchResponse: Codable {
    let message: String?
    let programs: [AIProgram]?
    let programsFound: Int?
    let searchQuery: String?
    let location: LocationInfo?
    let quickAnswer: QuickAnswer?
    let tier: String?
}

struct AIProgram: Codable, Identifiable {
    let id: String
    let name: String
    let category: String
    let description: String?
    let phone: String?
    let website: String?
    let areas: [String]?
}

struct LocationInfo: Codable {
    let zip: String?
    let city: String?
    let county: String?
}

struct ErrorResponse: Codable {
    let error: String
}

// MARK: - Quick Answer Types

/// Quick answer from cached responses (Tier 1)
/// Provides instant responses for common queries without AI cost
struct QuickAnswer: Codable {
    let type: String
    let title: String?
    let message: String?
    let summary: String?
    let resource: QuickAnswerResource?
    let secondary: QuickAnswerResource?
    let categories: [QuickAnswerCategory]?
    let countyContact: CountyContact?
    let guideUrl: String?
    let guideText: String?
    let applyUrl: String?
    let applyText: String?
    let search: String?

    /// Check if this is a crisis response
    var isCrisis: Bool { type == "crisis" }

    /// Check if this needs user clarification
    var needsClarification: Bool { type == "clarify" }
}

struct QuickAnswerResource: Codable {
    let name: String
    let phone: String?
    let description: String?
    let action: String?
}

struct QuickAnswerCategory: Codable, Identifiable {
    let id: String
    let label: String
    let icon: String?
    let search: String?
}

struct CountyContact: Codable {
    let name: String
    let phone: String
    let agency: String
}
