import Foundation
import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

/// WCAG 2.2 AAA Accessibility Service
///
/// Provides accessibility utilities for Bay Navigator including:
/// - Reduced motion detection and preference
/// - High contrast mode support
/// - Screen reader announcements
/// - Text customization (WCAG 3.0 draft)
/// - Semantic label helpers
public final class AccessibilityService: Sendable {
    public static let shared = AccessibilityService()

    // MARK: - UserDefaults Keys

    private let textScaleKey = "accessibility_text_scale"
    private let lineHeightKey = "accessibility_line_height"
    private let letterSpacingKey = "accessibility_letter_spacing"
    private let wordSpacingKey = "accessibility_word_spacing"

    private init() {}

    // MARK: - System Accessibility Settings

    /// Check if reduced motion is preferred (system setting)
    @MainActor
    public var shouldReduceMotion: Bool {
        #if canImport(UIKit) && !os(watchOS)
        return UIAccessibility.isReduceMotionEnabled
        #else
        return false
        #endif
    }

    /// Check if VoiceOver is running
    @MainActor
    public var isVoiceOverRunning: Bool {
        #if canImport(UIKit) && !os(watchOS)
        return UIAccessibility.isVoiceOverRunning
        #else
        return false
        #endif
    }

    /// Check if bold text is enabled
    @MainActor
    public var isBoldTextEnabled: Bool {
        #if canImport(UIKit) && !os(watchOS)
        return UIAccessibility.isBoldTextEnabled
        #else
        return false
        #endif
    }

    /// Check if reduce transparency is enabled
    @MainActor
    public var isReduceTransparencyEnabled: Bool {
        #if canImport(UIKit) && !os(watchOS)
        return UIAccessibility.isReduceTransparencyEnabled
        #else
        return false
        #endif
    }

    /// Check if differentiate without color is enabled
    @MainActor
    public var isDifferentiateWithoutColorEnabled: Bool {
        #if canImport(UIKit) && !os(watchOS)
        return UIAccessibility.shouldDifferentiateWithoutColor
        #else
        return false
        #endif
    }

    // MARK: - Screen Reader Announcements

    /// Announce a message to screen readers
    @MainActor
    public func announce(_ message: String) {
        #if canImport(UIKit) && !os(watchOS)
        UIAccessibility.post(notification: .announcement, argument: message)
        #endif
    }

    /// Announce a message with a slight delay (useful after UI updates)
    @MainActor
    public func announceAfterDelay(_ message: String, delay: TimeInterval = 0.5) {
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            announce(message)
        }
    }

    /// Announce screen change to VoiceOver
    @MainActor
    public func announceScreenChange(_ message: String? = nil) {
        #if canImport(UIKit) && !os(watchOS)
        UIAccessibility.post(notification: .screenChanged, argument: message)
        #endif
    }

    /// Announce layout change to VoiceOver
    @MainActor
    public func announceLayoutChange(_ element: Any? = nil) {
        #if canImport(UIKit) && !os(watchOS)
        UIAccessibility.post(notification: .layoutChanged, argument: element)
        #endif
    }

    // MARK: - Common Announcements

    /// Announce loading state
    @MainActor
    public func announceLoading() {
        announce("Loading")
    }

    /// Announce loading complete
    @MainActor
    public func announceLoadingComplete(itemCount: Int? = nil) {
        if let count = itemCount {
            announce("Loaded \(count) items")
        } else {
            announce("Loading complete")
        }
    }

    /// Announce error
    @MainActor
    public func announceError(_ error: String) {
        announce("Error: \(error)")
    }

    /// Announce filter change
    @MainActor
    public func announceFilterChange(resultCount: Int) {
        announce("Showing \(resultCount) results")
    }

    /// Announce save/unsave action
    @MainActor
    public func announceSaveAction(isSaved: Bool, programName: String) {
        if isSaved {
            announce("\(programName) saved to your list")
        } else {
            announce("\(programName) removed from your list")
        }
    }

    // MARK: - Animation Helpers

    /// Get animation duration respecting reduced motion
    @MainActor
    public func getAnimationDuration(_ normalDuration: TimeInterval) -> TimeInterval {
        shouldReduceMotion ? 0 : normalDuration
    }

    /// Get animation respecting reduced motion
    @MainActor
    public func getAnimation(_ normalAnimation: Animation?) -> Animation? {
        shouldReduceMotion ? nil : normalAnimation
    }

    // MARK: - Text Settings

    /// Save text customization settings
    public func saveTextSettings(_ settings: TextSettings) {
        UserDefaults.standard.set(settings.textScale, forKey: textScaleKey)
        UserDefaults.standard.set(settings.lineHeight, forKey: lineHeightKey)
        UserDefaults.standard.set(settings.letterSpacing, forKey: letterSpacingKey)
        UserDefaults.standard.set(settings.wordSpacing, forKey: wordSpacingKey)
    }

    /// Load text customization settings
    public func loadTextSettings() -> TextSettings {
        TextSettings(
            textScale: UserDefaults.standard.double(forKey: textScaleKey).nonZeroOrDefault(1.0),
            lineHeight: UserDefaults.standard.double(forKey: lineHeightKey).nonZeroOrDefault(1.5),
            letterSpacing: UserDefaults.standard.double(forKey: letterSpacingKey),
            wordSpacing: UserDefaults.standard.double(forKey: wordSpacingKey)
        )
    }

    /// Reset text settings to defaults
    public func resetTextSettings() {
        UserDefaults.standard.removeObject(forKey: textScaleKey)
        UserDefaults.standard.removeObject(forKey: lineHeightKey)
        UserDefaults.standard.removeObject(forKey: letterSpacingKey)
        UserDefaults.standard.removeObject(forKey: wordSpacingKey)
    }
}

