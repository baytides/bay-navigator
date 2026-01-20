import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// User preferences for personalized experience
class UserPrefs {
  final String? firstName;
  final String? city;
  final String? zipCode; // Stored separately for more precise rep lookup
  final String? county;
  final int? birthYear;
  final bool? isMilitaryOrVeteran;
  final List<String> qualifications;
  final List<String> groups; // Kept for backward compatibility, derived from qualifications
  final int timestamp;

  const UserPrefs({
    this.firstName,
    this.city,
    this.zipCode,
    this.county,
    this.birthYear,
    this.isMilitaryOrVeteran,
    this.qualifications = const [],
    this.groups = const [],
    required this.timestamp,
  });

  factory UserPrefs.fromJson(Map<String, dynamic> json) {
    return UserPrefs(
      firstName: json['firstName'] as String?,
      city: json['city'] as String?,
      zipCode: json['zipCode'] as String?,
      county: json['county'] as String?,
      birthYear: json['birthYear'] as int?,
      isMilitaryOrVeteran: json['isMilitaryOrVeteran'] as bool?,
      qualifications: List<String>.from(json['qualifications'] ?? []),
      groups: List<String>.from(json['groups'] ?? []),
      timestamp: json['timestamp'] as int? ?? DateTime.now().millisecondsSinceEpoch,
    );
  }

  Map<String, dynamic> toJson() => {
    'firstName': firstName,
    'city': city,
    'zipCode': zipCode,
    'county': county,
    'birthYear': birthYear,
    'isMilitaryOrVeteran': isMilitaryOrVeteran,
    'qualifications': qualifications,
    'groups': groups,
    'timestamp': timestamp,
  };

  UserPrefs copyWith({
    String? firstName,
    String? city,
    String? zipCode,
    String? county,
    int? birthYear,
    bool? isMilitaryOrVeteran,
    List<String>? qualifications,
    List<String>? groups,
    int? timestamp,
  }) {
    return UserPrefs(
      firstName: firstName ?? this.firstName,
      city: city ?? this.city,
      zipCode: zipCode ?? this.zipCode,
      county: county ?? this.county,
      birthYear: birthYear ?? this.birthYear,
      isMilitaryOrVeteran: isMilitaryOrVeteran ?? this.isMilitaryOrVeteran,
      qualifications: qualifications ?? this.qualifications,
      groups: groups ?? this.groups,
      timestamp: timestamp ?? this.timestamp,
    );
  }

  bool get hasPreferences =>
    firstName != null ||
    county != null ||
    birthYear != null ||
    isMilitaryOrVeteran != null ||
    qualifications.isNotEmpty ||
    groups.isNotEmpty;

  /// Derive age from birth year
  int? get age {
    if (birthYear == null) return null;
    return DateTime.now().year - birthYear!;
  }

  /// Get derived age groups based on birth year
  /// Uses API group IDs: youth, seniors
  List<String> get derivedAgeGroups {
    final currentAge = age;
    if (currentAge == null) return [];

    final ageGroups = <String>[];
    if (currentAge < 25) ageGroups.add('youth');
    if (currentAge >= 65) ageGroups.add('seniors');

    return ageGroups;
  }

  /// Get all applicable groups (derived + explicit)
  /// Uses API group IDs to match program data
  List<String> get allApplicableGroups {
    final allGroups = <String>{};

    // Add explicitly selected groups
    allGroups.addAll(groups);

    // Add age-derived groups
    allGroups.addAll(derivedAgeGroups);

    // Add veteran group if applicable
    if (isMilitaryOrVeteran == true) {
      allGroups.add('veterans');
    }

    // Add qualification-derived groups
    // Map to API group IDs
    for (final qual in qualifications) {
      switch (qual) {
        case 'unemployed':
          allGroups.add('unemployed');
          break;
        case 'public-assistance':
          allGroups.add('income-eligible');
          break;
        case 'student':
          allGroups.add('college-students');
          break;
        case 'disability':
          allGroups.add('disability');
          break;
        case 'caregiver':
          allGroups.add('caregivers');
          break;
        case 'lgbtq':
          allGroups.add('lgbtq');
          break;
        case 'immigrant':
          allGroups.add('immigrants');
          break;
        case 'first-responder':
          allGroups.add('first-responders');
          break;
        case 'educator':
          allGroups.add('educators');
          break;
      }
    }

    return allGroups.toList();
  }
}

/// Provider for managing user preferences and onboarding state
class UserPrefsProvider extends ChangeNotifier {
  static const String _prefsKey = 'baynavigator:user_prefs';
  static const String _onboardingKey = 'baynavigator:onboarding_complete';

  UserPrefs _prefs = const UserPrefs(timestamp: 0);
  bool _onboardingComplete = false;
  bool _initialized = false;
  bool _isLoading = false;

