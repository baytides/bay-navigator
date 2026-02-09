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
  // AI SEARCH (Two-Call Pattern: Intent → Typesense → Response)
  // ============================================

  /// Typesense search proxy (Azure Function)
  static const String _typesenseSearchUrl =
      'https://baynavigator-search.azurewebsites.net/api/search';

  /// vLLM endpoint (GPU-accelerated, OpenAI-compatible)
  static const String _vllmEndpoint = 'https://ai.baytides.org/v1/chat/completions';

  /// Ollama endpoint (CPU fallback)
  static const String _directAIEndpoint = 'https://ai.baytides.org/api/chat';

  /// CDN endpoints for AI (domain fronting - all route /api/chat to ai.baytides.org)
  static const Map<String, String> _cdnAIEndpoints = {
    'cloudflare': 'https://baynavigator-ai-proxy.autumn-disk-6090.workers.dev/api/chat',
    'fastly': 'https://arguably-unique-hippo.global.ssl.fastly.net/api/chat',
    'azure': 'https://baynavigator-bacwcda5f8csa3as.z02.azurefd.net/api/chat',
  };

  // API key from build-time environment or fallback
  static const String _aiApiKey = String.fromEnvironment(
    'OLLAMA_API_KEY',
    defaultValue: 'bnav_a76a835781d394a03aaf1662d76fd1f05e78da85bf8edf27c8f26fbb9d2b79f0',
  );

  /// Whether to use domain fronting for AI requests (for censorship circumvention)
  static bool _useDomainFronting = false;

  /// Selected CDN provider for domain fronting (cloudflare, fastly, azure)
  static String _cdnProvider = 'cloudflare';

  /// Enable or disable domain fronting for AI requests
  static void setDomainFronting(bool enabled, {String provider = 'cloudflare'}) {
    _useDomainFronting = enabled;
    _cdnProvider = provider;
  }

  /// Get the appropriate AI endpoint based on privacy settings
  static String get _aiEndpoint =>
      _useDomainFronting ? (_cdnAIEndpoints[_cdnProvider] ?? _directAIEndpoint) : _directAIEndpoint;
  static const String _conversationHistoryCacheKey = 'baynavigator:conversation_history';

  // Intent parser prompt (Call 1 of two-call pattern)
  static const String _intentParserPrompt =
      '''You are a search intent parser for a Bay Area benefits directory.
Given the user message and conversation history, output ONLY valid JSON (no markdown, no explanation):
{
  "query": "search terms for program lookup",
  "category": "food|health|housing|legal|employment|education|transit|crisis|general",
  "needs_location": true/false,
  "is_greeting": true/false,
  "is_crisis": true/false
}
Rules:
- "query" should be 1-5 keywords optimized for searching a program database
- Crisis keywords (suicide, abuse, danger, homeless emergency): set is_crisis=true
- Greetings (hi, hello, hey): set is_greeting=true, query=""
- Keep query concise — no filler words''';

  // Response formatter prompt (Call 2 of two-call pattern)
  static const String _responseFormatterPrompt =
      '''You are Carl, a friendly Bay Area benefits assistant named after Karl the Fog.
STYLE: Warm, casual, brief (2-3 sentences). Like texting a helpful friend.
RULES:
- ONLY mention programs listed in [PROGRAMS]. Never invent names/phones/addresses.
- If programs are listed, mention 2-3 by name. Users see clickable cards below your message.
- Link ONLY to real baynavigator.org pages: /directory, /eligibility, /eligibility/food-assistance, /eligibility/healthcare, /eligibility/housing-assistance, /eligibility/utility-programs, /eligibility/cash-assistance, /map
- If no programs match, suggest /directory or call 211
- For crisis: give 988 (suicide), 1-800-799-7233 (DV), 911 (emergency) IMMEDIATELY
ELIGIBILITY CHEAT SHEET:
- Medicare: 65+ or disabled
- Medi-Cal: income <\$1,677/mo (1 person)
- CalFresh: income <\$1,580/mo (~\$234/mo benefit)
- CARE: auto if on CalFresh/Medi-Cal, 20% off PG&E''';

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

  /// Search via Typesense proxy (Azure Function)
  /// Returns programs matching the query with typo tolerance and faceting
  Future<List<Program>> searchViaTypesense(String query, {String? category, int limit = 8}) async {
    try {
      final params = <String, String>{'q': query, 'limit': limit.toString()};
      if (category != null && category != 'general') {
        const categoryMap = {
          'food': 'Food',
          'health': 'Health',
          'housing': 'Community Services',
          'legal': 'Legal',
          'employment': 'Employment',
          'education': 'Education',
        };
        final facetValue = categoryMap[category];
        if (facetValue != null) params['category'] = facetValue;
      }

      final uri = Uri.parse(_typesenseSearchUrl).replace(queryParameters: params);
      final response = await _client.get(uri).timeout(const Duration(seconds: 5));

      if (response.statusCode != 200) throw Exception('Typesense ${response.statusCode}');

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final results = data['results'] as List? ?? [];

      return results.map((r) {
        final item = r as Map<String, dynamic>;
        return Program(
          id: item['id'] as String? ?? '',
          name: item['name'] as String? ?? '',
          description: item['description'] as String? ?? '',
          category: item['category'] as String? ?? '',
          areas: item['area'] != null ? [item['area'] as String] : [],
          city: item['city'] as String?,
          groups: (item['groups'] as List?)?.cast<String>() ?? [],
          phone: item['phone'] as String?,
          website: item['link'] as String? ?? '',
          lastUpdated: '',
        );
      }).toList();
    } catch (e) {
      // Fallback to local search if Typesense fails
      return searchPrograms(query);
    }
  }

  /// Call 1: Parse user intent into structured JSON via LLM
  Future<Map<String, dynamic>> _parseIntent(
    String message,
    List<Map<String, String>> history,
  ) async {
    final recentHistory = history.length > 4 ? history.sublist(history.length - 4) : history;
    final messages = <Map<String, String>>[
      {'role': 'system', 'content': _intentParserPrompt},
      ...recentHistory,
      {'role': 'user', 'content': message},
    ];

    try {
      // Use vLLM (GPU) for fast intent parsing
      final response = await _client
          .post(
            Uri.parse(_vllmEndpoint),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'model': 'qwen2.5:3b-instruct',
              'messages': messages,
              'stream': false,
              'max_tokens': 150,
              'temperature': 0.1,
            }),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode != 200) throw Exception('Intent parse failed: ${response.statusCode}');

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      // vLLM uses OpenAI format: choices[0].message.content
      final choices = data['choices'] as List?;
      final content = (choices?.first?['message']?['content'] as String?) ?? '';
      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(content);
      if (jsonMatch == null) throw Exception('No JSON in intent response');
      return jsonDecode(jsonMatch.group(0)!) as Map<String, dynamic>;
    } catch (e) {
      // Fallback: basic keyword classification
      final lowerMsg = message.toLowerCase();
      final isGreeting = RegExp(r'^(hi|hello|hey|howdy|good morning|good afternoon)\b').hasMatch(lowerMsg);
      return {
        'query': message,
        'category': 'general',
        'needs_location': false,
        'is_greeting': isGreeting,
        'is_crisis': false,
      };
    }
  }

  /// Perform an AI-powered search using two-call pattern:
  /// Call 1: Intent parse → Typesense search → Call 2: Response format
  Future<AISearchResult> performAISearch({
    required String query,
    List<Map<String, String>>? conversationHistory,
    String? location,
    String? county,
  }) async {
    try {
      final history = conversationHistory ?? await getConversationHistory();
      final sanitizedQuery = _sanitizeQuery(query);

      // Call 1: Parse intent
      final intent = await _parseIntent(sanitizedQuery, history);

      final isGreeting = intent['is_greeting'] == true;
      final isCrisis = intent['is_crisis'] == true;
      final searchQuery = (intent['query'] as String?) ?? sanitizedQuery;
      final category = (intent['category'] as String?) ?? 'general';

      // Handle greetings without search
      if (isGreeting) {
        const greeting =
            "Hey there! I'm Carl, your Bay Area benefits buddy. What can I help you find today? "
            "I know about food assistance, healthcare, housing, and more.";
        await _addToConversationHistory('user', query);
        await _addToConversationHistory('assistant', greeting);
        return AISearchResult(message: greeting, programs: [], quickAnswer: null, tier: 'greeting');
      }

      // Search via Typesense
      final programs = searchQuery.trim().isNotEmpty
          ? await searchViaTypesense(searchQuery, category: category)
          : <Program>[];

      // Build context for Call 2
      final programContext = programs.isNotEmpty
          ? programs.take(8).map((p) => '- ${p.name}: ${p.description}').join('\n')
          : 'No programs found matching this query.';

      // Call 2: Format response with search results via vLLM (GPU)
      final responseMessages = <Map<String, String>>[
        {'role': 'system', 'content': _responseFormatterPrompt},
        ...history.take(4),
        {
          'role': 'user',
          'content': '[PROGRAMS]\n$programContext\n[/PROGRAMS]\n\nUser asked: $sanitizedQuery',
        },
      ];

      final response = await _client
          .post(
            Uri.parse(_vllmEndpoint),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'model': 'qwen2.5:3b-instruct',
              'messages': responseMessages,
              'stream': false,
              'max_tokens': 250,
              'temperature': 0.4,
            }),
          )
          .timeout(const Duration(seconds: 30));

      if (response.statusCode != 200) {
        throw Exception('Response format failed: ${response.statusCode}');
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      String aiMessage = '';
      // vLLM uses OpenAI format: choices[0].message.content
      final choices = data['choices'] as List?;
      if (choices != null && choices.isNotEmpty) {
        aiMessage = (choices.first['message']?['content'] as String?) ?? '';
      } else if (data['message'] != null && data['message']['content'] != null) {
        aiMessage = data['message']['content'] as String;
      }

      await _addToConversationHistory('user', query);
      if (aiMessage.isNotEmpty) {
        await _addToConversationHistory('assistant', aiMessage);
      }

      return AISearchResult(
        message: aiMessage.isNotEmpty
            ? aiMessage
            : "I couldn't generate a response. Please try searching the directory directly.",
        programs: programs,
        quickAnswer: null,
        tier: isCrisis ? 'crisis' : 'llm',
      );
    } catch (e) {
      if (e.toString().contains('TimeoutException')) {
        throw Exception('AI search timed out. Please try again.');
      }
      rethrow;
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
