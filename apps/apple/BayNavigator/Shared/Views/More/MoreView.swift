import SwiftUI
import BayNavigatorCore

/// More tab hub screen - shows items not in the main tab bar
struct MoreView: View {
    @Environment(NavigationService.self) private var navigationService
    @Environment(ProgramsViewModel.self) private var programsVM
    @Environment(SettingsViewModel.self) private var settingsVM
    @Environment(UserPrefsViewModel.self) private var userPrefsVM
    @Environment(SmartAssistantViewModel.self) private var assistantVM
    @State private var showCustomization = false
    @State private var useGridLayout = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    headerView

                    // Layout toggle
                    layoutToggle

                    // Items
                    if useGridLayout {
                        gridView
                    } else {
                        listView
                    }

                    // Customize button
                    customizeButton

                    Spacer(minLength: 40)
                }
                .padding()
            }
            .navigationTitle("More")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.large)
            #endif
            .sheet(isPresented: $showCustomization) {
                NavigationCustomizationView()
                    .environment(navigationService)
            }
        }
    }

    // MARK: - Header

    private var headerView: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.appPrimary.opacity(0.1))
                    .frame(width: 48, height: 48)

                Image(systemName: "ellipsis")
                    .font(.title2)
                    .foregroundStyle(Color.appPrimary)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("More Features")
                    .font(.title3.bold())

                Text("Access additional tools and settings")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
    }

    // MARK: - Layout Toggle

    private var layoutToggle: some View {
        Picker("Layout", selection: $useGridLayout) {
            Image(systemName: "list.bullet")
                .tag(false)
            Image(systemName: "square.grid.2x2")
                .tag(true)
        }
        .pickerStyle(.segmented)
        .frame(width: 100)
        .frame(maxWidth: .infinity, alignment: .trailing)
    }

    // MARK: - List View

    private var listView: some View {
        LazyVStack(spacing: 8) {
            ForEach(navigationService.moreItems) { item in
                NavigationLink(value: item) {
                    MoreItemRow(item: item)
                }
                .buttonStyle(.plain)
            }
        }
        .navigationDestination(for: NavItem.self) { item in
            destinationView(for: item)
        }
    }

    // MARK: - Grid View

    private var gridView: some View {
        let columns = [
            GridItem(.flexible()),
            GridItem(.flexible())
        ]

        return LazyVGrid(columns: columns, spacing: 12) {
            ForEach(navigationService.moreItems) { item in
                NavigationLink(value: item) {
                    MoreItemGridCell(item: item)
                }
                .buttonStyle(.plain)
            }
        }
        .navigationDestination(for: NavItem.self) { item in
            destinationView(for: item)
        }
    }

    // MARK: - Customize Button

    private var customizeButton: some View {
        Button {
            HapticManager.impact(.light)
            showCustomization = true
        } label: {
            HStack {
                Image(systemName: "slider.horizontal.3")
                Text("Customize Navigation")
            }
            .frame(maxWidth: .infinity)
            .padding()
            #if os(iOS)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #elseif os(macOS)
            .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 12))
            #else
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #endif
        }
        .buttonStyle(.plain)
    }

    // MARK: - Destination Views

    @ViewBuilder
    private func destinationView(for item: NavItem) -> some View {
        // Note: Using Content versions for views that have their own NavigationStack
        // to avoid nested navigation stacks when pushed from MoreView
        switch item.id {
        case "for_you":
            ForYouViewContent()
                .environment(programsVM)
                .environment(userPrefsVM)
        case "directory":
            DirectoryViewContent()
                .environment(programsVM)
                .environment(settingsVM)
        case "saved":
            FavoritesViewContent()
                .environment(programsVM)
        case "map":
            MapViewContent()
                .environment(programsVM)
        case "ask_carl":
            AskCarlView()
                .environment(assistantVM)
                .environment(programsVM)
                .environment(settingsVM)
        case "transit":
            TransitViewContent()
        case "glossary":
            GlossaryViewContent()
        case "guides":
            EligibilityGuidesViewContent()
        case "profiles":
            ProfilesViewContent()
        case "settings":
            SettingsViewContent()
                .environment(settingsVM)
                .environment(programsVM)
                .environment(userPrefsVM)
        case "safety":
            SafetySettingsView()
        default:
            Text("Unknown destination")
        }
    }
}

// MARK: - More Item Row

struct MoreItemRow: View {
    let item: NavItem

    var body: some View {
        HStack(spacing: 16) {
            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.appPrimary.opacity(0.1))
                    .frame(width: 44, height: 44)

                Image(systemName: item.iconName)
                    .font(.title3)
                    .foregroundStyle(Color.appPrimary)
            }

            // Title
            Text(item.label)
                .font(.body)
                .fontWeight(.medium)

            Spacer()

            // Arrow
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding()
        #if os(iOS)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        #elseif os(macOS)
        .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 12))
        #else
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        #endif
        .contentShape(Rectangle())
        #if os(visionOS)
        .hoverEffect(.highlight)
        #endif
    }
}

// MARK: - More Item Grid Cell

struct MoreItemGridCell: View {
    let item: NavItem

    var body: some View {
        VStack(spacing: 12) {
            // Icon
            ZStack {
                Circle()
                    .fill(Color.appPrimary.opacity(0.1))
                    .frame(width: 56, height: 56)

                Image(systemName: item.iconName)
                    .font(.title2)
                    .foregroundStyle(Color.appPrimary)
            }

            // Title
            Text(item.label)
                .font(.subheadline)
                .fontWeight(.medium)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .padding()
        #if os(iOS)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        #elseif os(macOS)
        .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 16))
        #else
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        #endif
        .contentShape(Rectangle())
        #if os(visionOS)
        .hoverEffect(.highlight)
        #endif
    }
}

#Preview {
    MoreView()
        .environment(NavigationService.shared)
        .environment(ProgramsViewModel())
        .environment(SettingsViewModel())
        .environment(UserPrefsViewModel())
        .environment(SmartAssistantViewModel())
}
