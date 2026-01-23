import SwiftUI
import BayNavigatorCore

struct ContentView: View {
    @Environment(ProgramsViewModel.self) private var programsVM
    @Environment(SettingsViewModel.self) private var settingsVM
    @Environment(UserPrefsViewModel.self) private var userPrefsVM
    @Environment(SmartAssistantViewModel.self) private var assistantVM
    @Environment(NavigationService.self) private var navigationService

    @State private var selectedTab: Tab = .forYou
    @State private var isAppLocked = false
    @State private var isIncognitoMode = false
    @State private var showPINEntry = false
    @State private var hasCheckedPIN = false

    // MARK: - Tab Enum

    enum Tab: String, CaseIterable, Identifiable {
        // Main tabs (visible in tab bar)
        case forYou = "for_you"
        case directory = "directory"
        case map = "map"
        case askCarl = "ask_carl"
        case more = "more"

        // Secondary tabs (in More menu)
        case saved = "saved"
        case transit = "transit"
        case airports = "airports"
        case glossary = "glossary"
        case guides = "guides"
        case profiles = "profiles"
        case settings = "settings"
        case safety = "safety"

        var id: String { rawValue }

        var label: String {
            switch self {
            case .forYou: return "For You"
            case .directory: return "Directory"
            case .map: return "Map"
            case .askCarl: return "Ask Carl"
            case .more: return "More"
            case .saved: return "Saved"
            case .transit: return "Transit"
            case .airports: return "Airports"
            case .glossary: return "Glossary"
            case .guides: return "Guides"
            case .profiles: return "Profiles"
            case .settings: return "Settings"
            case .safety: return "Safety"
            }
        }

        var icon: String {
            switch self {
            case .forYou: return "sparkles"
            case .directory: return "list.bullet"
            case .map: return "map"
            case .askCarl: return "bubble.left.and.bubble.right"
            case .more: return "ellipsis.circle"
            case .saved: return "bookmark"
            case .transit: return "tram"
            case .airports: return "airplane"
            case .glossary: return "book.closed"
            case .guides: return "book"
            case .profiles: return "person.2"
            case .settings: return "gearshape"
            case .safety: return "shield"
            }
        }

        var selectedIcon: String {
            switch self {
            case .forYou: return "sparkles"
            case .directory: return "list.bullet"
            case .map: return "map.fill"
            case .askCarl: return "bubble.left.and.bubble.right.fill"
            case .more: return "ellipsis.circle.fill"
            case .saved: return "bookmark.fill"
            case .transit: return "tram.fill"
            case .airports: return "airplane"
            case .glossary: return "book.closed.fill"
            case .guides: return "book.fill"
            case .profiles: return "person.2.fill"
            case .settings: return "gearshape.fill"
            case .safety: return "shield.fill"
            }
        }

        /// Convert from NavItem id
        init?(navItemId: String) {
            switch navItemId {
            case "for_you": self = .forYou
            case "directory": self = .directory
            case "map": self = .map
            case "ask_carl": self = .askCarl
            case "saved": self = .saved
            case "transit": self = .transit
            case "airports": self = .airports
            case "glossary": self = .glossary
            case "guides": self = .guides
            case "profiles": self = .profiles
            case "settings": self = .settings
            case "safety": self = .safety
            default: return nil
            }
        }

        /// Default main tabs (excluding More which is always last)
        static let defaultMainTabs: [Tab] = [.forYou, .directory, .map, .askCarl]
    }

    var body: some View {
        Group {
            if isAppLocked && !hasCheckedPIN {
                // Loading state while checking PIN
                ProgressView("Loading...")
            } else if isAppLocked {
                // Show PIN entry
                pinLockedView
            } else {
                // Main content
                mainContentView
            }
        }
        .task {
            await checkPINProtection()
            await checkIncognitoMode()
            await programsVM.loadData()
        }
        .sheet(isPresented: .init(
            get: { userPrefsVM.showOnboarding },
            set: { userPrefsVM.showOnboarding = $0 }
        )) {
            OnboardingView()
                .environment(programsVM)
                .environment(userPrefsVM)
        }
    }

    // MARK: - Main Content View

    @ViewBuilder
    private var mainContentView: some View {
        ZStack(alignment: .top) {
            Group {
                #if os(iOS)
                iOSTabView()
                #elseif os(macOS)
                macOSNavigationView()
                #elseif os(visionOS)
                visionOSTabView()
                #endif
            }

            // Incognito indicator at top
            if isIncognitoMode {
                incognitoIndicatorView
            }
        }
    }

    // MARK: - Incognito Indicator

    @ViewBuilder
    private var incognitoIndicatorView: some View {
        HStack(spacing: 8) {
            Image(systemName: "eye.slash.fill")
                .font(.caption)

            Text("Incognito Mode - History not saved")
                .font(.caption)
        }
        .foregroundStyle(.white.opacity(0.8))
        .padding(.horizontal, 16)
        .padding(.vertical, 6)
        .frame(maxWidth: .infinity)
        .background(Color.gray.opacity(0.9))
    }

    // MARK: - PIN Locked View

    @ViewBuilder
    private var pinLockedView: some View {
        PINEntryView(mode: .unlock) { success in
            if success {
                withAnimation {
                    isAppLocked = false
                }
            }
        }
    }

