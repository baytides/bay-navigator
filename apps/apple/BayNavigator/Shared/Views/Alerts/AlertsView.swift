import SwiftUI
import BayNavigatorCore

// MARK: - Data Models

struct EarthquakeData: Codable {
    let generated: String
    let source: String
    let sourceUrl: String
    let count: Int
    let alerts: [Earthquake]
}

struct Earthquake: Codable, Identifiable {
    let id: String
    let magnitude: Double
    let place: String
    let time: String
    let timestamp: Int
    let url: String
    let depth: Double
    let lat: Double
    let lng: Double
    let felt: Int
    let tsunami: Bool
    let severity: String
    let title: String
    let status: String
    let magType: String
    let sig: Int
}

struct WeatherData: Codable {
    let generated: String
    let source: String
    let sourceUrl: String
    let count: Int
    let alerts: [WeatherAlert]
}

struct WeatherAlert: Codable, Identifiable {
    let id: String
    let event: String
    let headline: String
    let description: String
    let instruction: String?
    let severity: String
    let certainty: String
    let urgency: String
    let areaDesc: String
    let effective: String
    let onset: String
    let expires: String
    let ends: String
    let senderName: String
    let response: String
    let categories: [String]
    let zones: [String]
}

struct MissingPersonsData: Codable {
    let cases: [MissingPerson]
}

struct MissingPerson: Codable, Identifiable {
    let id: String
    let sourceId: String
    let source: String
    let name: String
    let age: Int
    let missingDate: String
    let missingFrom: MissingLocation
    let photoUrl: String
    let posterUrl: String
    let contact: ContactInfo
    let syncedAt: String
    let physical: PhysicalDescription
    let dateOfBirth: String
    let circumstances: String
    let summary: String
    let caseType: String
    let lastSeenWearing: String
    let enrichedByLlm: Bool
}

struct MissingLocation: Codable {
    let city: String
    let county: String
    let state: String

    var displayName: String {
        [city, county].filter { !$0.isEmpty }.joined(separator: ", ")
    }
}

struct ContactInfo: Codable {
    let agency: String
    let phone: String
}

struct PhysicalDescription: Codable {
    let sex: String
    let race: String
    let height: String
    let weight: String
    let hairColor: String
    let eyeColor: String
}

// MARK: - View Model

@Observable
final class AlertsViewModel {
    var missingPersons: [MissingPerson] = []
    var earthquakeData: EarthquakeData?
    var weatherData: WeatherData?

    var isLoadingMissing = false
    var isLoadingEarthquakes = false
    var isLoadingWeather = false

    var errorMissing: String?
    var errorEarthquakes: String?
    var errorWeather: String?

    private static let missingUrl = "https://baytidesstorage.blob.core.windows.net/missing-persons/missing-persons.json"
    private static let earthquakeUrl = "https://baynavigator.org/api/earthquake-alerts.json"
    private static let weatherUrl = "https://baynavigator.org/api/weather-alerts.json"

    func loadAll() async {
        async let m: () = loadMissingPersons()
        async let e: () = loadEarthquakes()
        async let w: () = loadWeather()
        _ = await (m, e, w)
    }

    func loadMissingPersons() async {
        await MainActor.run { isLoadingMissing = true; errorMissing = nil }
        do {
            guard let url = URL(string: Self.missingUrl) else { return }
            let (data, _) = try await URLSession.shared.data(from: url)
            let decoded = try JSONDecoder().decode(MissingPersonsData.self, from: data)
            await MainActor.run {
                missingPersons = decoded.cases
                isLoadingMissing = false
            }
        } catch {
            await MainActor.run {
                errorMissing = "Failed to load missing persons data"
                isLoadingMissing = false
            }
        }
    }

    func loadEarthquakes() async {
        await MainActor.run { isLoadingEarthquakes = true; errorEarthquakes = nil }
        do {
            guard let url = URL(string: Self.earthquakeUrl) else { return }
            let (data, _) = try await URLSession.shared.data(from: url)
            let decoded = try JSONDecoder().decode(EarthquakeData.self, from: data)
            await MainActor.run {
                earthquakeData = decoded
                isLoadingEarthquakes = false
            }
        } catch {
            await MainActor.run {
                errorEarthquakes = "Failed to load earthquake data"
                isLoadingEarthquakes = false
            }
        }
    }

