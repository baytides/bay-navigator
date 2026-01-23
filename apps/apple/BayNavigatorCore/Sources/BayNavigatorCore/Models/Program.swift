import Foundation

/// Data source for a program
public enum DataSource: String, Codable, CaseIterable, Sendable {
    case bayNavigator
    case ohana
    case dataSF
    case oneDegree

    public var displayName: String {
        switch self {
        case .bayNavigator: return "Bay Navigator"
        case .ohana: return "SMC Gov"
        case .dataSF: return "SF Data"
        case .oneDegree: return "One Degree"
        }
    }
}

public struct Program: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let category: String
    public let description: String
    public let fullDescription: String?
    public let whatTheyOffer: String?
    public let howToGetIt: String?
    public let groups: [String]
    public let areas: [String]
    public let city: String?
    public let website: String?
    public let cost: String?
    public let phone: String?
    public let email: String?
    public let address: String?
    public let requirements: String?
    public let howToApply: String?
    public let lastUpdated: String
    public let latitude: Double?
    public let longitude: Double?

    // External data source fields
    public var dataSource: DataSource
    public var externalId: String?
    public var sourceUrl: String?

    // Calculated at runtime (not persisted)
    public var distanceFromUser: Double?

    // Public memberwise initializer
    public init(
        id: String,
        name: String,
        category: String,
        description: String,
        fullDescription: String? = nil,
        whatTheyOffer: String? = nil,
        howToGetIt: String? = nil,
        groups: [String],
        areas: [String],
        city: String? = nil,
        website: String? = nil,
        cost: String? = nil,
        phone: String? = nil,
        email: String? = nil,
        address: String? = nil,
        requirements: String? = nil,
        howToApply: String? = nil,
        lastUpdated: String,
        latitude: Double? = nil,
        longitude: Double? = nil,
        dataSource: DataSource = .bayNavigator,
        externalId: String? = nil,
        sourceUrl: String? = nil,
        distanceFromUser: Double? = nil
    ) {
        self.id = id
        self.name = name
        self.category = category
        self.description = description
        self.fullDescription = fullDescription
        self.whatTheyOffer = whatTheyOffer
        self.howToGetIt = howToGetIt
        self.groups = groups
        self.areas = areas
        self.city = city
        self.website = website
        self.cost = cost
        self.phone = phone
        self.email = email
        self.address = address
        self.requirements = requirements
        self.howToApply = howToApply
        self.lastUpdated = lastUpdated
        self.latitude = latitude
        self.longitude = longitude
        self.dataSource = dataSource
        self.externalId = externalId
        self.sourceUrl = sourceUrl
        self.distanceFromUser = distanceFromUser
    }

    public var hasCoordinates: Bool {
        latitude != nil && longitude != nil
    }

    // Custom Hashable conformance (exclude distanceFromUser)
    public static func == (lhs: Program, rhs: Program) -> Bool {
        lhs.id == rhs.id
    }

    public func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    // Custom Codable keys (exclude distanceFromUser from JSON)
    enum CodingKeys: String, CodingKey {
        case id, name, category, description, fullDescription
        case whatTheyOffer, howToGetIt, groups, areas, city
        case website, cost, phone, email, address
        case requirements, howToApply, lastUpdated
        case latitude, longitude
        case dataSource, externalId, sourceUrl
    }

    // Custom decoder to provide default value for dataSource
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        category = try container.decode(String.self, forKey: .category)
        description = try container.decode(String.self, forKey: .description)
        fullDescription = try container.decodeIfPresent(String.self, forKey: .fullDescription)
        whatTheyOffer = try container.decodeIfPresent(String.self, forKey: .whatTheyOffer)
        howToGetIt = try container.decodeIfPresent(String.self, forKey: .howToGetIt)
        groups = try container.decode([String].self, forKey: .groups)
        areas = try container.decode([String].self, forKey: .areas)
        city = try container.decodeIfPresent(String.self, forKey: .city)
        website = try container.decodeIfPresent(String.self, forKey: .website)
        cost = try container.decodeIfPresent(String.self, forKey: .cost)
        phone = try container.decodeIfPresent(String.self, forKey: .phone)
        email = try container.decodeIfPresent(String.self, forKey: .email)
        address = try container.decodeIfPresent(String.self, forKey: .address)
        requirements = try container.decodeIfPresent(String.self, forKey: .requirements)
        howToApply = try container.decodeIfPresent(String.self, forKey: .howToApply)
        lastUpdated = try container.decode(String.self, forKey: .lastUpdated)
        latitude = try container.decodeIfPresent(Double.self, forKey: .latitude)
        longitude = try container.decodeIfPresent(Double.self, forKey: .longitude)
        dataSource = try container.decodeIfPresent(DataSource.self, forKey: .dataSource) ?? .bayNavigator
        externalId = try container.decodeIfPresent(String.self, forKey: .externalId)
        sourceUrl = try container.decodeIfPresent(String.self, forKey: .sourceUrl)
        distanceFromUser = nil
    }

    public var lastUpdatedDate: Date? {
        // Try simple date format first (yyyy-MM-dd)
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        if let date = dateFormatter.date(from: lastUpdated) {
            return date
        }
        // Fallback to ISO8601
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: lastUpdated) {
            return date
        }
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: lastUpdated)
    }

    public var formattedLastUpdated: String {
        guard let date = lastUpdatedDate else { return lastUpdated }
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }

    /// Get display description (prefer fullDescription, fallback to description)
    public var displayDescription: String {
        fullDescription ?? description
    }

    /// Get location text for display
    public var locationText: String {
        if let city = city, !city.isEmpty { return city }
        if !areas.isEmpty { return areas.joined(separator: ", ") }
        return "Bay Area"
    }

    /// Parse whatTheyOffer into list items
    public var offerItems: [String] {
        guard let text = whatTheyOffer, !text.isEmpty else { return [] }
        return text
            .components(separatedBy: "\n")
            .map { line in
                var cleaned = line
                if cleaned.hasPrefix("- ") {
                    cleaned = String(cleaned.dropFirst(2))
                }
                return cleaned.trimmingCharacters(in: .whitespaces)
            }
            .filter { !$0.isEmpty }
    }

    /// Parse howToGetIt into numbered steps
    public var howToSteps: [String] {
        guard let text = howToGetIt, !text.isEmpty else { return [] }
        return text
            .components(separatedBy: "\n")
            .map { line in
                var cleaned = line.trimmingCharacters(in: .whitespaces)
                // Remove leading number and period (e.g., "1. ", "2. ")
                if let range = cleaned.range(of: #"^\d+\.\s*"#, options: .regularExpression) {
                    cleaned = String(cleaned[range.upperBound...])
                }
                return cleaned
            }
            .filter { !$0.isEmpty }
    }
}

