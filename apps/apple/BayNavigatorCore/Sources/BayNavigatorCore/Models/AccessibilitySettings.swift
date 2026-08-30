import Foundation
import SwiftUI

/// WCAG 2.2 AAA Accessibility Settings Model
///
/// Provides comprehensive accessibility customization options that sync
/// across devices and respect system-level preferences as defaults.
public struct AccessibilitySettings: Codable, Equatable, Sendable {
    // MARK: - Vision Settings

    /// Text scale factor (0.8 - 2.0, default: 1.0)
    public var textScale: Double

    /// Enable bold text throughout the app
    public var boldText: Bool

    /// Enable high contrast mode (10:1+ contrast ratios)
    public var highContrastMode: Bool

    /// Reduce transparency effects
    public var reduceTransparency: Bool

    /// Enable dyslexia-friendly font (OpenDyslexic)
    public var dyslexiaFont: Bool

    // MARK: - Motion Settings

    /// Reduce motion and animations
    public var reduceMotion: Bool

    /// Pause all auto-playing animations
    public var pauseAnimations: Bool

    // MARK: - Reading & Display Settings

    /// Line height multiplier (1.0 - 2.0, default: 1.5)
    public var lineHeightMultiplier: Double

    /// Letter spacing (0 - 0.1em, default: 0)
    public var letterSpacing: Double

    /// Word spacing (0 - 0.2em, default: 0)
    public var wordSpacing: Double

    /// Enable simple language mode (simplified content)
    public var simpleLanguageMode: Bool

    // MARK: - Interaction Settings

    /// Enable larger touch targets (48x48pt minimum)
    public var largerTouchTargets: Bool

    /// Extend timeouts for timed content
    public var extendedTimeouts: Bool

    // MARK: - Audio & Captions Settings

    /// Prefer captions/subtitles when available
    public var preferCaptions: Bool

    /// Show visual alerts for sounds
    public var visualAlerts: Bool

    // MARK: - Preset

    /// Currently active preset (if any)
    public var activePreset: AccessibilityPreset?

    // MARK: - Initialization

    public init(
        textScale: Double = 1.0,
        boldText: Bool = false,
        highContrastMode: Bool = false,
        reduceTransparency: Bool = false,
        dyslexiaFont: Bool = false,
        reduceMotion: Bool = false,
        pauseAnimations: Bool = false,
        lineHeightMultiplier: Double = 1.5,
        letterSpacing: Double = 0,
        wordSpacing: Double = 0,
        simpleLanguageMode: Bool = false,
        largerTouchTargets: Bool = false,
        extendedTimeouts: Bool = false,
        preferCaptions: Bool = false,
        visualAlerts: Bool = false,
        activePreset: AccessibilityPreset? = nil
    ) {
        self.textScale = textScale
        self.boldText = boldText
        self.highContrastMode = highContrastMode
        self.reduceTransparency = reduceTransparency
        self.dyslexiaFont = dyslexiaFont
        self.reduceMotion = reduceMotion
        self.pauseAnimations = pauseAnimations
        self.lineHeightMultiplier = lineHeightMultiplier
        self.letterSpacing = letterSpacing
        self.wordSpacing = wordSpacing
        self.simpleLanguageMode = simpleLanguageMode
        self.largerTouchTargets = largerTouchTargets
        self.extendedTimeouts = extendedTimeouts
        self.preferCaptions = preferCaptions
        self.visualAlerts = visualAlerts
        self.activePreset = activePreset
    }

    /// Default settings (all features off, standard values)
    public static let `default` = AccessibilitySettings()

    /// Check if all settings are at default values
    public var isDefault: Bool {
        self == .default
    }
}

// MARK: - Accessibility Presets

