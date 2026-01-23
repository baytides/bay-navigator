import SwiftUI
import BayNavigatorCore

/// Full Favorites view with NavigationStack (use when displayed as a tab)
struct FavoritesView: View {
    var body: some View {
        NavigationStack {
            FavoritesViewContent()
        }
    }
}

/// Favorites content without NavigationStack (use when pushed onto existing navigation)
struct FavoritesViewContent: View {
    @Environment(ProgramsViewModel.self) private var programsVM
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @State private var selectedProgram: Program?
    @State private var showStatusEditor = false
    @State private var editingItem: FavoriteItem?

    var body: some View {
        Group {
            if programsVM.favoritePrograms.isEmpty {
                emptyState
            } else {
                favoritesList
            }
        }
        .navigationTitle("Saved")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.large)
        #endif
        .sheet(item: $editingItem) { item in
            StatusEditorSheet(item: item)
                .environment(programsVM)
        }
        .onAppear {
            // Announce screen to VoiceOver
            Task { @MainActor in
                AccessibilityService.shared.announceScreenChange("Saved programs, \(programsVM.favoritePrograms.count) items")
            }
        }
    }

    // MARK: - Subviews

    private var favoritesList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                // Status filter (future enhancement)

                ForEach(programsVM.favoritePrograms) { program in
                    NavigationLink(value: program) {
                        FavoriteCard(
                            program: program,
                            item: programsVM.getFavoriteItem(program.id),
                            onStatusTap: {
                                if let item = programsVM.getFavoriteItem(program.id) {
                                    editingItem = item
                                }
                            }
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
        }
        .navigationDestination(for: Program.self) { program in
            ProgramDetailView(program: program)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "bookmark")
                .font(.system(size: 64))
                .foregroundStyle(.secondary)
                .accessibilityHidden(true)

            Text("No Saved Programs")
                .font(.title2.bold())
                .accessibilityAddTraits(.isHeader)

            Text("Programs you save will appear here so you can easily track your applications.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("No saved programs. Programs you save will appear here so you can easily track your applications.")
    }
}

// MARK: - Favorite Card

struct FavoriteCard: View {
    let program: Program
    let item: FavoriteItem?
    let onStatusTap: () -> Void

    @Environment(ProgramsViewModel.self) private var programsVM
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityDifferentiateWithoutColor) private var differentiateWithoutColor

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                // Category icon
                Circle()
                    .fill(Color.categoryColor(for: program.category).gradient)
                    .frame(width: 44, height: 44)
                    .overlay {
                        Image(systemName: categoryIcon)
                            .font(.body)
                            .foregroundStyle(.white)
                    }
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 4) {
                    Text(program.name)
                        .font(.headline)
                        .foregroundStyle(.primary)
                        .lineLimit(2)
                        .accessibilityAddTraits(.isHeader)

                    Text(program.category)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                // Status badge
                if let item = item {
                    statusBadge(for: item.status)
                }
            }

            // Notes preview
            if let notes = item?.notes, !notes.isEmpty {
                Text(notes)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                    .italic()
                    .accessibilityLabel("Notes: \(notes)")
            }

            // Actions row
            HStack {
                Button {
                    onStatusTap()
                } label: {
                    Label("Update Status", systemImage: "pencil.circle")
                        .font(.caption)
                }
                .buttonStyle(.bordered)
                .tint(.appPrimary)
                .accessibilityHint("Opens status editor to update application progress")

                Spacer()

                Button {
                    if reduceMotion {
                        programsVM.toggleFavorite(program.id)
                    } else {
                        withAnimation {
                            programsVM.toggleFavorite(program.id)
                        }
                    }
                    // Announce removal
                    Task { @MainActor in
                        AccessibilityService.shared.announce("\(program.name) removed from saved programs")
                    }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "trash")
                            .font(.body)
                            .foregroundStyle(Color.appDanger)
                        if differentiateWithoutColor {
                            Text("Remove")
                                .font(.caption)
                                .foregroundStyle(Color.appDanger)
                        }
                    }
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Remove \(program.name) from saved programs")
                .accessibilityHint("Removes this program from your saved list")
            }
        }
        .padding()
        #if os(iOS)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        #elseif os(macOS)
        .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 16))
        #else
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        #endif
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(cardAccessibilityLabel)
        .accessibilityHint("Double tap to view program details")
    }

    private var cardAccessibilityLabel: String {
        var label = "\(program.name), \(program.category)"
        if let status = item?.status {
            label += ", status: \(status.label)"
        }
        if let notes = item?.notes, !notes.isEmpty {
            label += ", has notes"
        }
        return label
    }

    private func statusBadge(for status: FavoriteStatus) -> some View {
        HStack(spacing: 4) {
            Image(systemName: status.systemImage)
            Text(status.label)
        }
        .font(.caption2.bold())
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(statusColor(for: status).opacity(0.15))
        .foregroundStyle(statusColor(for: status))
        .clipShape(Capsule())
        .accessibilityLabel("Status: \(status.label)")
    }

    private func statusColor(for status: FavoriteStatus) -> Color {
        let rgb = status.color
        return Color(red: rgb.red, green: rgb.green, blue: rgb.blue)
    }

    private var categoryIcon: String {
        switch program.category.lowercased() {
        case "food", "food assistance": return "fork.knife"
        case "health", "healthcare": return "heart.fill"
        case "housing", "shelter": return "house.fill"
        case "transportation", "transit": return "bus.fill"
        case "education", "learning": return "graduationcap.fill"
        case "employment", "jobs": return "briefcase.fill"
        case "utilities": return "bolt.fill"
        case "legal": return "building.columns.fill"
        default: return "star.fill"
        }
    }
}

// MARK: - Status Editor Sheet

struct StatusEditorSheet: View {
    let item: FavoriteItem
    @Environment(ProgramsViewModel.self) private var programsVM
    @Environment(\.dismiss) private var dismiss

    @State private var selectedStatus: FavoriteStatus
    @State private var notes: String

    init(item: FavoriteItem) {
        self.item = item
        _selectedStatus = State(initialValue: item.status)
        _notes = State(initialValue: item.notes ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Status") {
                    Picker("Application Status", selection: $selectedStatus) {
                        ForEach(FavoriteStatus.allCases) { status in
                            HStack {
                                Image(systemName: status.systemImage)
                                Text(status.label)
                            }
                            .tag(status)
                        }
                    }
                    .pickerStyle(.inline)
                }

                Section("Notes") {
                    TextField("Add notes about your application...", text: $notes, axis: .vertical)
                        .lineLimit(5...10)
                }
            }
            .navigationTitle("Update Status")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        programsVM.updateFavoriteStatus(item.programId, status: selectedStatus)
                        programsVM.updateFavoriteNotes(item.programId, notes: notes.isEmpty ? nil : notes)
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
        .presentationDetents([.medium])
    }
}

#Preview {
    FavoritesView()
        .environment(ProgramsViewModel())
}