public struct ProgramsResponse: Codable, Sendable {
    public let programs: [Program]
}

public struct ProgramCategory: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let icon: String
    public let programCount: Int
}

public struct CategoriesResponse: Codable, Sendable {
    public let categories: [ProgramCategory]
}

public struct ProgramGroup: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let description: String
    public let icon: String
    public let programCount: Int
}

public struct GroupsResponse: Codable, Sendable {
    public let groups: [ProgramGroup]
}

public struct Area: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let type: String // 'county' | 'region' | 'state' | 'nationwide'
    public let programCount: Int

    public var isCounty: Bool {
        type == "county"
    }
}

public struct AreasResponse: Codable, Sendable {
    public let areas: [Area]
}

public struct APIMetadata: Codable, Sendable {
    public let version: String
    public let generatedAt: String
    public let totalPrograms: Int

    public var generatedAtDate: Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: generatedAt) {
            return date
        }
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: generatedAt)
    }

    public var formattedGeneratedAt: String {
        guard let date = generatedAtDate else { return generatedAt }
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

public struct FilterState: Equatable, Sendable {
    public var categories: Set<String> = []
    public var groups: Set<String> = []
    public var areas: Set<String> = []
    public var searchQuery: String = ""

    // IDs for "Other" area group (Bay Area, Statewide, Nationwide)
    public static let otherAreaIds: Set<String> = ["bay-area", "statewide", "nationwide"]

    public var hasFilters: Bool {
        !categories.isEmpty || !groups.isEmpty || !areas.isEmpty || !searchQuery.isEmpty
    }

    public var filterCount: Int {
        // Count counties as individual filters, but "Other" (bay-area, statewide, nationwide) as 1
        let countyCount = areas.filter { !Self.otherAreaIds.contains($0) }.count
        let hasOther = areas.contains { Self.otherAreaIds.contains($0) }
        let areaCount = countyCount + (hasOther ? 1 : 0)

        return categories.count + groups.count + areaCount + (searchQuery.isEmpty ? 0 : 1)
    }

    public var selectedAreaDisplayCount: Int {
        let countyCount = areas.filter { !Self.otherAreaIds.contains($0) }.count
        let hasOther = areas.contains { Self.otherAreaIds.contains($0) }
        return countyCount + (hasOther ? 1 : 0)
    }

    public var hasOtherAreasSelected: Bool {
        areas.contains { Self.otherAreaIds.contains($0) }
    }

    public mutating func clear() {
        categories.removeAll()
        groups.removeAll()
        areas.removeAll()
        searchQuery = ""
    }

    public mutating func toggleOtherAreas() {
        if hasOtherAreasSelected {
            // Remove all "other" area IDs
            areas.subtract(Self.otherAreaIds)
        } else {
            // Add all "other" area IDs
            areas.formUnion(Self.otherAreaIds)
        }
    }

    public init(
        categories: Set<String> = [],
        groups: Set<String> = [],
        areas: Set<String> = [],
        searchQuery: String = ""
    ) {
        self.categories = categories
        self.groups = groups
        self.areas = areas
        self.searchQuery = searchQuery
    }
}

public enum SortOption: String, CaseIterable, Identifiable, Sendable {
    case recentlyVerified = "Recently Verified"
    case nameAsc = "Name (A-Z)"
    case nameDesc = "Name (Z-A)"
    case categoryAsc = "Category"
    case distanceAsc = "Distance (Nearest)"

    public var id: String { rawValue }
}

// MARK: - Favorite Status Tracking

/// Status options for tracking application progress
public enum FavoriteStatus: String, Codable, CaseIterable, Identifiable, Sendable {
    case saved
    case researching
    case applied
    case waiting
    case approved
    case denied

    public var id: String { rawValue }

    public var label: String {
        switch self {
        case .saved: return "Saved"
        case .researching: return "Researching"
        case .applied: return "Applied"
        case .waiting: return "Waiting for Response"
        case .approved: return "Approved"
        case .denied: return "Denied"
        }
    }

    public var color: (red: Double, green: Double, blue: Double) {
        switch self {
        case .saved: return (0.62, 0.62, 0.62)       // Grey
        case .researching: return (0.13, 0.59, 0.95) // Blue
        case .applied: return (1.0, 0.76, 0.03)      // Amber
        case .waiting: return (0.61, 0.15, 0.69)     // Purple
        case .approved: return (0.30, 0.69, 0.31)    // Green
        case .denied: return (0.96, 0.26, 0.21)      // Red
        }
    }

    public var systemImage: String {
        switch self {
        case .saved: return "bookmark"
        case .researching: return "magnifyingglass"
        case .applied: return "paperplane"
        case .waiting: return "clock"
        case .approved: return "checkmark.circle"
        case .denied: return "xmark.circle"
        }
    }
}

/// Extended favorite info with status tracking and notes
public struct FavoriteItem: Codable, Identifiable, Sendable {
    public let programId: String
    public let savedAt: Date
    public var status: FavoriteStatus
    public var notes: String?
    public var statusUpdatedAt: Date?

    public var id: String { programId }

    public init(programId: String, savedAt: Date = Date(), status: FavoriteStatus = .saved, notes: String? = nil, statusUpdatedAt: Date? = nil) {
        self.programId = programId
        self.savedAt = savedAt
        self.status = status
        self.notes = notes
        self.statusUpdatedAt = statusUpdatedAt
    }

    public var hasNotes: Bool {
        guard let notes = notes else { return false }
        return !notes.isEmpty
    }
}
