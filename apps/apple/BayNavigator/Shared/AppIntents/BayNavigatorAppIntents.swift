import AppIntents
import SwiftUI

#if canImport(FoundationModels)
import FoundationModels
#endif

// MARK: - App Shortcuts Provider

struct BayNavigatorShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        // Ask Carl - primary conversational interface.
        // Note: App Shortcut phrases must contain \(.applicationName) and cannot
        // interpolate String parameters, so these are non-parameterized.
        AppShortcut(
            intent: AskCarlIntent(),
            phrases: [
                "Ask Carl in \(.applicationName)",
                "Ask \(.applicationName) for help",
                "Talk to Carl in \(.applicationName)",
                "Get help from \(.applicationName)"
            ],
            shortTitle: "Ask Carl",
            systemImageName: "bubble.left.and.bubble.right.fill"
        )

        AppShortcut(
            intent: SearchProgramsIntent(),
            phrases: [
                "Search \(.applicationName)",
                "Find services in \(.applicationName)",
                "Look up programs in \(.applicationName)"
            ],
            shortTitle: "Search Programs",
            systemImageName: "magnifyingglass"
        )

        AppShortcut(
            intent: FindFoodAssistanceIntent(),
            phrases: [
                "Find food assistance in \(.applicationName)",
                "Food help in \(.applicationName)",
                "Get food benefits in \(.applicationName)",
                "Find CalFresh in \(.applicationName)"
            ],
            shortTitle: "Food Assistance",
            systemImageName: "fork.knife"
        )

        AppShortcut(
            intent: FindHousingIntent(),
            phrases: [
                "Find housing assistance in \(.applicationName)",
                "Housing help in \(.applicationName)",
                "Rental assistance in \(.applicationName)",
                "Emergency housing in \(.applicationName)"
            ],
            shortTitle: "Housing Help",
            systemImageName: "house"
        )

        AppShortcut(
            intent: FindHealthcareIntent(),
            phrases: [
                "Find healthcare assistance in \(.applicationName)",
                "Health services in \(.applicationName)",
                "Find Medi-Cal in \(.applicationName)",
                "Find free clinics in \(.applicationName)"
            ],
            shortTitle: "Healthcare",
            systemImageName: "heart"
        )

        AppShortcut(
            intent: ShowFavoritesIntent(),
            phrases: [
                "Show my saved programs in \(.applicationName)",
                "Open favorites in \(.applicationName)",
                "My saved services in \(.applicationName)"
            ],
            shortTitle: "My Favorites",
            systemImageName: "heart.fill"
        )

        AppShortcut(
            intent: GetProgramCountIntent(),
            phrases: [
                "How many programs are in \(.applicationName)?",
                "Program count in \(.applicationName)"
            ],
            shortTitle: "Program Count",
            systemImageName: "number"
        )
    }
}

// MARK: - Ask Carl Intent (Apple Intelligence Enhanced)

/// Ask Carl - Conversational AI assistant for finding Bay Area programs
/// Uses Apple Intelligence Foundation Models when available for on-device processing
struct AskCarlIntent: AppIntent {
    static var title: LocalizedStringResource = "Ask Carl"
    static var description = IntentDescription("Ask Carl to help you find Bay Area social services and programs")

    @Parameter(title: "Question", description: "What would you like help with?")
    var question: String

    @Parameter(title: "County", description: "Optional: Specify a county for location-specific results")
    var county: CountyEntity?

    // Carl's system prompt for Siri context
    private static let carlSystemPrompt = """
    You are Carl, a friendly and knowledgeable assistant for Bay Navigator, helping people in the Bay Area find free and low-cost social services.

    Keep responses brief (2-3 sentences max) since this is a voice interface.
    Be warm and helpful. If you don't know something, suggest they open the app for more options.
    Focus on actionable information: program names, phone numbers, or next steps.
    """

    func perform() async throws -> some IntentResult & ProvidesDialog & ShowsSnippetView {
        // Use on-device Apple Intelligence when available; otherwise hand off to the app.
        var carlResponse = Self.handoffMessage
        var showOpenAppButton = true

        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, visionOS 26.0, *), SystemLanguageModel.default.isAvailable {
            carlResponse = try await generateWithAppleIntelligence()
            showOpenAppButton = false
        }
        #endif

