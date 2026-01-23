import 'dart:math';
import 'package:flutter/foundation.dart';
import '../models/program.dart';
import '../services/api_service.dart';
import '../services/imessage_service.dart';
import '../services/external/soda_client.dart';
import '../services/external/ohana_client.dart';

enum SortOption {
  recentlyVerified,
  nameAsc,
  nameDesc,
  categoryAsc,
  distanceAsc, // Sort by distance from user (requires location)
}

class ProgramsProvider extends ChangeNotifier {
  final ApiService _apiService;
  final SodaClient _sodaClient;
  final OhanaClient _ohanaClient;

  List<Program> _programs = [];
  List<Program> _externalPrograms = [];
  List<ProgramCategory> _categories = [];
  List<ProgramGroup> _groups = [];
  List<Area> _areas = [];
  APIMetadata? _metadata;
  List<String> _favorites = [];
  List<FavoriteItem> _favoriteItems = [];

  bool _isLoading = false;
  bool _isLoadingExternal = false;
  String? _error;
  bool _includeExternalSources = true;
  DateTime? _lastExternalSync;

  FilterState _filterState = FilterState();
  SortOption _sortOption = SortOption.recentlyVerified;

  // AI Search state
  bool _isAISearching = false;
  List<Program>? _aiSearchResults;
  String? _aiSearchMessage;

  bool get isAISearching => _isAISearching;
  List<Program>? get aiSearchResults => _aiSearchResults;
  String? get aiSearchMessage => _aiSearchMessage;
  bool get isLoadingExternal => _isLoadingExternal;
  bool get includeExternalSources => _includeExternalSources;
  DateTime? get lastExternalSync => _lastExternalSync;
  List<Program> get externalPrograms => _externalPrograms;

  ProgramsProvider({
    ApiService? apiService,
    SodaClient? sodaClient,
    OhanaClient? ohanaClient,
  })  : _apiService = apiService ?? ApiService(),
        _sodaClient = sodaClient ?? SodaClient(),
        _ohanaClient = ohanaClient ?? OhanaClient();

  // Getters
  List<Program> get programs => _programs;
  List<ProgramCategory> get categories => _categories;
  List<ProgramGroup> get groups => _groups;
  List<Area> get areas => _areas;
  APIMetadata? get metadata => _metadata;
  List<String> get favorites => _favorites;
  List<FavoriteItem> get favoriteItems => _favoriteItems;
  bool get isLoading => _isLoading;
  String? get error => _error;
  FilterState get filterState => _filterState;
  SortOption get sortOption => _sortOption;

  // Helper to get area name from ID (programs store names, not IDs)
  String? _getAreaName(String areaId) {
    final area = _areas.where((a) => a.id == areaId).firstOrNull;
    return area?.name;
  }

  // Names for "Other" areas (what programs actually store)
  static const _otherAreaNames = ['Bay Area', 'Statewide', 'Nationwide'];

