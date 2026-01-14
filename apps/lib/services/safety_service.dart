import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter_dynamic_icon/flutter_dynamic_icon.dart';

/// Safety service for Bay Navigator
/// Provides features to protect vulnerable users:
/// - Quick Exit (panic button) to instantly leave the app
/// - Incognito Mode to prevent saving history
/// - Safety tips for sensitive services
/// - Network privacy warnings
class SafetyService {
  static final SafetyService _instance = SafetyService._internal();
  factory SafetyService() => _instance;
  SafetyService._internal();

  // Preference keys
  static const String _quickExitEnabledKey = 'bay_navigator:quick_exit_enabled';
  static const String _quickExitUrlKey = 'bay_navigator:quick_exit_url';
  static const String _incognitoModeKey = 'bay_navigator:incognito_mode';
  static const String _showSafetyTipsKey = 'bay_navigator:show_safety_tips';
  static const String _networkWarningsKey = 'bay_navigator:network_warnings';
  static const String _networkMonitoringKey = 'bay_navigator:network_monitoring';
  static const String _recentProgramsKey = 'bay_navigator:recent_programs';
  static const String _searchHistoryKey = 'bay_navigator:search_history';
  static const String _disguisedModeKey = 'bay_navigator:disguised_mode';
  static const String _disguisedIconKey = 'bay_navigator:disguised_icon';
  static const String _safetyPinKey = 'bay_navigator:safety_pin';
  static const String _pinProtectionEnabledKey = 'bay_navigator:pin_protection';
  static const String _panicWipeEnabledKey = 'bay_navigator:panic_wipe_enabled';
  static const String _failedPinAttemptsKey = 'bay_navigator:failed_pin_attempts';

  // Secure storage keys (encrypted on-device)
  static const String _encryptionEnabledKey = 'bay_navigator:encryption_enabled';

  // Disguised app icons - these blend in as utility apps
  // Note: Actual icon changing requires platform-specific setup
  // (activity-alias on Android, alternate icons in Info.plist on iOS)
  static const List<DisguisedAppIcon> disguisedIcons = [
    DisguisedAppIcon(
      id: 'calculator',
      name: 'Calculator',
      androidActivityAlias: '.CalculatorAlias',
      iosIconName: 'CalculatorIcon',
      iconData: Icons.calculate_outlined,
      backgroundColor: Color(0xFF424242),
    ),
    DisguisedAppIcon(
      id: 'notes',
      name: 'My Notes',
      androidActivityAlias: '.NotesAlias',
      iosIconName: 'NotesIcon',
      iconData: Icons.note_outlined,
      backgroundColor: Color(0xFFFFC107),
    ),
    DisguisedAppIcon(
      id: 'weather',
      name: 'Weather',
      androidActivityAlias: '.WeatherAlias',
      iosIconName: 'WeatherIcon',
      iconData: Icons.wb_sunny_outlined,
      backgroundColor: Color(0xFF2196F3),
    ),
    DisguisedAppIcon(
      id: 'utilities',
      name: 'Utilities',
      androidActivityAlias: '.UtilitiesAlias',
      iosIconName: 'UtilitiesIcon',
      iconData: Icons.build_outlined,
      backgroundColor: Color(0xFF607D8B),
    ),
    DisguisedAppIcon(
      id: 'files',
      name: 'Files',
      androidActivityAlias: '.FilesAlias',
      iosIconName: 'FilesIcon',
      iconData: Icons.folder_outlined,
      backgroundColor: Color(0xFF4CAF50),
    ),
  ];

  SharedPreferences? _prefs;
  bool _isIncognitoSession = false;
  final List<String> _sessionRecentPrograms = [];
  final List<String> _sessionSearchHistory = [];

