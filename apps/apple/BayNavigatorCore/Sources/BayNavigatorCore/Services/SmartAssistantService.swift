import Foundation

/// Service for AI-powered smart search functionality - "Carl"
///
/// TWO-TIER AI ARCHITECTURE:
/// -------------------------
/// WORKFLOW: User → OLLAMA (engage, collect, parse) → VLLM (search, retrieve) → Response
///
/// TIER 1 - OLLAMA (Primary): User Engagement & Data Collection
///   - Model: Llama 3.1 8B Instruct (Q8)
///   - Infrastructure: Always-on Azure VM (CPU-based)
///   - Role: CONVERSATION HANDLER - the "face" of Carl
///   - Responsibilities:
///     * ALL user engagement and conversation
///     * Collecting context (city/ZIP, birth year, needs)
///     * Parsing user input into structured queries
///     * Crisis response (immediate - no delay!)
///     * Formatting responses in Carl's friendly voice
///
/// TIER 2 - VLLM (Secondary): Database Search & Resource Retrieval
///   - Model: Qwen2.5-3B-Instruct
///   - Infrastructure: Azure Container Apps with NVIDIA T4 (scales to zero after 3 min idle)
///   - Role: DATA RETRIEVAL ENGINE - searches program database
///   - Responsibilities:
///     * Searching programs based on Ollama's parsed query
///     * Matching programs to user eligibility
///     * Retrieving specific details when requested
///   - Pre-warmed when chat opens so it's ready when needed
///
/// RESPONSE PRIORITIES:
/// 1. Always prioritize Bay Navigator links (program cards, eligibility guides)
/// 2. Let clickable program cards be the primary source
/// 3. Extract specific details (phone, address, hours) ONLY when specifically asked
///
/// USER PROFILE INTEGRATION (All Apps - iOS, Android, Windows, macOS, Linux):
/// - If user has enabled profile sharing, use ProfileContext to pre-fill location, age, etc.
/// - AI should use this context to skip redundant questions and prioritize relevant programs
/// - If profile not enabled, treat user as anonymous (same as website visitor)
/// - Profile data is privacy-respecting: uses age ranges, not exact dates; county, not address
/// - This pattern should be implemented consistently across all platform apps
///
/// TOR SUPPORT:
/// - Carl is fully accessible via Tor hidden service for maximum privacy
/// - Uses: ul3gghpdow6o6rmtowpgdbx2c6fgqz3bogcwm44wg62r3vxq3eil43ad.onion
/// - No API key required over Tor (already authenticated by onion routing)
///
/// IMPORTANT: Both tiers should NEVER make up program names, phone numbers, or addresses.
///
public actor SmartAssistantService {
    public static let shared = SmartAssistantService()

    /// Typesense search (direct — uses search-only API key, same as website)
    private static let typesenseBaseUrl = "https://search.baytides.org"
    private static let typesenseSearchKey = "fOjrMAfZl4tb9Dux7ZZEdSOGXWjFzu5N"

    /// Primary Ollama endpoint - for simple queries (location parsing, routing)
    /// Model: Llama 3.1 8B Instruct, always-on Azure VM
    private static let ollamaEndpoint = "https://ollama.baytides.org/api/chat"

    /// Secondary vLLM endpoint - for complex tasks (deep analysis) - OpenAI compatible
    /// Model: Qwen2.5-3B-Instruct on serverless T4 GPU, scales to zero when idle
    private static let vllmEndpoint = "https://ai.baytides.org/v1/chat/completions"

    /// Privacy service for getting the correct endpoint based on privacy mode
    private let privacyService = PrivacyService.shared

    // API key from environment or fallback
    private let apiKey = ProcessInfo.processInfo.environment["OLLAMA_API_KEY"]
        ?? "bnav_a76a835781d394a03aaf1662d76fd1f05e78da85bf8edf27c8f26fbb9d2b79f0"

    private var standardSession: URLSession
    private var torSession: URLSession?
    private let requestTimeout: TimeInterval = 45
    private let torRequestTimeout: TimeInterval = 90 // Tor is slower

    private let quickAnswers = QuickAnswersService.shared

    // Intent parser prompt (Call 1 of two-call pattern)
    private let intentParserPrompt = """
    You are a search intent parser for a Bay Area benefits directory.
    Given the user message and conversation history, output ONLY valid JSON (no markdown, no explanation):
    {
      "query": "search terms for program lookup",
      "category": "food|health|housing|legal|employment|education|transit|crisis|general",
      "needs_location": true/false,
      "is_greeting": true/false,
      "is_crisis": true/false
    }
    Rules:
    - "query" should be 1-5 keywords optimized for searching a program database
    - Crisis keywords (suicide, abuse, danger, homeless emergency): set is_crisis=true
    - Greetings (hi, hello, hey): set is_greeting=true, query=""
    - Keep query concise — no filler words
    """

    // Response formatter prompt (Call 2 of two-call pattern)
    private let responseFormatterPrompt = """
    You are Carl, a friendly Bay Area benefits assistant named after Karl the Fog.
    STYLE: Warm, casual, brief (2-3 sentences). Like texting a helpful friend.
    RULES:
    - ONLY mention programs listed in [PROGRAMS]. Never invent names/phones/addresses.
    - If programs are listed, mention 2-3 by name. Users see clickable cards below your message.
    - Link ONLY to real baynavigator.org pages: /directory, /eligibility, /eligibility/food-assistance, /eligibility/healthcare, /eligibility/housing-assistance, /eligibility/utility-programs, /eligibility/cash-assistance, /map
    - If no programs match, suggest /directory or call 211
    - For crisis: give 988 (suicide), 1-800-799-7233 (DV), 911 (emergency) IMMEDIATELY
    ELIGIBILITY CHEAT SHEET:
    - Medicare: 65+ or disabled
    - Medi-Cal: income <$1,677/mo (1 person)
    - CalFresh: income <$1,580/mo (~$234/mo benefit)
    - CARE: auto if on CalFresh/Medi-Cal, 20% off PG&E
    """

    /// Track if vLLM has been warmed up this session
    private var vllmWarmedUp = false

    /// vLLM model name
    private static let vllmModel = "qwen2.5:3b-instruct"

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = requestTimeout
        config.timeoutIntervalForResource = requestTimeout
        self.standardSession = URLSession(configuration: config)
    }

    // MARK: - vLLM Warmup

    /// Warm up the vLLM GPU container in the background
    /// Call this when the chat UI opens to preemptively wake up the serverless GPU
    /// so it's ready for complex queries
    public func warmupVLLM() async {
        guard !vllmWarmedUp else { return } // Only warm up once per session

        guard let url = URL(string: Self.vllmEndpoint) else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 90 // Allow time for cold start

        let body: [String: Any] = [
            "model": Self.vllmModel,
            "messages": [["role": "user", "content": "ping"]],
            "max_tokens": 1 // Minimal response
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            let (_, response) = try await standardSession.data(for: request)

            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                vllmWarmedUp = true
                print("[SmartAssistant] vLLM GPU warmed up and ready")
            }
        } catch {
            // Silently fail - vLLM warmup is optional
            print("[SmartAssistant] vLLM warmup skipped: \(error.localizedDescription)")
        }
    }

    // MARK: - Privacy-Aware Endpoint Resolution

    /// Get the AI chat endpoint based on current privacy mode
    /// All CDN providers (Cloudflare, Fastly, Azure) support /api/chat routing
    /// - For domain fronting: Uses CDN URL + /api/chat
    /// - For Tor: Uses direct endpoint (Tor handles privacy)
    /// - For standard: Uses direct endpoint (or CDN if censored)
    private func getAIChatEndpoint(useTor: Bool) async -> String {
        let privacyMode = await privacyService.getPrivacyMode()

        switch privacyMode {
        case .domainFronting:
            // All CDNs now support /api/chat routing to ai.baytides.org
            let cdnProvider = await privacyService.getCDNProvider()
            return "\(cdnProvider.reflectorURL)/api/chat"

        case .tor:
            // Tor uses direct endpoint (privacy is handled by Tor network)
            return Self.ollamaEndpoint

        case .standard:
            // Check if auto-detect censorship is enabled and we're censored
            if await privacyService.isAutoDetectCensorshipEnabled() {
                let isCensored = await privacyService.detectCensorship()
                if isCensored {
                    // Use user's preferred CDN for censored users
                    let cdnProvider = await privacyService.getCDNProvider()
                    return "\(cdnProvider.reflectorURL)/api/chat"
                }
            }
            return Self.ollamaEndpoint
        }
    }

    // MARK: - Tor Configuration

    /// Configure Tor proxy for requests using SafetyService's configuration
    /// This ensures consistent Tor settings across all services
    public func configureTorProxy(host: String = "127.0.0.1", port: Int = 9050) async {
        let safetyService = SafetyService.shared
        let proxyAvailable = await safetyService.isOrbotProxyAvailable()

        if proxyAvailable {
            let config = safetyService.createTorProxyConfiguration()
            config.timeoutIntervalForRequest = torRequestTimeout
            config.timeoutIntervalForResource = torRequestTimeout
            self.torSession = URLSession(configuration: config)
            print("[SmartAssistant] Tor proxy configured via SafetyService")
        } else {
            print("[SmartAssistant] Tor proxy not available (Orbot not running)")
            self.torSession = nil
        }
    }

    /// Disable Tor proxy
    public func disableTorProxy() {
        self.torSession = nil
        print("[SmartAssistant] Tor proxy disabled")
    }

    /// Check if Tor is configured and available
    public var isTorEnabled: Bool {
        get async {
            await SafetyService.shared.isTorEnabled()
        }
    }

    /// Check if Tor session is ready for use
    public var isTorSessionReady: Bool {
        torSession != nil
    }

    // MARK: - PII Sanitization

    /// Sanitize query to remove personally identifiable information
    private func sanitizeQuery(_ query: String) -> String {
        var result = query
        // SSN with dashes (XXX-XX-XXXX)
        result = result.replacingOccurrences(of: "\\b\\d{3}-\\d{2}-\\d{4}\\b", with: "[REDACTED]", options: .regularExpression)
        // SSN without dashes (9 consecutive digits)
        result = result.replacingOccurrences(of: "\\b\\d{9}\\b", with: "[REDACTED]", options: .regularExpression)
        // Email addresses
        result = result.replacingOccurrences(of: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", with: "[REDACTED]", options: .regularExpression)
        // Phone numbers (various formats)
        result = result.replacingOccurrences(of: "\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b", with: "[REDACTED]", options: .regularExpression)
        result = result.replacingOccurrences(of: "\\(\\d{3}\\)\\s*\\d{3}[-.]?\\d{4}", with: "[REDACTED]", options: .regularExpression)
        // Credit card numbers
        result = result.replacingOccurrences(of: "\\b\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{1,7}\\b", with: "[REDACTED]", options: .regularExpression)
        return result
    }

    // MARK: - Search (Tiered Approach)

    /// Main search function - uses quick answers first, then AI if needed
    public func search(
        query: String,
        conversationHistory: [[String: String]] = [],
        useTor: Bool = false,
        profileContext: ProfileContext? = nil
    ) async throws -> AISearchResult {
        // Tier 1: Check for quick answer match first (instant, no network)
        if let quickMatch = await quickAnswers.matchQuery(query) {
            return buildResultFromQuickAnswer(quickMatch)
        }

        // Tier 2: Use AI API
        return try await performAISearch(
            query: query,
            conversationHistory: conversationHistory,
            useTor: useTor,
            profileContext: profileContext
        )
    }

    /// Build AISearchResult from a quick answer match
    private func buildResultFromQuickAnswer(_ match: QuickAnswerResult) -> AISearchResult {
        let response = match.response

        // Build message from quick answer
        var message = ""

        if let title = response.title {
            message += "**\(title)**\n\n"
        }

        if let msg = response.message {
            message += msg
        } else if let summary = response.summary {
            message += summary
        }

        // Add resource info if present
        if let resource = response.resource {
            message += "\n\n📞 **\(resource.name)**"
            if let phone = resource.phone {
                message += " - \(phone)"
            }
            if let action = resource.action {
                message += "\n\(action)"
            }
        }

        // Add guide link if present
        if let guideUrl = response.guideUrl, let guideText = response.guideText {
            message += "\n\n📖 [\(guideText)](https://baynavigator.org\(guideUrl))"
        }

        // Add apply link if present
        if let applyUrl = response.applyUrl, let applyText = response.applyText {
            message += "\n\n✅ [\(applyText)](\(applyUrl))"
        }

        return AISearchResult(
            message: message,
            programs: [],
            programsFound: 0,
            location: nil,
            quickAnswer: nil,
            tier: "quick_answer"
        )
    }

    // MARK: - Typesense Search

    /// Search via Typesense directly (same approach as website)
    private func searchViaTypesense(query: String, category: String? = nil, limit: Int = 8) async -> [AIProgram] {
        let searchPath = "\(Self.typesenseBaseUrl)/collections/programs/documents/search"
        guard var components = URLComponents(string: searchPath) else { return [] }

        var queryItems = [
            URLQueryItem(name: "q", value: query),
            URLQueryItem(name: "query_by", value: "name,keywords,description"),
            URLQueryItem(name: "per_page", value: String(limit)),
            URLQueryItem(name: "num_typos", value: "2"),
            URLQueryItem(name: "typo_tokens_threshold", value: "1"),
        ]

        if let category = category, category != "general" {
            let categoryMap = [
                "food": "Food", "health": "Health", "housing": "Housing",
                "legal": "Legal", "employment": "Employment", "education": "Education",
                "pets": "Pet Resources", "seniors": "Community Services",
                "veterans": "Community Services", "disability": "Health",
                "transit": "Transportation",
            ]
            if let facetValue = categoryMap[category] {
                queryItems.append(URLQueryItem(name: "filter_by", value: "category:=\(facetValue)"))
            }
        }

        components.queryItems = queryItems

        guard let url = components.url else { return [] }

        do {
            var request = URLRequest(url: url)
            request.timeoutInterval = 5
            request.setValue(Self.typesenseSearchKey, forHTTPHeaderField: "X-TYPESENSE-API-KEY")
            let (data, response) = try await standardSession.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                return []
            }

            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let hits = json?["hits"] as? [[String: Any]] ?? []

            return hits.compactMap { hit in
                guard let doc = hit["document"] as? [String: Any],
                      let id = doc["id"] as? String,
                      let name = doc["name"] as? String else { return nil }
                return AIProgram(
                    id: id,
                    name: name,
                    category: doc["category"] as? String ?? "",
                    description: doc["description"] as? String,
                    phone: doc["phone"] as? String,
                    website: doc["link"] as? String,
                    areas: doc["area"] != nil ? [doc["area"] as! String] : nil
                )
            }
        } catch {
            print("[SmartAssistant] Typesense search failed: \(error.localizedDescription)")
            return []
        }
    }

    // MARK: - Intent Parsing (Call 1)

    /// Parse user intent into structured JSON via LLM
    private func parseIntent(
        message: String,
        history: [[String: String]],
        session: URLSession,
        endpoint: String
    ) async -> [String: Any] {
        // Use vLLM (GPU) for fast intent parsing
        guard let url = URL(string: Self.vllmEndpoint) else {
            return fallbackIntent(message)
        }

        let recentHistory = Array(history.suffix(4))
        var messages: [[String: String]] = [
            ["role": "system", "content": intentParserPrompt]
        ]
        messages.append(contentsOf: recentHistory)
        messages.append(["role": "user", "content": message])

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 10

        let body: [String: Any] = [
            "model": Self.vllmModel,
            "messages": messages,
            "stream": false,
            "max_tokens": 150,
            "temperature": 0.1
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                return fallbackIntent(message)
            }

            // vLLM uses OpenAI format
            let result = try JSONDecoder().decode(OpenAIResponse.self, from: data)
            let content = result.choices?.first?.message?.content ?? ""

            // Extract JSON from response
            if let range = content.range(of: "\\{[\\s\\S]*\\}", options: .regularExpression) {
                let jsonString = String(content[range])
                if let jsonData = jsonString.data(using: .utf8),
                   let parsed = try JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
                    return parsed
                }
            }
            return fallbackIntent(message)
        } catch {
            return fallbackIntent(message)
        }
    }

    /// Fallback intent when LLM parse fails
    private func fallbackIntent(_ message: String) -> [String: Any] {
        let lower = message.lowercased()
        let isGreeting = lower.hasPrefix("hi") || lower.hasPrefix("hello") || lower.hasPrefix("hey")
        return [
            "query": message,
            "category": "general",
            "needs_location": false,
            "is_greeting": isGreeting,
            "is_crisis": false,
        ]
    }

    // MARK: - AI Search (Two-Call Pattern)

    /// Perform AI search using two-call pattern:
    /// Call 1: Intent parse → Typesense search → Call 2: Response format
    public func performAISearch(
        query: String,
        conversationHistory: [[String: String]] = [],
        location: String? = nil,
        county: String? = nil,
        useTor: Bool = false,
        profileContext: ProfileContext? = nil
    ) async throws -> AISearchResult {
        // Get the appropriate endpoint based on privacy mode
        let endpoint = await getAIChatEndpoint(useTor: useTor)
        guard let _ = URL(string: endpoint) else {
            throw SmartAssistantError.invalidURL
        }

        // Select appropriate session based on privacy mode
        let session: URLSession
        let privacyMode = await privacyService.getPrivacyMode()

        if useTor || privacyMode == .tor {
            guard let torSession = torSession else {
                throw SmartAssistantError.torNotConfigured
            }
            session = torSession
        } else if privacyMode == .domainFronting {
            let config = await privacyService.createURLSessionConfiguration()
            config.timeoutIntervalForRequest = requestTimeout
            config.timeoutIntervalForResource = requestTimeout
            session = URLSession(configuration: config)
        } else {
            session = standardSession
        }

        let sanitizedQuery = sanitizeQuery(query)

        // Call 1: Parse intent
        let intent = await parseIntent(
            message: sanitizedQuery,
            history: conversationHistory,
            session: session,
            endpoint: endpoint
        )

        let isGreeting = intent["is_greeting"] as? Bool ?? false
        let isCrisis = intent["is_crisis"] as? Bool ?? false
        let searchQuery = intent["query"] as? String ?? sanitizedQuery
        let category = intent["category"] as? String ?? "general"

        // Handle greetings without search
        if isGreeting {
            return AISearchResult(
                message: "Hey there! I'm Carl, your Bay Area benefits buddy. What can I help you find today? I know about food assistance, healthcare, housing, and more.",
                programs: [],
                programsFound: 0,
                location: nil,
                quickAnswer: nil,
                tier: "greeting"
            )
        }

        // Search via Typesense
        let programs = searchQuery.trimmingCharacters(in: .whitespaces).isEmpty
            ? [] : await searchViaTypesense(query: searchQuery, category: category)

        // Build context for Call 2
        let programContext = programs.isEmpty
            ? "No programs found matching this query."
            : programs.prefix(8).map { "- \($0.name): \($0.description ?? "")" }.joined(separator: "\n")

        // Build system prompt with optional profile context
        var effectivePrompt = responseFormatterPrompt
        if let profile = profileContext {
            effectivePrompt += "\n\n" + profile.toPromptContext()
        }

        // Call 2: Format response with search results
        var responseMessages: [[String: String]] = [
            ["role": "system", "content": effectivePrompt]
        ]
        for msg in conversationHistory.prefix(4) {
            if let role = msg["role"], let content = msg["content"] {
                responseMessages.append(["role": role, "content": content])
            }
        }
        responseMessages.append([
            "role": "user",
            "content": "[PROGRAMS]\n\(programContext)\n[/PROGRAMS]\n\nUser asked: \(sanitizedQuery)"
        ])

        // Call 2 uses vLLM (GPU) for fast response generation
        guard let url = URL(string: Self.vllmEndpoint) else {
            throw SmartAssistantError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "model": Self.vllmModel,
            "messages": responseMessages,
            "stream": false,
            "max_tokens": 250,
            "temperature": 0.4
        ]

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

        // vLLM uses OpenAI format
        let vllmResult = try JSONDecoder().decode(OpenAIResponse.self, from: data)
        let aiMessage = vllmResult.choices?.first?.message?.content ?? "I couldn't generate a response. Please try searching the directory directly."

        return AISearchResult(
            message: aiMessage,
            programs: programs,
            programsFound: programs.count,
            location: nil,
            quickAnswer: nil,
            tier: isCrisis ? "crisis" : (useTor ? "llm_tor" : "llm")
        )
    }

    // MARK: - Crisis Detection

    /// Check if a query contains crisis keywords
    public func detectCrisis(_ query: String) async -> CrisisType? {
        // First check quick answers for crisis patterns
        if let crisisResponse = await quickAnswers.matchCrisis(query) {
            if crisisResponse.type == "crisis" {
                // Determine crisis type from the response
                if let resource = crisisResponse.resource {
                    if resource.phone == "988" {
                        return .mentalHealth
                    } else if resource.phone == "1-800-799-7233" {
                        return .domesticViolence
                    }
                }
                return .emergency
            }
        }

        // Fallback to simple keyword detection
        let lowerQuery = query.lowercased()

        let emergencyKeywords = [
            "emergency", "danger", "hurt", "attack", "abuse",
            "violence", "domestic violence", "unsafe", "threatened"
        ]

        let mentalHealthKeywords = [
            "suicide", "suicidal", "kill myself", "end my life",
            "don't want to live", "want to die", "self-harm",
            "cutting", "hurting myself", "crisis", "desperate"
        ]

        for keyword in mentalHealthKeywords {
            if lowerQuery.contains(keyword) {
                return .mentalHealth
            }
        }

        for keyword in emergencyKeywords {
            if lowerQuery.contains(keyword) {
                return .emergency
            }
        }

        return nil
    }

    // MARK: - Query Classification

    /// Check if a query should use AI search (complex/natural language queries)
    public func shouldUseAISearch(_ query: String) -> Bool {
        guard query.count >= 10 else { return false }

        let demographicTerms = [
            "senior", "elderly", "veteran", "disabled", "disability",
            "student", "low-income", "homeless", "immigrant", "lgbtq",
            "family", "child", "parent", "youth", "teen"
        ]

        let naturalPatterns = [
            "i need", "i'm looking", "help with", "how can i", "where can i",
            "looking for", "need help", "can you help", "what programs",
            "i am a", "i'm a", "my family", "we need"
        ]

        let lowerQuery = query.lowercased()

        for term in demographicTerms {
            if lowerQuery.contains(term) { return true }
        }

        for pattern in naturalPatterns {
            if lowerQuery.contains(pattern) { return true }
        }

        let wordCount = query.split(separator: " ").filter { $0.count > 2 }.count
        if wordCount >= 4 { return true }

        return false
    }
}