  List<Program> get filteredPrograms {
    // If AI search results are available, return those instead
    if (_aiSearchResults != null) {
      return _aiSearchResults!;
    }

    var result = allPrograms;

    // Apply search query
    if (_filterState.searchQuery.isNotEmpty) {
      final query = _filterState.searchQuery.toLowerCase();
      result = result.where((p) =>
        p.name.toLowerCase().contains(query) ||
        p.description.toLowerCase().contains(query)
      ).toList();
    }

    // Apply category filter
    if (_filterState.categories.isNotEmpty) {
      result = result.where((p) =>
        _filterState.categories.contains(p.category)
      ).toList();
    }

    // Apply groups filter
    if (_filterState.groups.isNotEmpty) {
      result = result.where((p) =>
        _filterState.groups.any((g) => p.groups.contains(g))
      ).toList();
    }

    // Apply area filter
    if (_filterState.areas.isNotEmpty) {
      // Check if "Other" is selected (any of bay-area, statewide, nationwide)
      final hasOtherSelected = _filterState.areas.any((a) => otherAreaIds.contains(a));
      // Get selected county IDs and convert to names for comparison
      final selectedCountyIds = _filterState.areas.where((a) => !otherAreaIds.contains(a)).toList();
      final selectedCountyNames = selectedCountyIds.map((id) => _getAreaName(id)).whereType<String>().toList();

      result = result.where((p) {
        // Programs store area names like "Bay Area", "Statewide", "San Francisco"
        final isUniversal = p.areas.any((name) => _otherAreaNames.contains(name));
        final matchesCounty = selectedCountyNames.any((name) => p.areas.contains(name));

        if (hasOtherSelected && selectedCountyNames.isEmpty) {
          // Only "Other" selected: show only universal programs
          return isUniversal;
        } else if (hasOtherSelected && selectedCountyNames.isNotEmpty) {
          // Both "Other" and counties selected: show universal + matching counties
          return isUniversal || matchesCounty;
        } else {
          // Only counties selected: show matching counties + universal (they apply everywhere)
          return matchesCounty || isUniversal;
        }
      }).toList();
    }

    // Apply sorting
    result = List.from(result);
    switch (_sortOption) {
      case SortOption.recentlyVerified:
        result.sort((a, b) => b.lastUpdated.compareTo(a.lastUpdated));
        break;
      case SortOption.nameAsc:
        result.sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
        break;
      case SortOption.nameDesc:
        result.sort((a, b) => b.name.toLowerCase().compareTo(a.name.toLowerCase()));
        break;
      case SortOption.categoryAsc:
        result.sort((a, b) {
          final categoryCompare = a.category.compareTo(b.category);
          if (categoryCompare != 0) return categoryCompare;
          return a.name.toLowerCase().compareTo(b.name.toLowerCase());
        });
        break;
      case SortOption.distanceAsc:
        // Sort by distance (programs without distance go to end)
        result.sort((a, b) {
          final distA = a.distanceFromUser ?? double.infinity;
          final distB = b.distanceFromUser ?? double.infinity;
          return distA.compareTo(distB);
        });
        break;
    }

    return result;
  }

  List<Program> get favoritePrograms {
    return allPrograms.where((p) => _favorites.contains(p.id)).toList();
  }

  // Get count of programs for a specific category within current filters
  int getCategoryCount(String categoryId) {
    return _getFilteredProgramsExcluding(excludeCategory: true)
        .where((p) => p.category == categoryId)
        .length;
  }

  // Get count of programs for a specific group within current filters
  int getGroupCount(String groupId) {
    return _getFilteredProgramsExcluding(excludeGroups: true)
        .where((p) => p.groups.contains(groupId))
        .length;
  }

  // Get count of programs for a specific area within current filters
  int getAreaCount(String areaId) {
    final areaName = _getAreaName(areaId);
    if (areaName == null) return 0;
    return _getFilteredProgramsExcluding(excludeArea: true)
        .where((p) => p.areas.contains(areaName))
        .length;
  }