        return .result(
            dialog: "\(carlResponse)",
            view: AskCarlSnippetView(
                question: question,
                response: carlResponse,
                county: county?.name,
                showOpenAppButton: showOpenAppButton
            )
        )
    }

    /// Message shown when on-device AI is unavailable and we hand off to the app.
    static let handoffMessage = "I'd love to help you with that! Let me open Bay Navigator so we can explore your options together."

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, visionOS 26.0, *)
    private func generateWithAppleIntelligence() async throws -> String {
        let session = LanguageModelSession()

        // Build prompt with county context if available
        var prompt = Self.carlSystemPrompt + "\n\n"
        if let county = county {
            prompt += "The user is asking about services in \(county.name).\n\n"
        }
        prompt += "User: \(question)\nCarl:"

        // Generate response using on-device model
        let response = try await session.respond(to: prompt)
        return response.content.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    #endif
}

/// Snippet view for Ask Carl responses in Siri
struct AskCarlSnippetView: View {
    let question: String
    let response: String
    let county: String?
    var showOpenAppButton: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Carl avatar and response
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "sparkles")
                    .font(.title2)
                    .foregroundStyle(.tint)
                    .frame(width: 32, height: 32)
                    .background(Color.accentColor.opacity(0.1))
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 4) {
                    Text("Carl")
                        .font(.caption.bold())
                        .foregroundStyle(.secondary)

                    Text(response)
                        .font(.body)
                }
            }

            // County context if provided
            if let county = county {
                HStack(spacing: 4) {
                    Image(systemName: "mappin.circle.fill")
                        .font(.caption)
                    Text(county)
                        .font(.caption)
                }
                .foregroundStyle(.secondary)
            }

            // Open app button if needed
            if showOpenAppButton {
                Link(destination: URL(string: "baynavigator://ask-carl?q=\(question.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")")!) {
                    HStack {
                        Image(systemName: "arrow.up.right.square")
                        Text("Open Bay Navigator")
                    }
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color.accentColor, in: RoundedRectangle(cornerRadius: 8))
                }
            }
        }
        .padding()
    }
}

// MARK: - Search Programs Intent

@available(iOS 18.0, macOS 15.0, visionOS 2.0, *)
struct SearchProgramsIntent: AppIntent {
    static var title: LocalizedStringResource = "Search Programs"
    static var description = IntentDescription("Search for social service programs in the Bay Area")
    static var openAppWhenRun: Bool = true

    @Parameter(title: "Search Query")
    var query: String?

    @Parameter(title: "Category")
    var category: ProgramCategoryEntity?

    @Parameter(title: "County")
    var county: CountyEntity?

    func perform() async throws -> some IntentResult & OpensIntent {
        // Build deep link URL
        var components = URLComponents(string: "baynavigator://search")!
        var queryItems: [URLQueryItem] = []

        if let query = query {
            queryItems.append(URLQueryItem(name: "q", value: query))
        }
        if let category = category {
            queryItems.append(URLQueryItem(name: "category", value: category.id))
        }
        if let county = county {
            queryItems.append(URLQueryItem(name: "county", value: county.id))
        }

        if !queryItems.isEmpty {
            components.queryItems = queryItems
        }

        return .result(opensIntent: OpenURLIntent(components.url!))
    }
}

// MARK: - Category-Specific Intents

@available(iOS 18.0, macOS 15.0, visionOS 2.0, *)
struct FindFoodAssistanceIntent: AppIntent {
    static var title: LocalizedStringResource = "Find Food Assistance"
    static var description = IntentDescription("Find food assistance programs like CalFresh, food banks, and meal programs")
    static var openAppWhenRun: Bool = true

    @Parameter(title: "County")
    var county: CountyEntity?

    func perform() async throws -> some IntentResult & OpensIntent {
        var urlString = "baynavigator://category/food"
        if let county = county {
            urlString += "?county=\(county.id)"
        }
        return .result(opensIntent: OpenURLIntent(URL(string: urlString)!))
    }
}

@available(iOS 18.0, macOS 15.0, visionOS 2.0, *)
struct FindHousingIntent: AppIntent {
    static var title: LocalizedStringResource = "Find Housing Assistance"
    static var description = IntentDescription("Find housing programs including rental assistance and emergency housing")
    static var openAppWhenRun: Bool = true

    @Parameter(title: "County")
    var county: CountyEntity?