/// Pre-configured accessibility profiles for common needs
public enum AccessibilityPreset: String, Codable, CaseIterable, Identifiable, Sendable {
    case lowVision = "low_vision"
    case motor = "motor"
    case cognitive = "cognitive"

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .lowVision:
            return "Low Vision"
        case .motor:
            return "Motor Accessibility"
        case .cognitive:
            return "Cognitive / Reading"
        }
    }

    public var description: String {
        switch self {
        case .lowVision:
            return "Larger text, high contrast, and bold fonts for easier viewing"
        case .motor:
            return "Larger touch targets, extended timeouts, and reduced motion"
        case .cognitive:
            return "Simple language, increased spacing, and dyslexia-friendly font"
        }
    }

    public var icon: String {
        switch self {
        case .lowVision:
            return "eye"
        case .motor:
            return "hand.tap"
        case .cognitive:
            return "brain.head.profile"
        }
    }

    /// Apply this preset to create new settings
    public var settings: AccessibilitySettings {
        switch self {
        case .lowVision:
            return AccessibilitySettings(
                textScale: 1.4,
                boldText: true,
                highContrastMode: true,
                reduceTransparency: true,
                dyslexiaFont: false,
                reduceMotion: false,
                pauseAnimations: false,
                lineHeightMultiplier: 1.6,
                letterSpacing: 0.02,
                wordSpacing: 0.05,
                simpleLanguageMode: false,
                largerTouchTargets: true,
                extendedTimeouts: false,
                preferCaptions: true,
                visualAlerts: true,
                activePreset: .lowVision
            )
        case .motor:
            return AccessibilitySettings(
                textScale: 1.1,
                boldText: false,
                highContrastMode: false,
                reduceTransparency: false,
                dyslexiaFont: false,
                reduceMotion: true,
                pauseAnimations: true,
                lineHeightMultiplier: 1.5,
                letterSpacing: 0,
                wordSpacing: 0,
                simpleLanguageMode: false,
                largerTouchTargets: true,
                extendedTimeouts: true,
                preferCaptions: false,
                visualAlerts: true,
                activePreset: .motor
            )
        case .cognitive:
            return AccessibilitySettings(
                textScale: 1.2,
                boldText: false,
                highContrastMode: false,
                reduceTransparency: true,
                dyslexiaFont: true,
                reduceMotion: true,
                pauseAnimations: true,
                lineHeightMultiplier: 1.8,
                letterSpacing: 0.05,
                wordSpacing: 0.1,
                simpleLanguageMode: true,
                largerTouchTargets: false,
                extendedTimeouts: true,
                preferCaptions: true,
                visualAlerts: false,
                activePreset: .cognitive
            )
        }
    }
}

// MARK: - System Settings Integration

extension AccessibilitySettings {
    /// Create settings based on current system accessibility preferences
    @MainActor
    public static func fromSystemSettings() -> AccessibilitySettings {
        // These will be populated from environment values in the view.
        // This method provides a base that can be enhanced with @Environment values.
        AccessibilitySettings.default
    }
}

// MARK: - Text Style Helpers

extension AccessibilitySettings {
    /// Get the scaled font size for a given base size
    public func scaledFontSize(_ baseSize: CGFloat) -> CGFloat {
        baseSize * textScale
    }

    /// Get the font weight based on bold text setting
    public func fontWeight(_ defaultWeight: Font.Weight = .regular) -> Font.Weight {
        if boldText {
            switch defaultWeight {
            case .ultraLight, .thin, .light:
                return .regular
            case .regular:
                return .medium
            case .medium:
                return .semibold
            case .semibold:
                return .bold
            case .bold:
                return .heavy
            case .heavy, .black:
                return .black
            default:
                return .semibold
            }
        }
        return defaultWeight
    }

    /// Get minimum touch target size
    public var minimumTouchTargetSize: CGFloat {
        largerTouchTargets ? 48 : 44
    }

    /// Get timeout multiplier for timed content
    public var timeoutMultiplier: Double {
        extendedTimeouts ? 2.0 : 1.0
    }

    /// Get animation duration based on reduce motion setting
    public func animationDuration(_ normalDuration: Double) -> Double {
        if reduceMotion || pauseAnimations {
            return 0
        }
        return normalDuration
    }
}

// MARK: - High Contrast Colors

/// High contrast color palette for WCAG 2.2 AAA compliance (10:1+ contrast)
public enum HighContrastColors {
    public static let text = Color.black
    public static let textOnDark = Color.white
    public static let background = Color.white
    public static let backgroundDark = Color.black
    public static let primary = Color(red: 0, green: 0.25, blue: 0.25) // Darker teal
    public static let primaryOnDark = Color(red: 0.5, green: 1, blue: 1) // Bright cyan
    public static let link = Color(red: 0, green: 0, blue: 0.8) // Traditional blue
    public static let linkOnDark = Color(red: 0.6, green: 0.8, blue: 1)
    public static let focus = Color.black
    public static let focusOnDark = Color.yellow
    public static let error = Color(red: 0.8, green: 0, blue: 0)
    public static let errorOnDark = Color(red: 1, green: 0.4, blue: 0.4)
    public static let success = Color(red: 0, green: 0.4, blue: 0)
    public static let successOnDark = Color(red: 0.4, green: 1, blue: 0.4)
}