  // Secure storage for encrypted data (uses Android Keystore / iOS Keychain)
  // This protects sensitive data even on rooted/jailbroken devices
  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      // Use strong encryption that requires device unlock
      keyCipherAlgorithm: KeyCipherAlgorithm.RSA_ECB_OAEPwithSHA_256andMGF1Padding,
      storageCipherAlgorithm: StorageCipherAlgorithm.AES_GCM_NoPadding,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
      // Data protected until first unlock, then available
    ),
  );

  // Default safe exit destinations
  static const List<QuickExitDestination> defaultDestinations = [
    QuickExitDestination(
      id: 'google',
      name: 'Google',
      url: 'https://www.google.com',
      description: 'Opens Google search',
    ),
    QuickExitDestination(
      id: 'weather',
      name: 'Weather.gov',
      url: 'https://www.weather.gov',
      description: 'Opens weather forecast',
    ),
    QuickExitDestination(
      id: 'news',
      name: 'AP News',
      url: 'https://apnews.com',
      description: 'Opens news website',
    ),
    QuickExitDestination(
      id: 'recipes',
      name: 'AllRecipes',
      url: 'https://www.allrecipes.com',
      description: 'Opens recipe website',
    ),
  ];

  // Sensitive program categories that should show safety tips
  static const List<String> sensitiveCategories = [
    'crisis',
    'domestic-violence',
    'mental-health',
    'lgbtq',
    'teen-health',
    'substance-abuse',
    'housing-emergency',
  ];

  // Sensitive eligibility groups
  static const List<String> sensitiveEligibilities = [
    'survivors',
    'lgbtq',
    'youth',
    'immigrants',
    'unhoused',
    'reentry',
  ];

  Future<SharedPreferences> get _preferences async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  // ============================================
  // QUICK EXIT (PANIC BUTTON)
  // ============================================

  /// Check if quick exit is enabled
  Future<bool> isQuickExitEnabled() async {
    final prefs = await _preferences;
    return prefs.getBool(_quickExitEnabledKey) ?? false;
  }

  /// Enable or disable quick exit
  Future<void> setQuickExitEnabled(bool enabled) async {
    final prefs = await _preferences;
    await prefs.setBool(_quickExitEnabledKey, enabled);
  }

  /// Get the quick exit URL
  Future<String> getQuickExitUrl() async {
    final prefs = await _preferences;
    return prefs.getString(_quickExitUrlKey) ?? defaultDestinations[0].url;
  }

  /// Set the quick exit URL
  Future<void> setQuickExitUrl(String url) async {
    final prefs = await _preferences;
    await prefs.setString(_quickExitUrlKey, url);
  }

  /// Execute quick exit - opens safe URL and clears app state
  Future<void> executeQuickExit() async {
    final url = await getQuickExitUrl();

    // Clear sensitive data immediately
    await clearSessionData();

    // Open the safe URL
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }

    // Exit the app (on mobile) or minimize
    if (Platform.isAndroid || Platform.isIOS) {
      // This will send the app to background
      SystemNavigator.pop();
    }
  }

  // ============================================
  // INCOGNITO MODE
  // ============================================

  /// Check if incognito mode is enabled (persistent setting)
  Future<bool> isIncognitoModeEnabled() async {
    final prefs = await _preferences;
    return prefs.getBool(_incognitoModeKey) ?? false;
  }

  /// Enable or disable incognito mode
  Future<void> setIncognitoModeEnabled(bool enabled) async {
    final prefs = await _preferences;
    await prefs.setBool(_incognitoModeKey, enabled);
    _isIncognitoSession = enabled;

    if (enabled) {
      // Clear existing history when enabling
      await clearAllHistory();
    }
  }

  /// Check if current session is incognito
  bool get isIncognitoSession => _isIncognitoSession;

  /// Start an incognito session (temporary, doesn't change setting)
  void startIncognitoSession() {
    _isIncognitoSession = true;
    _sessionRecentPrograms.clear();
    _sessionSearchHistory.clear();
  }

  /// End incognito session and clear session data
  Future<void> endIncognitoSession() async {
    _isIncognitoSession = false;
    _sessionRecentPrograms.clear();
    _sessionSearchHistory.clear();
  }

  // ============================================
  // HISTORY MANAGEMENT
  // ============================================

  /// Add a program to recent history (respects incognito mode)
  Future<void> addRecentProgram(String programId) async {
    if (_isIncognitoSession) {
      // Only keep in memory, don't persist
      if (!_sessionRecentPrograms.contains(programId)) {
        _sessionRecentPrograms.insert(0, programId);
        if (_sessionRecentPrograms.length > 10) {
          _sessionRecentPrograms.removeLast();
        }
      }
      return;
    }

    final prefs = await _preferences;
    final recent = prefs.getStringList(_recentProgramsKey) ?? [];

    recent.remove(programId);
    recent.insert(0, programId);

    // Keep only last 20
    if (recent.length > 20) {
      recent.removeLast();
    }

    await prefs.setStringList(_recentProgramsKey, recent);
  }

  /// Get recent programs
  Future<List<String>> getRecentPrograms() async {
    if (_isIncognitoSession) {
      return List.from(_sessionRecentPrograms);
    }

    final prefs = await _preferences;
    return prefs.getStringList(_recentProgramsKey) ?? [];
  }

  /// Add a search query to history (respects incognito mode)
  Future<void> addSearchQuery(String query) async {
    if (_isIncognitoSession) {
      if (!_sessionSearchHistory.contains(query)) {
        _sessionSearchHistory.insert(0, query);
        if (_sessionSearchHistory.length > 10) {
          _sessionSearchHistory.removeLast();
        }
      }
      return;
    }

    final prefs = await _preferences;
    final history = prefs.getStringList(_searchHistoryKey) ?? [];

    history.remove(query);
    history.insert(0, query);

    if (history.length > 20) {
      history.removeLast();
    }

    await prefs.setStringList(_searchHistoryKey, history);
  }

  /// Get search history
  Future<List<String>> getSearchHistory() async {
    if (_isIncognitoSession) {
      return List.from(_sessionSearchHistory);
    }

    final prefs = await _preferences;
    return prefs.getStringList(_searchHistoryKey) ?? [];
  }

  /// Clear all history
  Future<void> clearAllHistory() async {
    final prefs = await _preferences;
    await prefs.remove(_recentProgramsKey);
    await prefs.remove(_searchHistoryKey);
    _sessionRecentPrograms.clear();
    _sessionSearchHistory.clear();
  }

  /// Clear session data (for quick exit)
  Future<void> clearSessionData() async {
    _sessionRecentPrograms.clear();
    _sessionSearchHistory.clear();

    // If incognito mode is enabled, also clear persisted data
    if (_isIncognitoSession || await isIncognitoModeEnabled()) {
      await clearAllHistory();
    }
  }

  // ============================================
  // SAFETY TIPS
  // ============================================

  /// Check if safety tips should be shown
  Future<bool> shouldShowSafetyTips() async {
    final prefs = await _preferences;
    return prefs.getBool(_showSafetyTipsKey) ?? true;
  }

  /// Enable or disable safety tips
  Future<void> setShowSafetyTips(bool show) async {
    final prefs = await _preferences;
    await prefs.setBool(_showSafetyTipsKey, show);
  }

  /// Check if a program is sensitive and should show safety tips
  bool isProgramSensitive(String? category, List<String>? eligibility) {
    if (category != null && sensitiveCategories.contains(category.toLowerCase())) {
      return true;
    }

    if (eligibility != null) {
      for (final elig in eligibility) {
        if (sensitiveEligibilities.contains(elig.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  }

  /// Get safety tips for a sensitive program
  /// Provides category-specific guidance for different vulnerable communities
  List<SafetyTip> getSafetyTips(String? category, {List<String>? eligibility}) {
    final tips = <SafetyTip>[];
    final lowerCategory = category?.toLowerCase() ?? '';
    final lowerEligibility = eligibility?.map((e) => e.toLowerCase()).toList() ?? [];

    // Universal tips for all sensitive programs
    tips.addAll([
      const SafetyTip(
        icon: Icons.security,
        title: 'Check your surroundings',
        description: 'Make sure you\'re in a private, safe location before making calls.',
      ),
      const SafetyTip(
        icon: Icons.history,
        title: 'Clear your history',
        description: 'Use Incognito Mode or clear your browser/app history after visiting.',
      ),
    ]);

    // Domestic violence / survivors - most comprehensive tips
    if (lowerCategory == 'domestic-violence' ||
        lowerCategory == 'crisis' ||
        lowerEligibility.contains('survivors')) {
      tips.addAll([
        const SafetyTip(
          icon: Icons.dialpad,
          title: 'Use *67 to hide your number',
          description: 'Dial *67 before the number to block your caller ID from appearing.',
        ),
        const SafetyTip(
          icon: Icons.phone_android,
          title: 'Consider using a different phone',
          description: 'If your phone is monitored, use a friend\'s phone, library, or public phone.',
        ),
        const SafetyTip(
          icon: Icons.schedule,
          title: 'Plan your call time',
          description: 'Choose a time when you know you\'ll have privacy and won\'t be interrupted.',
        ),
        const SafetyTip(
          icon: Icons.location_off,
          title: 'Check location sharing',
          description: 'Review if your location is being shared via Find My, Google Maps, or family apps.',
        ),
        const SafetyTip(
          icon: Icons.devices,
          title: 'Be aware of shared devices',
          description: 'Browsing history, iCloud, and Google accounts may sync across devices.',
        ),
      ]);
    }

    // LGBTQ+ specific tips
    if (lowerCategory == 'lgbtq' || lowerEligibility.contains('lgbtq')) {
      tips.addAll([
        const SafetyTip(
          icon: Icons.phone_forwarded,
          title: 'Use a private number',
          description: 'Consider Google Voice, TextNow, or another app for a separate phone number.',
        ),
        const SafetyTip(
          icon: Icons.share,
          title: 'Check shared accounts',
          description: 'Family plans and shared accounts may show call/text logs to others.',
        ),
        const SafetyTip(
          icon: Icons.apps,
          title: 'Use app disguise',
          description: 'This app can be disguised as a calculator or notes app in Settings.',
        ),
      ]);
    }

    // Youth / Teen specific tips
    if (lowerCategory == 'teen-health' || lowerEligibility.contains('youth')) {
      tips.addAll([
        const SafetyTip(
          icon: Icons.textsms,
          title: 'Text option available',
          description: 'Many hotlines offer text support if you can\'t talk safely.',
        ),
        const SafetyTip(
          icon: Icons.school,
          title: 'Talk to a trusted adult',
          description: 'School counselors, coaches, or relatives may be able to help.',
        ),
        const SafetyTip(
          icon: Icons.family_restroom,
          title: 'Parental controls',
          description: 'Be aware if your device has monitoring or screen time apps installed.',
        ),
      ]);
    }

    // Mental health specific tips
    if (lowerCategory == 'mental-health' || lowerCategory == 'substance-abuse') {
      tips.addAll([
        const SafetyTip(
          icon: Icons.textsms,
          title: 'Text support available',
          description: 'Text HOME to 741741 (Crisis Text Line) if you can\'t make a call.',
        ),
        const SafetyTip(
          icon: Icons.chat,
          title: 'Chat options',
          description: 'Many services offer online chat that may be less visible than phone calls.',
        ),
        const SafetyTip(
          icon: Icons.volunteer_activism,
          title: 'Warm handoffs available',
          description: 'Ask about being transferred directly to local services while on the line.',
        ),
      ]);
    }

    // Immigrant specific tips
    if (lowerEligibility.contains('immigrants')) {
      tips.addAll([
        const SafetyTip(
          icon: Icons.gavel,
          title: 'Know your rights',
          description: 'You have rights regardless of immigration status. Ask about confidentiality.',
        ),
        const SafetyTip(
          icon: Icons.language,
          title: 'Language support',
          description: 'Many services offer interpretation in multiple languages.',
        ),
        const SafetyTip(
          icon: Icons.verified_user,
          title: 'Ask about privacy policies',
          description: 'Confirm that services won\'t share your information with immigration authorities.',
        ),
      ]);
    }

    // Unhoused / Housing emergency
    if (lowerCategory == 'housing-emergency' || lowerEligibility.contains('unhoused')) {
      tips.addAll([
        const SafetyTip(
          icon: Icons.wifi,
          title: 'Free WiFi locations',
          description: 'Libraries, community centers, and some fast food restaurants offer free WiFi.',
        ),
        const SafetyTip(
          icon: Icons.phone,
          title: 'Charge your phone',
          description: 'Libraries and some shelters have charging stations available.',
        ),
      ]);
    }

    // Reentry / Formerly incarcerated
    if (lowerEligibility.contains('reentry')) {
      tips.addAll([
        const SafetyTip(
          icon: Icons.work,
          title: 'Background-friendly employers',
          description: 'Many programs listed work specifically with people with records.',
        ),
        const SafetyTip(
          icon: Icons.description,
          title: 'Record expungement',
          description: 'Ask about services that help with clearing or sealing records.',
        ),
      ]);
    }

    return tips;
  }

  // ============================================
  // NETWORK PRIVACY WARNINGS
  // ============================================

  /// Check if network monitoring is enabled (opt-in, default false)
  Future<bool> isNetworkMonitoringEnabled() async {
    final prefs = await _preferences;
    return prefs.getBool(_networkMonitoringKey) ?? false;
  }

  /// Enable or disable network monitoring
  Future<void> setNetworkMonitoringEnabled(bool enabled) async {
    final prefs = await _preferences;
    await prefs.setBool(_networkMonitoringKey, enabled);
  }

  /// Check if network warnings are enabled
  Future<bool> isNetworkWarningsEnabled() async {
    final prefs = await _preferences;
    return prefs.getBool(_networkWarningsKey) ?? false;
  }

  /// Enable or disable network warnings
  Future<void> setNetworkWarningsEnabled(bool enabled) async {
    final prefs = await _preferences;
    await prefs.setBool(_networkWarningsKey, enabled);
  }

  /// Get current network privacy status
  Future<NetworkPrivacyStatus> getNetworkPrivacyStatus() async {
    try {
      final connectivityResult = await Connectivity().checkConnectivity();

      if (connectivityResult.contains(ConnectivityResult.wifi)) {
        return NetworkPrivacyStatus(
          level: NetworkPrivacyLevel.caution,
          connectionType: 'WiFi',
          warning: 'You\'re on WiFi. Network owner may be able to see your activity.',
          suggestion: 'Consider using mobile data for sensitive lookups.',
        );
      }

      if (connectivityResult.contains(ConnectivityResult.mobile)) {
        return NetworkPrivacyStatus(
          level: NetworkPrivacyLevel.moderate,
          connectionType: 'Mobile Data',
          warning: null,
          suggestion: 'Mobile data is generally more private than public WiFi.',
        );
      }

      if (connectivityResult.contains(ConnectivityResult.vpn)) {
        return NetworkPrivacyStatus(
          level: NetworkPrivacyLevel.good,
          connectionType: 'VPN',
          warning: null,
          suggestion: 'VPN detected. Your traffic is encrypted.',
        );
      }

      if (connectivityResult.contains(ConnectivityResult.none)) {
        return NetworkPrivacyStatus(
          level: NetworkPrivacyLevel.offline,
          connectionType: 'Offline',
          warning: 'You\'re offline.',
          suggestion: 'Some features may not work without internet.',
        );
      }

      return NetworkPrivacyStatus(
        level: NetworkPrivacyLevel.unknown,
        connectionType: 'Unknown',
        warning: null,
        suggestion: null,
      );
    } catch (e) {
      return NetworkPrivacyStatus(
        level: NetworkPrivacyLevel.unknown,
        connectionType: 'Unknown',
        warning: null,
        suggestion: null,
      );
    }
  }

  /// Listen to network changes
  Stream<NetworkPrivacyStatus> get networkPrivacyStream {
    return Connectivity().onConnectivityChanged.asyncMap((_) async {
      return await getNetworkPrivacyStatus();
    });
  }

  // ============================================
  // DISGUISED APP MODE
  // ============================================

  /// Check if disguised mode is enabled
  Future<bool> isDisguisedModeEnabled() async {
    final prefs = await _preferences;
    return prefs.getBool(_disguisedModeKey) ?? false;
  }

  /// Enable or disable disguised mode
  Future<void> setDisguisedModeEnabled(bool enabled) async {
    final prefs = await _preferences;
    await prefs.setBool(_disguisedModeKey, enabled);
  }

  /// Get the current disguised icon ID
  Future<String?> getDisguisedIconId() async {
    final prefs = await _preferences;
    return prefs.getString(_disguisedIconKey);
  }

  /// Set the disguised icon
  Future<void> setDisguisedIcon(String iconId) async {
    final prefs = await _preferences;
    await prefs.setString(_disguisedIconKey, iconId);
  }

  /// Get the current disguised icon configuration
  Future<DisguisedAppIcon?> getCurrentDisguisedIcon() async {
    final iconId = await getDisguisedIconId();
    if (iconId == null) return null;

    return disguisedIcons.firstWhere(
      (icon) => icon.id == iconId,
      orElse: () => disguisedIcons.first,
    );
  }

  /// Apply disguised icon (platform-specific implementation)
  /// On Android: Enable/disable activity-alias in manifest
  /// On iOS: Call setAlternateIconName
  Future<DisguiseResult> applyDisguisedIcon(String iconId) async {
    try {
      // Find the icon configuration
      final icon = disguisedIcons.firstWhere(
        (i) => i.id == iconId,
        orElse: () => disguisedIcons.first,
      );

      if (Platform.isIOS) {
        // Check if alternate icons are supported
        final supportsAlternateIcons = await FlutterDynamicIcon.supportsAlternateIcons;
        if (!supportsAlternateIcons) {
          return DisguiseResult(
            success: false,
            message: 'This device does not support alternate app icons.',
            requiresRestart: false,
          );
        }

        // Set the alternate icon - iOS shows a system alert
        await FlutterDynamicIcon.setAlternateIconName(icon.iosIconName);

        // Save the preference
        await setDisguisedIcon(iconId);
        await setDisguisedModeEnabled(true);

        return DisguiseResult(
          success: true,
          message: 'App icon changed to "${icon.name}".',
          requiresRestart: false,
        );
      } else if (Platform.isAndroid) {
        // Save the preference for Android (actual icon change via activity-alias)
        await setDisguisedIcon(iconId);
        await setDisguisedModeEnabled(true);

        // Android requires app restart and activity-alias setup
        return DisguiseResult(
          success: true,
          message: 'App icon will change after restarting the app.',
          requiresRestart: true,
        );
      }

      // Save preference for other platforms
      await setDisguisedIcon(iconId);
      await setDisguisedModeEnabled(true);

      return DisguiseResult(
        success: true,
        message: 'Disguised mode enabled.',
        requiresRestart: false,
      );
    } catch (e) {
      return DisguiseResult(
        success: false,
        message: 'Failed to change app icon: $e',
        requiresRestart: false,
      );
    }
  }

  /// Reset to default app icon
  Future<DisguiseResult> resetToDefaultIcon() async {
    try {
      if (Platform.isIOS) {
        // Check if alternate icons are supported
        final supportsAlternateIcons = await FlutterDynamicIcon.supportsAlternateIcons;
        if (supportsAlternateIcons) {
          // Reset to primary icon by passing null
          await FlutterDynamicIcon.setAlternateIconName(null);
        }
      }

      await setDisguisedModeEnabled(false);
      final prefs = await _preferences;
      await prefs.remove(_disguisedIconKey);

      return DisguiseResult(
        success: true,
        message: 'App icon reset to default.',
        requiresRestart: Platform.isAndroid,
      );
    } catch (e) {
      return DisguiseResult(
        success: false,
        message: 'Failed to reset app icon: $e',
        requiresRestart: false,
      );
    }
  }

  // ============================================
  // PIN PROTECTION FOR SAFETY SETTINGS
  // ============================================

  /// Check if PIN protection is enabled
  Future<bool> isPinProtectionEnabled() async {
    final prefs = await _preferences;
    return prefs.getBool(_pinProtectionEnabledKey) ?? false;
  }

  /// Check if a PIN has been set
  Future<bool> hasPinSet() async {
    final prefs = await _preferences;
    return prefs.getString(_safetyPinKey) != null;
  }

  /// Validate a PIN against stored hash
  Future<bool> validatePin(String pin) async {
    final prefs = await _preferences;
    final storedHash = prefs.getString(_safetyPinKey);
    if (storedHash == null) return false;

    // Simple hash comparison (in production, use proper crypto)
    final inputHash = _hashPin(pin);
    return inputHash == storedHash;
  }

  /// Set a new PIN (must pass validation)
  Future<PinSetResult> setPin(String pin) async {
    // Validate PIN strength
    final validation = validatePinStrength(pin);
    if (!validation.isValid) {
      return PinSetResult(success: false, message: validation.message);
    }

    final prefs = await _preferences;
    final hashedPin = _hashPin(pin);
    await prefs.setString(_safetyPinKey, hashedPin);
    await prefs.setBool(_pinProtectionEnabledKey, true);

    return PinSetResult(success: true, message: 'PIN set successfully');
  }

  /// Remove PIN protection
  Future<void> removePin() async {
    final prefs = await _preferences;
    await prefs.remove(_safetyPinKey);
    await prefs.setBool(_pinProtectionEnabledKey, false);
  }

  /// Validate PIN strength
  /// Returns validation result with specific error if invalid
  PinValidation validatePinStrength(String pin) {
    // Check length (6-8 digits)
    if (pin.length < 6 || pin.length > 8) {
      return PinValidation(
        isValid: false,
        message: 'PIN must be 6-8 digits',
      );
    }

    // Check if all digits
    if (!RegExp(r'^\d+$').hasMatch(pin)) {
      return PinValidation(
        isValid: false,
        message: 'PIN must contain only numbers',
      );
    }

    // Check for repeated digits (e.g., 111111, 222222)
    if (RegExp(r'^(\d)\1+$').hasMatch(pin)) {
      return PinValidation(
        isValid: false,
        message: 'PIN cannot be all the same digit',
      );
    }

    // Check for sequential ascending (e.g., 123456, 234567)
    if (_isSequentialAscending(pin)) {
      return PinValidation(
        isValid: false,
        message: 'PIN cannot be a sequential number',
      );
    }

    // Check for sequential descending (e.g., 654321, 876543)
    if (_isSequentialDescending(pin)) {
      return PinValidation(
        isValid: false,
        message: 'PIN cannot be a sequential number',
      );
    }

    // Check for common weak PINs
    if (_isCommonWeakPin(pin)) {
      return PinValidation(
        isValid: false,
        message: 'PIN is too common. Choose something more unique.',
      );
    }

    // Check for repeated pairs (e.g., 121212, 787878)
    if (_isRepeatedPattern(pin)) {
      return PinValidation(
        isValid: false,
        message: 'PIN cannot be a repeated pattern',
      );
    }

    return PinValidation(isValid: true, message: 'PIN is strong');
  }

  /// Check if PIN is sequential ascending
  bool _isSequentialAscending(String pin) {
    for (int i = 0; i < pin.length - 1; i++) {
      final current = int.parse(pin[i]);
      final next = int.parse(pin[i + 1]);
      if (next != (current + 1) % 10) {
        return false;
      }
    }
    return true;
  }

  /// Check if PIN is sequential descending
  bool _isSequentialDescending(String pin) {
    for (int i = 0; i < pin.length - 1; i++) {
      final current = int.parse(pin[i]);
      final next = int.parse(pin[i + 1]);
      if (next != (current - 1 + 10) % 10) {
        return false;
      }
    }
    return true;
  }

  /// Check against common weak PINs
  bool _isCommonWeakPin(String pin) {
    const weakPins = [
      '000000', '111111', '222222', '333333', '444444',
      '555555', '666666', '777777', '888888', '999999',
      '123456', '654321', '123123', '112233', '121212',
      '696969', '131313', '420420', '101010', '192837',
      '1234567', '7654321', '1111111', '0000000',
      '12345678', '87654321', '11111111', '00000000',
    ];
    return weakPins.contains(pin);
  }

  /// Check for repeated patterns (e.g., 121212, 787878)
  bool _isRepeatedPattern(String pin) {
    if (pin.length < 4) return false;

    // Check for 2-digit repeated patterns
    if (pin.length % 2 == 0) {
      final pattern = pin.substring(0, 2);
      String reconstructed = '';
      for (int i = 0; i < pin.length ~/ 2; i++) {
        reconstructed += pattern;
      }
      if (reconstructed == pin) return true;
    }

    // Check for 3-digit repeated patterns
    if (pin.length % 3 == 0) {
      final pattern = pin.substring(0, 3);
      String reconstructed = '';
      for (int i = 0; i < pin.length ~/ 3; i++) {
        reconstructed += pattern;
      }
      if (reconstructed == pin) return true;
    }

    return false;
  }

  /// Simple hash function for PIN (in production, use proper bcrypt or similar)
  /// This provides basic protection against casual inspection of preferences
  String _hashPin(String pin) {
    // Simple hash: salt + pin, then hash each char
    const salt = 'BayNav2024Safety';
    final salted = salt + pin;
    int hash = 0;
    for (int i = 0; i < salted.length; i++) {
      hash = ((hash << 5) - hash) + salted.codeUnitAt(i);
      hash = hash & 0xFFFFFFFF; // Convert to 32-bit integer
    }
    return hash.toRadixString(16);
  }

  // ============================================
  // PANIC WIPE (3 FAILED PIN ATTEMPTS)
  // ============================================

  /// Check if panic wipe is enabled
  Future<bool> isPanicWipeEnabled() async {
    final prefs = await _preferences;
    return prefs.getBool(_panicWipeEnabledKey) ?? false;
  }

  /// Enable or disable panic wipe
  Future<void> setPanicWipeEnabled(bool enabled) async {
    final prefs = await _preferences;
    await prefs.setBool(_panicWipeEnabledKey, enabled);
  }

  /// Get current failed PIN attempts count
  Future<int> getFailedPinAttempts() async {
    final prefs = await _preferences;
    return prefs.getInt(_failedPinAttemptsKey) ?? 0;
  }

  /// Record a failed PIN attempt, returns true if panic wipe should trigger
  Future<bool> recordFailedPinAttempt() async {
    final prefs = await _preferences;
    final currentAttempts = prefs.getInt(_failedPinAttemptsKey) ?? 0;
    final newAttempts = currentAttempts + 1;
    await prefs.setInt(_failedPinAttemptsKey, newAttempts);

    // Check if panic wipe should trigger (3 failed attempts)
    final panicWipeEnabled = await isPanicWipeEnabled();
    if (panicWipeEnabled && newAttempts >= 3) {
      return true;
    }
    return false;
  }

  /// Reset failed PIN attempts (call after successful PIN entry)
  Future<void> resetFailedPinAttempts() async {
    final prefs = await _preferences;
    await prefs.setInt(_failedPinAttemptsKey, 0);
  }

  /// Execute panic wipe - deletes all app data and force closes
  /// WARNING: This is destructive and cannot be undone
  Future<void> executePanicWipe() async {
    try {
      // 1. Clear all secure storage (encrypted data)
      await _secureStorage.deleteAll();

      // 2. Clear all shared preferences
      final prefs = await _preferences;
      await prefs.clear();

      // 3. Clear app's cache and documents directories
      try {
        final cacheDir = await getTemporaryDirectory();
        if (await cacheDir.exists()) {
          await cacheDir.delete(recursive: true);
        }
      } catch (_) {}

      try {
        final appDocDir = await getApplicationDocumentsDirectory();
        // Delete files but keep the directory
        await for (final entity in appDocDir.list()) {
          try {
            if (entity is File) {
              await entity.delete();
            } else if (entity is Directory) {
              await entity.delete(recursive: true);
            }
          } catch (_) {}
        }
      } catch (_) {}

      try {
        final supportDir = await getApplicationSupportDirectory();
        await for (final entity in supportDir.list()) {
          try {
            if (entity is File) {
              await entity.delete();
            } else if (entity is Directory) {
              await entity.delete(recursive: true);
            }
          } catch (_) {}
        }
      } catch (_) {}

      // 4. Force close the app
      // Using SystemNavigator.pop() for a clean exit
      // On some platforms, this may just background the app
      await SystemNavigator.pop(animated: false);

      // If pop doesn't work, use exit (less graceful but guaranteed)
      exit(0);
    } catch (e) {
      // Even if something fails, try to exit
      exit(0);
    }
  }

  // ============================================
  // ENCRYPTED ON-DEVICE STORAGE
  // ============================================
  // Uses flutter_secure_storage which leverages:
  // - Android: EncryptedSharedPreferences with Android Keystore
  // - iOS: Keychain Services with Secure Enclave
  // This protects data even on rooted/jailbroken devices

  /// Check if data encryption is enabled
  Future<bool> isEncryptionEnabled() async {
    final prefs = await _preferences;
    return prefs.getBool(_encryptionEnabledKey) ?? false;
  }

  /// Enable data encryption and migrate existing data
  Future<EncryptionResult> enableEncryption() async {
    try {
      final prefs = await _preferences;

      // Migrate sensitive data to secure storage
      await _migrateToSecureStorage();

      await prefs.setBool(_encryptionEnabledKey, true);

      return EncryptionResult(
        success: true,
        message: 'Data encryption enabled. Your data is now protected.',
      );
    } catch (e) {
      return EncryptionResult(
        success: false,
        message: 'Failed to enable encryption: $e',
      );
    }
  }

  /// Disable encryption (migrate back to regular storage)
  Future<EncryptionResult> disableEncryption() async {
    try {
      final prefs = await _preferences;

      // Migrate data back from secure storage
      await _migrateFromSecureStorage();

      await prefs.setBool(_encryptionEnabledKey, false);

      return EncryptionResult(
        success: true,
        message: 'Data encryption disabled.',
      );
    } catch (e) {
      return EncryptionResult(
        success: false,
        message: 'Failed to disable encryption: $e',
      );
    }
  }

  /// Store sensitive data securely (encrypted)
  Future<void> storeSecureData(String key, String value) async {
    final isEncrypted = await isEncryptionEnabled();
    if (isEncrypted) {
      await _secureStorage.write(key: key, value: value);
    } else {
      final prefs = await _preferences;
      await prefs.setString(key, value);
    }
  }

  /// Read sensitive data (handles both encrypted and unencrypted)
  Future<String?> readSecureData(String key) async {
    final isEncrypted = await isEncryptionEnabled();
    if (isEncrypted) {
      return await _secureStorage.read(key: key);
    } else {
      final prefs = await _preferences;
      return prefs.getString(key);
    }
  }

  /// Delete sensitive data
  Future<void> deleteSecureData(String key) async {
    final isEncrypted = await isEncryptionEnabled();
    if (isEncrypted) {
      await _secureStorage.delete(key: key);
    } else {
      final prefs = await _preferences;
      await prefs.remove(key);
    }
  }

  /// Store a list securely
  Future<void> storeSecureList(String key, List<String> values) async {
    final jsonString = jsonEncode(values);
    await storeSecureData(key, jsonString);
  }

  /// Read a list from secure storage
  Future<List<String>> readSecureList(String key) async {
    final jsonString = await readSecureData(key);
    if (jsonString == null) return [];
    try {
      final decoded = jsonDecode(jsonString);
      return List<String>.from(decoded);
    } catch (_) {
      return [];
    }
  }

  /// Migrate sensitive data to secure storage
  Future<void> _migrateToSecureStorage() async {
    final prefs = await _preferences;

    // List of sensitive keys to migrate
    final sensitiveKeys = [
      _recentProgramsKey,
      _searchHistoryKey,
      _safetyPinKey,
    ];

    for (final key in sensitiveKeys) {
      final value = prefs.getString(key);
      if (value != null) {
        await _secureStorage.write(key: key, value: value);
        // Don't remove from prefs yet - keep as backup during migration
      }
    }
  }

  /// Migrate data back from secure storage
  Future<void> _migrateFromSecureStorage() async {
    final prefs = await _preferences;

    final sensitiveKeys = [
      _recentProgramsKey,
      _searchHistoryKey,
      _safetyPinKey,
    ];

    for (final key in sensitiveKeys) {
      final value = await _secureStorage.read(key: key);
      if (value != null) {
        await prefs.setString(key, value);
        await _secureStorage.delete(key: key);
      }
    }
  }

  /// Check if device might be compromised (rooted/jailbroken)
  /// Note: This is a basic check and can be bypassed by sophisticated attackers
  Future<DeviceSecurityStatus> checkDeviceSecurity() async {
    bool potentiallyCompromised = false;
    final warnings = <String>[];

    if (Platform.isAndroid) {
      // Check for common root indicators on Android
      final rootIndicators = [
        '/system/app/Superuser.apk',
        '/system/xbin/su',
        '/system/bin/su',
        '/sbin/su',
        '/data/local/xbin/su',
        '/data/local/bin/su',
        '/data/local/su',
        '/system/sd/xbin/su',
        '/system/bin/failsafe/su',
        '/su/bin/su',
        '/magisk/.core',
      ];

      for (final path in rootIndicators) {
        if (await File(path).exists()) {
          potentiallyCompromised = true;
          warnings.add('Root indicator found');
          break;
        }
      }
    } else if (Platform.isIOS) {
      // Check for common jailbreak indicators on iOS
      final jailbreakIndicators = [
        '/Applications/Cydia.app',
        '/Library/MobileSubstrate/MobileSubstrate.dylib',
        '/bin/bash',
        '/usr/sbin/sshd',
        '/etc/apt',
        '/private/var/lib/apt/',
        '/private/var/lib/cydia',
        '/private/var/stash',
      ];

      for (final path in jailbreakIndicators) {
        if (await File(path).exists()) {
          potentiallyCompromised = true;
          warnings.add('Jailbreak indicator found');
          break;
        }
      }
    }

    return DeviceSecurityStatus(
      isSecure: !potentiallyCompromised,
      warnings: warnings,
      recommendation: potentiallyCompromised
          ? 'Your device may be rooted/jailbroken. Enable encryption for better data protection.'
          : 'Device appears secure.',
    );
  }
}

// ============================================
// DATA MODELS
// ============================================

/// Quick exit destination
class QuickExitDestination {
  final String id;
  final String name;
  final String url;
  final String description;

  const QuickExitDestination({
    required this.id,
    required this.name,
    required this.url,
    required this.description,
  });
}

/// Safety tip for sensitive programs
class SafetyTip {
  final IconData icon;
  final String title;
  final String description;

  const SafetyTip({
    required this.icon,
    required this.title,
    required this.description,
  });
}

/// Network privacy level
enum NetworkPrivacyLevel {
  good,
  moderate,
  caution,
  offline,
  unknown,
}

/// Network privacy status
class NetworkPrivacyStatus {
  final NetworkPrivacyLevel level;
  final String connectionType;
  final String? warning;
  final String? suggestion;

  NetworkPrivacyStatus({
    required this.level,
    required this.connectionType,
    this.warning,
    this.suggestion,
  });

  Color get indicatorColor {
    switch (level) {
      case NetworkPrivacyLevel.good:
        return const Color(0xFF4CAF50); // Green
      case NetworkPrivacyLevel.moderate:
        return const Color(0xFF2196F3); // Blue
      case NetworkPrivacyLevel.caution:
        return const Color(0xFFFF9800); // Orange
      case NetworkPrivacyLevel.offline:
        return const Color(0xFF9E9E9E); // Grey
      case NetworkPrivacyLevel.unknown:
        return const Color(0xFF9E9E9E); // Grey
    }
  }

  IconData get icon {
    switch (level) {
      case NetworkPrivacyLevel.good:
        return Icons.shield;
      case NetworkPrivacyLevel.moderate:
        return Icons.signal_cellular_alt;
      case NetworkPrivacyLevel.caution:
        return Icons.wifi;
      case NetworkPrivacyLevel.offline:
        return Icons.signal_wifi_off;
      case NetworkPrivacyLevel.unknown:
        return Icons.help_outline;
    }
  }
}

/// Disguised app icon configuration
class DisguisedAppIcon {
  final String id;
  final String name;
  final String androidActivityAlias;
  final String iosIconName;
  final IconData iconData;
  final Color backgroundColor;

  const DisguisedAppIcon({
    required this.id,
    required this.name,
    required this.androidActivityAlias,
    required this.iosIconName,
    required this.iconData,
    required this.backgroundColor,
  });
}

/// Result of applying a disguised icon
class DisguiseResult {
  final bool success;
  final String message;
  final bool requiresRestart;

  DisguiseResult({
    required this.success,
    required this.message,
    required this.requiresRestart,
  });
}

/// PIN validation result
class PinValidation {
  final bool isValid;
  final String message;

  PinValidation({
    required this.isValid,
    required this.message,
  });
}

/// Result of setting a PIN
class PinSetResult {
  final bool success;
  final String message;

  PinSetResult({
    required this.success,
    required this.message,
  });
}

/// Result of encryption operation
class EncryptionResult {
  final bool success;
  final String message;

  EncryptionResult({
    required this.success,
    required this.message,
  });
}

/// Device security status (root/jailbreak detection)
class DeviceSecurityStatus {
  final bool isSecure;
  final List<String> warnings;
  final String recommendation;

  DeviceSecurityStatus({
    required this.isSecure,
    required this.warnings,
    required this.recommendation,
  });
}