    func perform() async throws -> some IntentResult & OpensIntent {
        var urlString = "baynavigator://category/housing"
        if let county = county {
            urlString += "?county=\(county.id)"
        }
        return .result(opensIntent: OpenURLIntent(URL(string: urlString)!))
    }
}

@available(iOS 18.0, macOS 15.0, visionOS 2.0, *)
struct FindHealthcareIntent: AppIntent {
    static var title: LocalizedStringResource = "Find Healthcare"
    static var description = IntentDescription("Find healthcare programs including Medi-Cal and free clinics")
    static var openAppWhenRun: Bool = true

    @Parameter(title: "County")
    var county: CountyEntity?

    func perform() async throws -> some IntentResult & OpensIntent {
        var urlString = "baynavigator://category/health"
        if let county = county {
            urlString += "?county=\(county.id)"
        }
        return .result(opensIntent: OpenURLIntent(URL(string: urlString)!))
    }
}

@available(iOS 18.0, macOS 15.0, visionOS 2.0, *)
struct FindEmploymentIntent: AppIntent {
    static var title: LocalizedStringResource = "Find Employment Help"
    static var description = IntentDescription("Find job training and employment assistance programs")
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult & OpensIntent {
        return .result(opensIntent: OpenURLIntent(URL(string: "baynavigator://category/employment")!))
    }
}

@available(iOS 18.0, macOS 15.0, visionOS 2.0, *)
struct FindLegalHelpIntent: AppIntent {
    static var title: LocalizedStringResource = "Find Legal Help"
    static var description = IntentDescription("Find free legal assistance and immigration services")
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult & OpensIntent {
        return .result(opensIntent: OpenURLIntent(URL(string: "baynavigator://category/legal")!))
    }
}

// MARK: - Favorites Intent

@available(iOS 18.0, macOS 15.0, visionOS 2.0, *)
struct ShowFavoritesIntent: AppIntent {
    static var title: LocalizedStringResource = "Show Favorites"
    static var description = IntentDescription("Open your saved programs")
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult & OpensIntent {
        return .result(opensIntent: OpenURLIntent(URL(string: "baynavigator://favorites")!))
    }
}

// MARK: - Information Intents

struct GetProgramCountIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Program Count"
    static var description = IntentDescription("Get the total number of available programs")

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let defaults = UserDefaults(suiteName: "group.org.baytides.baynavigator")
        let count = defaults?.integer(forKey: "totalPrograms") ?? 0
        let favorites = defaults?.integer(forKey: "favoriteCount") ?? 0

        return .result(dialog: "Bay Navigator has \(count) programs available. You have \(favorites) saved to favorites.")
    }
}

struct GetProgramDetailsIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Program Details"
    static var description = IntentDescription("Get details about a specific program")

    @Parameter(title: "Program")
    var program: ProgramEntity

    func perform() async throws -> some IntentResult & ProvidesDialog & ShowsSnippetView {
        return .result(
            dialog: "\(program.name) is a \(program.category) program.",
            view: ProgramSnippetView(program: program)
        )
    }
}

// MARK: - Add to Favorites Intent

struct AddToFavoritesIntent: AppIntent {
    static var title: LocalizedStringResource = "Save Program"
    static var description = IntentDescription("Add a program to your favorites")

    @Parameter(title: "Program")
    var program: ProgramEntity

    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Save to shared UserDefaults
        let defaults = UserDefaults(suiteName: "group.org.baytides.baynavigator")
        var favorites = defaults?.stringArray(forKey: "favoriteIds") ?? []

        if !favorites.contains(program.id) {
            favorites.append(program.id)
            defaults?.set(favorites, forKey: "favoriteIds")
            defaults?.set(favorites.count, forKey: "favoriteCount")

            return .result(dialog: "Added \(program.name) to your favorites.")
        } else {
            return .result(dialog: "\(program.name) is already in your favorites.")
        }
    }
}

// MARK: - Entities

struct ProgramEntity: AppEntity {
    var id: String
    var name: String
    var category: String
    var description: String?

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Program"

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(name)", subtitle: "\(category)")
    }

    static var defaultQuery = ProgramEntityQuery()
}

struct ProgramEntityQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [ProgramEntity] {
        // Load programs from shared storage
        let defaults = UserDefaults(suiteName: "group.org.baytides.baynavigator")
        guard let data = defaults?.data(forKey: "allPrograms"),
              let programs = try? JSONDecoder().decode([ProgramEntityData].self, from: data) else {
            return []
        }

