import Foundation
import SwiftUI

// MARK: - Navigation Item Definition

/// Represents a navigation item that can appear in the tab bar or More menu
public struct NavItem: Identifiable, Equatable, Codable, Sendable, Hashable {
    public let id: String
    public let label: String
    public let iconName: String
    public let selectedIconName: String
    public let isLocked: Bool

    public init(
        id: String,
        label: String,
        iconName: String,
        selectedIconName: String,
        isLocked: Bool = false
    ) {
        self.id = id
        self.label = label
        self.iconName = iconName
        self.selectedIconName = selectedIconName
        self.isLocked = isLocked
    }

    public var icon: Image {
        Image(systemName: iconName)
    }

    public var selectedIcon: Image {
        Image(systemName: selectedIconName)
    }
}

// MARK: - Available Navigation Items

public enum NavItems {
    public static let forYou = NavItem(
        id: "for_you",
        label: "For You",
        iconName: "sparkles",
        selectedIconName: "sparkles",
        isLocked: true
    )

    public static let directory = NavItem(
        id: "directory",
        label: "Directory",
        iconName: "list.bullet",
        selectedIconName: "list.bullet"
    )

    public static let saved = NavItem(
        id: "saved",
        label: "Saved",
        iconName: "bookmark",
        selectedIconName: "bookmark.fill"
    )

    public static let map = NavItem(
        id: "map",
        label: "Map",
        iconName: "map",
        selectedIconName: "map.fill"
    )

    public static let askCarl = NavItem(
        id: "ask_carl",
        label: "Ask Carl",
        iconName: "bubble.left.and.bubble.right",
        selectedIconName: "bubble.left.and.bubble.right.fill"
    )

    public static let transit = NavItem(
        id: "transit",
        label: "Transit",
        iconName: "tram",
        selectedIconName: "tram.fill"
    )

    public static let glossary = NavItem(
        id: "glossary",
        label: "Glossary",
        iconName: "book.closed",
        selectedIconName: "book.closed.fill"
    )

    public static let guides = NavItem(
        id: "guides",
        label: "Guides",
        iconName: "book",
        selectedIconName: "book.fill"
    )

    public static let profiles = NavItem(
        id: "profiles",
        label: "Profiles",
        iconName: "person.2",
        selectedIconName: "person.2.fill"
    )

    public static let settings = NavItem(
        id: "settings",
        label: "Settings",
        iconName: "gearshape",
        selectedIconName: "gearshape.fill"
    )

    public static let safety = NavItem(
        id: "safety",
        label: "Safety",
        iconName: "shield",
        selectedIconName: "shield.fill"
    )

    public static let airports = NavItem(
        id: "airports",
        label: "Airports",
        iconName: "airplane",
        selectedIconName: "airplane"
    )

    public static let sports = NavItem(
        id: "sports",
        label: "Sports",
        iconName: "sportscourt",
        selectedIconName: "sportscourt.fill"
    )

    public static let alerts = NavItem(
        id: "alerts",
        label: "Alerts",
        iconName: "exclamationmark.triangle",
        selectedIconName: "exclamationmark.triangle.fill"
    )

    public static let stats = NavItem(
        id: "stats",
        label: "Stats",
        iconName: "leaf",
        selectedIconName: "leaf.fill"
    )

    /// All available navigation items in default order
    public static let all: [NavItem] = [
        forYou,
        directory,
        saved,
        map,
        askCarl,
        transit,
        airports,
        sports,
        alerts,
        glossary,
        guides,
        profiles,
        stats,
        settings,
        safety
    ]

    /// Default tab bar item IDs (max 5 items, excluding "More" which is auto-added)
    public static let defaultTabBarIds: [String] = [
        "for_you",
        "directory",
        "map",
        "ask_carl"
    ]

    /// Get NavItem by id
    public static func getById(_ id: String) -> NavItem? {
        all.first { $0.id == id }
    }
}

// MARK: - Navigation Service

/// Service for managing customizable navigation configuration
@Observable
@MainActor
public final class NavigationService {
    public static let shared = NavigationService()

    // MARK: - Constants

    private static let prefsKey = "baynavigator:nav_tab_order"
    public static let maxTabBarItems = 5  // Excluding "More" tab
    public static let minTabBarItems = 3

    // MARK: - Properties

    private var _tabBarItemIds: [String] = NavItems.defaultTabBarIds
    public private(set) var initialized: Bool = false

    // MARK: - Computed Properties

    /// Items currently in the tab bar (excludes "More")
    public var tabBarItems: [NavItem] {
        _tabBarItemIds.compactMap { NavItems.getById($0) }
    }

    /// Items in the "More" menu
    public var moreItems: [NavItem] {
        NavItems.all.filter { !_tabBarItemIds.contains($0.id) }
    }

    /// All items for desktop/tablet sidebar (full list)
    public var sidebarItems: [NavItem] {
        NavItems.all
    }

    /// Current tab bar item IDs
    public var tabBarItemIds: [String] {
        _tabBarItemIds
    }

    // MARK: - Initialization

