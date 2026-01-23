import SwiftUI

@Observable
public final class ProgramsViewModel {
    // MARK: - Data
    public private(set) var programs: [Program] = []
    public private(set) var externalPrograms: [Program] = []
    public private(set) var categories: [ProgramCategory] = []
    public private(set) var groups: [ProgramGroup] = []
    public private(set) var areas: [Area] = []
    public private(set) var metadata: APIMetadata?

    // MARK: - State
    public private(set) var isLoading = false
    public private(set) var isLoadingExternal = false
    public private(set) var error: String?
    public var filterState = FilterState()
    public var sortOption: SortOption = .recentlyVerified
    public var includeExternalSources = true
    public private(set) var lastExternalSync: Date?

    // MARK: - AI Search State
    public private(set) var isAISearching = false
    public private(set) var aiSearchResults: [Program]?
    public private(set) var aiSearchMessage: String?

    // MARK: - Favorites
    public private(set) var favorites: Set<String> = []
    public private(set) var favoriteItems: [FavoriteItem] = []

    private let api = APIService.shared
    private let cache = CacheService.shared
    private let sodaClient = SodaClient.shared
    private let ohanaClient = OhanaClient.shared

    // Names for "Other" areas (what programs actually store)
    private static let otherAreaNames: Set<String> = ["Bay Area", "Statewide", "Nationwide"]

    public init() {
        Task {
            favorites = await cache.getFavorites()
            favoriteItems = await cache.getFavoriteItems()
        }
    }

    // MARK: - Helper Methods

    /// Convert area ID to area name (programs store names, not IDs)
    private func getAreaName(_ areaId: String) -> String? {
        areas.first { $0.id == areaId }?.name
    }

    // MARK: - Computed Properties

    /// All programs including external sources if enabled
    public var allPrograms: [Program] {
        if includeExternalSources && !externalPrograms.isEmpty {
            return programs + externalPrograms
        }
        return programs
    }

