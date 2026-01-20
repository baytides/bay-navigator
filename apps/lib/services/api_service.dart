import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/program.dart';

/// API Service for Bay Navigator
/// Fetches data from static JSON API endpoints
/// Implements offline-first caching with background sync
class ApiService {
  static const String _apiBaseUrl = 'https://baynavigator.org/api';
  static const Duration _cacheDuration = Duration(hours: 24);
  // ignore: unused_field - reserved for stale-while-revalidate pattern
  static const Duration _staleCacheDuration = Duration(days: 7);
  static const String _lastSyncKey = 'baynavigator:last_sync';
  static const String _offlineModeKey = 'baynavigator:offline_mode';

  static const String _programsCacheKey = 'baynavigator:programs';
  static const String _categoriesCacheKey = 'baynavigator:categories';
  static const String _groupsCacheKey = 'baynavigator:groups';
  static const String _areasCacheKey = 'baynavigator:areas';
  static const String _metadataCacheKey = 'baynavigator:metadata';
  static const String _favoritesCacheKey = 'baynavigator:favorites';
  static const String _recentSearchesCacheKey = 'baynavigator:recent_searches';
  static const String _filterPresetsCacheKey = 'baynavigator:filter_presets';

  static const int _maxRecentSearches = 5;
  static const int _maxPresets = 10;

  final http.Client _client;
  SharedPreferences? _prefs;

  ApiService({http.Client? client}) : _client = client ?? http.Client();

  Future<SharedPreferences> get _preferences async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  // ============================================
  // CACHING
  // ============================================

  Future<T?> _getFromCache<T>(
    String key,
    T Function(Map<String, dynamic>) fromJson, {
    bool allowStale = false,
  }) async {
    try {
      final prefs = await _preferences;
      final cached = prefs.getString(key);
      if (cached == null) return null;

      final data = jsonDecode(cached) as Map<String, dynamic>;
      final timestamp = data['timestamp'] as int;
      final age = DateTime.now().millisecondsSinceEpoch - timestamp;

      if (!allowStale && age > _cacheDuration.inMilliseconds) {
        return null;
      }

      return fromJson(data['data'] as Map<String, dynamic>);
    } catch (e) {
      return null;
    }
  }

  Future<List<T>?> _getListFromCache<T>(
    String key,
    T Function(Map<String, dynamic>) fromJson, {
    bool allowStale = false,
  }) async {
    try {
      final prefs = await _preferences;
      final cached = prefs.getString(key);
      if (cached == null) return null;

      final data = jsonDecode(cached) as Map<String, dynamic>;
      final timestamp = data['timestamp'] as int;
      final age = DateTime.now().millisecondsSinceEpoch - timestamp;

      if (!allowStale && age > _cacheDuration.inMilliseconds) {
        return null;
      }

      final list = data['data'] as List;
      return list.map((item) => fromJson(item as Map<String, dynamic>)).toList();
    } catch (e) {
      return null;
    }
  }

  Future<void> _saveToCache(String key, dynamic data) async {
    try {
      final prefs = await _preferences;
      final cached = jsonEncode({
        'data': data,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      });
      await prefs.setString(key, cached);
    } catch (e) {
      // Cache write failed, continue silently
    }
  }

  // ============================================
  // API CALLS
  // ============================================

