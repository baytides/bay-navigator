import SwiftUI
import BayNavigatorCore

// MARK: - Transit View Model

@MainActor
@Observable
final class TransitViewModel {
    private let transitService = TransitService.shared

    var alerts: [TransitAlert] = []
    var alertCounts: [String: Int] = [:]
    var isLoading = false
    var error: String?

    var agencies: [TransitAgency] { transitService.getAgencies() }
    var railAgencies: [TransitAgency] { transitService.getAgenciesByType(.rail) }
    var ferryAgencies: [TransitAgency] { transitService.getAgenciesByType(.ferry) }
    var busAgencies: [TransitAgency] { transitService.getAgenciesByType(.bus) }

    func loadAlerts(forceRefresh: Bool = false) async {
        isLoading = true
        error = nil

        do {
            let response = try await transitService.fetchAlerts(forceRefresh: forceRefresh)
            alerts = response.alerts
            alertCounts = try await transitService.getAlertCounts()
        } catch {
            self.error = "Unable to load alerts. Pull down to retry."
        }

        isLoading = false
    }

    func alertCount(for agencyId: String) -> Int {
        alertCounts[agencyId] ?? 0
    }

    func agency(for id: String) -> TransitAgency? {
        agencies.first { $0.id == id }
    }
}

// MARK: - Transit View

/// Full Transit view with NavigationStack (use when displayed as a tab)
struct TransitView: View {
    var body: some View {
        NavigationStack {
            TransitViewContent()
        }
    }
}

/// Transit content without NavigationStack (use when pushed onto existing navigation)
struct TransitViewContent: View {
    @State private var viewModel = TransitViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Header
                headerSection

                // Live Alerts Section
                liveAlertsSection

                // Rail Services
                agencySection(
                    title: "Rail Services",
                    icon: "tram.fill",
                    dotColor: .blue,
                    agencies: viewModel.railAgencies
                )

                // Ferry Services
                agencySection(
                    title: "Ferry Services",
                    icon: "ferry.fill",
                    dotColor: .teal,
                    agencies: viewModel.ferryAgencies
                )

                // Bus Services
                agencySection(
                    title: "Bus Services",
                    icon: "bus.fill",
                    dotColor: .green,
                    agencies: viewModel.busAgencies
                )

                // Clipper Card Info
                clipperCardSection

                Spacer(minLength: 32)
            }
            .padding()
        }
        .navigationTitle("Transit")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.large)
        #endif
        .refreshable {
            await viewModel.loadAlerts(forceRefresh: true)
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    Task {
                        await viewModel.loadAlerts(forceRefresh: true)
                    }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .disabled(viewModel.isLoading)
            }
        }
        .task {
            await viewModel.loadAlerts()
        }
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Bay Area Transit")
                .font(.title2.bold())

            Text("Live service alerts and information for \(viewModel.agencies.count) Bay Area transit agencies.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Live Alerts Section

    private var liveAlertsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Section header with status indicator
            HStack {
                if viewModel.isLoading {
                    ProgressView()
                        .scaleEffect(0.8)
                        .frame(width: 12, height: 12)
                } else {
                    Circle()
                        .fill(viewModel.alerts.isEmpty ? Color.green : Color.orange)
                        .frame(width: 12, height: 12)
                }

                Text("Live Service Alerts")
                    .font(.headline)

                Spacer()

                if !viewModel.alerts.isEmpty {
                    Text("\(viewModel.alerts.count) active")
                        .font(.caption.weight(.semibold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.orange.opacity(0.15))
                        .foregroundStyle(.orange)
                        .clipShape(Capsule())
                }
            }

            // Content
            if viewModel.isLoading && viewModel.alerts.isEmpty {
                loadingState
            } else if let error = viewModel.error, viewModel.alerts.isEmpty {
                errorState(error)
            } else if viewModel.alerts.isEmpty {
                emptyState
            } else {
                alertsList
            }

            // Data source attribution
            Text("Data from 511.org. Alerts refresh every 5 minutes.")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 8)
    }

    private var loadingState: some View {
        HStack {
            Spacer()
            ProgressView()
                .padding(24)
            Spacer()
        }
    }

    private func errorState(_ message: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.red)

            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Spacer()
        }
        .padding()
        .background(Color.red.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var emptyState: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(.green)
                .font(.title3)

            Text("No active service alerts. All systems normal.")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Spacer()
        }
        .padding()
        .background(Color.green.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var alertsList: some View {
        VStack(spacing: 8) {
            ForEach(Array(viewModel.alerts.prefix(5))) { alert in
                AlertCard(alert: alert, viewModel: viewModel)
            }

            // View all link
            if viewModel.alerts.count > 5 {
                Link(destination: URL(string: "https://511.org/transit/alerts")!) {
                    HStack {
                        Image(systemName: "arrow.up.right.square")
                        Text("View all \(viewModel.alerts.count) alerts on 511.org")
                    }
                    .font(.subheadline)
                }
                .padding(.top, 4)
            }
        }
    }

    // MARK: - Agency Section

    private func agencySection(
        title: String,
        icon: String,
        dotColor: Color,
        agencies: [TransitAgency]
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader(title: title, dotColor: dotColor)

            ForEach(agencies) { agency in
                AgencyCard(agency: agency, alertCount: viewModel.alertCount(for: agency.id))
            }
        }
    }

    private func sectionHeader(title: String, dotColor: Color) -> some View {
        HStack(spacing: 8) {
            Circle()
                .fill(dotColor)
                .frame(width: 8, height: 8)

            Text(title)
                .font(.headline)
        }
        .padding(.top, 8)
    }

    // MARK: - Clipper Card Section

    private var clipperCardSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "creditcard.fill")
                    .foregroundStyle(Color.appPrimary)

                Text("Clipper Card")
                    .font(.headline)
            }

            Text("Use one card for all Bay Area transit. Available at Walgreens, Whole Foods, and transit stations.")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Link(destination: URL(string: "https://www.clippercard.com")!) {
                HStack {
                    Image(systemName: "arrow.up.right.square")
                    Text("Get Clipper Card")
                }
                .font(.subheadline.weight(.medium))
            }
            .buttonStyle(.bordered)
            .tint(.appPrimary)
        }
        .padding()
        #if os(iOS)
        .background(.regularMaterial)
        #elseif os(macOS)
        .background(Color(nsColor: .windowBackgroundColor))
        #else
        .background(Color.primary.opacity(0.05))
        #endif
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .padding(.top, 8)
    }
}