    func loadWeather() async {
        await MainActor.run { isLoadingWeather = true; errorWeather = nil }
        do {
            guard let url = URL(string: Self.weatherUrl) else { return }
            let (data, _) = try await URLSession.shared.data(from: url)
            let decoded = try JSONDecoder().decode(WeatherData.self, from: data)
            await MainActor.run {
                weatherData = decoded
                isLoadingWeather = false
            }
        } catch {
            await MainActor.run {
                errorWeather = "Failed to load weather data"
                isLoadingWeather = false
            }
        }
    }
}

// MARK: - AlertsView (with NavigationStack for iOS tab)

struct AlertsView: View {
    var body: some View {
        NavigationStack {
            AlertsViewContent()
        }
    }
}

// MARK: - AlertsViewContent (for macOS detail pane)

struct AlertsViewContent: View {
    @State private var viewModel = AlertsViewModel()
    @State private var selectedTab = 0

    var body: some View {
        VStack(spacing: 0) {
            // Tab picker
            Picker("Alert Type", selection: $selectedTab) {
                HStack {
                    Text("Missing Persons")
                    if !viewModel.missingPersons.isEmpty {
                        Text("\(viewModel.missingPersons.count)")
                            .font(.caption2)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 1)
                            .background(Color.red.opacity(0.2))
                            .clipShape(Capsule())
                    }
                }.tag(0)

                HStack {
                    Text("Earthquakes")
                    if let count = viewModel.earthquakeData?.count, count > 0 {
                        Text("\(count)")
                            .font(.caption2)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 1)
                            .background(Color.orange.opacity(0.2))
                            .clipShape(Capsule())
                    }
                }.tag(1)

                HStack {
                    Text("Weather")
                    if let count = viewModel.weatherData?.count, count > 0 {
                        Text("\(count)")
                            .font(.caption2)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 1)
                            .background(Color.blue.opacity(0.2))
                            .clipShape(Capsule())
                    }
                }.tag(2)
            }
            .pickerStyle(.segmented)
            .padding()

            // Tab content
            TabView(selection: $selectedTab) {
                MissingPersonsListView(viewModel: viewModel)
                    .tag(0)

                EarthquakeListView(viewModel: viewModel)
                    .tag(1)

                WeatherListView(viewModel: viewModel)
                    .tag(2)
            }
            #if os(iOS) || os(visionOS)
            .tabViewStyle(.page(indexDisplayMode: .never))
            #endif
        }
        .navigationTitle("Bay Area Alerts")
        .toolbar {
            ToolbarItem(placement: .automatic) {
                Button {
                    Task { await viewModel.loadAll() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .help("Refresh")
            }
        }
        .task {
            await viewModel.loadAll()
        }
    }
}

// MARK: - Missing Persons List

private struct MissingPersonsListView: View {
    let viewModel: AlertsViewModel

    var body: some View {
        Group {
            if viewModel.isLoadingMissing {
                ProgressView("Loading...")
            } else if let error = viewModel.errorMissing {
                ErrorStateView(message: error) {
                    Task { await viewModel.loadMissingPersons() }
                }
            } else if viewModel.missingPersons.isEmpty {
                EmptyStateView(
                    icon: "checkmark.circle",
                    title: "No Active Cases",
                    subtitle: "No missing person cases currently reported in the Bay Area."
                )
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.missingPersons) { person in
                            MissingPersonCard(person: person)
                        }

                        AttributionFooter(source: "National Center for Missing & Exploited Children")
                    }
                    .padding()
                }
                .refreshable {
                    await viewModel.loadMissingPersons()
                }
            }
        }
    }
}

// MARK: - Earthquake List

private struct EarthquakeListView: View {
    let viewModel: AlertsViewModel

    var body: some View {
        Group {
            if viewModel.isLoadingEarthquakes {
                ProgressView("Loading...")
            } else if let error = viewModel.errorEarthquakes {
                ErrorStateView(message: error) {
                    Task { await viewModel.loadEarthquakes() }
                }
            } else if viewModel.earthquakeData?.alerts.isEmpty ?? true {
                EmptyStateView(
                    icon: "mountain.2",
                    title: "No Recent Earthquakes",
                    subtitle: "No earthquakes detected in the Bay Area this week."
                )
            } else {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(viewModel.earthquakeData!.alerts) { quake in
                            EarthquakeCard(earthquake: quake)
                        }

                        AttributionFooter(source: viewModel.earthquakeData?.source ?? "USGS")
                    }
                    .padding()
                }
                .refreshable {
                    await viewModel.loadEarthquakes()
                }
            }
        }
    }
}