        return programs
            .filter { identifiers.contains($0.id) }
            .map { ProgramEntity(id: $0.id, name: $0.name, category: $0.category, description: $0.description) }
    }

    func suggestedEntities() async throws -> [ProgramEntity] {
        // Return recent/favorite programs as suggestions
        let defaults = UserDefaults(suiteName: "group.org.baytides.baynavigator")
        guard let data = defaults?.data(forKey: "favoritePrograms"),
              let programs = try? JSONDecoder().decode([ProgramEntityData].self, from: data) else {
            return []
        }

        return programs.prefix(10).map {
            ProgramEntity(id: $0.id, name: $0.name, category: $0.category, description: $0.description)
        }
    }
}

struct ProgramEntityData: Codable {
    let id: String
    let name: String
    let category: String
    let description: String?
}

struct ProgramCategoryEntity: AppEntity {
    var id: String
    var name: String

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Category"

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(name)")
    }

    static var defaultQuery = ProgramCategoryQuery()

    static let all: [ProgramCategoryEntity] = [
        ProgramCategoryEntity(id: "food", name: "Food Assistance"),
        ProgramCategoryEntity(id: "housing", name: "Housing"),
        ProgramCategoryEntity(id: "health", name: "Healthcare"),
        ProgramCategoryEntity(id: "employment", name: "Employment"),
        ProgramCategoryEntity(id: "education", name: "Education"),
        ProgramCategoryEntity(id: "legal", name: "Legal Services"),
        ProgramCategoryEntity(id: "financial", name: "Financial Assistance"),
        ProgramCategoryEntity(id: "transportation", name: "Transportation")
    ]
}

struct ProgramCategoryQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [ProgramCategoryEntity] {
        ProgramCategoryEntity.all.filter { identifiers.contains($0.id) }
    }

    func suggestedEntities() async throws -> [ProgramCategoryEntity] {
        ProgramCategoryEntity.all
    }
}

struct CountyEntity: AppEntity {
    var id: String
    var name: String

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "County"

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(name)")
    }

    static var defaultQuery = CountyEntityQuery()

    static let bayAreaCounties: [CountyEntity] = [
        CountyEntity(id: "alameda", name: "Alameda County"),
        CountyEntity(id: "contra-costa", name: "Contra Costa County"),
        CountyEntity(id: "marin", name: "Marin County"),
        CountyEntity(id: "napa", name: "Napa County"),
        CountyEntity(id: "san-francisco", name: "San Francisco"),
        CountyEntity(id: "san-mateo", name: "San Mateo County"),
        CountyEntity(id: "santa-clara", name: "Santa Clara County"),
        CountyEntity(id: "solano", name: "Solano County"),
        CountyEntity(id: "sonoma", name: "Sonoma County")
    ]
}

struct CountyEntityQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [CountyEntity] {
        CountyEntity.bayAreaCounties.filter { identifiers.contains($0.id) }
    }

    func suggestedEntities() async throws -> [CountyEntity] {
        CountyEntity.bayAreaCounties
    }
}

// MARK: - Snippet Views

struct ProgramSnippetView: View {
    let program: ProgramEntity

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: categoryIcon(for: program.category))
                    .foregroundStyle(.tint)
                Text(program.category)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Text(program.name)
                .font(.headline)

            if let description = program.description {
                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(3)
            }
        }
        .padding()
    }

    private func categoryIcon(for category: String) -> String {
        switch category.lowercased() {
        case "food", "food assistance": return "fork.knife"
        case "housing": return "house.fill"
        case "health", "healthcare": return "heart.fill"
        case "employment": return "briefcase.fill"
        case "education": return "book.fill"
        case "legal", "legal services": return "scale.3d"
        default: return "folder.fill"
        }
    }
}

// MARK: - Spotlight Integration

import CoreSpotlight

extension ProgramEntity {
    func indexInSpotlight() {
        let attributeSet = CSSearchableItemAttributeSet(contentType: .content)
        attributeSet.title = name
        attributeSet.contentDescription = description ?? "A \(category) program in the Bay Area"
        attributeSet.keywords = [category, "social services", "bay area", "assistance"]

        let item = CSSearchableItem(
            uniqueIdentifier: "program-\(id)",
            domainIdentifier: "org.baytides.baynavigator.programs",
            attributeSet: attributeSet
        )

        CSSearchableIndex.default().indexSearchableItems([item])
    }
}