    public var filteredPrograms: [Program] {
        // Return AI search results if available
        if let aiResults = aiSearchResults {
            return aiResults
        }

        var result = allPrograms

        // Apply search query
        if !filterState.searchQuery.isEmpty {
            let query = filterState.searchQuery.lowercased()
            result = result.filter { program in
                program.name.lowercased().contains(query) ||
                program.description.lowercased().contains(query)
            }
        }

        // Apply category filter
        if !filterState.categories.isEmpty {
            result = result.filter { filterState.categories.contains($0.category) }
        }

        // Apply groups filter (formerly eligibility)
        if !filterState.groups.isEmpty {
            result = result.filter { program in
                filterState.groups.contains { program.groups.contains($0) }
            }
        }

        // Apply area filter
        if !filterState.areas.isEmpty {
            // Check if "Other" is selected (any of bay-area, statewide, nationwide)
            let hasOtherSelected = filterState.areas.contains { FilterState.otherAreaIds.contains($0) }
            // Get selected county IDs and convert to names for comparison
            let selectedCountyIds = filterState.areas.filter { !FilterState.otherAreaIds.contains($0) }
            let selectedCountyNames = Set(selectedCountyIds.compactMap { getAreaName($0) })

            result = result.filter { program in
                // Programs store area names like "Bay Area", "Statewide", "San Francisco"
                let isUniversal = program.areas.contains { Self.otherAreaNames.contains($0) }
                let matchesCounty = program.areas.contains { selectedCountyNames.contains($0) }

                if hasOtherSelected && selectedCountyNames.isEmpty {
                    // Only "Other" selected: show only universal programs
                    return isUniversal
                } else if hasOtherSelected && !selectedCountyNames.isEmpty {
                    // Both "Other" and counties selected: show universal + matching counties
                    return isUniversal || matchesCounty
                } else {
                    // Only counties selected: show matching counties + universal (they apply everywhere)
                    return matchesCounty || isUniversal
                }
            }
        }

        // Apply sorting
        switch sortOption {
        case .recentlyVerified:
            result.sort { ($0.lastUpdatedDate ?? .distantPast) > ($1.lastUpdatedDate ?? .distantPast) }
        case .nameAsc:
            result.sort { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
        case .nameDesc:
            result.sort { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedDescending }
        case .categoryAsc:
            result.sort { $0.category.localizedCaseInsensitiveCompare($1.category) == .orderedAscending }
        case .distanceAsc:
            // Sort by distance (programs without distance go to end)
            result.sort {
                let dist0 = $0.distanceFromUser ?? .infinity
                let dist1 = $1.distanceFromUser ?? .infinity
                return dist0 < dist1
            }
        }

        return result
    }

    public var favoritePrograms: [Program] {
        allPrograms.filter { favorites.contains($0.id) }
    }

    public var countyAreas: [Area] {
        areas.filter { $0.isCounty }
    }

    // MARK: - Data Loading

    @MainActor
    public func loadData(forceRefresh: Bool = false) async {
        guard !isLoading else { return }

        isLoading = true
        error = nil

        do {
            async let programsTask = api.getPrograms(forceRefresh: forceRefresh)
            async let categoriesTask = api.getCategories(forceRefresh: forceRefresh)
            async let groupsTask = api.getGroups(forceRefresh: forceRefresh)
            async let areasTask = api.getAreas(forceRefresh: forceRefresh)
            async let metadataTask = api.getMetadata(forceRefresh: forceRefresh)
            async let coordinatesTask = api.getProgramCoordinates(forceRefresh: forceRefresh)

            let (loadedPrograms, loadedCategories, loadedGroups, loadedAreas, loadedMetadata, coordinates) =
                try await (programsTask, categoriesTask, groupsTask, areasTask, metadataTask, coordinatesTask)

            // Merge coordinates into programs
            self.programs = loadedPrograms.map { program in
                if let coords = coordinates[program.id] {
                    return Program(
                        id: program.id,
                        name: program.name,
                        category: program.category,
                        description: program.description,
                        fullDescription: program.fullDescription,
                        whatTheyOffer: program.whatTheyOffer,
                        howToGetIt: program.howToGetIt,
                        groups: program.groups,
                        areas: program.areas,
                        city: program.city,
                        website: program.website,
                        cost: program.cost,
                        phone: program.phone,
                        email: program.email,
                        address: program.address,
                        requirements: program.requirements,
                        howToApply: program.howToApply,
                        lastUpdated: program.lastUpdated,
                        latitude: coords.latitude,
                        longitude: coords.longitude
                    )
                }
                return program
            }
            self.categories = loadedCategories
            self.groups = loadedGroups
            self.areas = loadedAreas
            self.metadata = loadedMetadata

            // Load external data in background (non-blocking)
            Task {
                await loadExternalData()
            }
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    /// Load external data sources (SF DataSF, Ohana API)
    @MainActor
    public func loadExternalData() async {
        guard !isLoadingExternal else { return }

        isLoadingExternal = true

        do {
            async let sodaTask = sodaClient.fetchAll()
            async let ohanaTask = ohanaClient.fetchAll()

            let (sodaPrograms, ohanaPrograms) = await (sodaTask, ohanaTask)

            self.externalPrograms = sodaPrograms + ohanaPrograms
            self.lastExternalSync = Date()
        } catch {
            // Silently fail - external data is supplementary
        }

        isLoadingExternal = false
    }

    /// Refresh external data sources
    @MainActor
    public func refreshExternalData() async {
        await loadExternalData()
    }

    @MainActor
    public func refreshMetadata() async {
        do {
            metadata = try await api.getMetadata(forceRefresh: true)
        } catch {
            // Silently fail
        }
    }

    // MARK: - Filtering

    public func setSearchQuery(_ query: String) {
        // Clear AI search results when query changes
        aiSearchResults = nil
        aiSearchMessage = nil
        filterState.searchQuery = query
    }

    /// Check if query should use AI search (natural language queries)
    public func shouldUseAISearch(_ query: String) -> Bool {
        guard query.count >= 10 else { return false }

        let lowerQuery = query.lowercased()

        // Demographic/eligibility terms that suggest complex queries
        let demographicTerms = ["senior", "elderly", "veteran", "disabled", "disability",
                                "student", "low-income", "homeless", "immigrant", "lgbtq",
                                "family", "child", "parent", "youth", "teen"]

        // Natural language patterns
        let naturalPatterns = ["i need", "i'm looking", "help with", "how can i", "where can i",
                               "looking for", "need help", "can you help", "what programs",
                               "i am a", "i'm a", "my family", "we need"]

        // Check for demographic terms
        for term in demographicTerms where lowerQuery.contains(term) {
            return true
        }

        // Check for natural language patterns
        for pattern in naturalPatterns where lowerQuery.contains(pattern) {
            return true
        }

        // Multiple words suggest natural language
        let wordCount = query.split(separator: " ").filter { $0.count > 2 }.count
        return wordCount >= 4
    }

    /// Perform AI-powered search for natural language queries
    @MainActor
    public func performAISearch(_ query: String, aiEnabled: Bool = true) async -> Bool {
        guard aiEnabled, shouldUseAISearch(query) else {
            setSearchQuery(query)
            return false
        }

        isAISearching = true
        aiSearchMessage = nil

        do {
            let result = try await SmartAssistantService.shared.search(query: query)
            // Convert AIProgram to Program
            aiSearchResults = result.programs.compactMap { aiProgram in
                programs.first { $0.id == aiProgram.id }
            }
            aiSearchMessage = result.message
            filterState.searchQuery = "" // Clear regular search
            isAISearching = false
            return true
        } catch {
            // Fall back to local search on error
            isAISearching = false
            aiSearchResults = nil
            aiSearchMessage = nil
            setSearchQuery(query)
            return false
        }
    }

    /// Clear AI search results and return to normal filtering
    public func clearAISearch() {
        aiSearchResults = nil
        aiSearchMessage = nil
    }

    public func toggleCategory(_ id: String) {
        if filterState.categories.contains(id) {
            filterState.categories.remove(id)
        } else {
            filterState.categories.insert(id)
        }
    }

    public func toggleGroup(_ id: String) {
        if filterState.groups.contains(id) {
            filterState.groups.remove(id)
        } else {
            filterState.groups.insert(id)
        }
    }

    public func toggleArea(_ id: String) {
        if filterState.areas.contains(id) {
            filterState.areas.remove(id)
        } else {
            filterState.areas.insert(id)
        }
    }

    public func toggleOtherAreas() {
        filterState.toggleOtherAreas()
    }

    public func clearFilters() {
        filterState.clear()
    }

    // MARK: - Dynamic Filter Counts

    public func getCategoryCount(_ id: String) -> Int {
        var tempFilter = filterState
        tempFilter.categories.removeAll()

        return programsMatchingFilter(tempFilter).filter { $0.category == id }.count
    }

    public func getGroupCount(_ id: String) -> Int {
        var tempFilter = filterState
        tempFilter.groups.removeAll()

        return programsMatchingFilter(tempFilter).filter { $0.groups.contains(id) }.count
    }

    public func getAreaCount(_ id: String) -> Int {
        guard let areaName = getAreaName(id) else { return 0 }
        var tempFilter = filterState
        tempFilter.areas.removeAll()

        return programsMatchingFilter(tempFilter).filter { $0.areas.contains(areaName) }.count
    }

    public func getOtherAreasCount() -> Int {
        var tempFilter = filterState
        tempFilter.areas.removeAll()

        return programsMatchingFilter(tempFilter).filter { program in
            program.areas.contains { Self.otherAreaNames.contains($0) }
        }.count
    }

    private func programsMatchingFilter(_ filter: FilterState) -> [Program] {
        var result = allPrograms

        if !filter.searchQuery.isEmpty {
            let query = filter.searchQuery.lowercased()
            result = result.filter { program in
                program.name.lowercased().contains(query) ||
                program.description.lowercased().contains(query)
            }
        }

        if !filter.categories.isEmpty {
            result = result.filter { filter.categories.contains($0.category) }
        }

        if !filter.groups.isEmpty {
            result = result.filter { program in
                filter.groups.contains { program.groups.contains($0) }
            }
        }

        if !filter.areas.isEmpty {
            // Check if "Other" is selected (any of bay-area, statewide, nationwide)
            let hasOtherSelected = filter.areas.contains { FilterState.otherAreaIds.contains($0) }
            // Get selected county IDs and convert to names for comparison
            let selectedCountyIds = filter.areas.filter { !FilterState.otherAreaIds.contains($0) }
            let selectedCountyNames = Set(selectedCountyIds.compactMap { getAreaName($0) })

            result = result.filter { program in
                let isUniversal = program.areas.contains { Self.otherAreaNames.contains($0) }
                let matchesCounty = program.areas.contains { selectedCountyNames.contains($0) }

                if hasOtherSelected && selectedCountyNames.isEmpty {
                    return isUniversal
                } else if hasOtherSelected && !selectedCountyNames.isEmpty {
                    return isUniversal || matchesCounty
                } else {
                    return matchesCounty || isUniversal
                }
            }
        }

        return result
    }

    // MARK: - Favorites

    public func isFavorite(_ id: String) -> Bool {
        favorites.contains(id)
    }

    public func toggleFavorite(_ id: String) {
        if favorites.contains(id) {
            favorites.remove(id)
            favoriteItems.removeAll { $0.programId == id }
            Task {
                await cache.removeFavorite(id)
            }
        } else {
            favorites.insert(id)
            let newItem = FavoriteItem(programId: id)
            favoriteItems.append(newItem)
            Task {
                await cache.addFavorite(id)
            }
        }
    }

    /// Get the FavoriteItem for a specific program
    public func getFavoriteItem(_ programId: String) -> FavoriteItem? {
        favoriteItems.first { $0.programId == programId }
    }

    /// Update the status of a favorite item
    public func updateFavoriteStatus(_ programId: String, status: FavoriteStatus) {
        if let index = favoriteItems.firstIndex(where: { $0.programId == programId }) {
            favoriteItems[index].status = status
            favoriteItems[index].statusUpdatedAt = Date()
            Task {
                await cache.updateFavoriteStatus(programId, status: status)
            }
        }
    }

    /// Update the notes of a favorite item
    public func updateFavoriteNotes(_ programId: String, notes: String?) {
        if let index = favoriteItems.firstIndex(where: { $0.programId == programId }) {
            favoriteItems[index].notes = notes
            favoriteItems[index].statusUpdatedAt = Date()
            Task {
                await cache.updateFavoriteNotes(programId, notes: notes)
            }
        }
    }

    // MARK: - Location (Privacy-First, All On-Device)

    /// Update program distances from user location
    public func updateDistances(from location: (latitude: Double, longitude: Double)) {
        for index in programs.indices {
            if let lat = programs[index].latitude,
               let lng = programs[index].longitude {
                programs[index].distanceFromUser = Self.calculateDistance(
                    lat1: location.latitude, lng1: location.longitude,
                    lat2: lat, lng2: lng
                )
            } else {
                programs[index].distanceFromUser = nil
            }
        }
        for index in externalPrograms.indices {
            if let lat = externalPrograms[index].latitude,
               let lng = externalPrograms[index].longitude {
                externalPrograms[index].distanceFromUser = Self.calculateDistance(
                    lat1: location.latitude, lng1: location.longitude,
                    lat2: lat, lng2: lng
                )
            } else {
                externalPrograms[index].distanceFromUser = nil
            }
        }
    }

    /// Clear all program distances
    public func clearDistances() {
        for index in programs.indices {
            programs[index].distanceFromUser = nil
        }
        for index in externalPrograms.indices {
            externalPrograms[index].distanceFromUser = nil
        }
        // Reset sort if was distance-based
        if sortOption == .distanceAsc {
            sortOption = .recentlyVerified
        }
    }

    /// Haversine distance calculation (on-device, privacy-first)
    private static func calculateDistance(lat1: Double, lng1: Double, lat2: Double, lng2: Double) -> Double {
        let earthRadiusMiles = 3959.0

        let dLat = (lat2 - lat1) * .pi / 180
        let dLng = (lng2 - lng1) * .pi / 180

        let a = sin(dLat / 2) * sin(dLat / 2) +
                cos(lat1 * .pi / 180) * cos(lat2 * .pi / 180) *
                sin(dLng / 2) * sin(dLng / 2)

        let c = 2 * atan2(sqrt(a), sqrt(1 - a))

        return earthRadiusMiles * c
    }
}
