import SwiftUI
import BayNavigatorCore

struct SearchView: View {
    @Environment(ProgramsViewModel.self) private var programsVM
    @Environment(SettingsViewModel.self) private var settingsVM
    @Environment(SmartAssistantViewModel.self) private var assistantVM

    @State private var searchText = ""
    @State private var showSmartAssistant = false
    @State private var recentSearches: [String] = []
    @FocusState private var isSearchFocused: Bool

    var body: some View {
        NavigationStack {
            Group {
                if searchText.isEmpty {
                    emptySearchState
                } else if filteredPrograms.isEmpty {
                    noResultsState
                } else {
                    searchResults
                }
            }
            .navigationTitle("Search")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.large)
            #endif
            .searchable(text: $searchText, prompt: "Search programs...")
            .onChange(of: searchText) { _, newValue in
                programsVM.setSearchQuery(newValue)
            }
            .toolbar {
                if settingsVM.aiSearchEnabled {
                    ToolbarItem(placement: .primaryAction) {
                        Button {
                            showSmartAssistant = true
                        } label: {
                            Image(systemName: "sparkles")
                        }
                    }
                }
            }
            .sheet(isPresented: $showSmartAssistant) {
                SmartAssistantView()
            }
            .navigationDestination(for: Program.self) { program in
                ProgramDetailView(program: program)
            }
        }
    }

    private var filteredPrograms: [Program] {
        programsVM.filteredPrograms
    }

    // MARK: - Empty State

    private var emptySearchState: some View {
        ScrollView {
            VStack(spacing: 32) {
                if settingsVM.aiSearchEnabled {
                    aiSearchPrompt
                }

                if !recentSearches.isEmpty {
                    recentSearchesSection
                }

                popularCategoriesSection
            }
            .padding()
        }
    }

    private var aiSearchPrompt: some View {
        Button {
            showSmartAssistant = true
        } label: {
            HStack(spacing: 16) {
                Image(systemName: "sparkles")
                    .font(.title)
                    .foregroundStyle(Color.appPrimary)

                VStack(alignment: .leading, spacing: 4) {
                    Text("Try AI-Powered Search")
                        .font(.headline)
                    Text("Ask questions like \"food help for seniors\"")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundStyle(.secondary)
            }
            .padding()
            #if os(iOS)
            .background(.regularMaterial)
            #else
            .background(Color.secondary.opacity(0.1))
            #endif
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }

    private var recentSearchesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Searches")
                    .font(.headline)
                Spacer()
                Button("Clear") {
                    recentSearches.removeAll()
                }
                .font(.caption)
                .foregroundStyle(Color.appPrimary)
            }

            ForEach(recentSearches, id: \.self) { search in
                Button {
                    searchText = search
                    isSearchFocused = true
                } label: {
                    HStack {
                        Image(systemName: "clock")
                            .foregroundStyle(.secondary)
                        Text(search)
                        Spacer()
                        Image(systemName: "arrow.up.left")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 8)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var popularCategoriesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Browse by Category")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(programsVM.categories.prefix(6)) { category in
                    Button {
                        searchText = category.name
                    } label: {
                        HStack {
                            categoryIcon(for: category.name)
                            Text(category.name)
                                .lineLimit(1)
                            Spacer()
                        }
                        .padding()
                        #if os(iOS)
                        .background(.regularMaterial)
                        #else
                        .background(Color.secondary.opacity(0.1))
                        #endif
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - No Results

    private var noResultsState: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "magnifyingglass")
                .font(.system(size: 60))
                .foregroundStyle(.secondary)

            VStack(spacing: 8) {
                Text("No results found")
                    .font(.title2.bold())
                Text("Try different keywords or use AI search")
                    .foregroundStyle(.secondary)
            }

            if settingsVM.aiSearchEnabled {
                Button {
                    showSmartAssistant = true
                } label: {
                    HStack {
                        Image(systemName: "sparkles")
                        Text("Try AI Search")
                    }
                    .padding()
                    .background(Color.appPrimary)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }

            Spacer()
        }
    }

    // MARK: - Search Results

    private var searchResults: some View {
        List {
            Section {
                ForEach(filteredPrograms) { program in
                    NavigationLink(value: program) {
                        SearchResultRow(program: program, searchText: searchText)
                    }
                }
            } header: {
                Text("\(filteredPrograms.count) results")
            }
        }
        #if os(iOS) || os(visionOS)
        .listStyle(.insetGrouped)
        #else
        .listStyle(.inset)
        #endif
        .onDisappear {
            if !searchText.isEmpty && !recentSearches.contains(searchText) {
                recentSearches.insert(searchText, at: 0)
                if recentSearches.count > 5 {
                    recentSearches.removeLast()
                }
            }
        }
    }

    // MARK: - Helpers

    private func categoryIcon(for name: String) -> some View {
        let iconName: String
        switch name.lowercased() {
        case let n where n.contains("food"):
            iconName = "fork.knife"
        case let n where n.contains("housing"):
            iconName = "house"
        case let n where n.contains("health"):
            iconName = "heart"
        case let n where n.contains("employment"):
            iconName = "briefcase"
        case let n where n.contains("education"):
            iconName = "book"
        case let n where n.contains("legal"):
            iconName = "scale.3d"
        default:
            iconName = "folder"
        }
        return Image(systemName: iconName)
            .foregroundStyle(Color.appPrimary)
    }
}

// MARK: - Search Result Row

struct SearchResultRow: View {
    let program: Program
    let searchText: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(program.name)
                .font(.headline)
                .lineLimit(2)

            HStack(spacing: 8) {
                Label(program.category, systemImage: "folder")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                if let area = program.areas.first {
                    Label(area, systemImage: "location")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Text(highlightedDescription(program.description))
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineLimit(2)
        }
        .padding(.vertical, 4)
    }

    private func highlightedDescription(_ text: String) -> AttributedString {
        var attributedString = AttributedString(text)

        if let range = attributedString.range(of: searchText, options: .caseInsensitive) {
            attributedString[range].foregroundColor = .appPrimary
            attributedString[range].font = .subheadline.bold()
        }

        return attributedString
    }
}

#Preview {
    SearchView()
        .environment(ProgramsViewModel())
        .environment(SettingsViewModel())
        .environment(SmartAssistantViewModel())
}