  Future<List<Program>> getPrograms({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await _getListFromCache<Program>(
        _programsCacheKey,
        Program.fromJson,
      );
      if (cached != null) return cached;
    }

    try {
      final response = await _client
          .get(Uri.parse('$_apiBaseUrl/programs.json'))
          .timeout(const Duration(seconds: 12));

      if (response.statusCode != 200) {
        throw Exception('HTTP ${response.statusCode}');
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final programs = (data['programs'] as List)
          .map((p) => Program.fromJson(p as Map<String, dynamic>))
          .toList();

      await _saveToCache(_programsCacheKey, data['programs']);
      return programs;
    } catch (e) {
      // Try stale cache on error
      final cached = await _getListFromCache<Program>(
        _programsCacheKey,
        Program.fromJson,
        allowStale: true,
      );
      if (cached != null) return cached;
      rethrow;
    }
  }

  Future<Program> getProgram(String id) async {
    final response = await _client
        .get(Uri.parse('$_apiBaseUrl/programs/$id.json'))
        .timeout(const Duration(seconds: 12));

    if (response.statusCode != 200) {
      throw Exception('Program not found: $id');
    }

    return Program.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<List<ProgramCategory>> getCategories({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await _getListFromCache<ProgramCategory>(
        _categoriesCacheKey,
        ProgramCategory.fromJson,
      );
      if (cached != null) return cached;
    }

    try {
      final response = await _client
          .get(Uri.parse('$_apiBaseUrl/categories.json'))
          .timeout(const Duration(seconds: 12));

      if (response.statusCode != 200) {
        throw Exception('HTTP ${response.statusCode}');
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final categories = (data['categories'] as List)
          .map((c) => ProgramCategory.fromJson(c as Map<String, dynamic>))
          .toList();

      await _saveToCache(_categoriesCacheKey, data['categories']);
      return categories;
    } catch (e) {
      final cached = await _getListFromCache<ProgramCategory>(
        _categoriesCacheKey,
        ProgramCategory.fromJson,
        allowStale: true,
      );
      if (cached != null) return cached;
      rethrow;
    }
  }

  Future<List<ProgramGroup>> getGroups({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await _getListFromCache<ProgramGroup>(
        _groupsCacheKey,
        ProgramGroup.fromJson,
      );
      if (cached != null) return cached;
    }

    try {
      final response = await _client
          .get(Uri.parse('$_apiBaseUrl/groups.json'))
          .timeout(const Duration(seconds: 12));

      if (response.statusCode != 200) {
        throw Exception('HTTP ${response.statusCode}');
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final groups = (data['groups'] as List)
          .map((g) => ProgramGroup.fromJson(g as Map<String, dynamic>))
          .toList();

      await _saveToCache(_groupsCacheKey, data['groups']);
      return groups;
    } catch (e) {
      final cached = await _getListFromCache<ProgramGroup>(
        _groupsCacheKey,
        ProgramGroup.fromJson,
        allowStale: true,
      );
      if (cached != null) return cached;
      rethrow;
    }
  }

  Future<List<Area>> getAreas({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await _getListFromCache<Area>(
        _areasCacheKey,
        Area.fromJson,
      );
      if (cached != null) return cached;
    }

    try {
      final response = await _client
          .get(Uri.parse('$_apiBaseUrl/areas.json'))
          .timeout(const Duration(seconds: 12));

      if (response.statusCode != 200) {
        throw Exception('HTTP ${response.statusCode}');
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final areas = (data['areas'] as List)
          .map((a) => Area.fromJson(a as Map<String, dynamic>))
          .toList();

      await _saveToCache(_areasCacheKey, data['areas']);
      return areas;
    } catch (e) {
      final cached = await _getListFromCache<Area>(
        _areasCacheKey,
        Area.fromJson,
        allowStale: true,
      );
      if (cached != null) return cached;
      rethrow;
    }
  }

  Future<APIMetadata> getMetadata({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await _getFromCache<APIMetadata>(
        _metadataCacheKey,
        APIMetadata.fromJson,
      );
      if (cached != null) return cached;
    }

    try {
      final response = await _client
          .get(Uri.parse('$_apiBaseUrl/metadata.json'))
          .timeout(const Duration(seconds: 12));

      if (response.statusCode != 200) {
        throw Exception('HTTP ${response.statusCode}');
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      await _saveToCache(_metadataCacheKey, data);
      return APIMetadata.fromJson(data);
    } catch (e) {
      final cached = await _getFromCache<APIMetadata>(
        _metadataCacheKey,
        APIMetadata.fromJson,
        allowStale: true,
      );
      if (cached != null) return cached;
      rethrow;
    }
  }

  // ============================================
  // SEARCH & FILTER
  // ============================================

  Future<List<Program>> searchPrograms(String query) async {
    final programs = await getPrograms();
    final lowerQuery = query.toLowerCase();

    return programs.where((program) =>
      program.name.toLowerCase().contains(lowerQuery) ||
      program.description.toLowerCase().contains(lowerQuery)
    ).toList();
  }

  Future<List<Program>> filterPrograms({
    List<String> categories = const [],
    List<String> groups = const [],
    List<String> areas = const [],
    String searchQuery = '',
  }) async {
    var programs = await getPrograms();

    // Apply search query
    if (searchQuery.isNotEmpty) {
      final lowerQuery = searchQuery.toLowerCase();
      programs = programs.where((p) =>
        p.name.toLowerCase().contains(lowerQuery) ||
        p.description.toLowerCase().contains(lowerQuery)
      ).toList();
    }

    // Apply category filter
    if (categories.isNotEmpty) {
      programs = programs.where((p) => categories.contains(p.category)).toList();
    }

    // Apply groups filter (formerly eligibility)
    if (groups.isNotEmpty) {
      programs = programs.where((p) =>
        groups.any((g) => p.groups.contains(g))
      ).toList();
    }

    // Apply area filter
    if (areas.isNotEmpty) {
      programs = programs.where((p) =>
        areas.any((a) => p.areas.contains(a))
      ).toList();
    }

    return programs;
  }

  // ============================================
  // FAVORITES
  // ============================================

  static const String _favoriteItemsCacheKey = 'baynavigator:favorite_items';

  Future<List<String>> getFavorites() async {
    try {
      final prefs = await _preferences;
      final favorites = prefs.getString(_favoritesCacheKey);
      if (favorites == null) return [];
      return List<String>.from(jsonDecode(favorites) as List);
    } catch (e) {
      return [];
    }
  }

  /// Get full favorite items with status and notes
  Future<List<FavoriteItem>> getFavoriteItems() async {
    try {
      final prefs = await _preferences;
      final itemsJson = prefs.getString(_favoriteItemsCacheKey);
      if (itemsJson == null) {
        // Migrate from old format if needed
        final legacyFavorites = await getFavorites();
        if (legacyFavorites.isNotEmpty) {
          final items = legacyFavorites.map((id) => FavoriteItem(
            programId: id,
            savedAt: DateTime.now(),
          )).toList();
          await _saveFavoriteItems(items);
          return items;
        }
        return [];
      }
      final List<dynamic> items = jsonDecode(itemsJson) as List;
      return items.map((item) => FavoriteItem.fromJson(item as Map<String, dynamic>)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<void> _saveFavoriteItems(List<FavoriteItem> items) async {
    final prefs = await _preferences;
    final json = jsonEncode(items.map((i) => i.toJson()).toList());
    await prefs.setString(_favoriteItemsCacheKey, json);
    // Keep legacy format in sync for backwards compatibility
    await prefs.setString(_favoritesCacheKey, jsonEncode(items.map((i) => i.programId).toList()));
  }

  Future<void> addFavorite(String programId) async {
    final items = await getFavoriteItems();
    if (!items.any((i) => i.programId == programId)) {
      items.add(FavoriteItem(
        programId: programId,
        savedAt: DateTime.now(),
      ));
      await _saveFavoriteItems(items);
    }
  }

  Future<void> removeFavorite(String programId) async {
    final items = await getFavoriteItems();
    items.removeWhere((i) => i.programId == programId);
    await _saveFavoriteItems(items);
  }

  Future<bool> isFavorite(String programId) async {
    final items = await getFavoriteItems();
    return items.any((i) => i.programId == programId);
  }

  /// Get favorite item for a specific program
  Future<FavoriteItem?> getFavoriteItem(String programId) async {
    final items = await getFavoriteItems();
    try {
      return items.firstWhere((i) => i.programId == programId);
    } catch (e) {
      return null;
    }
  }

  /// Update status for a favorite item
  Future<void> updateFavoriteStatus(String programId, FavoriteStatus status) async {
    final items = await getFavoriteItems();
    final index = items.indexWhere((i) => i.programId == programId);
    if (index != -1) {
      items[index].status = status;
      items[index].statusUpdatedAt = DateTime.now();
      await _saveFavoriteItems(items);
    }
  }

  /// Update notes for a favorite item
  Future<void> updateFavoriteNotes(String programId, String? notes) async {
    final items = await getFavoriteItems();
    final index = items.indexWhere((i) => i.programId == programId);
    if (index != -1) {
      items[index].notes = notes;
      items[index].statusUpdatedAt = DateTime.now();
      await _saveFavoriteItems(items);
    }
  }

  // ============================================
  // RECENT SEARCHES
  // ============================================

  Future<List<String>> getRecentSearches() async {
    try {
      final prefs = await _preferences;
      final searches = prefs.getString(_recentSearchesCacheKey);
      if (searches == null) return [];
      return List<String>.from(jsonDecode(searches) as List);
    } catch (e) {
      return [];
    }
  }

  Future<void> addRecentSearch(String query) async {
    if (query.length < 2) return;

    var searches = await getRecentSearches();
    searches.removeWhere((s) => s.toLowerCase() == query.toLowerCase());
    searches.insert(0, query);
    if (searches.length > _maxRecentSearches) {
      searches = searches.sublist(0, _maxRecentSearches);
    }

    final prefs = await _preferences;
    await prefs.setString(_recentSearchesCacheKey, jsonEncode(searches));
  }

  Future<void> clearRecentSearches() async {
    final prefs = await _preferences;
    await prefs.remove(_recentSearchesCacheKey);
  }

  // ============================================
  // FILTER PRESETS
  // ============================================

  Future<List<FilterPreset>> getFilterPresets() async {
    try {
      final prefs = await _preferences;
      final presets = prefs.getString(_filterPresetsCacheKey);
      if (presets == null) return [];
      final list = jsonDecode(presets) as List;
      return list.map((p) => FilterPreset.fromJson(p as Map<String, dynamic>)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<FilterPreset?> saveFilterPreset(String name, FilterState filters) async {
    if (name.trim().isEmpty) return null;

    final presets = await getFilterPresets();
    if (presets.length >= _maxPresets) return null;

    final preset = FilterPreset(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name.trim(),
      filters: filters,
      createdAt: DateTime.now().toIso8601String(),
    );

    presets.insert(0, preset);
    final prefs = await _preferences;
    await prefs.setString(
      _filterPresetsCacheKey,
      jsonEncode(presets.map((p) => p.toJson()).toList()),
    );
    return preset;
  }

  Future<void> deleteFilterPreset(String id) async {
    final presets = await getFilterPresets();
    presets.removeWhere((p) => p.id == id);
    final prefs = await _preferences;
    await prefs.setString(
      _filterPresetsCacheKey,
      jsonEncode(presets.map((p) => p.toJson()).toList()),
    );
  }

  // ============================================
  // AI SEARCH (Ollama LLM at ai.baytides.org)
  // ============================================

  static const String _aiEndpoint = 'https://ai.baytides.org/api/chat';
  // API key from build-time environment or fallback
  static const String _aiApiKey = String.fromEnvironment(
    'OLLAMA_API_KEY',
    defaultValue: 'bnav_a76a835781d394a03aaf1662d76fd1f05e78da85bf8edf27c8f26fbb9d2b79f0',
  );
  static const String _conversationHistoryCacheKey = 'baynavigator:conversation_history';

  // System prompt for Carl - CONDENSED for faster API responses
  static const String _systemPrompt = '''You're Carl, Bay Navigator's AI (named after Karl the Fog, C for Chat). Help Bay Area residents find programs.

RULES:
1. Ask city/zip FIRST (unless crisis)
2. ONLY link to baynavigator.org - NEVER external sites
3. Crisis (911/988/DV hotline) = respond immediately, no location needed
4. Be concise, warm. Available 24/7!

LINKS (use these, not external):
Food: baynavigator.org/eligibility/food-assistance
Health: baynavigator.org/eligibility/healthcare
Housing: baynavigator.org/eligibility/housing-assistance
Utilities: baynavigator.org/eligibility/utility-programs
Cash: baynavigator.org/eligibility/cash-assistance
Seniors: baynavigator.org/eligibility/seniors
Veterans: baynavigator.org/eligibility/military-veterans
Directory: baynavigator.org/directory

KEY PROGRAMS: CalFresh (\$292/mo 1 person), Medi-Cal (free health), CARE (20% off PG&E), Section 8 (rent help, long waits).

CRISIS: 911 emergency, 988 suicide/crisis, 1-800-799-7233 DV.''';

  /// Sanitize query to remove PII before sending to LLM
  String _sanitizeQuery(String query) {
    return query
        // SSN with dashes (XXX-XX-XXXX)
        .replaceAll(RegExp(r'\b\d{3}-\d{2}-\d{4}\b'), '[REDACTED]')
        // SSN without dashes (9 consecutive digits)
        .replaceAll(RegExp(r'\b\d{9}\b'), '[REDACTED]')
        // Email addresses
        .replaceAll(RegExp(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'), '[REDACTED]')
        // Phone numbers (various formats)
        .replaceAll(RegExp(r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b'), '[REDACTED]')
        .replaceAll(RegExp(r'\(\d{3}\)\s*\d{3}[-.\s]?\d{4}'), '[REDACTED]')
        // Credit card numbers
        .replaceAll(RegExp(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{1,7}\b'), '[REDACTED]')
        // Bank account numbers (8-17 digits)
        .replaceAll(RegExp(r'\b\d{8,17}\b'), '[REDACTED]');
  }

  /// Perform an AI-powered search using the Ollama LLM
  /// Returns the AI message and optionally matching programs
  Future<AISearchResult> performAISearch({
    required String query,
    List<Map<String, String>>? conversationHistory,
    String? location,
    String? county,
  }) async {
    try {
      final history = conversationHistory ?? await getConversationHistory();

      // Sanitize the query to remove PII
      final sanitizedQuery = _sanitizeQuery(query);

      // Build messages array for Ollama chat API
      final messages = <Map<String, String>>[
        {'role': 'system', 'content': _systemPrompt},
        // Add conversation history (sanitized)
        ...history.take(6).map((msg) => {
          'role': msg['role']!,
          'content': msg['role'] == 'user' ? _sanitizeQuery(msg['content']!) : msg['content']!,
        }),
        {'role': 'user', 'content': sanitizedQuery},
      ];

      final response = await _client
          .post(
            Uri.parse(_aiEndpoint),
            headers: {
              'Content-Type': 'application/json',
              if (_aiApiKey.isNotEmpty) 'X-API-Key': _aiApiKey,
            },
            body: jsonEncode({
              'model': 'llama3.1:8b-instruct-q4_K_M',
              'messages': messages,
              'stream': false,  // Non-streaming for simplicity in Flutter
              'options': {
                'temperature': 0.5,
                'num_predict': 256,
                'num_ctx': 2048,
              },
            }),
          )
          .timeout(const Duration(seconds: 45));

      if (response.statusCode != 200) {
        final error = jsonDecode(response.body);
        throw Exception(error['error'] ?? 'AI search failed');
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      // Extract message from Ollama response format
      String aiMessage = '';
      if (data['message'] != null && data['message']['content'] != null) {
        aiMessage = data['message']['content'] as String;
      } else if (data['response'] != null) {
        aiMessage = data['response'] as String;
      }

      // Update conversation history
      await _addToConversationHistory('user', query);
      if (aiMessage.isNotEmpty) {
        await _addToConversationHistory('assistant', aiMessage);
      }

      // Try to find matching programs based on query keywords
      final programs = await _findRelevantPrograms(query);

      return AISearchResult(
        message: aiMessage.isNotEmpty
            ? aiMessage
            : "I couldn't generate a response. Please try searching the directory directly.",
        programs: programs,
        quickAnswer: null,
        tier: 'llm',
      );
    } catch (e) {
      if (e.toString().contains('TimeoutException')) {
        throw Exception('AI search timed out. Please try again.');
      }
      rethrow;
    }
  }

  /// Find relevant programs based on query keywords
  Future<List<Program>> _findRelevantPrograms(String query) async {
    try {
      final programs = await getPrograms();
      final lowerQuery = query.toLowerCase();

      // Category mapping from query keywords
      final categoryKeywords = <String, List<String>>{
        'food': ['food', 'grocery', 'groceries', 'hungry', 'calfresh', 'snap', 'wic', 'eat', 'meal'],
        'health': ['health', 'healthcare', 'medical', 'medi-cal', 'medicaid', 'doctor', 'hospital', 'clinic'],
        'housing': ['housing', 'rent', 'shelter', 'homeless', 'eviction', 'apartment', 'section 8'],
        'utilities': ['utility', 'utilities', 'electric', 'gas', 'pge', 'bill', 'care program', 'liheap'],
        'transportation': ['transportation', 'bus', 'transit', 'ride', 'paratransit'],
        'employment': ['job', 'employment', 'work', 'career', 'training'],
        'education': ['education', 'school', 'college', 'student', 'learning'],
        'legal': ['legal', 'lawyer', 'attorney', 'court'],
      };

      // Find matching categories
      final matchingCategories = <String>[];
      for (final entry in categoryKeywords.entries) {
        for (final keyword in entry.value) {
          if (lowerQuery.contains(keyword)) {
            matchingCategories.add(entry.key);
            break;
          }
        }
      }

      // Filter programs by matching categories
      if (matchingCategories.isNotEmpty) {
        return programs
            .where((p) => matchingCategories.contains(p.category.toLowerCase()))
            .take(5)
            .toList();
      }

      // Fallback: search by name/description
      return programs
          .where((p) =>
              p.name.toLowerCase().contains(lowerQuery) ||
              p.description.toLowerCase().contains(lowerQuery))
          .take(5)
          .toList();
    } catch (e) {
      return [];
    }
  }

  /// Get conversation history for AI context
  Future<List<Map<String, String>>> getConversationHistory() async {
    try {
      final prefs = await _preferences;
      final history = prefs.getString(_conversationHistoryCacheKey);
      if (history == null) return [];

      final list = jsonDecode(history) as List;
      return list.map((item) => Map<String, String>.from(item as Map)).toList();
    } catch (e) {
      return [];
    }
  }

  /// Add a message to conversation history
  Future<void> _addToConversationHistory(String role, String content) async {
    try {
      final history = await getConversationHistory();
      history.add({'role': role, 'content': content});

      // Keep only the last 10 messages
      final trimmed = history.length > 10 ? history.sublist(history.length - 10) : history;

      final prefs = await _preferences;
      await prefs.setString(_conversationHistoryCacheKey, jsonEncode(trimmed));
    } catch (e) {
      // Silently fail
    }
  }

  /// Clear conversation history
  Future<void> clearConversationHistory() async {
    final prefs = await _preferences;
    await prefs.remove(_conversationHistoryCacheKey);
  }

  /// Check if a query should use AI search (complex/natural language queries)
  bool shouldUseAISearch(String query) {
    if (query.length < 10) return false;

    // Demographic/eligibility terms that suggest complex queries
    final demographicTerms = [
      'senior', 'elderly', 'veteran', 'disabled', 'disability',
      'student', 'low-income', 'homeless', 'immigrant', 'lgbtq',
      'family', 'child', 'parent', 'youth', 'teen',
    ];

    // Natural language patterns
    final naturalPatterns = [
      'i need', 'i\'m looking', 'help with', 'how can i', 'where can i',
      'looking for', 'need help', 'can you help', 'what programs',
      'i am a', 'i\'m a', 'my family', 'we need',
    ];

    final lowerQuery = query.toLowerCase();

    // Check for demographic terms
    for (final term in demographicTerms) {
      if (lowerQuery.contains(term)) return true;
    }

    // Check for natural language patterns
    for (final pattern in naturalPatterns) {
      if (lowerQuery.contains(pattern)) return true;
    }

    // Multiple words with spaces suggest natural language
    final wordCount = query.split(' ').where((w) => w.length > 2).length;
    if (wordCount >= 4) return true;

    return false;
  }

  /// Detect crisis keywords in a query
  CrisisType? detectCrisis(String query) {
    final lowerQuery = query.toLowerCase();

    // Emergency keywords
    const emergencyKeywords = [
      'emergency', 'danger', 'hurt', 'attack', 'abuse',
      'violence', 'domestic violence', 'unsafe', 'threatened',
    ];

    // Mental health crisis keywords
    const mentalHealthKeywords = [
      'suicide', 'suicidal', 'kill myself', 'end my life',
      'don\'t want to live', 'want to die', 'self-harm',
      'cutting', 'hurting myself', 'crisis', 'desperate',
    ];

    for (final keyword in emergencyKeywords) {
      if (lowerQuery.contains(keyword)) return CrisisType.emergency;
    }

    for (final keyword in mentalHealthKeywords) {
      if (lowerQuery.contains(keyword)) return CrisisType.mentalHealth;
    }

    return null;
  }

  // ============================================
  // USER PROFILES
  // ============================================

  static const String _profilesCacheKey = 'baynavigator:profiles';
  static const String _activeProfileCacheKey = 'baynavigator:active_profile';
  static const int _maxProfiles = 6;
  static const int _maxSavedPerProfile = 50;

  /// Get all user profiles
  Future<List<UserProfile>> getProfiles() async {
    try {
      final prefs = await _preferences;
      final profiles = prefs.getString(_profilesCacheKey);
      if (profiles == null) return [];

      final list = jsonDecode(profiles) as List;
      return list.map((p) => UserProfile.fromJson(p as Map<String, dynamic>)).toList();
    } catch (e) {
      return [];
    }
  }

  /// Get active profile ID
  Future<String?> getActiveProfileId() async {
    final prefs = await _preferences;
    return prefs.getString(_activeProfileCacheKey);
  }

  /// Set active profile ID
  Future<void> setActiveProfileId(String? id) async {
    final prefs = await _preferences;
    if (id == null) {
      await prefs.remove(_activeProfileCacheKey);
    } else {
      await prefs.setString(_activeProfileCacheKey, id);
    }
  }

  /// Create a new profile
  Future<UserProfile?> createProfile({
    required String name,
    required String relationship,
    required int colorIndex,
    List<String> eligibilityGroups = const [],
    String? county,
  }) async {
    final profiles = await getProfiles();
    if (profiles.length >= _maxProfiles) return null;

    final profile = UserProfile(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      relationship: relationship,
      colorIndex: colorIndex,
      eligibilityGroups: eligibilityGroups,
      county: county,
      createdAt: DateTime.now(),
    );

    profiles.add(profile);
    await _saveProfiles(profiles);

    // If this is the first profile, set it as active
    if (profiles.length == 1) {
      await setActiveProfileId(profile.id);
    }

    return profile;
  }

  /// Update an existing profile
  Future<void> updateProfile(UserProfile profile) async {
    final profiles = await getProfiles();
    final index = profiles.indexWhere((p) => p.id == profile.id);
    if (index != -1) {
      profiles[index] = profile;
      await _saveProfiles(profiles);
    }
  }

  /// Delete a profile and its saved programs
  Future<void> deleteProfile(String id) async {
    final profiles = await getProfiles();
    profiles.removeWhere((p) => p.id == id);
    await _saveProfiles(profiles);

    // Clear saved programs for this profile
    await clearProfileFavorites(id);

    // If deleted profile was active, switch to first available or none
    final activeId = await getActiveProfileId();
    if (activeId == id) {
      await setActiveProfileId(profiles.isNotEmpty ? profiles.first.id : null);
    }
  }

  Future<void> _saveProfiles(List<UserProfile> profiles) async {
    final prefs = await _preferences;
    await prefs.setString(
      _profilesCacheKey,
      jsonEncode(profiles.map((p) => p.toJson()).toList()),
    );
  }

  /// Get favorites for a specific profile
  Future<List<String>> getProfileFavorites(String profileId) async {
    try {
      final prefs = await _preferences;
      final key = '${_favoritesCacheKey}_$profileId';
      final favorites = prefs.getString(key);
      if (favorites == null) return [];
      return List<String>.from(jsonDecode(favorites) as List);
    } catch (e) {
      return [];
    }
  }

  /// Add a favorite for a specific profile
  Future<bool> addProfileFavorite(String profileId, String programId) async {
    final favorites = await getProfileFavorites(profileId);
    if (favorites.length >= _maxSavedPerProfile) return false;
    if (favorites.contains(programId)) return true;

    favorites.add(programId);
    final prefs = await _preferences;
    final key = '${_favoritesCacheKey}_$profileId';
    await prefs.setString(key, jsonEncode(favorites));
    return true;
  }

  /// Remove a favorite for a specific profile
  Future<void> removeProfileFavorite(String profileId, String programId) async {
    final favorites = await getProfileFavorites(profileId);
    favorites.remove(programId);
    final prefs = await _preferences;
    final key = '${_favoritesCacheKey}_$profileId';
    await prefs.setString(key, jsonEncode(favorites));
  }

  /// Check if a program is favorited for a profile
  Future<bool> isProfileFavorite(String profileId, String programId) async {
    final favorites = await getProfileFavorites(profileId);
    return favorites.contains(programId);
  }

  /// Clear all favorites for a profile
  Future<void> clearProfileFavorites(String profileId) async {
    final prefs = await _preferences;
    final key = '${_favoritesCacheKey}_$profileId';
    await prefs.remove(key);
  }

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  Future<void> clearCache() async {
    final prefs = await _preferences;
    final keys = [
      _programsCacheKey,
      _categoriesCacheKey,
      _groupsCacheKey,
      _areasCacheKey,
      _metadataCacheKey,
      // Don't clear favorites or profiles
    ];
    for (final key in keys) {
      await prefs.remove(key);
    }
  }

  Future<int> getCacheSize() async {
    try {
      final prefs = await _preferences;
      final keys = prefs.getKeys().where((k) => k.startsWith('baynavigator:'));
      int totalSize = 0;
      for (final key in keys) {
        final value = prefs.getString(key);
        if (value != null) {
          totalSize += value.length;
        }
      }
      return totalSize;
    } catch (e) {
      return 0;
    }
  }

  // ============================================
  // OFFLINE-FIRST SYNC
  // ============================================

  /// Check if we have valid cached data (can work offline)
  Future<bool> hasValidCache() async {
    try {
      final cached = await _getListFromCache<Program>(
        _programsCacheKey,
        Program.fromJson,
        allowStale: true,
      );
      return cached != null && cached.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  /// Get the last sync timestamp
  Future<DateTime?> getLastSyncTime() async {
    try {
      final prefs = await _preferences;
      final timestamp = prefs.getInt(_lastSyncKey);
      if (timestamp == null) return null;
      return DateTime.fromMillisecondsSinceEpoch(timestamp);
    } catch (e) {
      return null;
    }
  }

  /// Update the last sync timestamp
  Future<void> _updateLastSyncTime() async {
    try {
      final prefs = await _preferences;
      await prefs.setInt(_lastSyncKey, DateTime.now().millisecondsSinceEpoch);
    } catch (e) {
      // Silently fail
    }
  }

  /// Check if a background sync is needed
  Future<bool> needsSync() async {
    final lastSync = await getLastSyncTime();
    if (lastSync == null) return true;

    final age = DateTime.now().difference(lastSync);
    return age > _cacheDuration;
  }

  /// Perform a background sync of all data
  /// Returns true if sync was successful
  Future<bool> performBackgroundSync() async {
    try {
      // Sync all data types in parallel
      await Future.wait([
        getPrograms(forceRefresh: true),
        getCategories(forceRefresh: true),
        getGroups(forceRefresh: true),
        getAreas(forceRefresh: true),
        getMetadata(forceRefresh: true),
      ]);

      await _updateLastSyncTime();
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Get sync status for UI display
  Future<SyncStatus> getSyncStatus() async {
    final hasCache = await hasValidCache();
    final lastSync = await getLastSyncTime();
    final needsUpdate = await needsSync();

    if (!hasCache) {
      return SyncStatus(
        status: SyncState.noData,
        lastSync: null,
        message: 'No data cached. Connect to internet to load programs.',
      );
    }

    if (needsUpdate) {
      return SyncStatus(
        status: SyncState.stale,
        lastSync: lastSync,
        message: lastSync != null
            ? 'Data from ${_formatLastSync(lastSync)}. Pull to refresh.'
            : 'Data may be outdated. Pull to refresh.',
      );
    }

    return SyncStatus(
      status: SyncState.fresh,
      lastSync: lastSync,
      message: 'Data up to date',
    );
  }

  String _formatLastSync(DateTime lastSync) {
    final now = DateTime.now();
    final diff = now.difference(lastSync);

    if (diff.inMinutes < 60) {
      return '${diff.inMinutes} minutes ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours} hours ago';
    } else if (diff.inDays == 1) {
      return 'yesterday';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} days ago';
    } else {
      return '${lastSync.month}/${lastSync.day}';
    }
  }

  /// Prefetch all data for offline use
  /// Useful when user has good connectivity
  Future<void> prefetchForOffline() async {
    await performBackgroundSync();
  }

  /// Check if the app is in offline mode
  Future<bool> isOfflineMode() async {
    final prefs = await _preferences;
    return prefs.getBool(_offlineModeKey) ?? false;
  }

  /// Set offline mode (user preference)
  Future<void> setOfflineMode(bool enabled) async {
    final prefs = await _preferences;
    await prefs.setBool(_offlineModeKey, enabled);
  }
}

/// Sync status for UI display
enum SyncState { fresh, stale, noData, syncing }

class SyncStatus {
  final SyncState status;
  final DateTime? lastSync;
  final String message;

  SyncStatus({
    required this.status,
    this.lastSync,
    required this.message,
  });
}
