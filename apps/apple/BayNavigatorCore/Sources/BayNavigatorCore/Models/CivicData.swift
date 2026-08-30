import Foundation
import SwiftUI

// MARK: - Representative

/// Elected representative at federal, state, or local level
public struct Representative: Codable, Identifiable, Hashable, Sendable {
    public let name: String
    public let title: String
    public let level: RepresentativeLevel
    public let party: String?
    public let phone: String?
    public let email: String?
    public let website: String?
    public let photoUrl: String?
    public let district: String?
    public let bio: String?

    public var id: String { "\(name)-\(title)" }

    public init(
        name: String,
        title: String,
        level: RepresentativeLevel,
        party: String? = nil,
        phone: String? = nil,
        email: String? = nil,
        website: String? = nil,
        photoUrl: String? = nil,
        district: String? = nil,
        bio: String? = nil
    ) {
        self.name = name
        self.title = title
        self.level = level
        self.party = party
        self.phone = phone
        self.email = email
        self.website = website
        self.photoUrl = photoUrl
        self.district = district
        self.bio = bio
    }
}

/// Government level for representatives
public enum RepresentativeLevel: String, Codable, Sendable {
    case federal
    case state
    case local

    public var displayName: String {
        switch self {
        case .federal: return "Federal"
        case .state: return "State"
        case .local: return "Local"
        }
    }

    public var badgeColor: Color {
        switch self {
        case .federal: return .blue
        case .state: return .purple
        case .local: return .green
        }
    }
}

/// Container for representatives organized by level
public struct RepresentativeList: Sendable {
    public let federal: [Representative]
    public let state: [Representative]
    public let local: [Representative]

    public init(
        federal: [Representative] = [],
        state: [Representative] = [],
        local: [Representative] = []
    ) {
        self.federal = federal
        self.state = state
        self.local = local
    }

    public var all: [Representative] {
        federal + state + local
    }

    public var isEmpty: Bool {
        federal.isEmpty && state.isEmpty && local.isEmpty
    }
}

// MARK: - City Agency

/// Local government agency/department
public struct CityAgency: Identifiable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let description: String
    public let phone: String?
    public let website: String?
    public let address: String?
    public let iconName: String
    public let colorHex: String

    public init(
        id: String,
        name: String,
        description: String,
        phone: String? = nil,
        website: String? = nil,
        address: String? = nil,
        iconName: String,
        colorHex: String
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.phone = phone
        self.website = website
        self.address = address
        self.iconName = iconName
        self.colorHex = colorHex
    }

    public var color: Color {
        Color(hexString: colorHex) ?? .accentColor
    }
}

// MARK: - City Guide

/// City guide with local government info
public struct CityGuide: Identifiable, Sendable {
    public let cityName: String
    public let countyName: String
    public let agencies: [CityAgency]
    public let cityWebsite: String?
    public let newsRssUrl: String?
    public let nextdoorUrl: String?

    public var id: String { cityName.lowercased() }

    public init(
        cityName: String,
        countyName: String,
        agencies: [CityAgency],
        cityWebsite: String? = nil,
        newsRssUrl: String? = nil,
        nextdoorUrl: String? = nil
    ) {
        self.cityName = cityName
        self.countyName = countyName
        self.agencies = agencies
        self.cityWebsite = cityWebsite
        self.newsRssUrl = newsRssUrl
        self.nextdoorUrl = nextdoorUrl
    }
}

// MARK: - City News

/// News article from city website
public struct CityNews: Codable, Identifiable, Hashable, Sendable {
    public let title: String
    public let summary: String
    public let url: String
    public let publishedAt: Date
    public let imageUrl: String?
    public let source: String

    public var id: String { url }

    public init(
        title: String,
        summary: String,
        url: String,
        publishedAt: Date,
        imageUrl: String? = nil,
        source: String
    ) {
        self.title = title
        self.summary = summary
        self.url = url
        self.publishedAt = publishedAt
        self.imageUrl = imageUrl
        self.source = source
    }

    /// Formatted relative date (Today, Yesterday, X days ago, or date)
    public var formattedDate: String {
        let calendar = Calendar.current
        let now = Date()

        if calendar.isDateInToday(publishedAt) {
            return "Today"
        } else if calendar.isDateInYesterday(publishedAt) {
            return "Yesterday"
        } else {
            let days = calendar.dateComponents([.day], from: publishedAt, to: now).day ?? 0
            if days < 7 {
                return "\(days) days ago"
            } else {
                let formatter = DateFormatter()
                formatter.dateStyle = .medium
                return formatter.string(from: publishedAt)
            }
        }
    }
}

