import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/privacy_service.dart';

/// View mode for program cards in directory
enum DirectoryViewMode {
  comfort, // Default - full cards with descriptions
  condensed, // Compact list view
}

class SettingsProvider extends ChangeNotifier {
  static const String _crashReportingKey = 'baynavigator:crash_reporting';
  static const String _aiSearchEnabledKey = 'baynavigator:ai_search_enabled';
  static const String _directoryViewModeKey = 'baynavigator:directory_view_mode';

  final PrivacyService _privacyService = PrivacyService();

  bool _crashReportingEnabled = true;
  bool _aiSearchEnabled = true;
  bool _initialized = false;
  DirectoryViewMode _directoryViewMode = DirectoryViewMode.comfort;

  // Privacy settings
  bool _useOnion = false;
  bool _proxyEnabled = false;
  ProxyConfig? _proxyConfig;
  bool _orbotAvailable = false;
  PrivacyStatus? _privacyStatus;

  // VoIP calling settings
  CallingApp _preferredCallingApp = CallingApp.system;
  List<CallingApp> _availableCallingApps = [CallingApp.system, CallingApp.other];

  bool get crashReportingEnabled => _crashReportingEnabled;
  bool get aiSearchEnabled => _aiSearchEnabled;
  bool get initialized => _initialized;
  DirectoryViewMode get directoryViewMode => _directoryViewMode;

  // Privacy getters
  bool get useOnion => _useOnion;
  bool get proxyEnabled => _proxyEnabled;
  ProxyConfig? get proxyConfig => _proxyConfig;
  bool get orbotAvailable => _orbotAvailable;
  PrivacyStatus? get privacyStatus => _privacyStatus;
  PrivacyService get privacyService => _privacyService;

  // VoIP calling getters
  CallingApp get preferredCallingApp => _preferredCallingApp;
  List<CallingApp> get availableCallingApps => _availableCallingApps;

  Future<void> initialize() async {
    if (_initialized) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      _crashReportingEnabled = prefs.getBool(_crashReportingKey) ?? true;
      _aiSearchEnabled = prefs.getBool(_aiSearchEnabledKey) ?? true;

      // Load directory view mode
      final viewModeStr = prefs.getString(_directoryViewModeKey);
      if (viewModeStr == 'condensed') {
        _directoryViewMode = DirectoryViewMode.condensed;
      } else {
        _directoryViewMode = DirectoryViewMode.comfort;
      }

      // Load privacy settings
      _useOnion = await _privacyService.isOnionEnabled();
      _proxyEnabled = await _privacyService.isProxyEnabled();
      _proxyConfig = await _privacyService.getProxyConfig();
      _orbotAvailable = await _privacyService.isOrbotAvailable();
      _privacyStatus = await _privacyService.getPrivacyStatus();

      // Load VoIP calling settings
      _preferredCallingApp = await _privacyService.getPreferredCallingApp();
      _availableCallingApps = await _privacyService.getAvailableCallingApps();
    } catch (e) {
      // Use defaults
    }

    _initialized = true;
    notifyListeners();
  }

  Future<void> setCrashReportingEnabled(bool enabled) async {
    _crashReportingEnabled = enabled;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_crashReportingKey, enabled);
    } catch (e) {
      // Continue without persistence
    }
  }

  Future<void> setAISearchEnabled(bool enabled) async {
    _aiSearchEnabled = enabled;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_aiSearchEnabledKey, enabled);
    } catch (e) {
      // Continue without persistence
    }
  }

  Future<void> setDirectoryViewMode(DirectoryViewMode mode) async {
    _directoryViewMode = mode;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_directoryViewModeKey, mode == DirectoryViewMode.condensed ? 'condensed' : 'comfort');
    } catch (e) {
      // Continue without persistence
    }
  }

  // ============================================
  // PRIVACY SETTINGS
  // ============================================

  /// Enable or disable Tor/Onion routing
  /// Requires Orbot (Android/iOS) or Tor client (desktop) to be running
  Future<void> setUseOnion(bool enabled) async {
    _useOnion = enabled;
    await _privacyService.setOnionEnabled(enabled);
    _privacyStatus = await _privacyService.getPrivacyStatus();
    notifyListeners();
  }

  /// Enable or disable custom proxy
  Future<void> setProxyEnabled(bool enabled) async {
    _proxyEnabled = enabled;
    await _privacyService.setProxyEnabled(enabled);
    _privacyStatus = await _privacyService.getPrivacyStatus();
    notifyListeners();
  }

  /// Set proxy configuration
  Future<void> setProxyConfig(ProxyConfig config) async {
    _proxyConfig = config;
    await _privacyService.setProxyConfig(config);
    _privacyStatus = await _privacyService.getPrivacyStatus();
    notifyListeners();
  }

  /// Clear proxy configuration
  Future<void> clearProxyConfig() async {
    _proxyConfig = null;
    _proxyEnabled = false;
    await _privacyService.clearProxyConfig();
    _privacyStatus = await _privacyService.getPrivacyStatus();
    notifyListeners();
  }

  /// Refresh Orbot/Tor availability status
  Future<void> refreshOrbotStatus() async {
    _orbotAvailable = await _privacyService.isOrbotAvailable();
    _privacyStatus = await _privacyService.getPrivacyStatus();
    notifyListeners();
  }

  /// Test the current privacy connection
  Future<PrivacyTestResult> testPrivacyConnection() async {
    return await _privacyService.testPrivacyConnection();
  }

  // ============================================
  // VOIP CALLING SETTINGS
  // ============================================

  /// Set the preferred calling app
  Future<void> setPreferredCallingApp(CallingApp app) async {
    _preferredCallingApp = app;
    await _privacyService.setPreferredCallingApp(app);
    notifyListeners();
  }

  /// Refresh available calling apps (e.g., after installing a new app)
  Future<void> refreshAvailableCallingApps() async {
    _availableCallingApps = await _privacyService.getAvailableCallingApps();
    notifyListeners();
  }

  /// Make a call using the preferred calling app
  Future<CallResult> makeCall(String phoneNumber) async {
    return await _privacyService.makeCall(phoneNumber);
  }
}
