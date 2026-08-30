import Foundation
import SwiftUI

/// Desktop menu bar service for macOS
/// Provides the standard macOS menu bar with keyboard shortcuts
#if os(macOS)

// MARK: - Menu Commands

/// Standard app commands for Bay Navigator
public struct BayNavigatorCommands: Commands {
    // Actions. These drive `MenuBarState`, which is `@MainActor`, so the
    // callbacks are main-actor isolated too — menu commands always fire on the
    // main thread, and this makes that a compiler-checked guarantee rather than
    // an assumption (an error under the Swift 6 language mode otherwise).
    let onSearch: @MainActor () -> Void
    let onSettings: @MainActor () -> Void
    let onFilters: @MainActor () -> Void
    let onRefresh: @MainActor () -> Void
    let onExport: @MainActor () -> Void
    let onPrint: @MainActor () -> Void
    let onToggleTheme: @MainActor () -> Void
    let onGoToTab: @MainActor (Int) -> Void
    let onShowKeyboardShortcuts: @MainActor () -> Void

    public init(
        onSearch: @escaping @MainActor () -> Void = {},
        onSettings: @escaping @MainActor () -> Void = {},
        onFilters: @escaping @MainActor () -> Void = {},
        onRefresh: @escaping @MainActor () -> Void = {},
        onExport: @escaping @MainActor () -> Void = {},
        onPrint: @escaping @MainActor () -> Void = {},
        onToggleTheme: @escaping @MainActor () -> Void = {},
        onGoToTab: @escaping @MainActor (Int) -> Void = { _ in },
        onShowKeyboardShortcuts: @escaping @MainActor () -> Void = {}
    ) {
        self.onSearch = onSearch
        self.onSettings = onSettings
        self.onFilters = onFilters
        self.onRefresh = onRefresh
        self.onExport = onExport
        self.onPrint = onPrint
        self.onToggleTheme = onToggleTheme
        self.onGoToTab = onGoToTab
        self.onShowKeyboardShortcuts = onShowKeyboardShortcuts
    }

    public var body: some Commands {
        // Replace the default New/Open with our custom File menu items
        CommandGroup(replacing: .newItem) {
            // Empty - we don't need New Document
        }

        // File Menu - Export and Print
        CommandGroup(after: .newItem) {
            Button("Export Saved Programs...") {
                onExport()
            }
            .keyboardShortcut("e", modifiers: [.command, .shift])

            Button("Print Saved Programs...") {
                onPrint()
            }
            .keyboardShortcut("p", modifiers: .command)
        }

        // Edit Menu - Search and Filters
        CommandGroup(after: .pasteboard) {
            Divider()

            Button("Search Programs") {
                onSearch()
            }
            .keyboardShortcut("f", modifiers: .command)

            Button("Filter Programs") {
                onFilters()
            }
            .keyboardShortcut("l", modifiers: .command)
        }

        // View Menu
        CommandGroup(after: .toolbar) {
            Button("Refresh") {
                onRefresh()
            }
            .keyboardShortcut("r", modifiers: .command)

            Divider()

            Button("Toggle Dark Mode") {
                onToggleTheme()
            }
            .keyboardShortcut("d", modifiers: [.command, .shift])
        }

        // Custom Go Menu
        CommandMenu("Go") {
            Button("Home") {
                onGoToTab(0)
            }
            .keyboardShortcut("1", modifiers: .command)

            Button("Saved Programs") {
                onGoToTab(1)
            }
            .keyboardShortcut("2", modifiers: .command)

            Button("More") {
                onGoToTab(2)
            }
            .keyboardShortcut("3", modifiers: .command)

            Divider()

            Button("Settings") {
                onSettings()
            }
            .keyboardShortcut(",", modifiers: .command)
        }

        // Help Menu
        CommandGroup(replacing: .help) {
            Button("Keyboard Shortcuts") {
                onShowKeyboardShortcuts()
            }
            .keyboardShortcut("/", modifiers: .command)

            Divider()

            Link("Bay Navigator Help",
                 destination: URL(string: "https://baynavigator.org/help")!)

            Link("Report an Issue",
                 destination: URL(string: "https://github.com/baytides/baynavigator/issues")!)

            Divider()

            Link("Privacy Policy",
                 destination: URL(string: "https://baynavigator.org/privacy")!)

            Link("Terms of Service",
                 destination: URL(string: "https://baynavigator.org/terms")!)
        }
    }
}

// MARK: - Menu Bar State

/// Observable state for menu bar actions
@MainActor
public final class MenuBarState: ObservableObject {
    public static let shared = MenuBarState()

    // Published actions that views can subscribe to
    @Published public var searchTriggered = false
    @Published public var settingsTriggered = false
    @Published public var filtersTriggered = false
    @Published public var refreshTriggered = false
    @Published public var exportTriggered = false
    @Published public var printTriggered = false
    @Published public var themeToggleTriggered = false
    @Published public var keyboardShortcutsTriggered = false
    @Published public var navigateToTab: Int?

    private init() {}

    // MARK: - Action Triggers

