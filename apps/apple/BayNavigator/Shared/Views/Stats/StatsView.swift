import SwiftUI

// MARK: - Data Models

private struct CarbonStats: Codable {
    let generated: String
    let period: String
    let dataFreshness: DataFreshness
    let summary: CarbonSummary
    let usage: UsageData
    let emissionsBySource: [String: EmissionSource]
    let comparison: CarbonComparison
    let notes: [String]
}

private struct DataFreshness: Codable {
    let cloudflare: String
    let github: String
    let azure: String
    let ollama: String
}

private struct CarbonSummary: Codable {
    let totalGrossEmissionsKg: String
    let renewableEnergyPercent: Int
    let netEmissionsKg: String
    let greenRating: String
    let carbonNeutral: Bool
}

private struct UsageData: Codable {
    let cdnRequests: Int?
    let cdnBytesTransferred: Int?
    let cdnCacheHitRate: String?
    let aiQueries: Int?
    let aiChatQueries: Int?
    let functionExecutions: Int?
    let ciRuns: Int?
    let ciMinutes: Int?
}

private struct EmissionSource: Codable {
    let grams: String
    let percent: String
    let note: String?
}

private struct CarbonComparison: Codable {
    let equivalentMilesDriven: String
    let equivalentPaperPages: Int
}

// MARK: - View Model

@Observable
private final class StatsViewModel {
    var stats: CarbonStats?
    var isLoading = false
    var error: String?

    private static let dataUrl = "https://baynavigator.org/data/carbon-stats.json"

    func loadStats() async {
        await MainActor.run { isLoading = true; error = nil }
        do {
            guard let url = URL(string: Self.dataUrl) else { return }
            let (data, _) = try await URLSession.shared.data(from: url)
            let decoded = try JSONDecoder().decode(CarbonStats.self, from: data)
            await MainActor.run {
                stats = decoded
                isLoading = false
            }
        } catch {
            await MainActor.run {
                self.error = "Failed to load stats"
                isLoading = false
            }
        }
    }

    static func formatNumber(_ value: Int?) -> String {
        guard let value else { return "--" }
        if value >= 1_000_000 {
            return String(format: "%.1fM", Double(value) / 1_000_000)
        }
        if value >= 1000 {
            return String(format: "%.1fK", Double(value) / 1000)
        }
        return "\(value)"
    }
}

// MARK: - StatsView (with NavigationStack for iOS tab)

struct StatsView: View {
    var body: some View {
        NavigationStack {
            StatsViewContent()
        }
    }
}

// MARK: - StatsViewContent (for macOS detail pane)

