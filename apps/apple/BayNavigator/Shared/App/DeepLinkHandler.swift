import SwiftUI
import BayNavigatorCore
#if canImport(WidgetKit)
import WidgetKit
#endif

// MARK: - Deep Link Types

enum DeepLink: Equatable {
    case home
    case search(query: String?, category: String?, county: String?)
    case program(id: String)
    case category(id: String, county: String?)
    case guide(id: String)
    case favorites
    case settings
    case forYou
    case onboarding

    init?(url: URL) {
        guard url.scheme == "baynavigator" else { return nil }

        let path = url.host ?? url.path
        let queryParams = url.queryParameters

        switch path {
        case "", "home":
            self = .home

        case "search":
            self = .search(
                query: queryParams?["q"],
                category: queryParams?["category"],
                county: queryParams?["county"]
            )

        case "program":
            // baynavigator://program/abc123 or baynavigator://program?id=abc123
            if let programId = url.pathComponents.dropFirst().first ?? queryParams?["id"] {
                self = .program(id: programId)
            } else {
                return nil
            }

        case "category":
            // baynavigator://category/food?county=alameda
            if let categoryId = url.pathComponents.dropFirst().first ?? queryParams?["id"] {
                self = .category(id: categoryId, county: queryParams?["county"])
            } else {
                return nil
            }

        case "guide":
            // baynavigator://guide/food -> open food eligibility guide
            if let guideId = url.pathComponents.dropFirst().first ?? queryParams?["id"] {
                self = .guide(id: guideId)
            } else {
                return nil
            }

        case "favorites":
            self = .favorites

        case "settings":
            self = .settings

        case "foryou", "for-you":
            self = .forYou

        case "onboarding":
            self = .onboarding

        default:
            // Try to parse as program ID directly
            if !path.isEmpty {
                self = .program(id: path)
            } else {
                return nil
            }
        }
    }
}

// MARK: - Deep Link Handler

@Observable
class DeepLinkHandler {
    var pendingDeepLink: DeepLink?
    var selectedTab: ContentView.Tab = .forYou
    var navigationPath = NavigationPath()
    var searchQuery: String = ""
    var selectedCategory: String?
    var selectedCounty: String?
    var showOnboarding = false

    func handle(_ url: URL) {
        guard let deepLink = DeepLink(url: url) else {
            print("Invalid deep link: \(url)")
            return
        }

        handle(deepLink)
    }

    func handle(_ deepLink: DeepLink) {
        // Reset navigation state
        navigationPath = NavigationPath()

        switch deepLink {
        case .home:
            selectedTab = .forYou

        case .search(let query, let category, let county):
            selectedTab = .directory
            searchQuery = query ?? ""
            selectedCategory = category
            selectedCounty = county

        case .program(let id):
            selectedTab = .directory
            // Push program onto navigation stack
            pendingDeepLink = deepLink

        case .category(let id, let county):
            selectedTab = .directory
            selectedCategory = id
            selectedCounty = county

        case .guide(let id):
            selectedTab = .guides
            // Push guide onto navigation stack
            pendingDeepLink = deepLink

        case .favorites:
            selectedTab = .saved

        case .settings:
            selectedTab = .settings

        case .forYou:
            selectedTab = .forYou

        case .onboarding:
            showOnboarding = true
        }
    }

    func consumePendingDeepLink() -> DeepLink? {
        let link = pendingDeepLink
        pendingDeepLink = nil
        return link
    }
}

// MARK: - URL Query Parameters Extension

extension URL {
    var queryParameters: [String: String]? {
        guard let components = URLComponents(url: self, resolvingAgainstBaseURL: true),
              let queryItems = components.queryItems else {
            return nil
        }

        var params: [String: String] = [:]
        for item in queryItems {
            params[item.name] = item.value
        }
        return params
    }
}

// MARK: - Environment Key

struct DeepLinkHandlerKey: EnvironmentKey {
    static let defaultValue = DeepLinkHandler()
}

extension EnvironmentValues {
    var deepLinkHandler: DeepLinkHandler {
        get { self[DeepLinkHandlerKey.self] }
        set { self[DeepLinkHandlerKey.self] = newValue }
    }
}

// MARK: - View Modifier for Deep Link Handling

struct DeepLinkModifier: ViewModifier {
    @Environment(DeepLinkHandler.self) private var deepLinkHandler
    @Environment(ProgramsViewModel.self) private var programsVM

    func body(content: Content) -> some View {
        content
            .onOpenURL { url in
                deepLinkHandler.handle(url)
            }
            .onChange(of: deepLinkHandler.pendingDeepLink) { _, newValue in
                if case .program(let id) = newValue {
                    // Find the program and navigate to it
                    if let program = programsVM.programs.first(where: { $0.id == id }) {
                        // Add to navigation path
                        // This requires the view to observe the deep link handler
                    }
                    deepLinkHandler.pendingDeepLink = nil
                }
            }
    }
}

extension View {
    func handleDeepLinks() -> some View {
        modifier(DeepLinkModifier())
    }
}

// MARK: - Widget Data Sync

class WidgetDataSync {
    static let shared = WidgetDataSync()

    private let defaults = UserDefaults(suiteName: "group.org.baytides.navigator")

    func syncProgramData(programs: [Program], favorites: Set<String>) {
        // Sync total count
        defaults?.set(programs.count, forKey: "totalPrograms")
        defaults?.set(favorites.count, forKey: "favoriteCount")
        defaults?.set(Date(), forKey: "lastUpdated")

        // Sync favorite programs for widget
        let favoritePrograms = programs
            .filter { favorites.contains($0.id) }
            .prefix(10)
            .map { program in
                WidgetProgramData(
                    id: program.id,
                    name: program.name,
                    category: program.category,
                    description: program.description
                )
            }

        if let data = try? JSONEncoder().encode(Array(favoritePrograms)) {
            defaults?.set(data, forKey: "favoritePrograms")
        }

        // Sync recent programs
        let recentPrograms = programs
            .prefix(10)
            .map { program in
                WidgetProgramData(
                    id: program.id,
                    name: program.name,
                    category: program.category,
                    description: program.description
                )
            }

        if let data = try? JSONEncoder().encode(Array(recentPrograms)) {
            defaults?.set(data, forKey: "recentPrograms")
        }

        // Sync favorite IDs
        defaults?.set(Array(favorites), forKey: "favoriteIds")

        // Sync all programs for App Intents
        let allProgramData = programs.map { program in
            WidgetProgramData(
                id: program.id,
                name: program.name,
                category: program.category,
                description: program.description
            )
        }

        if let data = try? JSONEncoder().encode(allProgramData) {
            defaults?.set(data, forKey: "allPrograms")
        }

        // Reload widgets
        #if canImport(WidgetKit)
        if #available(iOS 14.0, macOS 11.0, visionOS 26.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
        #endif
    }

    func syncFavoriteChange(programId: String, isFavorite: Bool) {
        var favorites = defaults?.stringArray(forKey: "favoriteIds") ?? []

        if isFavorite {
            if !favorites.contains(programId) {
                favorites.append(programId)
            }
        } else {
            favorites.removeAll { $0 == programId }
        }

        defaults?.set(favorites, forKey: "favoriteIds")
        defaults?.set(favorites.count, forKey: "favoriteCount")

        #if canImport(WidgetKit)
        if #available(iOS 14.0, macOS 11.0, visionOS 26.0, *) {
            WidgetCenter.shared.reloadTimelines(ofKind: "FavoritesWidget")
        }
        #endif
    }
}

struct WidgetProgramData: Codable {
    let id: String
    let name: String
    let category: String
    let description: String?
}