// MARK: - Weather List

private struct WeatherListView: View {
    let viewModel: AlertsViewModel

    var body: some View {
        Group {
            if viewModel.isLoadingWeather {
                ProgressView("Loading...")
            } else if let error = viewModel.errorWeather {
                ErrorStateView(message: error) {
                    Task { await viewModel.loadWeather() }
                }
            } else if viewModel.weatherData?.alerts.isEmpty ?? true {
                EmptyStateView(
                    icon: "sun.max",
                    title: "No Active Weather Alerts",
                    subtitle: "No severe weather alerts for the Bay Area at this time."
                )
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.weatherData!.alerts) { alert in
                            WeatherAlertCard(alert: alert)
                        }

                        AttributionFooter(source: viewModel.weatherData?.source ?? "NWS")
                    }
                    .padding()
                }
                .refreshable {
                    await viewModel.loadWeather()
                }
            }
        }
    }
}

// MARK: - Missing Person Card

private struct MissingPersonCard: View {
    let person: MissingPerson
    @Environment(\.openURL) private var openURL

    var body: some View {
        Button {
            if let url = URL(string: person.posterUrl), !person.posterUrl.isEmpty {
                openURL(url)
            }
        } label: {
            HStack(alignment: .top, spacing: 16) {
                // Photo
                AsyncImage(url: URL(string: person.photoUrl)) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    default:
                        Rectangle()
                            .fill(.quaternary)
                            .overlay {
                                Image(systemName: "person.fill")
                                    .font(.title)
                                    .foregroundStyle(.secondary)
                            }
                    }
                }
                .frame(width: 80, height: 100)
                .clipShape(RoundedRectangle(cornerRadius: 8))

                // Details
                VStack(alignment: .leading, spacing: 4) {
                    // Case type badge
                    Text(person.caseType.isEmpty ? "Missing" : person.caseType)
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.red.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 4))

                    Text(person.name)
                        .font(.headline)
                        .foregroundStyle(.primary)

                    if person.age > 0 {
                        Text("Age \(person.age)")
                            .font(.subheadline)
                            .foregroundStyle(.primary)
                    }

                    if !person.missingFrom.displayName.isEmpty {
                        Text("Missing from \(person.missingFrom.displayName)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    if !person.missingDate.isEmpty {
                        Text("Since \(person.missingDate)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    if !person.contact.agency.isEmpty {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(person.contact.agency)
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundStyle(.primary)

                            if !person.contact.phone.isEmpty {
                                Text(person.contact.phone)
                                    .font(.caption)
                                    .foregroundStyle(.blue)
                            }
                        }
                        .padding(.top, 4)
                    }
                }
                .multilineTextAlignment(.leading)

                Spacer(minLength: 0)
            }
            .padding()
            .background {
                #if os(iOS)
                RoundedRectangle(cornerRadius: 12)
                    .fill(.regularMaterial)
                #elseif os(macOS)
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(nsColor: .controlBackgroundColor))
                #else
                RoundedRectangle(cornerRadius: 12)
                    .fill(.regularMaterial)
                #endif
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Earthquake Card

private struct EarthquakeCard: View {
    let earthquake: Earthquake
    @Environment(\.openURL) private var openURL

    private var severityColor: Color {
        if earthquake.magnitude >= 4.0 { return .red }
        if earthquake.magnitude >= 3.0 { return .orange }
        if earthquake.magnitude >= 2.0 { return Color(red: 0.85, green: 0.65, blue: 0.0) }
        return .gray
    }