    private init() {
        Task {
            await initialize()
        }
    }

    /// Initialize from saved preferences
    public func initialize() async {
        guard !initialized else { return }

        do {
            if let data = UserDefaults.standard.data(forKey: Self.prefsKey) {
                let ids = try JSONDecoder().decode([String].self, from: data)

                // Validate saved items still exist
                var validIds = ids.filter { NavItems.getById($0) != nil }

                // Ensure "For You" is always first
                if !validIds.contains("for_you") {
                    validIds.insert("for_you", at: 0)
                } else if validIds.first != "for_you" {
                    validIds.removeAll { $0 == "for_you" }
                    validIds.insert("for_you", at: 0)
                }

                // Ensure we have at least minimum items
                if validIds.count < Self.minTabBarItems {
                    validIds = NavItems.defaultTabBarIds
                }

                // Ensure we don't exceed max items
                if validIds.count > Self.maxTabBarItems {
                    validIds = Array(validIds.prefix(Self.maxTabBarItems))
                }

                _tabBarItemIds = validIds
            }
        } catch {
            _tabBarItemIds = NavItems.defaultTabBarIds
        }

        initialized = true
    }

    // MARK: - Persistence

    private func save() {
        do {
            let data = try JSONEncoder().encode(_tabBarItemIds)
            UserDefaults.standard.set(data, forKey: Self.prefsKey)
        } catch {
            // Silently fail
        }
    }

    // MARK: - Tab Bar Management

    /// Move an item from More to tab bar
    @discardableResult
    public func addToTabBar(_ id: String) -> Bool {
        guard _tabBarItemIds.count < Self.maxTabBarItems else { return false }
        guard !_tabBarItemIds.contains(id) else { return false }
        guard NavItems.getById(id) != nil else { return false }

        _tabBarItemIds.append(id)
        save()
        return true
    }

    /// Move an item from tab bar to More
    @discardableResult
    public func removeFromTabBar(_ id: String) -> Bool {
        guard let item = NavItems.getById(id) else { return false }
        guard !item.isLocked else { return false }
        guard _tabBarItemIds.count > Self.minTabBarItems else { return false }

        _tabBarItemIds.removeAll { $0 == id }
        save()
        return true
    }

    /// Reorder tab bar items
    public func reorderTabBar(from oldIndex: Int, to newIndex: Int) {
        // Can't move the first item (For You is locked)
        guard oldIndex > 0 else { return }

        var adjustedNewIndex = newIndex
        if adjustedNewIndex == 0 {
            adjustedNewIndex = 1
        }

        let item = _tabBarItemIds.remove(at: oldIndex)
        _tabBarItemIds.insert(item, at: adjustedNewIndex)
        save()
    }

    /// Replace an item in the tab bar with another
    @discardableResult
    public func swapTabBarItem(remove removeId: String, add addId: String) -> Bool {
        guard let removeItem = NavItems.getById(removeId) else { return false }
        guard !removeItem.isLocked else { return false }
        guard NavItems.getById(addId) != nil else { return false }
        guard let index = _tabBarItemIds.firstIndex(of: removeId) else { return false }

        _tabBarItemIds[index] = addId
        save()
        return true
    }

    /// Reset to default configuration
    public func resetToDefault() {
        _tabBarItemIds = NavItems.defaultTabBarIds
        save()
    }

    /// Check if an item is in the tab bar
    public func isInTabBar(_ id: String) -> Bool {
        _tabBarItemIds.contains(id)
    }

    /// Get the screen index for a nav item id
    public func getScreenIndex(for id: String) -> Int {
        NavItems.all.firstIndex { $0.id == id } ?? 0
    }

    /// Get nav item id from screen index
    public func getIdFromScreenIndex(_ index: Int) -> String {
        guard index >= 0 && index < NavItems.all.count else { return "for_you" }
        return NavItems.all[index].id
    }

    /// Check if we can add more items to tab bar
    public var canAddToTabBar: Bool {
        _tabBarItemIds.count < Self.maxTabBarItems
    }

    /// Check if we can remove items from tab bar
    public var canRemoveFromTabBar: Bool {
        _tabBarItemIds.count > Self.minTabBarItems
    }

    /// Apply a new tab bar configuration
    public func applyConfiguration(tabBarIds: [String]) {
        // Validate and ensure "For You" is first
        var ids = tabBarIds.filter { NavItems.getById($0) != nil }

        if !ids.contains("for_you") {
            ids.insert("for_you", at: 0)
        } else if ids.first != "for_you" {
            ids.removeAll { $0 == "for_you" }
            ids.insert("for_you", at: 0)
        }

        // Clamp to valid range
        if ids.count < Self.minTabBarItems {
            // Add items from defaults that aren't already present
            for defaultId in NavItems.defaultTabBarIds where !ids.contains(defaultId) {
                ids.append(defaultId)
                if ids.count >= Self.minTabBarItems { break }
            }
        } else if ids.count > Self.maxTabBarItems {
            ids = Array(ids.prefix(Self.maxTabBarItems))
        }

        _tabBarItemIds = ids
        save()
    }
}
