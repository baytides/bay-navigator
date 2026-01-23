import SwiftUI
import BayNavigatorCore

@main
struct BayNavigatorApp: App {
    #if os(iOS)
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    #elseif os(macOS)
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    #endif

    @State private var programsViewModel = ProgramsViewModel()
    @State private var settingsViewModel = SettingsViewModel()
    @State private var userPrefsViewModel = UserPrefsViewModel()
    @State private var assistantViewModel = SmartAssistantViewModel()
    @State private var accessibilityViewModel = AccessibilityViewModel()

    // NavigationService is a singleton with shared state
    private let navigationService = NavigationService.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(programsViewModel)
                .environment(settingsViewModel)
                .environment(userPrefsViewModel)
                .environment(assistantViewModel)
                .environment(accessibilityViewModel)
                .environment(navigationService)
                .preferredColorScheme(settingsViewModel.colorScheme)
                #if os(visionOS)
                .warmMode(settingsViewModel.warmModeEnabled)
                #endif
                .task {
                    // Initialize navigation service
                    await navigationService.initialize()
                }
                .onOpenURL { url in
                    handleDeepLink(url)
                }
        }
        #if os(visionOS)
        .defaultSize(width: 1200, height: 900)
        #endif

        #if os(visionOS)
        ImmersiveSpace(id: "WelcomeSpace") {
            ImmersiveWelcomeView()
                .environment(programsViewModel)
        }
        .immersionStyle(selection: .constant(.mixed), in: .mixed)
        #endif

        #if os(macOS)
        Settings {
            SettingsView()
                .environment(settingsViewModel)
                .environment(programsViewModel)
                .environment(userPrefsViewModel)
                .environment(accessibilityViewModel)
                .environment(navigationService)
        }
        #endif
    }

    // MARK: - Deep Link Handling

    private func handleDeepLink(_ url: URL) {
        // Handle baynavigator:// URLs
        // Deep linking is handled primarily through NavigationService
        // This provides a centralized way to route to different parts of the app

        guard url.scheme == "baynavigator" else { return }

        // Navigation service handles the routing based on URL paths
        // Example URLs:
        // - baynavigator://foryou
        // - baynavigator://directory
        // - baynavigator://map
        // - baynavigator://askcarl
        // - baynavigator://program/PROGRAM_ID
    }
}