// MARK: - Types

public enum CrisisType: Sendable {
    case emergency
    case mentalHealth
    case domesticViolence
}

public enum SmartAssistantError: LocalizedError, Sendable {
    case invalidURL
    case networkError
    case httpError(Int)
    case serverError(String)
    case decodingError
    case torNotConfigured

    public var errorDescription: String? {
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
        case .torNotConfigured:
            return "Tor proxy is not configured. Enable Tor in Privacy settings."
        }
    }
}

public struct AISearchResult: Sendable {
    public let message: String
    public let programs: [AIProgram]
    public let programsFound: Int
    public let location: LocationInfo?
    public let quickAnswer: QuickAnswer?
    public let tier: String?

    public init(
        message: String,
        programs: [AIProgram],
        programsFound: Int,
        location: LocationInfo?,
        quickAnswer: QuickAnswer?,
        tier: String?
    ) {
        self.message = message
        self.programs = programs
        self.programsFound = programsFound
        self.location = location
        self.quickAnswer = quickAnswer
        self.tier = tier
    }
}

public struct AISearchResponse: Codable, Sendable {
    public let message: String?
    public let programs: [AIProgram]?
    public let programsFound: Int?
    public let searchQuery: String?
    public let location: LocationInfo?
    public let quickAnswer: QuickAnswer?
    public let tier: String?
}