    // MARK: - iOS View (with iOS 18 Sidebar Adaptable)

    #if os(iOS)
    @ViewBuilder
    private func iOSTabView() -> some View {
        TabView(selection: $selectedTab) {
            // Dynamic tabs from navigation service
            ForEach(visibleTabs, id: \.self) { tab in
                tabContent(for: tab)
                    .tabItem {
                        Label(tab.label, systemImage: selectedTab == tab ? tab.selectedIcon : tab.icon)
                    }
                    .tag(tab)
            }

            // More tab (always last)
            MoreView()
                .tabItem {
                    Label(Tab.more.label, systemImage: selectedTab == .more ? Tab.more.selectedIcon : Tab.more.icon)
                }
                .tag(Tab.more)
        }
        .modifier(SidebarAdaptableModifier())
        .tint(.appPrimary)
        .overlay(alignment: .bottomTrailing) {
            QuickExitFloatingButton()
        }
    }

    struct SidebarAdaptableModifier: ViewModifier {
        func body(content: Content) -> some View {
            if #available(iOS 18.0, *) {
                content.tabViewStyle(.sidebarAdaptable)
            } else {
                content
            }
        }
    }
    #endif

    // MARK: - macOS View

    #if os(macOS)
    @ViewBuilder
    private func macOSNavigationView() -> some View {
        NavigationSplitView {
            List(selection: $selectedTab) {
                Section("Main") {
                    ForEach(visibleTabs, id: \.self) { tab in
                        Label(tab.label, systemImage: tab.icon)
                            .tag(tab)
                    }
                }

                Section("More") {
                    ForEach(moreTabs, id: \.self) { tab in
                        Label(tab.label, systemImage: tab.icon)
                            .tag(tab)
                    }
                }
            }
            .navigationSplitViewColumnWidth(min: 180, ideal: 200)
        } detail: {
            tabContent(for: selectedTab)
        }
        .frame(minWidth: 900, minHeight: 600)
    }
    #endif

    // MARK: - visionOS View

    #if os(visionOS)
    @ViewBuilder
    private func visionOSTabView() -> some View {
        TabView(selection: $selectedTab) {
            // Dynamic tabs from navigation service
            ForEach(visibleTabs, id: \.self) { tab in
                tabContent(for: tab)
                    .tabItem {
                        Label(tab.label, systemImage: selectedTab == tab ? tab.selectedIcon : tab.icon)
                    }
                    .tag(tab)
            }

            // More tab (always last)
            MoreView()
                .tabItem {
                    Label(Tab.more.label, systemImage: selectedTab == .more ? Tab.more.selectedIcon : Tab.more.icon)
                }
                .tag(Tab.more)
        }
    }
    #endif

    // MARK: - Tab Content

    @ViewBuilder
    private func tabContent(for tab: Tab) -> some View {
        switch tab {
        case .forYou:
            ForYouView()
        case .directory:
            DirectoryView()
        case .map:
            MapView()
        case .askCarl:
            AskCarlView()
        case .saved:
            FavoritesView()
        case .transit:
            TransitView()
        case .airports:
            AirportsView()
        case .glossary:
            GlossaryView()
        case .guides:
            EligibilityGuidesView()
        case .profiles:
            ProfilesView()
        case .settings:
            SettingsView()
        case .safety:
            SafetySettingsView()
        case .more:
            MoreView()
        }
    }

    // MARK: - Computed Properties

    /// Tabs visible in the main tab bar (from NavigationService)
    private var visibleTabs: [Tab] {
        navigationService.tabBarItemIds.compactMap { Tab(navItemId: $0) }
    }

    /// Tabs in the More menu (excluding those in tab bar)
    private var moreTabs: [Tab] {
        let tabBarIds = Set(navigationService.tabBarItemIds)
        return [Tab.saved, .transit, .airports, .glossary, .guides, .profiles, .settings, .safety]
            .filter { !tabBarIds.contains($0.rawValue) }
    }

    // MARK: - PIN & Safety Checks

    private func checkPINProtection() async {
        let hasPIN = await SafetyService.shared.hasPinSet()
        let pinEnabled = await SafetyService.shared.isPinProtectionEnabled()

        await MainActor.run {
            isAppLocked = hasPIN && pinEnabled
            hasCheckedPIN = true
        }
    }

    private func checkIncognitoMode() async {
        let incognito = await SafetyService.shared.isIncognitoModeEnabled()

        await MainActor.run {
            isIncognitoMode = incognito
        }

        // Start incognito session if enabled
        if incognito {
            await SafetyService.shared.startIncognitoSession()
        }
    }
}

// MARK: - Haptic Manager

/// Simple haptic feedback manager
enum HapticManager {
    #if os(iOS)
    static func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
        UIImpactFeedbackGenerator(style: style).impactOccurred()
    }

    static func notification(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        UINotificationFeedbackGenerator().notificationOccurred(type)
    }

    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }
    #else
    static func impact(_ style: Any) {}
    static func notification(_ type: Any) {}
    static func selection() {}
    #endif
}

#Preview {
    ContentView()
        .environment(ProgramsViewModel())
        .environment(SettingsViewModel())
        .environment(UserPrefsViewModel())
        .environment(SmartAssistantViewModel())
        .environment(NavigationService.shared)
}