  // Helper to get filtered programs excluding specific filter types
  List<Program> _getFilteredProgramsExcluding({
    bool excludeCategory = false,
    bool excludeGroups = false,
    bool excludeArea = false,
  }) {
    var result = allPrograms;

    // Apply search query
    if (_filterState.searchQuery.isNotEmpty) {
      final query = _filterState.searchQuery.toLowerCase();
      result = result.where((p) =>
        p.name.toLowerCase().contains(query) ||
        p.description.toLowerCase().contains(query)
      ).toList();
    }

    // Apply category filter (unless excluded)
    if (!excludeCategory && _filterState.categories.isNotEmpty) {
      result = result.where((p) =>
        _filterState.categories.contains(p.category)
      ).toList();
    }

    // Apply groups filter (unless excluded)
    if (!excludeGroups && _filterState.groups.isNotEmpty) {
      result = result.where((p) =>
        _filterState.groups.any((g) => p.groups.contains(g))
      ).toList();
    }

    // Apply area filter (unless excluded)
    if (!excludeArea && _filterState.areas.isNotEmpty) {
      // Check if "Other" is selected (any of bay-area, statewide, nationwide)
      final hasOtherSelected = _filterState.areas.any((a) => otherAreaIds.contains(a));
      // Get selected county IDs and convert to names for comparison
      final selectedCountyIds = _filterState.areas.where((a) => !otherAreaIds.contains(a)).toList();
      final selectedCountyNames = selectedCountyIds.map((id) => _getAreaName(id)).whereType<String>().toList();

      result = result.where((p) {
        // Programs store area names like "Bay Area", "Statewide", "San Francisco"
        final isUniversal = p.areas.any((name) => _otherAreaNames.contains(name));
        final matchesCounty = selectedCountyNames.any((name) => p.areas.contains(name));

        if (hasOtherSelected && selectedCountyNames.isEmpty) {
          // Only "Other" selected: show only universal programs
          return isUniversal;
        } else if (hasOtherSelected && selectedCountyNames.isNotEmpty) {
          // Both "Other" and counties selected: show universal + matching counties
          return isUniversal || matchesCounty;
        } else {
          // Only counties selected: show matching counties + universal (they apply everywhere)
          return matchesCounty || isUniversal;
        }
      }).toList();
    }

    return result;
  }