/// Response format from Ollama API
struct OllamaResponse: Codable {
    let model: String?
    let message: OllamaMessage?
    let response: String?
    let done: Bool?
}

struct OllamaMessage: Codable {
    let role: String
    let content: String
}

/// OpenAI-compatible response (used by vLLM)
struct OpenAIResponse: Codable {
    let choices: [OpenAIChoice]?
}

struct OpenAIChoice: Codable {
    let message: OllamaMessage?
}

public struct AIProgram: Codable, Identifiable, Sendable {
    public let id: String
    public let name: String
    public let category: String
    public let description: String?
    public let phone: String?
    public let website: String?
    public let areas: [String]?
}

public struct LocationInfo: Codable, Sendable {
    public let zip: String?
    public let city: String?
    public let county: String?
}

struct ErrorResponse: Codable {
    let error: String
}

// MARK: - Quick Answer Types

public struct QuickAnswer: Codable, Sendable {
    public let type: String
    public let title: String?
    public let message: String?
    public let summary: String?
    public let resource: QuickAnswerResource?
    public let secondary: QuickAnswerResource?
    public let categories: [QuickAnswerCategory]?
    public let countyContact: CountyContact?
    public let guideUrl: String?
    public let guideText: String?
    public let applyUrl: String?
    public let applyText: String?
    public let search: String?

