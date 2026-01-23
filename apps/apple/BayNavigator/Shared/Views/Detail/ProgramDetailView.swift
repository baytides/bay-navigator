import SwiftUI
import BayNavigatorCore

struct ProgramDetailView: View {
    let program: Program
    @Environment(ProgramsViewModel.self) private var programsVM
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

    @State private var showShareSheet = false

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Hero header
                heroHeader

                VStack(spacing: 24) {
                    // Quick actions
                    quickActionsGrid

                    // What They Offer section
                    if !program.offerItems.isEmpty {
                        whatTheyOfferSection
                    }

                    // How to Get It section
                    if !program.howToSteps.isEmpty {
                        howToGetItSection
                    }

                    // Info cards
                    infoCardsGrid

                    // Contact section
                    contactSection

                    // Last updated
                    lastUpdatedBadge
                }
                .padding()
            }
        }
        .navigationTitle(program.name)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 12) {
                    Button {
                        showShareSheet = true
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                    }

                    Button {
                        withAnimation {
                            programsVM.toggleFavorite(program.id)
                        }
                    } label: {
                        Image(systemName: programsVM.isFavorite(program.id) ? "bookmark.fill" : "bookmark")
                            .foregroundStyle(programsVM.isFavorite(program.id) ? Color.appAccent : Color.primary)
                    }
                }
            }
        }
        .sheet(isPresented: $showShareSheet) {
            ShareSheet(items: [shareText])
        }
        #endif
        #if os(visionOS)
        .ornament(attachmentAnchor: .scene(.trailing)) {
            quickActionsOrnament
        }
        #endif
    }

    // MARK: - Hero Header

    private var heroHeader: some View {
        ZStack(alignment: .bottomLeading) {
            // Gradient background
            LinearGradient(
                colors: [
                    Color.categoryColor(for: program.category),
                    Color.categoryColor(for: program.category).opacity(0.7)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .frame(height: 200)

            // Content overlay
            VStack(alignment: .leading, spacing: 8) {
                // Category badge
                Text(program.category.uppercased())
                    .font(.caption.bold())
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(.white.opacity(0.25))
                    .foregroundStyle(.white)
                    .clipShape(Capsule())

                // Program name
                Text(program.name)
                    .font(.title.bold())
                    .foregroundStyle(.white)

                // Location
                HStack(spacing: 4) {
                    Image(systemName: "mappin.circle.fill")
                    Text(program.locationText)
                }
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.9))
            }
            .padding()
            .padding(.bottom, 8)
        }
    }

    // MARK: - Quick Actions Grid

    private var quickActionsGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible()),
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 12) {
            if let phone = program.phone {
                QuickActionButton(icon: "phone.fill", title: "Call", color: .appSuccess) {
                    if let url = URL(string: "tel:\(phone.replacingOccurrences(of: " ", with: ""))") {
                        openURL(url)
                    }
                }
            }

            if let email = program.email {
                QuickActionButton(icon: "envelope.fill", title: "Email", color: .appInfo) {
                    if let url = URL(string: "mailto:\(email)") {
                        openURL(url)
                    }
                }
            }

            if let website = program.website, let url = URL(string: website) {
                QuickActionButton(icon: "globe", title: "Website", color: .appPrimary) {
                    openURL(url)
                }
            }

            if let address = program.address {
                QuickActionButton(icon: "map.fill", title: "Directions", color: .appAccent) {
                    let query = address.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
                    if let url = URL(string: "maps://?q=\(query)") {
                        openURL(url)
                    }
                }
            }
        }
    }

    // MARK: - What They Offer Section

    private var whatTheyOfferSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("What They Offer", systemImage: "gift.fill")
                .font(.headline)
                .foregroundStyle(Color.appPrimary)

            VStack(alignment: .leading, spacing: 8) {
                ForEach(program.offerItems, id: \.self) { item in
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(Color.appSuccess)
                            .font(.body)

                        Text(item)
                            .font(.body)
                    }
                }
            }
            .padding()
            #if os(iOS)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #elseif os(macOS)
            .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 12))
            #else
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #endif
        }
    }

    // MARK: - How to Get It Section

    private var howToGetItSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("How to Get It", systemImage: "list.number")
                .font(.headline)
                .foregroundStyle(Color.appPrimary)

            VStack(alignment: .leading, spacing: 12) {
                ForEach(Array(program.howToSteps.enumerated()), id: \.offset) { index, step in
                    HStack(alignment: .top, spacing: 12) {
                        Text("\(index + 1)")
                            .font(.caption.bold())
                            .frame(width: 24, height: 24)
                            .background(Color.appPrimary)
                            .foregroundStyle(.white)
                            .clipShape(Circle())

                        Text(step)
                            .font(.body)
                    }
                }
            }
            .padding()
            #if os(iOS)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #elseif os(macOS)
            .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 12))
            #else
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #endif
        }
    }

    // MARK: - Info Cards Grid

    private var infoCardsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            // Who It's For
            if !program.groups.isEmpty {
                InfoCard(
                    icon: "person.2.fill",
                    title: "Who It's For",
                    content: program.groups.joined(separator: ", ")
                )
            }

            // Service Areas
            InfoCard(
                icon: "map.fill",
                title: "Service Areas",
                content: program.areas.joined(separator: ", ")
            )

            // Cost
            if let cost = program.cost {
                InfoCard(
                    icon: "dollarsign.circle.fill",
                    title: "Cost",
                    content: cost
                )
            }

            // Requirements
            if let requirements = program.requirements {
                InfoCard(
                    icon: "checklist",
                    title: "Requirements",
                    content: requirements
                )
            }
        }
    }

    // MARK: - Contact Section

    private var contactSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Contact Information", systemImage: "person.crop.circle.fill")
                .font(.headline)
                .foregroundStyle(Color.appPrimary)

            VStack(alignment: .leading, spacing: 8) {
                if let phone = program.phone {
                    contactRow(icon: "phone.fill", text: phone, color: .appSuccess)
                }
                if let email = program.email {
                    contactRow(icon: "envelope.fill", text: email, color: .appInfo)
                }
                if let address = program.address {
                    contactRow(icon: "mappin.circle.fill", text: address, color: .appAccent)
                }
                if let website = program.website {
                    contactRow(icon: "globe", text: website, color: .appPrimary)
                }
            }
            .padding()
            #if os(iOS)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #elseif os(macOS)
            .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 12))
            #else
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #endif
        }
    }

    private func contactRow(icon: String, text: String, color: Color) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .frame(width: 24)

            Text(text)
                .font(.subheadline)
                .foregroundStyle(.primary)

            Spacer()
        }
    }

    // MARK: - Last Updated Badge

    private var lastUpdatedBadge: some View {
        HStack {
            Image(systemName: "clock.arrow.circlepath")
                .foregroundStyle(.secondary)

            Text("Last updated: \(program.formattedLastUpdated)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.top, 8)
    }

    // MARK: - visionOS Ornament

    #if os(visionOS)
    private var quickActionsOrnament: some View {
        VStack(spacing: 16) {
            Button {
                programsVM.toggleFavorite(program.id)
            } label: {
                Image(systemName: programsVM.isFavorite(program.id) ? "bookmark.fill" : "bookmark")
                    .font(.title2)
            }
            .buttonStyle(.plain)

            if let website = program.website, let url = URL(string: website) {
                Button {
                    openURL(url)
                } label: {
                    Image(systemName: "globe")
                        .font(.title2)
                }
                .buttonStyle(.plain)
            }

            Button {
                showShareSheet = true
            } label: {
                Image(systemName: "square.and.arrow.up")
                    .font(.title2)
            }
            .buttonStyle(.plain)
        }
        .padding()
        .glassBackgroundEffect()
    }
    #endif

    // MARK: - Helper Properties

    private var shareText: String {
        var text = "\(program.name)\n\n\(program.description)"
        if let website = program.website {
            text += "\n\nLearn more: \(website)"
        }
        text += "\n\nFound on Bay Navigator - baynavigator.org"
        return text
    }
}

// MARK: - Quick Action Button

struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(color)

                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            #if os(iOS)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #elseif os(macOS)
            .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 12))
            #else
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #endif
        }
        .buttonStyle(.plain)
        #if os(visionOS)
        .hoverEffect(.highlight)
        #endif
    }
}

// MARK: - Info Card

struct InfoCard: View {
    let icon: String
    let title: String
    let content: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .foregroundStyle(Color.appPrimary)

                Text(title)
                    .font(.caption.bold())
                    .foregroundStyle(.secondary)
            }

            Text(content)
                .font(.subheadline)
                .lineLimit(3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        #if os(iOS)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        #elseif os(macOS)
        .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 12))
        #else
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        #endif
    }
}

// MARK: - Share Sheet (iOS)

#if os(iOS)
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
#endif
