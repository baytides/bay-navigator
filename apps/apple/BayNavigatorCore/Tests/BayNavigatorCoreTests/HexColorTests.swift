import Testing
import SwiftUI
@testable import BayNavigatorCore

/// Covers hex parsing for colors that arrive as *data* (civic agencies, transit
/// feeds), where a malformed value must fall back to something visible.
struct HexColorTests {

    // MARK: - Valid input

    @Test func parsesSixDigitHex() {
        #expect(Color(hexString: "00ACC1") != nil)
    }

    @Test func acceptsLeadingHashAndSurroundingWhitespace() {
        #expect(Color(hexString: "  #00ACC1 ") == Color(hexString: "00ACC1"))
    }

    @Test func isCaseInsensitive() {
        #expect(Color(hexString: "00acc1") == Color(hexString: "00ACC1"))
    }

    @Test func expandsThreeDigitShorthand() {
        // #0AC -> #00AACC
        #expect(Color(hexString: "0AC") == Color(hexString: "00AACC"))
    }

    @Test func parsesEightDigitHexAsARGB() {
        // Fully opaque AARRGGBB matches the equivalent RRGGBB.
        #expect(Color(hexString: "FF00ACC1") == Color(hexString: "00ACC1"))
    }

    // MARK: - Invalid input

    @Test func rejectsNonHexCharacters() {
        // Regression: `Scanner.scanHexInt64` stops at the first bad character and
        // reports partial success, so "GGGGGG" used to silently parse as black.
        #expect(Color(hexString: "GGGGGG") == nil)
        #expect(Color(hexString: "not-a-color") == nil)
    }

    @Test func rejectsWrongDigitCounts() {
        #expect(Color(hexString: "") == nil)
        #expect(Color(hexString: "AB") == nil)
        #expect(Color(hexString: "ABCD") == nil)
        #expect(Color(hexString: "ABCDEFAB12") == nil)
    }

    @Test func rejectsPartiallyValidHex() {
        // "00AC" + junk must not parse as the leading valid digits.
        #expect(Color(hexString: "00ACZZ") == nil)
    }

    // MARK: - Fallback behaviour

    @Test func nonFailableInitFallsBackToAVisibleColor() {
        // Regression: the old `default` branch produced (a, r, g, b) = (1, 1, 1, 0),
        // i.e. ~0.4% alpha — an effectively invisible color rather than a fallback.
        #expect(Color(hex: "not-a-color") == .gray)
    }

    @Test func agencyWithMalformedColorFallsBackToAccentColor() {
        // Regression: `Color(hex:)` is non-failable, so `?? .accentColor` in
        // `CityAgency.color` was dead code and malformed data rendered invisible.
        let agency = CityAgency(
            id: "test",
            name: "Test Agency",
            description: "",
            iconName: "building.2",
            colorHex: "not-a-color"
        )
        #expect(agency.color == .accentColor)
    }

    @Test func agencyWithValidColorUsesIt() {
        let agency = CityAgency(
            id: "test",
            name: "Test Agency",
            description: "",
            iconName: "building.2",
            colorHex: "#00ACC1"
        )
        #expect(agency.color == Color(hexString: "00ACC1"))
    }
}