    public var isCrisis: Bool { type == "crisis" }
    public var needsClarification: Bool { type == "clarify" }
}

public struct QuickAnswerResource: Codable, Sendable {
    public let name: String
    public let phone: String?
    public let description: String?
    public let action: String?
}

public struct QuickAnswerCategory: Codable, Identifiable, Sendable {
    public let id: String
    public let label: String
    public let icon: String?
    public let search: String?
}

public struct CountyContact: Codable, Sendable {
    public let name: String
    public let phone: String
    public let agency: String
}

// MARK: - Profile Context for Personalized Responses

/// Profile context for personalized AI responses (App users only)
///
/// When a user has enabled profile sharing in the app, this context is passed to the AI
/// so it can skip redundant questions (like asking for location) and prioritize
/// programs relevant to the user's situation.
///
/// PRIVACY DESIGN:
/// - Contains abstracted user attributes, NEVER raw PII
/// - Age is stored as a range ("18-25", "65+"), not exact birth date
/// - Location is city/county level, not street address
/// - Qualifications are categories ("student", "veteran"), not specific details
///
/// If user hasn't enabled profile sharing, treat them like a website visitor
/// (ask for location, age, etc. as needed during conversation).
///
public struct ProfileContext: Sendable {
    public let county: String?
    public let city: String?
    public let ageRange: String?  // e.g., "18-25", "65+", not exact age
    public let isMilitaryOrVeteran: Bool
    public let qualifications: [String]  // e.g., ["student", "caregiver"]