    public func triggerSearch() {
        searchTriggered = true
        // Reset after a brief delay
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 100_000_000)
            searchTriggered = false
        }
    }

    public func triggerSettings() {
        settingsTriggered = true
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 100_000_000)
            settingsTriggered = false
        }
    }

    public func triggerFilters() {
        filtersTriggered = true
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 100_000_000)
            filtersTriggered = false
        }
    }

    public func triggerRefresh() {
        refreshTriggered = true
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 100_000_000)
            refreshTriggered = false
        }
    }

    public func triggerExport() {
        exportTriggered = true
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 100_000_000)
            exportTriggered = false
        }
    }

    public func triggerPrint() {
        printTriggered = true
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 100_000_000)
            printTriggered = false
        }
    }

    public func triggerThemeToggle() {
        themeToggleTriggered = true
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 100_000_000)
            themeToggleTriggered = false
        }
    }

    public func triggerKeyboardShortcuts() {
        keyboardShortcutsTriggered = true
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 100_000_000)
            keyboardShortcutsTriggered = false
        }
    }

    public func navigateTo(tab: Int) {
        navigateToTab = tab
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 100_000_000)
            navigateToTab = nil
        }
    }
}

// MARK: - Convenience Commands Factory

/// Factory for creating pre-configured menu commands
public struct DesktopMenuService {
    /// Create commands that use the shared MenuBarState
    @MainActor
    public static func createCommands() -> BayNavigatorCommands {
        let state = MenuBarState.shared

        return BayNavigatorCommands(
            onSearch: { state.triggerSearch() },
            onSettings: { state.triggerSettings() },
            onFilters: { state.triggerFilters() },
            onRefresh: { state.triggerRefresh() },
            onExport: { state.triggerExport() },
            onPrint: { state.triggerPrint() },
            onToggleTheme: { state.triggerThemeToggle() },
            onGoToTab: { tab in state.navigateTo(tab: tab) },
            onShowKeyboardShortcuts: { state.triggerKeyboardShortcuts() }
        )
    }
}

// MARK: - View Modifier for Menu Actions

/// View modifier that responds to menu bar actions
public struct MenuBarActionHandler: ViewModifier {
    @ObservedObject private var menuState = MenuBarState.shared

    let onSearch: () -> Void
    let onSettings: () -> Void
    let onFilters: () -> Void
    let onRefresh: () -> Void
    let onExport: () -> Void
    let onPrint: () -> Void
    let onToggleTheme: () -> Void
    let onGoToTab: (Int) -> Void
    let onShowKeyboardShortcuts: () -> Void

    public init(
        onSearch: @escaping () -> Void = {},
        onSettings: @escaping () -> Void = {},
        onFilters: @escaping () -> Void = {},
        onRefresh: @escaping () -> Void = {},
        onExport: @escaping () -> Void = {},
        onPrint: @escaping () -> Void = {},
        onToggleTheme: @escaping () -> Void = {},
        onGoToTab: @escaping (Int) -> Void = { _ in },
        onShowKeyboardShortcuts: @escaping () -> Void = {}
    ) {
        self.onSearch = onSearch
        self.onSettings = onSettings
        self.onFilters = onFilters
        self.onRefresh = onRefresh
        self.onExport = onExport
        self.onPrint = onPrint
        self.onToggleTheme = onToggleTheme
        self.onGoToTab = onGoToTab
        self.onShowKeyboardShortcuts = onShowKeyboardShortcuts
    }

    public func body(content: Content) -> some View {
        content
            .onChange(of: menuState.searchTriggered) { _, triggered in
                if triggered { onSearch() }
            }
            .onChange(of: menuState.settingsTriggered) { _, triggered in
                if triggered { onSettings() }
            }
            .onChange(of: menuState.filtersTriggered) { _, triggered in
                if triggered { onFilters() }
            }
            .onChange(of: menuState.refreshTriggered) { _, triggered in
                if triggered { onRefresh() }
            }
            .onChange(of: menuState.exportTriggered) { _, triggered in
                if triggered { onExport() }
            }
            .onChange(of: menuState.printTriggered) { _, triggered in
                if triggered { onPrint() }
            }
            .onChange(of: menuState.themeToggleTriggered) { _, triggered in
                if triggered { onToggleTheme() }
            }
            .onChange(of: menuState.keyboardShortcutsTriggered) { _, triggered in
                if triggered { onShowKeyboardShortcuts() }
            }
            .onChange(of: menuState.navigateToTab) { _, tab in
                if let tab = tab { onGoToTab(tab) }
            }
    }
}

public extension View {
    /// Handle menu bar actions in this view
    func handleMenuBarActions(
        onSearch: @escaping () -> Void = {},
        onSettings: @escaping () -> Void = {},
        onFilters: @escaping () -> Void = {},
        onRefresh: @escaping () -> Void = {},
        onExport: @escaping () -> Void = {},
        onPrint: @escaping () -> Void = {},
        onToggleTheme: @escaping () -> Void = {},
        onGoToTab: @escaping (Int) -> Void = { _ in },
        onShowKeyboardShortcuts: @escaping () -> Void = {}
    ) -> some View {
        modifier(MenuBarActionHandler(
            onSearch: onSearch,
            onSettings: onSettings,
            onFilters: onFilters,
            onRefresh: onRefresh,
            onExport: onExport,
            onPrint: onPrint,
            onToggleTheme: onToggleTheme,
            onGoToTab: onGoToTab,
            onShowKeyboardShortcuts: onShowKeyboardShortcuts
        ))
    }
}

#endif

// MARK: - Cross-Platform Stubs

#if !os(macOS)
/// Stub for non-macOS platforms
public struct DesktopMenuService {
    public static var isDesktop: Bool { false }
}
#endif