struct StatsViewContent: View {
    @State private var viewModel = StatsViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView("Loading stats...")
            } else if let error = viewModel.error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 48))
                        .foregroundStyle(.secondary)
                    Text(error)
                    Button("Retry") {
                        Task { await viewModel.loadStats() }
                    }
                    .buttonStyle(.borderedProminent)
                }
            } else if let stats = viewModel.stats {
                statsContent(stats)
            }
        }
        .navigationTitle("Sustainability")
        .toolbar {
            ToolbarItem(placement: .automatic) {
                Button {
                    Task { await viewModel.loadStats() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .help("Refresh")
            }
        }
        .task {
            await viewModel.loadStats()
        }
    }

    @ViewBuilder
    private func statsContent(_ stats: CarbonStats) -> some View {
        ScrollView {
            VStack(spacing: 24) {
                // Green badge
                if stats.summary.carbonNeutral {
                    carbonNeutralBadge(stats)
                }

                // Usage stats
                sectionHeader("Usage (Last 30 Days)")
                usageGrid(stats)

                // Carbon summary
                sectionHeader("Carbon Emissions")
                carbonSummary(stats)

                // Emissions breakdown
                sectionHeader("Emissions by Source")
                emissionsBreakdown(stats)

                // Comparison
                sectionHeader("Environmental Comparison")
                comparisonView(stats)

                // Data freshness
                dataFreshnessView(stats)

                // Footer
                Text("Data updated daily. All infrastructure runs on 100% renewable energy.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.bottom, 16)
            }
            .padding()
        }
        .refreshable {
            await viewModel.loadStats()
        }
    }

    // MARK: - Components

    private func sectionHeader(_ title: String) -> some View {
        HStack {
            Text(title)
                .font(.headline)
            Spacer()
        }
    }

    private func carbonNeutralBadge(_ stats: CarbonStats) -> some View {
        HStack {
            Image(systemName: "leaf.fill")
                .font(.title2)
                .foregroundStyle(.green)

            VStack(alignment: .leading, spacing: 2) {
                Text("Carbon Neutral")
                    .font(.headline)
                    .foregroundStyle(.green)
                Text("100% renewable energy powered")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text(stats.summary.greenRating)
                .font(.title2.bold())
                .foregroundStyle(.green)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.green.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.green.opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .strokeBorder(Color.green.opacity(0.2))
                )
        }
    }

    private func usageGrid(_ stats: CarbonStats) -> some View {
        LazyVGrid(columns: [.init(.flexible()), .init(.flexible())], spacing: 12) {
            StatBox(
                icon: "cloud",
                label: "CDN Requests",
                value: StatsViewModel.formatNumber(stats.usage.cdnRequests),
                color: .blue
            )
            StatBox(
                icon: "brain",
                label: "AI Chat Queries",
                value: StatsViewModel.formatNumber(stats.usage.aiChatQueries),
                color: .purple
            )
            StatBox(
                icon: "hammer",
                label: "CI/CD Runs",
                value: StatsViewModel.formatNumber(stats.usage.ciRuns),
                color: .orange
            )
            StatBox(
                icon: "bolt",
                label: "Renewable Energy",
                value: "\(stats.summary.renewableEnergyPercent)%",
                color: .green
            )
        }
    }

    private func carbonSummary(_ stats: CarbonStats) -> some View {
        HStack {
            VStack {
                Text("\(stats.summary.totalGrossEmissionsKg) kg")
                    .font(.title2.bold())
                Text("Gross CO₂e")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)

            Image(systemName: "arrow.right")
                .foregroundStyle(.green)

            VStack {
                Text("\(stats.summary.netEmissionsKg) kg")
                    .font(.title2.bold())
                    .foregroundStyle(.green)
                Text("Net CO₂e")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
        }
        .padding()
        .background {
            #if os(iOS)
            RoundedRectangle(cornerRadius: 12).fill(.regularMaterial)
            #elseif os(macOS)
            RoundedRectangle(cornerRadius: 12).fill(Color(nsColor: .controlBackgroundColor))
            #else
            RoundedRectangle(cornerRadius: 12).fill(.regularMaterial)
            #endif
        }
    }

    private func emissionsBreakdown(_ stats: CarbonStats) -> some View {
        let sources: [(String, String, Color)] = [
            ("CDN", "cdn", .blue),
            ("AI Chat", "aiChat", .purple),
            ("Simple Language", "ai", .teal),
            ("CI/CD", "ci", .orange),
        ]

        return VStack(spacing: 12) {
            ForEach(sources, id: \.0) { label, key, color in
                let source = stats.emissionsBySource[key]
                let percent = Double(source?.percent ?? "0") ?? 0

                HStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(color)
                        .frame(width: 12, height: 12)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(label)
                            .font(.subheadline)

                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(color.opacity(0.1))
                                    .frame(height: 6)

                                RoundedRectangle(cornerRadius: 3)
                                    .fill(color)
                                    .frame(width: geo.size.width * percent / 100, height: 6)
                            }
                        }
                        .frame(height: 6)
                    }

                    Text("\(source?.grams ?? "0")g")
                        .font(.caption.weight(.semibold))
                        .frame(width: 50, alignment: .trailing)
                }
            }
        }
        .padding()
        .background {
            #if os(iOS)
            RoundedRectangle(cornerRadius: 12).fill(.regularMaterial)
            #elseif os(macOS)
            RoundedRectangle(cornerRadius: 12).fill(Color(nsColor: .controlBackgroundColor))
            #else
            RoundedRectangle(cornerRadius: 12).fill(.regularMaterial)
            #endif
        }
    }

    private func comparisonView(_ stats: CarbonStats) -> some View {
        HStack(spacing: 12) {
            VStack(spacing: 8) {
                Image(systemName: "car")
                    .font(.title2)
                    .foregroundStyle(.secondary)
                Text(stats.comparison.equivalentMilesDriven)
                    .font(.title3.bold())
                Text("miles driven")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background {
                #if os(iOS)
                RoundedRectangle(cornerRadius: 12).fill(.regularMaterial)
                #elseif os(macOS)
                RoundedRectangle(cornerRadius: 12).fill(Color(nsColor: .controlBackgroundColor))
                #else
                RoundedRectangle(cornerRadius: 12).fill(.regularMaterial)
                #endif
            }

            VStack(spacing: 8) {
                Image(systemName: "doc.text")
                    .font(.title2)
                    .foregroundStyle(.secondary)
                Text("\(stats.comparison.equivalentPaperPages)")
                    .font(.title3.bold())
                Text("paper pages")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background {
                #if os(iOS)
                RoundedRectangle(cornerRadius: 12).fill(.regularMaterial)
                #elseif os(macOS)
                RoundedRectangle(cornerRadius: 12).fill(Color(nsColor: .controlBackgroundColor))
                #else
                RoundedRectangle(cornerRadius: 12).fill(.regularMaterial)
                #endif
            }
        }
    }

    private func dataFreshnessView(_ stats: CarbonStats) -> some View {
        let sources: [(String, String)] = [
            ("Cloudflare", stats.dataFreshness.cloudflare),
            ("GitHub", stats.dataFreshness.github),
            ("Azure", stats.dataFreshness.azure),
            ("Ollama", stats.dataFreshness.ollama),
        ]

        return VStack(alignment: .leading, spacing: 8) {
            Text("Data Sources")
                .font(.subheadline.weight(.semibold))

            HStack(spacing: 16) {
                ForEach(sources, id: \.0) { name, status in
                    HStack(spacing: 6) {
                        Circle()
                            .fill(status == "live" ? Color.green : Color.gray)
                            .frame(width: 8, height: 8)
                        Text(name)
                            .font(.caption)
                    }
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background {
            #if os(iOS)
            RoundedRectangle(cornerRadius: 12).fill(.regularMaterial)
            #elseif os(macOS)
            RoundedRectangle(cornerRadius: 12).fill(Color(nsColor: .controlBackgroundColor))
            #else
            RoundedRectangle(cornerRadius: 12).fill(.regularMaterial)
            #endif
        }
    }
}

// MARK: - Stat Box

private struct StatBox: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.title3)

            Spacer()

            Text(value)
                .font(.title2.bold())

            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(minHeight: 100)
        .background {
            #if os(iOS)
            RoundedRectangle(cornerRadius: 12).fill(.regularMaterial)
            #elseif os(macOS)
            RoundedRectangle(cornerRadius: 12).fill(Color(nsColor: .controlBackgroundColor))
            #else
            RoundedRectangle(cornerRadius: 12).fill(.regularMaterial)
            #endif
        }
    }
}

#Preview("Stats") {
    StatsView()
}
