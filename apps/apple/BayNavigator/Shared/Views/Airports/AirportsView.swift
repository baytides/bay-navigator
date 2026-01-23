import SwiftUI
import BayNavigatorCore

// MARK: - Airport Model

struct Airport: Identifiable {
    let id: String
    let name: String
    let code: String
    let city: String
    let description: String
    let websiteURL: URL?
    let flightStatusURL: URL?
    let parkingURL: URL?
    let transitInfo: String
    let color: Color
}

// MARK: - Airports View

/// Full Airports view with NavigationStack (use when displayed as a tab)
struct AirportsView: View {
    var body: some View {
        NavigationStack {
            AirportsViewContent()
        }
    }
}

/// Airports content without NavigationStack (use when pushed onto existing navigation)
struct AirportsViewContent: View {
    private let airports: [Airport] = [
        Airport(
            id: "sfo",
            name: "San Francisco International Airport",
            code: "SFO",
            city: "San Francisco",
            description: "The largest airport in the Bay Area, serving as a major hub for international and domestic flights.",
            websiteURL: URL(string: "https://www.flysfo.com"),
            flightStatusURL: URL(string: "https://www.flysfo.com/flight-info/flight-status"),
            parkingURL: URL(string: "https://www.flysfo.com/to-from/parking"),
            transitInfo: "BART connects directly to the airport. Caltrain + SamTrans route 398 also available.",
            color: .blue
        ),
        Airport(
            id: "oak",
            name: "Oakland International Airport",
            code: "OAK",
            city: "Oakland",
            description: "A popular alternative to SFO with lower fares and shorter security lines.",
            websiteURL: URL(string: "https://www.oaklandairport.com"),
            flightStatusURL: URL(string: "https://www.oaklandairport.com/flights"),
            parkingURL: URL(string: "https://www.oaklandairport.com/parking"),
            transitInfo: "BART connects via the Oakland Airport Connector automated people mover.",
            color: .green
        ),
        Airport(
            id: "sjc",
            name: "San José Mineta International Airport",
            code: "SJC",
            city: "San José",
            description: "The primary airport for Silicon Valley, convenient for South Bay travelers.",
            websiteURL: URL(string: "https://www.flysanjose.com"),
            flightStatusURL: URL(string: "https://www.flysanjose.com/flights"),
            parkingURL: URL(string: "https://www.flysanjose.com/parking"),
            transitInfo: "VTA buses and free Airport Flyer shuttle from Metro/Airport light rail station.",
            color: .purple
        )
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Header
                headerSection

                // Airport Cards
                ForEach(airports) { airport in
                    AirportCard(airport: airport)
                }

                // Tips Section
                tipsSection

                Spacer(minLength: 32)
            }
            .padding()
        }
        .navigationTitle("Airports")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.large)
        #endif
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Bay Area Airports")
                .font(.title2.bold())

            Text("Three major airports serve the San Francisco Bay Area, all connected by public transit.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Tips Section

    private var tipsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "lightbulb.fill")
                    .foregroundStyle(.yellow)

                Text("Travel Tips")
                    .font(.headline)
            }

            VStack(alignment: .leading, spacing: 8) {
                tipRow(icon: "clock", text: "Arrive 2+ hours early for domestic, 3+ for international flights")
                tipRow(icon: "tram.fill", text: "BART connects to SFO and OAK - avoid traffic and parking fees")
                tipRow(icon: "tag", text: "OAK often has lower fares and shorter security lines")
                tipRow(icon: "car", text: "Compare parking rates - off-site lots can save 50%+")
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
        .padding(.top, 8)
    }

    private func tipRow(icon: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(width: 16)

            Text(text)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Airport Card

private struct AirportCard: View {
    let airport: Airport

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header with code badge
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(airport.name)
                        .font(.headline)

                    Text(airport.city)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Text(airport.code)
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(airport.color)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }

            // Description
            Text(airport.description)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            // Transit info
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: "tram")
                    .foregroundStyle(airport.color)

                Text(airport.transitInfo)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(airport.color.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 8))

            // Action buttons
            HStack(spacing: 12) {
                if let url = airport.websiteURL {
                    LinkButton(title: "Website", icon: "globe", url: url)
                }

                if let url = airport.flightStatusURL {
                    LinkButton(title: "Flights", icon: "airplane.departure", url: url)
                }

                if let url = airport.parkingURL {
                    LinkButton(title: "Parking", icon: "car", url: url)
                }
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
    }
}

// MARK: - Link Button

private struct LinkButton: View {
    let title: String
    let icon: String
    let url: URL

    var body: some View {
        Link(destination: url) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                Text(title)
                    .font(.caption.weight(.medium))
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color.appPrimary.opacity(0.1))
            .foregroundStyle(Color.appPrimary)
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }
}

// MARK: - Preview

#Preview {
    AirportsView()
}