  // Load initial data
  Future<void> loadData({bool forceRefresh = false}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _apiService.getPrograms(forceRefresh: forceRefresh),
        _apiService.getCategories(forceRefresh: forceRefresh),
        _apiService.getGroups(forceRefresh: forceRefresh),
        _apiService.getAreas(forceRefresh: forceRefresh),
        _apiService.getMetadata(forceRefresh: forceRefresh),
        _apiService.getFavorites(),
        _apiService.getFavoriteItems(),
      ]);

      _programs = results[0] as List<Program>;
      _categories = results[1] as List<ProgramCategory>;
      _groups = results[2] as List<ProgramGroup>;
      _areas = results[3] as List<Area>;
      _metadata = results[4] as APIMetadata;
      _favorites = results[5] as List<String>;
      _favoriteItems = results[6] as List<FavoriteItem>;

      _error = null;

      // Sync favorites to iMessage extension on initial load
      _syncToIMessage();

      // Load external data in background (non-blocking)
      _loadExternalData();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Load external data sources (SF DataSF, Ohana API)
  /// This runs in the background and doesn't block the main UI
  Future<void> _loadExternalData() async {
    if (_isLoadingExternal) return;

    _isLoadingExternal = true;
    notifyListeners();

    try {
      final results = await Future.wait([
        _sodaClient.fetchAll(),
        _ohanaClient.fetchAll(),
      ]);

      final sodaPrograms = results[0];
      final ohanaPrograms = results[1];

      _externalPrograms = [...sodaPrograms, ...ohanaPrograms];
      _lastExternalSync = DateTime.now();
    } catch (e) {
      // Silently fail - external data is supplementary
      debugPrint('Failed to load external data: $e');
    } finally {
      _isLoadingExternal = false;
      notifyListeners();
    }
  }

  /// Refresh external data sources
  Future<void> refreshExternalData() async {
    await _loadExternalData();
  }

  /// Toggle whether to include external sources in results
  void setIncludeExternalSources(bool value) {
    _includeExternalSources = value;
    notifyListeners();
  }

  /// Get all programs (local + external if enabled)
  List<Program> get allPrograms {
    if (_includeExternalSources && _externalPrograms.isNotEmpty) {
      return [..._programs, ..._externalPrograms];
    }
    return _programs;
  }

  // Refresh metadata only
  Future<bool> refreshMetadata() async {
    try {
      final newMetadata = await _apiService.getMetadata(forceRefresh: true);
      final hasUpdate = _metadata != null &&
          DateTime.parse(newMetadata.generatedAt)
              .isAfter(DateTime.parse(_metadata!.generatedAt));

      if (hasUpdate) {
        _metadata = newMetadata;
        notifyListeners();
      }

      return hasUpdate;
    } catch (e) {
      return false;
    }
  }

  // Filter methods
  void setSearchQuery(String query) {
    // Clear AI search results when query changes
    _aiSearchResults = null;
    _aiSearchMessage = null;
    _filterState = _filterState.copyWith(searchQuery: query);
    notifyListeners();
  }

  /// Check if query should use AI search (natural language queries)
  bool shouldUseAISearch(String query) {
    return _apiService.shouldUseAISearch(query);
  }

  /// Perform AI-powered search for natural language queries
  /// Returns true if AI search was used, false if it fell back to local search
  /// Pass aiEnabled=false to disable AI (user preference or offline)
  Future<bool> performAISearch(String query, {bool aiEnabled = true}) async {
    if (!aiEnabled || !_apiService.shouldUseAISearch(query)) {
      // Use regular local search
      setSearchQuery(query);
      return false;
    }

    _isAISearching = true;
    _aiSearchMessage = null;
    notifyListeners();

    try {
      final result = await _apiService.performAISearch(query: query);
      _aiSearchResults = result.programs;
      _aiSearchMessage = result.message;
      // Clear regular search to show AI results
      _filterState = _filterState.copyWith(searchQuery: '');
      _isAISearching = false;
      notifyListeners();
      return true;
    } catch (e) {
      // Fall back to local search on error (likely offline)
      _isAISearching = false;
      _aiSearchResults = null;
      _aiSearchMessage = null;
      setSearchQuery(query);
      return false;
    }
  }

  /// Clear AI search results and return to normal filtering
  void clearAISearch() {
    _aiSearchResults = null;
    _aiSearchMessage = null;
    notifyListeners();
  }

  void toggleCategory(String categoryId) {
    final categories = List<String>.from(_filterState.categories);
    if (categories.contains(categoryId)) {
      categories.remove(categoryId);
    } else {
      categories.add(categoryId);
    }
    _filterState = _filterState.copyWith(categories: categories);
    notifyListeners();
  }

  void toggleGroup(String groupId) {
    final groups = List<String>.from(_filterState.groups);
    if (groups.contains(groupId)) {
      groups.remove(groupId);
    } else {
      groups.add(groupId);
    }
    _filterState = _filterState.copyWith(groups: groups);
    notifyListeners();
  }

  void toggleArea(String areaId) {
    final areas = List<String>.from(_filterState.areas);
    if (areas.contains(areaId)) {
      areas.remove(areaId);
    } else {
      areas.add(areaId);
    }
    _filterState = _filterState.copyWith(areas: areas);
    notifyListeners();
  }

  // IDs for "Other" area group (Bay Area, Statewide, Nationwide)
  static const otherAreaIds = ['bay-area', 'statewide', 'nationwide'];

  // Toggle "Other" areas (Bay Area, Statewide, Nationwide) as a group
  void toggleOtherAreas() {
    final areas = List<String>.from(_filterState.areas);
    final hasAnyOther = areas.any((id) => otherAreaIds.contains(id));

    if (hasAnyOther) {
      // Remove all other area IDs
      areas.removeWhere((id) => otherAreaIds.contains(id));
    } else {
      // Add all other area IDs
      for (final id in otherAreaIds) {
        if (!areas.contains(id)) {
          areas.add(id);
        }
      }
    }
    _filterState = _filterState.copyWith(areas: areas);
    notifyListeners();
  }

  // Get count of programs for "Other" areas (Bay Area, Statewide, Nationwide)
  int getOtherAreasCount() {
    return _getFilteredProgramsExcluding(excludeArea: true)
        .where((p) => p.areas.any((name) => _otherAreaNames.contains(name)))
        .length;
  }

  void clearFilters() {
    _filterState = FilterState();
    notifyListeners();
  }

  void setSortOption(SortOption option) {
    _sortOption = option;
    notifyListeners();
  }

  void applyFilterPreset(FilterPreset preset) {
    _filterState = preset.filters;
    notifyListeners();
  }

  // Favorites methods
  Future<void> toggleFavorite(String programId) async {
    if (_favorites.contains(programId)) {
      await _apiService.removeFavorite(programId);
      _favorites.remove(programId);
      _favoriteItems.removeWhere((i) => i.programId == programId);
    } else {
      await _apiService.addFavorite(programId);
      _favorites.add(programId);
      _favoriteItems.add(FavoriteItem(
        programId: programId,
        savedAt: DateTime.now(),
      ));
    }
    notifyListeners();
    // Sync to iMessage extension
    _syncToIMessage();
  }

  bool isFavorite(String programId) {
    return _favorites.contains(programId);
  }

  /// Get the FavoriteItem for a specific program
  FavoriteItem? getFavoriteItem(String programId) {
    try {
      return _favoriteItems.firstWhere((i) => i.programId == programId);
    } catch (e) {
      return null;
    }
  }

  /// Update the status of a favorite item
  Future<void> updateFavoriteStatus(String programId, FavoriteStatus status) async {
    await _apiService.updateFavoriteStatus(programId, status);
    final index = _favoriteItems.indexWhere((i) => i.programId == programId);
    if (index != -1) {
      _favoriteItems[index].status = status;
      _favoriteItems[index].statusUpdatedAt = DateTime.now();
      notifyListeners();
    }
  }

  /// Update the notes of a favorite item
  Future<void> updateFavoriteNotes(String programId, String? notes) async {
    await _apiService.updateFavoriteNotes(programId, notes);
    final index = _favoriteItems.indexWhere((i) => i.programId == programId);
    if (index != -1) {
      _favoriteItems[index].notes = notes;
      _favoriteItems[index].statusUpdatedAt = DateTime.now();
      notifyListeners();
    }
  }

  Future<void> clearAllFavorites() async {
    for (final programId in List.from(_favorites)) {
      await _apiService.removeFavorite(programId);
    }
    _favorites.clear();
    _favoriteItems.clear();
    notifyListeners();
    // Sync to iMessage extension
    _syncToIMessage();
  }

  /// Sync current favorites to iMessage extension (iOS only)
  void _syncToIMessage() {
    final favoritePrograms = allPrograms.where((p) => _favorites.contains(p.id)).toList();
    IMessageService.syncFavorites(favoritePrograms);
  }

  // Location methods (all calculations on-device, privacy-first)
  void updateDistancesFromLocation(double userLat, double userLng) {
    for (final program in _programs) {
      if (program.latitude != null && program.longitude != null) {
        program.distanceFromUser = _calculateDistance(
          userLat, userLng,
          program.latitude!, program.longitude!,
        );
      } else {
        program.distanceFromUser = null;
      }
    }
    for (final program in _externalPrograms) {
      if (program.latitude != null && program.longitude != null) {
        program.distanceFromUser = _calculateDistance(
          userLat, userLng,
          program.latitude!, program.longitude!,
        );
      } else {
        program.distanceFromUser = null;
      }
    }
    notifyListeners();
  }

  void clearDistances() {
    for (final program in _programs) {
      program.distanceFromUser = null;
    }
    for (final program in _externalPrograms) {
      program.distanceFromUser = null;
    }
    // Reset sort to default if was distance-based
    if (_sortOption == SortOption.distanceAsc) {
      _sortOption = SortOption.recentlyVerified;
    }
    notifyListeners();
  }

  // Haversine formula for distance calculation (on-device, privacy-first)
  double _calculateDistance(double lat1, double lng1, double lat2, double lng2) {
    const double earthRadiusMiles = 3959;

    final dLat = _toRadians(lat2 - lat1);
    final dLng = _toRadians(lng2 - lng1);

    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_toRadians(lat1)) * cos(_toRadians(lat2)) *
        sin(dLng / 2) * sin(dLng / 2);

    final c = 2 * atan2(sqrt(a), sqrt(1 - a));

    return earthRadiusMiles * c;
  }

  double _toRadians(double degrees) => degrees * pi / 180;

  // Cache methods
  Future<void> clearCache() async {
    await _apiService.clearCache();
  }

  Future<int> getCacheSize() async {
    return await _apiService.getCacheSize();
  }
}