    private var timeAgo: String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: earthquake.time) else { return "" }
        let diff = Date().timeIntervalSince(date)
        let minutes = Int(diff / 60)
        if minutes < 60 { return "\(minutes)m ago" }
        let hours = minutes / 60
        if hours < 24 { return "\(hours)h ago" }
        return "\(hours / 24)d ago"
    }

    var body: some View {
        Button {
            if let url = URL(string: earthquake.url) {
                openURL(url)
            }
        } label: {
            HStack(spacing: 16) {
                // Magnitude circle
                Circle()
                    .fill(severityColor.opacity(0.15))
                    .overlay {
                        Circle().strokeBorder(severityColor.opacity(0.4), lineWidth: 1)
                    }
                    .overlay {
                        Text(String(format: "%.1f", earthquake.magnitude))
                            .font(.title3.bold())
                            .foregroundStyle(severityColor)
                    }
                    .frame(width: 56, height: 56)

                // Details
                VStack(alignment: .leading, spacing: 4) {
                    Text(earthquake.place)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)

                    HStack(spacing: 12) {
                        Text(timeAgo)
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        Text("Depth: \(String(format: "%.1f", earthquake.depth)) km")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    if earthquake.felt > 0 {
                        Text("Felt by \(earthquake.felt) \(earthquake.felt == 1 ? "person" : "people")")
                            .font(.caption)
                            .foregroundStyle(.orange)
                            .fontWeight(.medium)
                    }
                }

                Spacer(minLength: 0)

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .background {
                #if os(iOS)
                RoundedRectangle(cornerRadius: 12)
                    .fill(.regularMaterial)
                #elseif os(macOS)
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(nsColor: .controlBackgroundColor))
                #else
                RoundedRectangle(cornerRadius: 12)
                    .fill(.regularMaterial)
                #endif
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Weather Alert Card

private struct WeatherAlertCard: View {
    let alert: WeatherAlert

    private var severityColor: Color {
        switch alert.severity.lowercased() {
        case "extreme": return Color(red: 0.6, green: 0.0, blue: 0.0)
        case "severe": return .red
        case "moderate": return .orange
        case "minor": return Color(red: 0.85, green: 0.65, blue: 0.0)
        default: return .blue
        }
    }

    private var severityIcon: String {
        switch alert.severity.lowercased() {
        case "extreme", "severe": return "exclamationmark.triangle.fill"
        case "moderate": return "info.circle.fill"
        default: return "cloud.fill"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                Image(systemName: severityIcon)
                    .foregroundStyle(severityColor)
                    .font(.title3)

                VStack(alignment: .leading) {
                    Text(alert.event)
                        .font(.headline)
                        .foregroundStyle(severityColor)

                    if !alert.senderName.isEmpty {
                        Text(alert.senderName)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                Text(alert.severity)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(severityColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(severityColor.opacity(0.15))
                    .clipShape(RoundedRectangle(cornerRadius: 4))
            }
            .padding()
            .background(severityColor.opacity(0.08))

            // Body
            VStack(alignment: .leading, spacing: 12) {
                if !alert.areaDesc.isEmpty {
                    Text("Areas: \(alert.areaDesc)")
                        .font(.caption)
                        .fontWeight(.medium)
                }

                if !alert.description.isEmpty {
                    Text(alert.description)
                        .font(.subheadline)
                }

                if let instruction = alert.instruction, !instruction.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Instructions")
                            .font(.caption.bold())
                            .foregroundStyle(.blue)

                        Text(instruction)
                            .font(.caption)
                            .foregroundStyle(.primary.opacity(0.8))
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.blue.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                if !alert.ends.isEmpty {
                    Text("Until: \(formatDateTime(alert.ends))")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
        }
        .background {
            #if os(iOS)
            RoundedRectangle(cornerRadius: 12)
                .fill(.regularMaterial)
            #elseif os(macOS)
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(nsColor: .controlBackgroundColor))
            #else
            RoundedRectangle(cornerRadius: 12)
                .fill(.regularMaterial)
            #endif
        }
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func formatDateTime(_ isoString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        guard let date = formatter.date(from: isoString) else { return isoString }
        let display = DateFormatter()
        display.dateFormat = "MMM d 'at' h:mm a"
        return display.string(from: date)
    }
}

// MARK: - Shared Views

private struct EmptyStateView: View {
    let icon: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundStyle(.green.opacity(0.6))

            Text(title)
                .font(.title2.bold())

            Text(subtitle)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct ErrorStateView: View {
    let message: String
    let onRetry: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)

            Text(message)
                .font(.subheadline)

            Button("Retry", action: onRetry)
                .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct AttributionFooter: View {
    let source: String

    var body: some View {
        Text("Data from \(source)")
            .font(.caption)
            .foregroundStyle(.secondary)
            .padding(.vertical, 16)
            .frame(maxWidth: .infinity)
    }
}

// MARK: - Previews

#Preview("Alerts") {
    AlertsView()
}
