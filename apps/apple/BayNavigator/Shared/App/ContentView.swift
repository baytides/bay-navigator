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
        case sports = "sports"
        case alerts = "alerts"
        case glossary = "glossary"
        case guides = "guides"
        case profiles = "profiles"
        case stats = "stats"
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
            case .sports: return "Sports"
            case .alerts: return "Alerts"
            case .glossary: return "Glossary"
            case .guides: return "Guides"
            case .profiles: return "Profiles"
            case .stats: return "Stats"
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
            case .sports: return "sportscourt"
            case .alerts: return "exclamationmark.triangle"
            case .glossary: return "book.closed"
            case .guides: return "book"
            case .profiles: return "person.2"
            case .stats: return "leaf"
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
            case .sports: return "sportscourt.fill"
            case .alerts: return "exclamationmark.triangle.fill"
            case .glossary: return "book.closed.fill"
            case .guides: return "book.fill"
            case .profiles: return "person.2.fill"
            case .stats: return "leaf.fill"
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
            case "sports": self = .sports
            case "alerts": self = .alerts
            case "glossary": self = .glossary
            case "guides": self = .guides
            case "profiles": self = .profiles
            case "stats": self = .stats
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
            .listStyle(.sidebar)
            .navigationSplitViewColumnWidth(min: 180, ideal: 220, max: 280)
        } detail: {
            // Wrap in NavigationStack for macOS - individual views don't need their own
            NavigationStack {
                macOSDetailContent(for: selectedTab)
                    .toolbar {
                        macOSToolbarContent
                    }
            }
        }
        .frame(minWidth: 1000, minHeight: 650)
        .navigationSplitViewStyle(.balanced)
        // Add keyboard shortcuts for tab navigation
        .background {
            // Cmd+1 through Cmd+4 for main tabs
            ForEach(Array(visibleTabs.enumerated()), id: \.offset) { index, tab in
                if index < 9 {
                    Button("") {
                        selectedTab = tab
                    }
                    .keyboardShortcut(KeyEquivalent(Character("\(index + 1)")), modifiers: .command)
                    .opacity(0)
                }
            }
            // Cmd+, for Settings
            Button("") {
                selectedTab = .settings
            }
            .keyboardShortcut(",", modifiers: .command)
            .opacity(0)
        }
    }

    /// macOS-specific toolbar content
    @ToolbarContentBuilder
    private var macOSToolbarContent: some ToolbarContent {
        ToolbarItem(placement: .automatic) {
            Button {
                // Refresh current view
                Task {
                    await programsVM.loadData()
                }
            } label: {
                Image(systemName: "arrow.clockwise")
            }
            .help("Refresh data")
            .keyboardShortcut("r", modifiers: .command)
        }
    }

    /// macOS-specific detail content - uses content views without NavigationStack wrappers
    @ViewBuilder
    private func macOSDetailContent(for tab: Tab) -> some View {
        switch tab {
        case .forYou:
            ForYouViewContent()
        case .directory:
            DirectoryViewContent()
        case .map:
            MapViewContent()
        case .askCarl:
            AskCarlView()
        case .saved:
            FavoritesViewContent()
        case .transit:
            TransitViewContent()
        case .airports:
            AirportsViewContent()
        case .sports:
            SportsViewContent()
        case .alerts:
            AlertsViewContent()
        case .glossary:
            GlossaryViewContent()
        case .guides:
            EligibilityGuidesViewContent()
        case .profiles:
            ProfilesViewContent()
        case .stats:
            StatsViewContent()
        case .settings:
            SettingsViewContent()
        case .safety:
            SafetySettingsView()
        case .more:
            MoreView()
        }
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
        case .sports:
            SportsView()
        case .alerts:
            AlertsView()
        case .glossary:
            GlossaryView()
        case .guides:
            EligibilityGuidesView()
        case .profiles:
            ProfilesView()
        case .stats:
            StatsView()
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
        return [Tab.saved, .transit, .airports, .sports, .alerts, .glossary, .guides, .profiles, .stats, .settings, .safety]
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
