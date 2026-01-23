import Foundation

/// Client for San Francisco's Socrata Open Data API (SODA)
/// https://data.sfgov.org/
public actor SodaClient {
    public static let shared = SodaClient()

    private static let baseUrl = "https://data.sfgov.org/resource"

    /// HSH Shelter Waitlist dataset
    private static let shelterWaitlistId = "w4sk-nq57"

    /// 311 Cases (service requests)
    private static let cases311Id = "vw6y-z8j6"

    private let urlSession: URLSession

    public init(urlSession: URLSession = .shared) {
        self.urlSession = urlSession
    }

    /// Fetch all shelter-related data from SF DataSF
    public func fetchShelterData(limit: Int = 500) async -> [Program] {
        var components = URLComponents(string: "\(Self.baseUrl)/\(Self.shelterWaitlistId).json")
        components?.queryItems = [
            URLQueryItem(name: "$limit", value: String(limit)),
            URLQueryItem(name: "$order", value: "data_as_of DESC"),
        ]

        guard let url = components?.url else { return [] }

        do {
            var request = URLRequest(url: url)
            request.setValue("application/json", forHTTPHeaderField: "Accept")

            let (data, response) = try await urlSession.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                return []
            }

            let items = try JSONDecoder().decode([[String: AnyCodable]].self, from: data)
            return items.map { mapShelterToProgram($0) }
        } catch {
            return []
        }
    }

    /// Fetch all available programs from SF DataSF
    public func fetchAll() async -> [Program] {
        await fetchShelterData()
    }

    private func mapShelterToProgram(_ item: [String: AnyCodable]) -> Program {
        let siteName = item["site_name"]?.stringValue ?? "Unknown Shelter"
        let address = item["site_address"]?.stringValue
        let date = item["data_as_of"]?.stringValue?.split(separator: "T").first.map(String.init) ?? dateString()

        return Program(
            id: "sf-shelter-\(siteName.hashValue)",
            name: siteName,
            category: "housing",
            description: buildShelterDescription(item),
            groups: ["unhoused"],
            areas: ["san-francisco"],
            city: "San Francisco",
            website: "https://sf.gov/departments/homelessness-and-supportive-housing",
            address: address,
            lastUpdated: date,
            dataSource: .dataSF,
            externalId: siteName,
            sourceUrl: "https://data.sfgov.org/d/\(Self.shelterWaitlistId)"
        )
    }

    private func buildShelterDescription(_ item: [String: AnyCodable]) -> String {
        var lines = ["San Francisco homeless shelter facility."]

        let adultOnly = item["adults_only_waitlist_count"]?.stringValue
        let youth = item["youth_waitlist_count"]?.stringValue
        let family = item["family_waitlist_count"]?.stringValue

        if adultOnly != nil || youth != nil || family != nil {
            lines.append("")
            lines.append("Waitlist information:")
            if let adultOnly = adultOnly {
                lines.append("• Adults only: \(adultOnly)")
            }
            if let youth = youth {
                lines.append("• Youth: \(youth)")
            }
            if let family = family {
                lines.append("• Families: \(family)")
            }
        }

        return lines.joined(separator: "\n")
    }

    private func dateString() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }
}

// MARK: - AnyCodable Helper

/// Helper type for decoding arbitrary JSON values
public struct AnyCodable: Codable {
    public let value: Any?

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if container.decodeNil() {
            value = nil
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dictionary = try? container.decode([String: AnyCodable].self) {
            value = dictionary.mapValues { $0.value }
        } else {
            value = nil
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if value == nil {
            try container.encodeNil()
        } else if let bool = value as? Bool {
            try container.encode(bool)
        } else if let int = value as? Int {
            try container.encode(int)
        } else if let double = value as? Double {
            try container.encode(double)
        } else if let string = value as? String {
            try container.encode(string)
        } else {
            try container.encodeNil()
        }
    }

    public var stringValue: String? {
        if let string = value as? String {
            return string
        }
        if let int = value as? Int {
            return String(int)
        }
        if let double = value as? Double {
            return String(double)
        }
        return nil
    }

    public var intValue: Int? {
        if let int = value as? Int {
            return int
        }
        if let string = value as? String {
            return Int(string)
        }
        return nil
    }

    public var doubleValue: Double? {
        if let double = value as? Double {
            return double
        }
        if let int = value as? Int {
            return Double(int)
        }
        if let string = value as? String {
            return Double(string)
        }
        return nil
    }
}
