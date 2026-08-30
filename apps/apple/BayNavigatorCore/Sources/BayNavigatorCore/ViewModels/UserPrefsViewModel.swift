import SwiftUI

/// Main-actor isolated: every property here drives SwiftUI, and the async
/// save paths were already hopping back to the main actor by hand. Isolating
/// the type makes that structural, and clears the non-Sendable `self` captures
/// that are errors under the Swift 6 language mode.
@MainActor
@Observable
public final class UserPrefsViewModel {
    /// Profile colors available for selection
    public static let profileColors: [Color] = [
        Color(hex: "00ACC1"),   // Teal (primary)
        Color(hex: "FF6F00"),   // Orange
        Color(hex: "8B5CF6"),   // Purple
        Color(hex: "22C55E"),   // Green
        Color(hex: "3B82F6"),   // Blue
        Color(hex: "EF4444"),   // Red
        Color(hex: "F59E0B"),   // Amber
        Color(hex: "EC4899"),   // Pink
        Color(hex: "6366F1"),   // Indigo
        Color(hex: "14B8A6"),   // Cyan
    ]

    /// Get the user's selected profile color
    public var profileColor: Color {
        Self.profileColors.indices.contains(profileColorIndex) ? Self.profileColors[profileColorIndex] : Self.profileColors[0]
    }

    // Legacy fields
    public var selectedGroups: [String] = []
    public var selectedCounty: String?
    public var onboardingComplete: Bool = false
    public var showOnboarding: Bool = false

    // New profile fields
    public var firstName: String?
    public var city: String?
    public var zipCode: String?
    public var birthYear: Int?
    public var qualifications: [String] = []
    public var isMilitaryOrVeteran: Bool?
    public var profileColorIndex: Int = 0

    private let cache = CacheService.shared

    public var hasPreferences: Bool {
        !selectedGroups.isEmpty || selectedCounty != nil || firstName != nil
    }

    /// Display location: city name with zip (if available), or county name if no city
    public var displayLocation: String? {
        if let city = city, !city.isEmpty {
            if let zip = zipCode, !zip.isEmpty {
                return "\(city), \(zip)"
            }
            return city
        }
        // County is internal only - don't show it to users
        return nil
    }

    public init() {
        Task {
            await loadPreferences()
        }
    }

    public func loadPreferences() async {
        selectedGroups = await cache.getUserGroups()
        selectedCounty = await cache.getUserCounty()
        onboardingComplete = await cache.isOnboardingComplete()

        // Load new profile fields
        firstName = await cache.getUserFirstName()
        city = await cache.getUserCity()
        zipCode = await cache.getUserZipCode()
        birthYear = await cache.getUserBirthYear()
        qualifications = await cache.getUserQualifications()
        isMilitaryOrVeteran = await cache.getUserIsMilitary()
        profileColorIndex = await cache.getUserProfileColorIndex()

        // Show onboarding if not complete
        if !onboardingComplete {
            showOnboarding = true
        }
    }

    /// Save all profile preferences (new comprehensive method)
    public func savePreferences(
        firstName: String? = nil,
        city: String? = nil,
        zipCode: String? = nil,
        county: String? = nil,
        birthYear: Int? = nil,
        isMilitaryOrVeteran: Bool? = nil,
        qualifications: [String] = [],
        groups: [String] = [],
        profileColorIndex: Int = 0
    ) async {
        await cache.setUserFirstName(firstName)
        await cache.setUserCity(city)
        await cache.setUserZipCode(zipCode)
        await cache.setUserCounty(county)
        await cache.setUserBirthYear(birthYear)
        await cache.setUserIsMilitary(isMilitaryOrVeteran)
        await cache.setUserQualifications(qualifications)
        await cache.setUserGroups(groups)
        await cache.setUserProfileColorIndex(profileColorIndex)

        // Force synchronization to ensure data is persisted immediately
        await cache.synchronize()

        self.firstName = firstName
        self.city = city
        self.zipCode = zipCode
        self.selectedCounty = county
        self.birthYear = birthYear
        self.isMilitaryOrVeteran = isMilitaryOrVeteran
        self.qualifications = qualifications
        self.selectedGroups = groups
        self.profileColorIndex = profileColorIndex
    }

    /// Legacy save method for backward compatibility
    public func savePreferences(groups: [String], county: String?) async {
        await cache.setUserGroups(groups)
        await cache.setUserCounty(county)
        await cache.synchronize()

        self.selectedGroups = groups
        self.selectedCounty = county
    }

    public func completeOnboarding() async {
        await cache.setOnboardingComplete(true)
        await cache.synchronize()
        self.onboardingComplete = true
        self.showOnboarding = false
    }

    public func reopenOnboarding() {
        showOnboarding = true
    }

    public func getGroupNames(from allGroups: [ProgramGroup]) -> [String] {
        selectedGroups.compactMap { groupId in
            allGroups.first { $0.id == groupId }?.name
        }
    }

    public func getCountyName(from allAreas: [Area]) -> String? {
        guard let countyId = selectedCounty else { return nil }
        return allAreas.first { $0.id == countyId }?.name
    }

    /// Convert county ID to display name (e.g., "alameda-county" -> "Alameda County")
    private func countyIdToDisplayName(_ countyId: String) -> String {
        countyId.split(separator: "-")
            .map { String($0).capitalized }
            .joined(separator: " ")
    }
}
