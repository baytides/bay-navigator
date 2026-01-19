// Data models for Bay Navigator API
// Matches the static JSON API structure from the main website

class Program {
  final String id;
  final String name;
  final String category;
  final String description;
  final String? fullDescription;
  final String? whatTheyOffer;
  final String? howToGetIt;
  final List<String> groups;
  final List<String> areas;
  final String? city;
  final String website;
  final String? cost;
  final String? phone;
  final String? email;
  final String? address;
  final String? requirements;
  final String? howToApply;
  final String lastUpdated;
  final double? latitude;
  final double? longitude;

  // Calculated at runtime (not persisted)
  double? distanceFromUser;

  Program({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    this.fullDescription,
    this.whatTheyOffer,
    this.howToGetIt,
    required this.groups,
    required this.areas,
    this.city,
    required this.website,
    this.cost,
    this.phone,
    this.email,
    this.address,
    this.requirements,
    this.howToApply,
    required this.lastUpdated,
    this.latitude,
    this.longitude,
    this.distanceFromUser,
  });

  factory Program.fromJson(Map<String, dynamic> json) {
    return Program(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String,
      description: json['description'] as String,
      fullDescription: json['fullDescription'] as String?,
      whatTheyOffer: json['whatTheyOffer'] as String?,
      howToGetIt: json['howToGetIt'] as String?,
      groups: List<String>.from(json['groups'] ?? json['eligibility'] ?? []),
      areas: List<String>.from(json['areas'] ?? []),
      city: json['city'] as String?,
      website: json['website'] as String? ?? '',
      cost: json['cost'] as String?,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      address: json['address'] as String?,
      requirements: json['requirements'] as String?,
      howToApply: json['howToApply'] as String?,
      lastUpdated: json['lastUpdated'] as String,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'description': description,
      'fullDescription': fullDescription,
      'whatTheyOffer': whatTheyOffer,
      'howToGetIt': howToGetIt,
      'groups': groups,
      'areas': areas,
      'city': city,
      'website': website,
      'cost': cost,
      'phone': phone,
      'email': email,
      'address': address,
      'requirements': requirements,
      'howToApply': howToApply,
      'lastUpdated': lastUpdated,
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  /// Check if program has valid coordinates
  bool get hasCoordinates => latitude != null && longitude != null;

  /// Get display description (prefer fullDescription, fallback to description)
  String get displayDescription => fullDescription ?? description;

  /// Get location text for display
  String get locationText {
    if (city != null && city!.isNotEmpty) return city!;
    if (areas.isNotEmpty) return areas.join(', ');
    return 'Bay Area';
  }

  /// Backwards-compatible alias for groups (formerly eligibility)
  List<String> get eligibility => groups;

  /// Parse whatTheyOffer into list items
  List<String> get offerItems {
    if (whatTheyOffer == null || whatTheyOffer!.isEmpty) return [];
    return whatTheyOffer!
        .split('\n')
        .map((line) => line.replaceFirst(RegExp(r'^[\s-]*'), '').trim())
        .where((line) => line.isNotEmpty)
        .toList();
  }

  /// Parse howToGetIt into numbered steps
  List<String> get howToSteps {
    if (howToGetIt == null || howToGetIt!.isEmpty) return [];
    return howToGetIt!
        .split('\n')
        .map((line) => line.replaceFirst(RegExp(r'^\d+\.\s*'), '').trim())
        .where((line) => line.isNotEmpty)
        .toList();
  }
}

class ProgramCategory {
  final String id;
  final String name;
  final String icon;
  final int programCount;

  ProgramCategory({
    required this.id,
    required this.name,
    required this.icon,
    required this.programCount,
  });

  factory ProgramCategory.fromJson(Map<String, dynamic> json) {
    return ProgramCategory(
      id: json['id'] as String,
      name: json['name'] as String,
      icon: json['icon'] as String,
      programCount: json['programCount'] as int,
    );
  }
}

class ProgramGroup {
  final String id;
  final String name;
  final String description;
  final String icon;
  final int programCount;

  ProgramGroup({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.programCount,
  });

  factory ProgramGroup.fromJson(Map<String, dynamic> json) {
    return ProgramGroup(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      icon: json['icon'] as String,
      programCount: json['programCount'] as int,
    );
  }
}

class Area {
  final String id;
  final String name;
  final String type; // 'county' | 'region' | 'state' | 'nationwide'
  final int programCount;

  Area({
    required this.id,
    required this.name,
    required this.type,
    required this.programCount,
  });

  factory Area.fromJson(Map<String, dynamic> json) {
    return Area(
      id: json['id'] as String,
      name: json['name'] as String,
      type: json['type'] as String,
      programCount: json['programCount'] as int,
    );
  }
}

class APIMetadata {
  final String version;
  final String generatedAt;
  final int totalPrograms;

  APIMetadata({
    required this.version,
    required this.generatedAt,
    required this.totalPrograms,
  });

  factory APIMetadata.fromJson(Map<String, dynamic> json) {
    return APIMetadata(
      version: json['version'] as String,
      generatedAt: json['generatedAt'] as String,
      totalPrograms: json['totalPrograms'] as int,
    );
  }
}

class FilterState {
  final List<String> categories;
  final List<String> groups;
  final List<String> areas;
  final String searchQuery;

  FilterState({
    this.categories = const [],
    this.groups = const [],
    this.areas = const [],
    this.searchQuery = '',
  });

  FilterState copyWith({
    List<String>? categories,
    List<String>? groups,
    List<String>? areas,
    String? searchQuery,
  }) {
    return FilterState(
      categories: categories ?? this.categories,
      groups: groups ?? this.groups,
      areas: areas ?? this.areas,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }

  bool get hasFilters =>
      categories.isNotEmpty ||
      groups.isNotEmpty ||
      areas.isNotEmpty ||
      searchQuery.isNotEmpty;

  // IDs for "Other" area group (Bay Area, Statewide, Nationwide)
  static const _otherAreaIds = ['bay-area', 'statewide', 'nationwide'];

  int get filterCount {
    // Count counties as individual filters, but "Other" (bay-area, statewide, nationwide) as 1
    final countyCount = areas.where((id) => !_otherAreaIds.contains(id)).length;
    final hasOther = areas.any((id) => _otherAreaIds.contains(id));
    final areaCount = countyCount + (hasOther ? 1 : 0);

    return categories.length + groups.length + areaCount +
        (searchQuery.isNotEmpty ? 1 : 0);
  }
}

class FilterPreset {
  final String id;
  final String name;
  final FilterState filters;
  final String createdAt;

  FilterPreset({
    required this.id,
    required this.name,
    required this.filters,
    required this.createdAt,
  });

  factory FilterPreset.fromJson(Map<String, dynamic> json) {
    final filtersJson = json['filters'] as Map<String, dynamic>;
    return FilterPreset(
      id: json['id'] as String,
      name: json['name'] as String,
      filters: FilterState(
        categories: List<String>.from(filtersJson['categories'] ?? []),
        groups: List<String>.from(filtersJson['groups'] ?? filtersJson['eligibility'] ?? []),
        areas: List<String>.from(filtersJson['areas'] ?? []),
        searchQuery: filtersJson['searchQuery'] as String? ?? '',
      ),
      createdAt: json['createdAt'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'filters': {
        'categories': filters.categories,
        'groups': filters.groups,
        'areas': filters.areas,
        'searchQuery': filters.searchQuery,
      },
      'createdAt': createdAt,
    };
  }
}

/// Result from AI-powered search
class AISearchResult {
  final String message;
  final List<Program> programs;
  final QuickAnswer? quickAnswer;
  final String? tier;

  AISearchResult({
    required this.message,
    required this.programs,
    this.quickAnswer,
    this.tier,
  });
}

/// Quick answer response types
enum QuickAnswerType {
  crisis,
  clarify,
  guide,
  program,
  eligibility,
}

/// Quick answer resource (phone number, hotline, etc.)
class QuickAnswerResource {
  final String name;
  final String? phone;
  final String? description;
  final String? action;

  QuickAnswerResource({
    required this.name,
    this.phone,
    this.description,
    this.action,
  });

  factory QuickAnswerResource.fromJson(Map<String, dynamic> json) {
    return QuickAnswerResource(
      name: json['name'] as String,
      phone: json['phone'] as String?,
      description: json['description'] as String?,
      action: json['action'] as String?,
    );
  }
}

/// Quick answer category for clarify responses
class QuickAnswerCategory {
  final String id;
  final String label;
  final String? icon;
  final String? search;

  QuickAnswerCategory({
    required this.id,
    required this.label,
    this.icon,
    this.search,
  });

  factory QuickAnswerCategory.fromJson(Map<String, dynamic> json) {
    return QuickAnswerCategory(
      id: json['id'] as String,
      label: json['label'] as String,
      icon: json['icon'] as String?,
      search: json['search'] as String?,
    );
  }
}

/// County contact info for location-aware responses
class CountyContact {
  final String name;
  final String phone;
  final String agency;

  CountyContact({
    required this.name,
    required this.phone,
    required this.agency,
  });

  factory CountyContact.fromJson(Map<String, dynamic> json) {
    return CountyContact(
      name: json['name'] as String,
      phone: json['phone'] as String,
      agency: json['agency'] as String,
    );
  }
}

/// Quick answer from cached responses (Tier 1)
/// Provides instant responses for common queries without AI cost
class QuickAnswer {
  final String type;
  final String? title;
  final String? message;
  final String? summary;
  final QuickAnswerResource? resource;
  final QuickAnswerResource? secondary;
  final List<QuickAnswerCategory>? categories;
  final CountyContact? countyContact;
  final String? guideUrl;
  final String? guideText;
  final String? applyUrl;
  final String? applyText;
  final String? search;

  QuickAnswer({
    required this.type,
    this.title,
    this.message,
    this.summary,
    this.resource,
    this.secondary,
    this.categories,
    this.countyContact,
    this.guideUrl,
    this.guideText,
    this.applyUrl,
    this.applyText,
    this.search,
  });

  factory QuickAnswer.fromJson(Map<String, dynamic> json) {
    return QuickAnswer(
      type: json['type'] as String,
      title: json['title'] as String?,
      message: json['message'] as String?,
      summary: json['summary'] as String?,
      resource: json['resource'] != null
          ? QuickAnswerResource.fromJson(json['resource'] as Map<String, dynamic>)
          : null,
      secondary: json['secondary'] != null
          ? QuickAnswerResource.fromJson(json['secondary'] as Map<String, dynamic>)
          : null,
      categories: json['categories'] != null
          ? (json['categories'] as List)
              .map((c) => QuickAnswerCategory.fromJson(c as Map<String, dynamic>))
              .toList()
          : null,
      countyContact: json['countyContact'] != null
          ? CountyContact.fromJson(json['countyContact'] as Map<String, dynamic>)
          : null,
      guideUrl: json['guideUrl'] as String?,
      guideText: json['guideText'] as String?,
      applyUrl: json['applyUrl'] as String?,
      applyText: json['applyText'] as String?,
      search: json['search'] as String?,
    );
  }

  /// Check if this is a crisis response that should stop further processing
  bool get isCrisis => type == 'crisis';

  /// Check if this needs user clarification before proceeding
  bool get needsClarification => type == 'clarify';
}

/// Status options for tracking application progress
enum FavoriteStatus {
  saved,
  researching,
  applied,
  waiting,
  approved,
  denied;

  String get label {
    switch (this) {
      case FavoriteStatus.saved:
        return 'Saved';
      case FavoriteStatus.researching:
        return 'Researching';
      case FavoriteStatus.applied:
        return 'Applied';
      case FavoriteStatus.waiting:
        return 'Waiting for Response';
      case FavoriteStatus.approved:
        return 'Approved';
      case FavoriteStatus.denied:
        return 'Denied';
    }
  }

  int get colorValue {
    switch (this) {
      case FavoriteStatus.saved:
        return 0xFF9E9E9E; // Grey
      case FavoriteStatus.researching:
        return 0xFF2196F3; // Blue
      case FavoriteStatus.applied:
        return 0xFFFFC107; // Amber
      case FavoriteStatus.waiting:
        return 0xFF9C27B0; // Purple
      case FavoriteStatus.approved:
        return 0xFF4CAF50; // Green
      case FavoriteStatus.denied:
        return 0xFFF44336; // Red
    }
  }

  static FavoriteStatus fromString(String value) {
    return FavoriteStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => FavoriteStatus.saved,
    );
  }
}

/// Extended favorite info with status tracking and notes
class FavoriteItem {
  final String programId;
  final DateTime savedAt;
  FavoriteStatus status;
  String? notes;
  DateTime? statusUpdatedAt;

  FavoriteItem({
    required this.programId,
    required this.savedAt,
    this.status = FavoriteStatus.saved,
    this.notes,
    this.statusUpdatedAt,
  });

  factory FavoriteItem.fromJson(Map<String, dynamic> json) {
    return FavoriteItem(
      programId: json['programId'] as String,
      savedAt: DateTime.parse(json['savedAt'] as String),
      status: FavoriteStatus.fromString(json['status'] as String? ?? 'saved'),
      notes: json['notes'] as String?,
      statusUpdatedAt: json['statusUpdatedAt'] != null
          ? DateTime.parse(json['statusUpdatedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'programId': programId,
      'savedAt': savedAt.toIso8601String(),
      'status': status.name,
      'notes': notes,
      'statusUpdatedAt': statusUpdatedAt?.toIso8601String(),
    };
  }

  FavoriteItem copyWith({
    FavoriteStatus? status,
    String? notes,
    DateTime? statusUpdatedAt,
  }) {
    return FavoriteItem(
      programId: programId,
      savedAt: savedAt,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      statusUpdatedAt: statusUpdatedAt ?? this.statusUpdatedAt,
    );
  }
}

/// Types of crisis situations detected in queries
enum CrisisType {
  emergency, // Call 911
  mentalHealth, // Call 988 Suicide & Crisis Lifeline
}

/// User profile for personalized recommendations
class UserProfile {
  final String id;
  final String name;
  final String relationship;
  final int colorIndex;
  final List<String> eligibilityGroups;
  final String? county;
  final DateTime createdAt;

  UserProfile({
    required this.id,
    required this.name,
    required this.relationship,
    required this.colorIndex,
    this.eligibilityGroups = const [],
    this.county,
    required this.createdAt,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      name: json['name'] as String,
      relationship: json['relationship'] as String,
      colorIndex: json['colorIndex'] as int,
      eligibilityGroups: List<String>.from(json['eligibilityGroups'] ?? []),
      county: json['county'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'relationship': relationship,
      'colorIndex': colorIndex,
      'eligibilityGroups': eligibilityGroups,
      'county': county,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  UserProfile copyWith({
    String? name,
    String? relationship,
    int? colorIndex,
    List<String>? eligibilityGroups,
    String? county,
  }) {
    return UserProfile(
      id: id,
      name: name ?? this.name,
      relationship: relationship ?? this.relationship,
      colorIndex: colorIndex ?? this.colorIndex,
      eligibilityGroups: eligibilityGroups ?? this.eligibilityGroups,
      county: county ?? this.county,
      createdAt: createdAt,
    );
  }

  /// Available relationship types
  static const List<String> relationshipTypes = [
    'Self',
    'Spouse',
    'Parent',
    'Child',
    'Sibling',
    'Grandparent',
    'Grandchild',
    'Aunt/Uncle',
    'Niece/Nephew',
    'Cousin',
    'Friend',
    'Other',
  ];

  /// Profile color options (Material Design palette)
  static const List<int> profileColors = [
    0xFF2196F3, // Blue
    0xFF4CAF50, // Green
    0xFFF44336, // Red
    0xFF9C27B0, // Purple
    0xFFFF9800, // Orange
    0xFF00BCD4, // Cyan
    0xFFE91E63, // Pink
    0xFF795548, // Brown
    0xFF607D8B, // Blue Grey
    0xFF009688, // Teal
  ];
}
