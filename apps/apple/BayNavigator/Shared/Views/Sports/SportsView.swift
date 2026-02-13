import SwiftUI
import BayNavigatorCore

// MARK: - Sports Data Models

struct SportsData: Codable {
    let generated: String
    let teams: [String: TeamData]
    let todaysGames: [TodaysGame]
}

struct TeamData: Codable {
    let name: String
    let sport: String
    let themeId: String
    let season: Int
    let record: TeamRecord
    let standings: [String: AnyCodable]
    let streak: String?
    let nextGame: GameInfo?
    let lastGame: GameInfo?
    let recentResults: [String]
    let isPlayoffs: Bool
    let excitement: String?

    var standingSummary: String {
        if let summary = standings["summary"]?.value as? String {
            return summary
        }
        if let rank = standings["divisionRank"]?.value as? Int {
            return "Division Rank: \(rank)"
        }
        return ""
    }

    var seedOrRank: String {
        if let seed = standings["seed"]?.value as? Int {
            return "#\(seed) Seed"
        }
        if let rank = standings["divisionRank"]?.value as? Int {
            return "#\(rank) in Division"
        }
        return ""
    }
}

struct TeamRecord: Codable {
    let wins: Int
    let losses: Int
}

struct GameInfo: Codable {
    let date: String
    let opponent: String
    let home: Bool
    let time: String?
    let result: String?
}

struct TodaysGame: Codable, Identifiable {
    let team: String
    let opponent: String
    let time: String
    let status: String
    let home: Bool

    var id: String { "\(team)-\(opponent)-\(time)" }
}

/// Flexible Codable wrapper for mixed-type JSON values
struct AnyCodable: Codable {
    let value: Any

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let intVal = try? container.decode(Int.self) {
            value = intVal
        } else if let doubleVal = try? container.decode(Double.self) {
            value = doubleVal
        } else if let stringVal = try? container.decode(String.self) {
            value = stringVal
        } else if let boolVal = try? container.decode(Bool.self) {
            value = boolVal
        } else if container.decodeNil() {
            value = NSNull()
        } else {
            value = ""
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let intVal = value as? Int {
            try container.encode(intVal)
        } else if let doubleVal = value as? Double {
            try container.encode(doubleVal)
        } else if let stringVal = value as? String {
            try container.encode(stringVal)
        } else if let boolVal = value as? Bool {
            try container.encode(boolVal)
        } else {
            try container.encodeNil()
        }
    }
}

// MARK: - Sports View Model

@MainActor
@Observable
final class SportsViewModel {
    private static let dataURL = "https://baynavigator.org/data/sports-data.json"

    var data: SportsData?
    var isLoading = false
    var error: String?

    static let teamOrder = ["warriors", "giants", "49ers"]

    func loadData() async {
        isLoading = true
        error = nil

        do {
            guard let url = URL(string: Self.dataURL) else { return }
            var request = URLRequest(url: url)
            request.timeoutInterval = 10
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }
            self.data = try JSONDecoder().decode(SportsData.self, from: data)
        } catch {
            self.error = "Unable to load sports data. Pull down to retry."
        }

        isLoading = false
    }

    var orderedTeams: [(id: String, team: TeamData)] {
        Self.teamOrder.compactMap { id in
            guard let team = data?.teams[id] else { return nil }
            return (id: id, team: team)
        }
    }
}

// MARK: - Sports View

struct SportsView: View {
    var body: some View {
        NavigationStack {
            SportsViewContent()
        }
    }
}

struct SportsViewContent: View {
    @State private var viewModel = SportsViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                headerSection
                todaysGamesBanner
                teamCards
                attributionSection
                Spacer(minLength: 32)
            }
            .padding()
        }
        .navigationTitle("Sports")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.large)
        #endif
        .refreshable {
            await viewModel.loadData()
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    Task { await viewModel.loadData() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .disabled(viewModel.isLoading)
            }
        }
        .task {
            await viewModel.loadData()
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Bay Area Sports")
                .font(.title2.bold())

            Text("Live scores, standings, and schedules for \(viewModel.data?.teams.count ?? 3) Bay Area pro teams. Data updates every 3 hours.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Today's Games Banner

    @ViewBuilder
    private var todaysGamesBanner: some View {
        if let games = viewModel.data?.todaysGames, !games.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    Circle()
                        .fill(.green)
                        .frame(width: 10, height: 10)
                    Text("Today's Games")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.green)
                }

                ForEach(games) { game in
                    let teamName = viewModel.data?.teams[game.team]?.name ?? game.team
                    let homeAway = game.home ? "vs" : "@"
                    Text("\(teamName) \(homeAway) \(game.opponent) — \(game.time)")
                        .font(.subheadline)
                        .foregroundStyle(Color.green.opacity(0.8))
                }
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.green.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(Color.green.opacity(0.3), lineWidth: 1)
            )
        }
    }

    // MARK: - Team Cards

    @ViewBuilder
    private var teamCards: some View {
        if viewModel.isLoading && viewModel.data == nil {
            HStack {
                Spacer()
                ProgressView()
                    .padding(48)
                Spacer()
            }
        } else if let error = viewModel.error, viewModel.data == nil {
            HStack(spacing: 12) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(.red)
                Text(error)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Spacer()
            }
            .padding()
            .background(Color.red.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        } else {
            ForEach(viewModel.orderedTeams, id: \.id) { entry in
                TeamCard(teamId: entry.id, team: entry.team)
            }
        }
    }

    // MARK: - Attribution

    @ViewBuilder
    private var attributionSection: some View {
        if let data = viewModel.data {
            VStack(alignment: .leading, spacing: 4) {
                Text("Last updated: \(formatDate(data.generated))")
                    .font(.caption)
                    .foregroundStyle(.tertiary)

                Text("Data from ESPN and MLB Stats API. Updated every 3 hours.")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
    }

    private func formatDate(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: iso) else { return iso }
        let display = DateFormatter()
        display.dateStyle = .medium
        display.timeStyle = .short
        return display.string(from: date)
    }
}

