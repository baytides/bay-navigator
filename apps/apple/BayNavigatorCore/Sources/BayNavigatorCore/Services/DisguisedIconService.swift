import Foundation
import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

/// Service for managing disguised app icons
/// Allows users to change the app icon to blend in as a utility app for safety
///
/// Note: To use alternate icons, you must configure them in your Info.plist:
/// ```
/// <key>CFBundleIcons</key>
/// <dict>
///     <key>CFBundleAlternateIcons</key>
///     <dict>
///         <key>CalculatorIcon</key>
///         <dict>
///             <key>CFBundleIconFiles</key>
///             <array>
///                 <string>CalculatorIcon</string>
///             </array>
///         </dict>
///         <!-- Add more alternate icons -->
///     </dict>
/// </dict>
/// ```
@MainActor
public final class DisguisedIconService: ObservableObject {
    public static let shared = DisguisedIconService()

    // MARK: - User Defaults Keys

    private let disguisedModeKey = "baynavigator:disguised_mode"
    private let disguisedIconKey = "baynavigator:disguised_icon"

    // MARK: - Published State

    @Published public private(set) var isDisguisedModeEnabled: Bool = false
    @Published public private(set) var currentIconId: String?

    // MARK: - Available Disguised Icons

    /// Disguised app icons that blend in as utility apps
    public static let availableIcons: [DisguisedAppIcon] = [
        DisguisedAppIcon(
            id: "calculator",
            name: "Calculator",
            iosIconName: "CalculatorIcon",
            systemImage: "plus.forwardslash.minus",
            backgroundColor: Color(red: 0.26, green: 0.26, blue: 0.26)
        ),
        DisguisedAppIcon(
            id: "notes",
            name: "My Notes",
            iosIconName: "NotesIcon",
            systemImage: "note.text",
            backgroundColor: Color(red: 1.0, green: 0.76, blue: 0.03)
        ),
        DisguisedAppIcon(
            id: "weather",
            name: "Weather",
            iosIconName: "WeatherIcon",
            systemImage: "sun.max.fill",
            backgroundColor: Color(red: 0.13, green: 0.59, blue: 0.95)
        ),
        DisguisedAppIcon(
            id: "utilities",
            name: "Utilities",
            iosIconName: "UtilitiesIcon",
            systemImage: "wrench.and.screwdriver.fill",
            backgroundColor: Color(red: 0.38, green: 0.49, blue: 0.55)
        ),
        DisguisedAppIcon(
            id: "files",
            name: "Files",
            iosIconName: "FilesIcon",
            systemImage: "folder.fill",
            backgroundColor: Color(red: 0.30, green: 0.69, blue: 0.31)
        )
    ]

    private init() {
        loadState()
    }

    // MARK: - State Management

    private func loadState() {
        isDisguisedModeEnabled = UserDefaults.standard.bool(forKey: disguisedModeKey)
        currentIconId = UserDefaults.standard.string(forKey: disguisedIconKey)
    }

    // MARK: - Icon Management

    /// Check if the device supports alternate icons
    public var supportsAlternateIcons: Bool {
        #if os(iOS)
        return UIApplication.shared.supportsAlternateIcons
        #else
        return false
        #endif
    }

    /// Get the current alternate icon name (nil = primary icon)
    public var currentAlternateIconName: String? {
        #if os(iOS)
        return UIApplication.shared.alternateIconName
        #else
        return nil
        #endif
    }

    /// Get the current disguised icon configuration
    public var currentDisguisedIcon: DisguisedAppIcon? {
        guard let iconId = currentIconId else { return nil }
        return Self.availableIcons.first { $0.id == iconId }
    }

    /// Apply a disguised icon
    /// - Parameter iconId: The ID of the icon to apply
    /// - Returns: Result of the operation
    public func applyDisguisedIcon(_ iconId: String) async -> DisguiseResult {
        guard supportsAlternateIcons else {
            return DisguiseResult(
                success: false,
                message: "This device does not support alternate app icons.",
                requiresRestart: false
            )
        }

        guard let icon = Self.availableIcons.first(where: { $0.id == iconId }) else {
            return DisguiseResult(
                success: false,
                message: "Unknown icon configuration.",
                requiresRestart: false
            )
        }

        #if os(iOS)
        do {
            try await UIApplication.shared.setAlternateIconName(icon.iosIconName)

            // Save preference
            UserDefaults.standard.set(iconId, forKey: disguisedIconKey)
            UserDefaults.standard.set(true, forKey: disguisedModeKey)
            currentIconId = iconId
            isDisguisedModeEnabled = true

            return DisguiseResult(
                success: true,
                message: "App icon changed to \"\(icon.name)\".",
                requiresRestart: false
            )
        } catch {
            return DisguiseResult(
                success: false,
                message: "Failed to change app icon: \(error.localizedDescription)",
                requiresRestart: false
            )
        }
        #else
        return DisguiseResult(
            success: false,
            message: "Alternate icons are only supported on iOS.",
            requiresRestart: false
        )
        #endif
    }

    /// Reset to the default app icon
    public func resetToDefaultIcon() async -> DisguiseResult {
        guard supportsAlternateIcons else {
            return DisguiseResult(
                success: false,
                message: "This device does not support alternate app icons.",
                requiresRestart: false
            )
        }

        #if os(iOS)
        do {
            try await UIApplication.shared.setAlternateIconName(nil)

            // Clear preference
            UserDefaults.standard.removeObject(forKey: disguisedIconKey)
            UserDefaults.standard.set(false, forKey: disguisedModeKey)
            currentIconId = nil
            isDisguisedModeEnabled = false

            return DisguiseResult(
                success: true,
                message: "App icon reset to default.",
                requiresRestart: false
            )
        } catch {
            return DisguiseResult(
                success: false,
                message: "Failed to reset app icon: \(error.localizedDescription)",
                requiresRestart: false
            )
        }
        #else
        return DisguiseResult(
            success: false,
            message: "Alternate icons are only supported on iOS.",
            requiresRestart: false
        )
        #endif
    }

    /// Check if a specific icon is currently active
    public func isIconActive(_ iconId: String) -> Bool {
        guard let icon = Self.availableIcons.first(where: { $0.id == iconId }) else {
            return false
        }
        return currentAlternateIconName == icon.iosIconName
    }
}

// MARK: - Data Models

/// Disguised app icon configuration
public struct DisguisedAppIcon: Identifiable, Sendable {
    public let id: String
    public let name: String
    public let iosIconName: String
    public let systemImage: String
    public let backgroundColor: Color

    public init(
        id: String,
        name: String,
        iosIconName: String,
        systemImage: String,
        backgroundColor: Color
    ) {
        self.id = id
        self.name = name
        self.iosIconName = iosIconName
        self.systemImage = systemImage
        self.backgroundColor = backgroundColor
    }
}

/// Result of applying a disguised icon
public struct DisguiseResult: Sendable {
    public let success: Bool
    public let message: String
    public let requiresRestart: Bool

    public init(success: Bool, message: String, requiresRestart: Bool) {
        self.success = success
        self.message = message
        self.requiresRestart = requiresRestart
    }
}

// MARK: - SwiftUI Preview Helpers

#if DEBUG
extension DisguisedAppIcon {
    @MainActor
    static var preview: DisguisedAppIcon {
        DisguisedIconService.availableIcons[0]
    }
}
#endif
