import SwiftUI
import BayNavigatorCore

struct ProgramCard: View {
    let program: Program
    @Environment(ProgramsViewModel.self) private var programsVM
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityDifferentiateWithoutColor) private var differentiateWithoutColor

    private var isFavorite: Bool {
        programsVM.isFavorite(program.id)
    }

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            // Category icon
            Circle()
                .fill(Color.categoryColor(for: program.category).gradient)
                .frame(width: 48, height: 48)
                .overlay {
                    Image(systemName: categoryIcon)
                        .font(.title3)
                        .foregroundStyle(.white)
                }
                .accessibilityHidden(true) // Decorative - category is announced in card label

            // Content
            VStack(alignment: .leading, spacing: 6) {
                // Title
                Text(program.name)
                    .font(.headline)
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                    .accessibilityAddTraits(.isHeader)

                // Location
                HStack(spacing: 4) {
                    Image(systemName: "mappin.circle.fill")
                        .font(.caption)
                        .accessibilityHidden(true)
                    Text(program.locationText)
                        .font(.caption)
                }
                .foregroundStyle(.secondary)
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Location: \(program.locationText)")

                // Description
                Text(program.description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)

                // Tags
                HStack(spacing: 8) {
                    // Category tag - with icon for differentiate without color
                    HStack(spacing: 4) {
                        if differentiateWithoutColor {
                            Image(systemName: categoryIcon)
                                .font(.caption2)
                        }
                        Text(program.category)
                            .font(.caption2)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.categoryColor(for: program.category).opacity(0.15))
                    .foregroundStyle(Color.categoryColor(for: program.category))
                    .clipShape(Capsule())
                    .accessibilityLabel("Category: \(program.category)")

                    // Source badge for external data
                    if program.dataSource != .bayNavigator {
                        HStack(spacing: 4) {
                            Image(systemName: sourceIcon)
                                .font(.caption2)
                            Text(program.dataSource.displayName)
                                .font(.caption2)
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(sourceColor.opacity(0.15))
                        .foregroundStyle(sourceColor)
                        .clipShape(Capsule())
                        .accessibilityLabel("Source: \(program.dataSource.displayName)")
                    }

                    // Distance if available
                    if let distance = program.distanceFromUser {
                        HStack(spacing: 4) {
                            if differentiateWithoutColor {
                                Image(systemName: "location.fill")
                                    .font(.caption2)
                            }
                            Text(LocationService.formatDistance(distance))
                                .font(.caption2)
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.appInfo.opacity(0.15))
                        .foregroundStyle(Color.appInfo)
                        .clipShape(Capsule())
                        .accessibilityLabel("Distance: \(LocationService.formatDistance(distance))")
                    }
                }
                .accessibilityElement(children: .combine)
            }

            Spacer()

            // Favorite button
            Button {
                if reduceMotion {
                    programsVM.toggleFavorite(program.id)
                } else {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        programsVM.toggleFavorite(program.id)
                    }
                }
                // Announce state change to VoiceOver
                Task { @MainActor in
                    AccessibilityService.shared.announceSaveAction(
                        isSaved: programsVM.isFavorite(program.id),
                        programName: program.name
                    )
                }
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: isFavorite ? "bookmark.fill" : "bookmark")
                        .font(.title3)
                        .foregroundStyle(isFavorite ? Color.appAccent : Color.secondary)
                        .modifier(SymbolEffectModifier(trigger: isFavorite, reduceMotion: reduceMotion))

                    // Text label for differentiate without color
                    if differentiateWithoutColor {
                        Text(isFavorite ? "Saved" : "Save")
                            .font(.caption2)
                            .foregroundStyle(isFavorite ? Color.appAccent : Color.secondary)
                    }
                }
            }
            .buttonStyle(.plain)
            .accessibilityLabel(isFavorite ? SemanticLabels.programSaved(program.name) : SemanticLabels.programNotSaved(program.name))
            .accessibilityHint(isFavorite ? SemanticLabels.unsaveProgram(program.name) : SemanticLabels.saveProgram(program.name))
            .accessibilityAddTraits(.isButton)
        }
        .padding()
        #if os(iOS)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        #else
        .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 16))
        #endif
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
        #if os(visionOS)
        .hoverEffect(.highlight)
        #endif
        // Card-level accessibility
        .accessibilityElement(children: .contain)
        .accessibilityLabel(cardAccessibilityLabel)
        .accessibilityHint("Double tap to view details")
    }

    // MARK: - Accessibility

    private var cardAccessibilityLabel: String {
        var label = "\(program.name), \(program.category) program"
        label += ", located in \(program.locationText)"
        if let distance = program.distanceFromUser {
            label += ", \(LocationService.formatDistance(distance)) away"
        }
        if isFavorite {
            label += ", saved"
        }
        return label
    }

    private var sourceIcon: String {
        switch program.dataSource {
        case .bayNavigator: return "safari"
        case .ohana: return "building.2"
        case .dataSF: return "building.columns"
        case .oneDegree: return "circle.hexagongrid"
        }
    }

    private var sourceColor: Color {
        switch program.dataSource {
        case .bayNavigator: return .accentColor
        case .ohana: return .green
        case .dataSF: return .blue
        case .oneDegree: return .purple
        }
    }

    private var categoryIcon: String {
        switch program.category.lowercased() {
        case "food", "food assistance": return "fork.knife"
        case "health", "healthcare": return "heart.fill"
        case "housing", "shelter": return "house.fill"
        case "transportation", "transit": return "bus.fill"
        case "education", "learning": return "graduationcap.fill"
        case "employment", "jobs": return "briefcase.fill"
        case "utilities", "utility programs": return "bolt.fill"
        case "legal", "legal aid": return "building.columns.fill"
        case "technology", "tech": return "wifi"
        case "recreation": return "figure.run"
        case "community", "community services": return "person.3.fill"
        case "finance", "financial assistance": return "dollarsign.circle.fill"
        case "childcare": return "figure.2.and.child.holdinghands"
        default: return "star.fill"
        }
    }
}

// MARK: - Symbol Effect Modifier (Reduce Motion Aware)

private struct SymbolEffectModifier: ViewModifier {
    let trigger: Bool
    let reduceMotion: Bool

    func body(content: Content) -> some View {
        if reduceMotion {
            content
        } else {
            content.symbolEffect(.bounce, value: trigger)
        }
    }
}

#Preview {
    VStack {
        ProgramCard(program: Program(
            id: "test",
            name: "CalFresh Food Assistance",
            category: "Food",
            description: "Monthly food benefits for low-income individuals and families.",
            groups: ["low-income", "families"],
            areas: ["Bay Area"],
            city: "San Francisco",
            website: "https://example.com",
            cost: "Free",
            phone: "(555) 123-4567",
            lastUpdated: "2024-01-15",
            latitude: 37.7749,
            longitude: -122.4194
        ))
    }
    .padding()
    .environment(ProgramsViewModel())
}