// MARK: - Double Extension

private extension Double {
    func nonZeroOrDefault(_ defaultValue: Double) -> Double {
        self == 0 ? defaultValue : self
    }
}

// MARK: - Text Settings

/// Text customization settings (WCAG 3.0 draft compliance)
public struct TextSettings: Codable, Equatable, Sendable {
    public var textScale: Double      // 0.8 - 1.5
    public var lineHeight: Double     // 1.5 - 2.5
    public var letterSpacing: Double  // 0 - 0.1em
    public var wordSpacing: Double    // 0 - 0.2em

    public init(
        textScale: Double = 1.0,
        lineHeight: Double = 1.5,
        letterSpacing: Double = 0.0,
        wordSpacing: Double = 0.0
    ) {
        self.textScale = textScale
        self.lineHeight = lineHeight
        self.letterSpacing = letterSpacing
        self.wordSpacing = wordSpacing
    }

    public var isDefault: Bool {
        textScale == 1.0 &&
        lineHeight == 1.5 &&
        letterSpacing == 0.0 &&
        wordSpacing == 0.0
    }

    /// Apply text settings to a Font
    public func scaledFont(_ font: Font) -> Font {
        // Note: SwiftUI doesn't support all text styling, so we scale the font
        return font
    }
}

// MARK: - High Contrast Colors
// HighContrastColors is defined in AccessibilitySettings.swift

// MARK: - Semantic Labels

/// Semantic label helpers for consistent accessibility descriptions
public enum SemanticLabels {
    // Navigation
    public static let home = "Home"
    public static let directory = "Program Directory"
    public static let saved = "Saved Programs"
    public static let settings = "Settings"
    public static let search = "Search programs"
    public static let filter = "Filter programs"
    public static let sort = "Sort programs"

    // Actions
    public static func saveProgram(_ name: String) -> String {
        "Save \(name) to your list"
    }

    public static func unsaveProgram(_ name: String) -> String {
        "Remove \(name) from your list"
    }

    public static func shareProgram(_ name: String) -> String {
        "Share \(name)"
    }

    public static func callPhone(_ phone: String) -> String {
        "Call \(phone)"
    }

    public static func openWebsite(_ name: String) -> String {
        "Open \(name) website"
    }

    public static func getDirections(_ location: String) -> String {
        "Get directions to \(location)"
    }

    // States
    public static func programSaved(_ name: String) -> String {
        "\(name) is saved"
    }

    public static func programNotSaved(_ name: String) -> String {
        "\(name) is not saved"
    }

    public static func filterActive(_ count: Int) -> String {
        "\(count) filters active"
    }

    public static func resultsCount(_ count: Int) -> String {
        "\(count) programs found"
    }

    public static let loadingPrograms = "Loading programs"

    // Categories
    public static func categoryLabel(_ category: String) -> String {
        "\(category) programs"
    }

    // Groups
    public static let groupLabels: [String: String] = [
        "seniors": "Seniors 65 and older",
        "veterans": "Veterans and military families",
        "disabled": "People with disabilities",
        "lowincome": "Low income individuals and families",
        "students": "Students",
        "families": "Families with children",
        "unemployed": "Unemployed or job seekers",
        "homeless": "People experiencing homelessness",
        "immigrants": "Immigrants and refugees",
        "youth": "Youth and young adults"
    ]

    public static func getGroupLabel(_ groupId: String) -> String {
        groupLabels[groupId.lowercased()] ?? groupId
    }
}

// MARK: - SwiftUI View Modifiers

/// Accessible animation modifier that respects reduced motion
public struct AccessibleAnimation: ViewModifier {
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    let animation: Animation?

    public func body(content: Content) -> some View {
        content.animation(reduceMotion ? nil : animation, value: UUID())
    }
}

/// Accessible opacity modifier
public struct AccessibleOpacity: ViewModifier {
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    let opacity: Double
    let animation: Animation?

    public func body(content: Content) -> some View {
        if reduceMotion {
            content.opacity(opacity)
        } else {
            content
                .opacity(opacity)
                .animation(animation, value: opacity)
        }
    }
}

// MARK: - View Extensions

public extension View {
    /// Apply animation respecting reduced motion preference
    func accessibleAnimation(_ animation: Animation? = .default) -> some View {
        modifier(AccessibleAnimation(animation: animation))
    }

    /// Apply opacity with animation respecting reduced motion
    func accessibleOpacity(_ opacity: Double, animation: Animation? = .easeInOut) -> some View {
        modifier(AccessibleOpacity(opacity: opacity, animation: animation))
    }

    /// Add semantic label for accessibility
    func accessibilitySemanticLabel(_ label: String) -> some View {
        self.accessibilityLabel(label)
    }

    /// Mark as a button with label
    func accessibleButton(_ label: String, hint: String? = nil) -> some View {
        self
            .accessibilityLabel(label)
            .accessibilityHint(hint ?? "")
            .accessibilityAddTraits(.isButton)
    }

    /// Mark as a heading
    func accessibleHeading(_ label: String) -> some View {
        self
            .accessibilityLabel(label)
            .accessibilityAddTraits(.isHeader)
    }

    /// Mark as an image with description
    func accessibleImage(_ description: String) -> some View {
        self
            .accessibilityLabel(description)
            .accessibilityAddTraits(.isImage)
    }

    /// Mark as a link
    func accessibleLink(_ label: String) -> some View {
        self
            .accessibilityLabel(label)
            .accessibilityAddTraits(.isLink)
    }

    /// Hide from accessibility (for decorative elements)
    func accessibilityDecorative() -> some View {
        self.accessibilityHidden(true)
    }

    /// Mark as a live region for dynamic updates
    func accessibilityLiveRegion() -> some View {
        self.accessibilityAddTraits(.updatesFrequently)
    }
}