// MARK: - Alert Card

private struct AlertCard: View {
    let alert: TransitAlert
    let viewModel: TransitViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Agency badges
            HStack(spacing: 6) {
                ForEach(alert.agencies, id: \.self) { agencyId in
                    if let agency = viewModel.agency(for: agencyId) {
                        AgencyBadge(agency: agency)
                    }
                }
            }

            // Alert title
            Text(alert.title)
                .font(.subheadline)
                .lineLimit(3)

            // Time ago
            if !alert.timeAgo.isEmpty {
                Text(alert.timeAgo)
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(severityBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(severityBorderColor, lineWidth: 1)
        )
        .contentShape(Rectangle())
        .onTapGesture {
            if let url = alert.url {
                openURL(url)
            }
        }
    }

    private var severityBackground: Color {
        switch alert.severity {
        case .severe:
            return Color.red.opacity(0.08)
        case .moderate:
            return Color.orange.opacity(0.08)
        case .minor:
            return Color.yellow.opacity(0.08)
        case .info:
            #if os(iOS)
            return Color(.secondarySystemBackground)
            #elseif os(macOS)
            return Color(nsColor: .controlBackgroundColor)
            #else
            return Color.secondary.opacity(0.1)
            #endif
        }
    }

    private var severityBorderColor: Color {
        switch alert.severity {
        case .severe:
            return Color.red.opacity(0.3)
        case .moderate:
            return Color.orange.opacity(0.3)
        case .minor:
            return Color.yellow.opacity(0.3)
        case .info:
            return Color.clear
        }
    }

    private func openURL(_ url: URL) {
        #if os(iOS) || os(visionOS)
        UIApplication.shared.open(url)
        #elseif os(macOS)
        NSWorkspace.shared.open(url)
        #endif
    }
}

// MARK: - Agency Badge

private struct AgencyBadge: View {
    let agency: TransitAgency

    var body: some View {
        Text(agency.name)
            .font(.caption2.weight(.semibold))
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(agencyColor.opacity(0.15))
            .foregroundStyle(agencyColor)
            .clipShape(RoundedRectangle(cornerRadius: 4))
    }

    private var agencyColor: Color {
        Color(hex: agency.color)
    }
}

// MARK: - Agency Card

private struct AgencyCard: View {
    let agency: TransitAgency
    let alertCount: Int

    var body: some View {
        HStack(spacing: 12) {
            // Color indicator
            Circle()
                .fill(agencyColor)
                .frame(width: 16, height: 16)

            // Agency info
            VStack(alignment: .leading, spacing: 2) {
                Text(agency.name)
                    .font(.subheadline.weight(.semibold))

                Text("\(formattedStationCount) \(agency.stationLabel)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            // Alert badge
            if alertCount > 0 {
                HStack(spacing: 4) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.caption2)
                    Text("\(alertCount)")
                        .font(.caption.weight(.semibold))
                }
                .foregroundStyle(.orange)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.orange.opacity(0.15))
                .clipShape(Capsule())
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding()
        #if os(iOS)
        .background(.regularMaterial)
        #elseif os(macOS)
        .background(Color(nsColor: .windowBackgroundColor))
        #else
        .background(Color.primary.opacity(0.05))
        #endif
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .contentShape(Rectangle())
        .onTapGesture {
            if let url = agency.websiteURL {
                openURL(url)
            }
        }
        #if os(visionOS)
        .hoverEffect(.highlight)
        #endif
    }

    private var agencyColor: Color {
        Color(hex: agency.color)
    }

    private var formattedStationCount: String {
        if agency.stations >= 1000 {
            return String(format: "%.1fk", Double(agency.stations) / 1000)
        }
        return "\(agency.stations)"
    }

    private func openURL(_ url: URL) {
        #if os(iOS) || os(visionOS)
        UIApplication.shared.open(url)
        #elseif os(macOS)
        NSWorkspace.shared.open(url)
        #endif
    }
}


// MARK: - Preview

#Preview {
    TransitView()
}
