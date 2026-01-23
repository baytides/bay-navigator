import Foundation

/// Client for the Ohana API (SMC-Connect)
/// HSDS-compliant API for San Mateo County services
/// https://api.smc-connect.org/
public actor OhanaClient {
    public static let shared = OhanaClient()

    private static let baseUrl = "https://api.smc-connect.org"

    private let urlSession: URLSession

    public init(urlSession: URLSession = .shared) {
        self.urlSession = urlSession
    }

    /// Search for services by keyword
    public func search(keyword: String) async -> [Program] {
        var components = URLComponents(string: "\(Self.baseUrl)/search")
        components?.queryItems = [
            URLQueryItem(name: "keyword", value: keyword),
            URLQueryItem(name: "per_page", value: "100"),
        ]

        guard let url = components?.url else { return [] }

        do {
            var request = URLRequest(url: url)
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            request.setValue("BayNavigator/1.0", forHTTPHeaderField: "User-Agent")

            let (data, response) = try await urlSession.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                return []
            }

            let items = try JSONDecoder().decode([OhanaSearchResult].self, from: data)
            return items.map { mapToProgram($0) }
        } catch {
            return []
        }
    }

    /// Fetch all available programs from Ohana API
    /// Uses multiple searches to cover common categories
    public func fetchAll() async -> [Program] {
        let searchTerms = ["food", "housing", "shelter", "health", "employment", "legal", "education"]

        var uniquePrograms: [String: Program] = [:]

        for term in searchTerms {
            let results = await search(keyword: term)
            for program in results {
                let key = program.externalId ?? program.id
                uniquePrograms[key] = program
            }
        }

        return Array(uniquePrograms.values)
    }

    private func mapToProgram(_ item: OhanaSearchResult) -> Program {
        let orgName = item.organization?.name ?? "Unknown Organization"
        let serviceName = item.services?.first?.name

        let name = serviceName != nil ? "\(orgName) - \(serviceName!)" : orgName

        let address = buildAddress(item.location?.address)
        let phone = item.location?.phones?.first?.number

        let lat = item.location?.latitude
        let lng = item.location?.longitude

        let description = item.services?.first?.description ?? "Service provided by \(orgName)."

        let eligibility = item.services?.first?.eligibility
        let groups = parseEligibility(eligibility)

        let category = determineCategory(item)

        return Program(
            id: "ohana-\(item.id ?? UUID().hashValue)",
            name: name,
            category: category,
            description: description,
            groups: groups,
            areas: ["san-mateo"],
            city: item.location?.address?.city,
            website: item.organization?.website ?? "https://www.smc-connect.org",
            phone: phone,
            address: address,
            lastUpdated: dateString(),
            latitude: lat,
            longitude: lng,
            dataSource: .ohana,
            externalId: item.id.map(String.init),
            sourceUrl: item.id.map { "https://www.smc-connect.org/locations/\($0)" }
        )
    }

    private func buildAddress(_ address: OhanaAddress?) -> String? {
        guard let address = address else { return nil }

        var parts: [String] = []
        if let street = address.address1, !street.isEmpty {
            parts.append(street)
        }
        if let city = address.city, !city.isEmpty {
            var cityLine = city
            if let state = address.stateProvince, !state.isEmpty {
                cityLine += " \(state)"
            }
            if let zip = address.postalCode, !zip.isEmpty {
                cityLine += " \(zip)"
            }
            parts.append(cityLine)
        }

        return parts.isEmpty ? nil : parts.joined(separator: ", ")
    }

    private func parseEligibility(_ eligibility: String?) -> [String] {
        guard let eligibility = eligibility?.lowercased() else { return [] }

        var groups: [String] = []

        if eligibility.contains("senior") || eligibility.contains("older adult") || eligibility.contains("65+") {
            groups.append("seniors")
        }
        if eligibility.contains("veteran") {
            groups.append("veterans")
        }
        if eligibility.contains("youth") || eligibility.contains("child") || eligibility.contains("teen") {
            groups.append("youth")
        }
        if eligibility.contains("disabled") || eligibility.contains("disability") {
            groups.append("disabled")
        }
        if eligibility.contains("immigrant") || eligibility.contains("refugee") {
            groups.append("immigrants")
        }
        if eligibility.contains("family") || eligibility.contains("families") {
            groups.append("families")
        }
        if eligibility.contains("homeless") || eligibility.contains("unhoused") {
            groups.append("unhoused")
        }

        return groups
    }

    private func determineCategory(_ item: OhanaSearchResult) -> String {
        guard let service = item.services?.first else { return "other" }

        let name = (service.name ?? "").lowercased()
        let description = (service.description ?? "").lowercased()
        let combined = "\(name) \(description)"

        if combined.contains("food") || combined.contains("meal") || combined.contains("pantry") {
            return "food"
        }
        if combined.contains("housing") || combined.contains("shelter") || combined.contains("rent") {
            return "housing"
        }
        if combined.contains("health") || combined.contains("medical") || combined.contains("clinic") {
            return "healthcare"
        }
        if combined.contains("job") || combined.contains("employment") || combined.contains("work") {
            return "employment"
        }
        if combined.contains("legal") || combined.contains("attorney") || combined.contains("law") {
            return "legal"
        }
        if combined.contains("education") || combined.contains("school") || combined.contains("training") {
            return "education"
        }
        if combined.contains("money") || combined.contains("financial") || combined.contains("cash") {
            return "financial"
        }

        return "other"
    }

    private func dateString() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }
}

// MARK: - Ohana API Response Models

private struct OhanaSearchResult: Codable {
    let id: Int?
    let organization: OhanaOrganization?
    let location: OhanaLocation?
    let services: [OhanaService]?
}

private struct OhanaOrganization: Codable {
    let name: String?
    let website: String?
}

private struct OhanaLocation: Codable {
    let address: OhanaAddress?
    let phones: [OhanaPhone]?
    let latitude: Double?
    let longitude: Double?
}

private struct OhanaAddress: Codable {
    let address1: String?
    let city: String?
    let stateProvince: String?
    let postalCode: String?

    enum CodingKeys: String, CodingKey {
        case address1 = "address_1"
        case city
        case stateProvince = "state_province"
        case postalCode = "postal_code"
    }
}

private struct OhanaPhone: Codable {
    let number: String?
}

private struct OhanaService: Codable {
    let name: String?
    let description: String?
    let eligibility: String?
}