  // Getters
  UserPrefs get prefs => _prefs;
  String? get firstName => _prefs.firstName;
  String? get city => _prefs.city;
  String? get zipCode => _prefs.zipCode;
  String? get selectedCounty => _prefs.county;
  int? get birthYear => _prefs.birthYear;
  bool? get isMilitaryOrVeteran => _prefs.isMilitaryOrVeteran;
  List<String> get qualifications => _prefs.qualifications;
  List<String> get selectedGroups => _prefs.allApplicableGroups; // Now returns derived groups
  bool get onboardingComplete => _onboardingComplete;
  bool get initialized => _initialized;
  bool get isLoading => _isLoading;
  bool get hasPreferences => _prefs.hasPreferences;

  /// Initialize provider from SharedPreferences
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      final prefs = await SharedPreferences.getInstance();

      // Load onboarding state
      _onboardingComplete = prefs.getBool(_onboardingKey) ?? false;

      // Load user preferences
      final prefsJson = prefs.getString(_prefsKey);
      if (prefsJson != null) {
        final data = jsonDecode(prefsJson) as Map<String, dynamic>;
        _prefs = UserPrefs.fromJson(data);
      }
    } catch (e) {
      debugPrint('Error loading user preferences: $e');
    }

    _initialized = true;
    notifyListeners();
  }

  /// Save user preferences after onboarding
  Future<void> savePreferences({
    String? firstName,
    String? city,
    String? zipCode,
    String? county,
    int? birthYear,
    bool? isMilitaryOrVeteran,
    List<String>? qualifications,
    List<String>? groups,
  }) async {
    _isLoading = true;
    notifyListeners();

    _prefs = UserPrefs(
      firstName: firstName ?? _prefs.firstName,
      city: city ?? _prefs.city,
      zipCode: zipCode ?? _prefs.zipCode,
      county: county ?? _prefs.county,
      birthYear: birthYear ?? _prefs.birthYear,
      isMilitaryOrVeteran: isMilitaryOrVeteran ?? _prefs.isMilitaryOrVeteran,
      qualifications: qualifications ?? _prefs.qualifications,
      groups: groups ?? _prefs.groups,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefsKey, jsonEncode(_prefs.toJson()));
    } catch (e) {
      debugPrint('Error saving user preferences: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Mark onboarding as complete
  Future<void> completeOnboarding() async {
    _onboardingComplete = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_onboardingKey, true);
    } catch (e) {
      debugPrint('Error saving onboarding state: $e');
    }
  }

  /// Reset onboarding to show wizard again
  Future<void> reopenOnboarding() async {
    _onboardingComplete = false;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_onboardingKey, false);
    } catch (e) {
      debugPrint('Error resetting onboarding state: $e');
    }
  }

  /// Clear all preferences (for settings)
  Future<void> clearPreferences() async {
    _prefs = const UserPrefs(timestamp: 0);
    _onboardingComplete = false;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_prefsKey);
      await prefs.remove(_onboardingKey);
    } catch (e) {
      debugPrint('Error clearing preferences: $e');
    }
  }

  /// Toggle a group selection (for onboarding - backward compat)
  void toggleGroup(String groupId) {
    final groups = List<String>.from(_prefs.groups);
    if (groups.contains(groupId)) {
      groups.remove(groupId);
    } else {
      groups.add(groupId);
    }
    _prefs = _prefs.copyWith(groups: groups);
    notifyListeners();
  }

  /// Toggle a qualification selection (for new onboarding)
  void toggleQualification(String qualId) {
    final quals = List<String>.from(_prefs.qualifications);
    if (quals.contains(qualId)) {
      quals.remove(qualId);
    } else {
      quals.add(qualId);
    }
    _prefs = _prefs.copyWith(qualifications: quals);
    notifyListeners();
  }

  /// Set county selection (for onboarding)
  void setCounty(String? county) {
    _prefs = _prefs.copyWith(county: county);
    notifyListeners();
  }

  /// Set city and auto-derive county
  void setCityAndCounty(String? city, String? county) {
    _prefs = _prefs.copyWith(city: city, county: county);
    notifyListeners();
  }

  /// Set first name
  void setFirstName(String? name) {
    _prefs = _prefs.copyWith(firstName: name);
    notifyListeners();
  }

  /// Set birth year
  void setBirthYear(int? year) {
    _prefs = _prefs.copyWith(birthYear: year);
    notifyListeners();
  }

  /// Set military/veteran status
  void setMilitaryOrVeteran(bool? status) {
    _prefs = _prefs.copyWith(isMilitaryOrVeteran: status);
    notifyListeners();
  }

  /// Check if a group is selected
  bool isGroupSelected(String groupId) => _prefs.allApplicableGroups.contains(groupId);

  /// Check if a qualification is selected
  bool isQualificationSelected(String qualId) => _prefs.qualifications.contains(qualId);
}