// MARK: - Team Card

private struct TeamCard: View {
    let teamId: String
    let team: TeamData

    private var teamColor: Color {
        switch teamId {
        case "warriors": return Color(red: 0.11, green: 0.26, blue: 0.54)
        case "giants": return Color(red: 0.92, green: 0.36, blue: 0.12)
        case "49ers": return Color(red: 0.67, green: 0, blue: 0)
        default: return .blue
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header row
            HStack {
                Text(team.name)
                    .font(.headline)

                Spacer()

                // Sport badge
                Text(team.sport)
                    .font(.caption2.weight(.bold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(teamColor)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 6))

                if team.isPlayoffs {
                    Text("PLAYOFFS")
                        .font(.caption2.weight(.bold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(.yellow)
                        .foregroundStyle(.black)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                }
            }

            // Stats grid
            HStack(spacing: 8) {
                StatBox(
                    label: "Record",
                    value: "\(team.record.wins)-\(team.record.losses)",
                    accent: teamColor
                )
                StatBox(
                    label: "Standings",
                    value: team.seedOrRank.isEmpty ? "—" : team.seedOrRank,
                    accent: teamColor
                )
                StatBox(
                    label: "Streak",
                    value: team.streak ?? "—",
                    accent: teamColor
                )

                // Last 10
                VStack(alignment: .leading, spacing: 4) {
                    Text("Last 10")
                        .font(.caption2)
                        .foregroundStyle(.secondary)

                    HStack(spacing: 2) {
                        ForEach(Array(team.recentResults.prefix(10).enumerated()), id: \.offset) { _, result in
                            Circle()
                                .fill(result == "W" ? Color.green : Color.red.opacity(0.7))
                                .frame(width: 10, height: 10)
                        }
                    }
                }
            }

            // Next / Last game
            HStack(spacing: 8) {
                GameInfoCard(
                    title: "Next Game",
                    icon: "calendar",
                    game: team.nextGame,
                    accent: teamColor,
                    showResult: false
                )
                GameInfoCard(
                    title: "Last Game",
                    icon: "clock",
                    game: team.lastGame,
                    accent: teamColor,
                    showResult: true
                )
            }
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
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .strokeBorder(teamColor.opacity(0.2), lineWidth: 1)
        )
    }
}

// MARK: - Stat Box

private struct StatBox: View {
    let label: String
    let value: String
    let accent: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)

            Text(value)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(accent)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(8)
        .background(accent.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

// MARK: - Game Info Card

private struct GameInfoCard: View {
    let title: String
    let icon: String
    let game: GameInfo?
    let accent: Color
    let showResult: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption2)
                    .foregroundStyle(accent)
                Text(title)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }

            if let game = game {
                Text(game.date)
                    .font(.caption)
                    .foregroundStyle(.tertiary)

                if showResult, let result = game.result {
                    Text(result)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(result.hasPrefix("W") ? .green : .red)
                } else if let time = game.time {
                    Text(time)
                        .font(.caption.weight(.semibold))
                }

                Text("\(game.home ? "vs" : "@") \(game.opponent)")
                    .font(.caption)
                    .lineLimit(1)
            } else {
                Text("No scheduled games")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .italic()
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        #if os(iOS)
        .background(Color(.secondarySystemBackground))
        #elseif os(macOS)
        .background(Color(nsColor: .controlBackgroundColor))
        #else
        .background(Color.secondary.opacity(0.1))
        #endif
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

// MARK: - Preview

#Preview {
    SportsView()
}