    public init(
        county: String? = nil,
        city: String? = nil,
        ageRange: String? = nil,
        isMilitaryOrVeteran: Bool = false,
        qualifications: [String] = []
    ) {
        self.county = county
        self.city = city
        self.ageRange = ageRange
        self.isMilitaryOrVeteran = isMilitaryOrVeteran
        self.qualifications = qualifications
    }

    /// Convert profile to a privacy-respecting prompt context
    /// Uses abstracted categories rather than specific personal details
    public func toPromptContext() -> String {
        var parts: [String] = []

        if let city = city, !city.isEmpty {
            parts.append("located in \(city)")
        } else if let county = county, !county.isEmpty {
            parts.append("in \(county) County")
        }

        if let ageRange = ageRange, !ageRange.isEmpty {
            parts.append("age \(ageRange)")
        }

        if isMilitaryOrVeteran {
            parts.append("veteran or military")
        }

        if !qualifications.isEmpty {
            let formattedQuals = qualifications.map { $0.replacingOccurrences(of: "-", with: " ") }
            parts.append(formattedQuals.joined(separator: ", "))
        }

        guard !parts.isEmpty else { return "" }

        return "USER CONTEXT: The user is \(parts.joined(separator: "; ")). Use this to prioritize relevant programs but still ask clarifying questions as needed."
    }
}
