import SwiftUI

extension Color {
    // Brand Primary - Teal (matches web design tokens)
    public static let appPrimary = Color(hex: "00ACC1")        // Teal - main brand
    public static let appPrimaryDark = Color(hex: "00838F")    // Teal darker - headings, links
    public static let appPrimaryDarker = Color(hex: "006064")  // Teal darkest - hover states
    public static let appAccent = Color(hex: "FF6F00")         // Orange - accents, CTAs
    public static let appAccentLight = Color(hex: "FF8F00")    // Orange lighter

    // Cyan Palette (brand tints)
    public static let cyan50 = Color(hex: "E0F7FA")
    public static let cyan100 = Color(hex: "B2EBF2")
    public static let cyan200 = Color(hex: "80DEEA")
    public static let cyan700 = Color(hex: "0097A7")
    public static let cyan800 = Color(hex: "00838F")
    public static let cyan900 = Color(hex: "006064")

    // Semantic colors
    public static let appSuccess = Color(hex: "22C55E")   // Green - verified, success
    public static let appWarning = Color(hex: "EAB308")   // Yellow - caution
    public static let appDanger = Color(hex: "EF4444")    // Red - error, stale
    public static let appInfo = Color(hex: "3B82F6")      // Blue - information

    // Light theme colors
    public static let lightBackground = Color(hex: "F9FAFB")
    public static let lightSurface = Color.white
    public static let lightSurfaceAlt = Color(hex: "F9FAFB")
    public static let lightCard = Color.white
    public static let lightText = Color(hex: "24292E")
    public static let lightTextSecondary = Color(hex: "586069")
    public static let lightTextMuted = Color(hex: "6B7280")
    public static let lightTextHeading = Color(hex: "00838F")
    public static let lightBorder = Color(hex: "E1E4E8")
    public static let lightBorderLight = Color(hex: "B2EBF2")
    public static let lightHover = Color(hex: "E0F7FA")

    // Light Neutral Palette
    public static let lightNeutral50 = Color(hex: "F9FAFB")
    public static let lightNeutral100 = Color(hex: "F3F4F6")
    public static let lightNeutral200 = Color(hex: "E5E7EB")
    public static let lightNeutral300 = Color(hex: "D1D5DB")
    public static let lightNeutral400 = Color(hex: "9CA3AF")

    // Dark theme colors
    public static let darkBackground = Color(hex: "0D1117")
    public static let darkSurface = Color(hex: "161B22")
    public static let darkSurfaceAlt = Color(hex: "1C2128")
    public static let darkCard = Color(hex: "1C2128")
    public static let darkText = Color(hex: "E8EEF5")
    public static let darkTextSecondary = Color(hex: "8B949E")
    public static let darkTextMuted = Color(hex: "6E7681")
    public static let darkTextHeading = Color(hex: "79D8EB")
    public static let darkBorder = Color(hex: "30363D")
    public static let darkBorderLight = Color(hex: "1B3A3A")
    public static let darkHover = Color(hex: "1B3A3A")

    // Dark Neutral Palette
    public static let darkNeutral50 = Color(hex: "21262D")
    public static let darkNeutral100 = Color(hex: "30363D")
    public static let darkNeutral200 = Color(hex: "484F58")
    public static let darkNeutral300 = Color(hex: "6E7681")
    public static let darkNeutral400 = Color(hex: "8B949E")

    // Focus Ring
    public static let focusRing = Color(hex: "2563EB")

    // Legacy aliases for backwards compatibility
    public static let appPrimaryLight = cyan200

    /// Parses a hex color string, returning `nil` when the string is not a valid
    /// color. Accepts an optional leading `#` and `RGB`, `RRGGBB`, or `AARRGGBB`
    /// digits.
    ///
    /// Use this for any hex that comes from data (civic agencies, transit feeds,
    /// user preferences) so a malformed value can fall back to a visible color.
    public init?(hexString: String) {
        var digits = hexString.trimmingCharacters(in: .whitespacesAndNewlines)
        if digits.hasPrefix("#") {
            digits.removeFirst()
        }

        // `Scanner` stops at the first non-hex character and reports success for
        // a partial parse, so validate every character up front instead.
        guard digits.allSatisfy(\.isHexDigit),
              let int = UInt64(digits, radix: 16) else {
            return nil
        }

        let a, r, g, b: UInt64
        switch digits.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            return nil
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }

    /// Non-failable convenience for the compile-time palette literals below.
    ///
    /// Falls back to `.gray` rather than the previous `(a, r, g, b) = (1, 1, 1, 0)`,
    /// which produced an effectively invisible color. Prefer `init?(hexString:)`
    /// for values that come from data.
    public init(hex: String) {
        self = Color(hexString: hex) ?? .gray
    }
}

// MARK: - Theme-aware colors

extension ShapeStyle where Self == Color {
    public static var cardBackground: Color {
        #if os(iOS) || os(visionOS)
        Color(.systemBackground)
        #elseif os(macOS)
        Color(nsColor: .windowBackgroundColor)
        #else
        Color.white
        #endif
    }

    public static var secondaryText: Color {
        Color.secondary
    }
}

// MARK: - Category Colors

extension Color {
    /// Get category-specific color
    public static func categoryColor(for category: String) -> Color {
        switch category.lowercased() {
        case "food", "food assistance":
            return Color(hex: "FF6F00") // Orange
        case "health", "healthcare", "medical":
            return Color(hex: "EF4444") // Red
        case "recreation", "activities", "entertainment":
            return Color(hex: "8B5CF6") // Purple
        case "community", "community services", "social services":
            return Color(hex: "10B981") // Green
        case "education", "learning", "training":
            return Color(hex: "3B82F6") // Blue
        case "finance", "financial", "financial assistance":
            return Color(hex: "22C55E") // Green
        case "transportation", "transit":
            return Color(hex: "0EA5E9") // Sky blue
        case "technology", "tech", "internet":
            return Color(hex: "6366F1") // Indigo
        case "legal", "legal aid":
            return Color(hex: "64748B") // Slate
        case "housing", "shelter":
            return Color(hex: "F59E0B") // Amber
        case "employment", "jobs", "career":
            return Color(hex: "0891B2") // Cyan
        default:
            return .appPrimary // Teal
        }
    }
}
