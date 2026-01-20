import 'dart:async';
import 'package:flutter/foundation.dart';
import '../services/safety_service.dart';

/// Provider for safety features state management
class SafetyProvider extends ChangeNotifier {
  final SafetyService _safetyService = SafetyService();

  bool _initialized = false;
  bool _quickExitEnabled = false;
  String _quickExitUrl = SafetyService.defaultDestinations[0].url;
  bool _incognitoModeEnabled = false;
  bool _isIncognitoSession = false;
  bool _showSafetyTips = true;
  bool _networkMonitoringEnabled = false;
  bool _networkWarningsEnabled = false;
  NetworkPrivacyStatus? _networkStatus;
  StreamSubscription? _networkSubscription;

  // Disguised mode
  bool _disguisedModeEnabled = false;
  DisguisedAppIcon? _currentDisguisedIcon;

  // PIN protection
  bool _pinProtectionEnabled = false;
  bool _hasPinSet = false;
  bool _isUnlocked = false; // Session unlock state

  // Panic wipe
  bool _panicWipeEnabled = false;
  int _failedPinAttempts = 0;

  // Shake to clear
  bool _shakeToClearEnabled = false;

  // Encryption
  bool _encryptionEnabled = false;
  DeviceSecurityStatus? _deviceSecurityStatus;

  // Getters
  bool get initialized => _initialized;
  bool get quickExitEnabled => _quickExitEnabled;
  String get quickExitUrl => _quickExitUrl;
  bool get incognitoModeEnabled => _incognitoModeEnabled;
  bool get isIncognitoSession => _isIncognitoSession;
  bool get showSafetyTips => _showSafetyTips;
  bool get networkMonitoringEnabled => _networkMonitoringEnabled;
  bool get networkWarningsEnabled => _networkWarningsEnabled;
  NetworkPrivacyStatus? get networkStatus => _networkStatus;
  SafetyService get safetyService => _safetyService;

  // Disguised mode getters
  bool get disguisedModeEnabled => _disguisedModeEnabled;
  DisguisedAppIcon? get currentDisguisedIcon => _currentDisguisedIcon;
  List<DisguisedAppIcon> get disguisedIcons => SafetyService.disguisedIcons;

  // PIN protection getters
  bool get pinProtectionEnabled => _pinProtectionEnabled;
  bool get hasPinSet => _hasPinSet;
  bool get isUnlocked => _isUnlocked;
  bool get requiresPinToAccess => _pinProtectionEnabled && _hasPinSet && !_isUnlocked;

  // Panic wipe getters
  bool get panicWipeEnabled => _panicWipeEnabled;
  int get failedPinAttempts => _failedPinAttempts;

  // Shake to clear getters
  bool get shakeToClearEnabled => _shakeToClearEnabled;

  // Encryption getters
  bool get encryptionEnabled => _encryptionEnabled;
  DeviceSecurityStatus? get deviceSecurityStatus => _deviceSecurityStatus;

  List<QuickExitDestination> get quickExitDestinations =>
      SafetyService.defaultDestinations;

  Future<void> initialize() async {
    if (_initialized) return;

    try {
      _quickExitEnabled = await _safetyService.isQuickExitEnabled();
      _quickExitUrl = await _safetyService.getQuickExitUrl();
      _incognitoModeEnabled = await _safetyService.isIncognitoModeEnabled();
      _isIncognitoSession = _safetyService.isIncognitoSession;
      _showSafetyTips = await _safetyService.shouldShowSafetyTips();
      _networkMonitoringEnabled = await _safetyService.isNetworkMonitoringEnabled();
      _networkWarningsEnabled = await _safetyService.isNetworkWarningsEnabled();

      // Load disguised mode state
      _disguisedModeEnabled = await _safetyService.isDisguisedModeEnabled();
      _currentDisguisedIcon = await _safetyService.getCurrentDisguisedIcon();

      // Load PIN protection state
      _pinProtectionEnabled = await _safetyService.isPinProtectionEnabled();
      _hasPinSet = await _safetyService.hasPinSet();

      // Load panic wipe state
      _panicWipeEnabled = await _safetyService.isPanicWipeEnabled();
      _failedPinAttempts = await _safetyService.getFailedPinAttempts();

      // Load shake to clear state
      _shakeToClearEnabled = await _safetyService.isShakeToClearEnabled();

      // Load encryption state
      _encryptionEnabled = await _safetyService.isEncryptionEnabled();

      // Only start network monitoring if enabled (opt-in)
      if (_networkMonitoringEnabled) {
        _networkStatus = await _safetyService.getNetworkPrivacyStatus();
        _networkSubscription = _safetyService.networkPrivacyStream.listen((status) {
          _networkStatus = status;
          notifyListeners();
        });
      }

      // If incognito mode was enabled, start session
      if (_incognitoModeEnabled) {
        _safetyService.startIncognitoSession();
        _isIncognitoSession = true;
      }
    } catch (e) {
      // Use defaults
    }

    _initialized = true;
    notifyListeners();
  }

  @override
  void dispose() {
    _networkSubscription?.cancel();
    super.dispose();
  }

  // ============================================
  // QUICK EXIT
  // ============================================

  Future<void> setQuickExitEnabled(bool enabled) async {
    _quickExitEnabled = enabled;
    await _safetyService.setQuickExitEnabled(enabled);
    notifyListeners();
  }

  Future<void> setQuickExitUrl(String url) async {
    _quickExitUrl = url;
    await _safetyService.setQuickExitUrl(url);
    notifyListeners();
  }

  Future<void> executeQuickExit() async {
    await _safetyService.executeQuickExit();
  }

  // ============================================
  // INCOGNITO MODE
  // ============================================

  Future<void> setIncognitoModeEnabled(bool enabled) async {
    _incognitoModeEnabled = enabled;
    _isIncognitoSession = enabled;
    await _safetyService.setIncognitoModeEnabled(enabled);
    notifyListeners();
  }

  void startIncognitoSession() {
    _safetyService.startIncognitoSession();
    _isIncognitoSession = true;
    notifyListeners();
  }

  Future<void> endIncognitoSession() async {
    await _safetyService.endIncognitoSession();
    _isIncognitoSession = false;
    notifyListeners();
  }

  // ============================================
  // HISTORY
  // ============================================

  Future<void> addRecentProgram(String programId) async {
    await _safetyService.addRecentProgram(programId);
  }

  Future<List<String>> getRecentPrograms() async {
    return await _safetyService.getRecentPrograms();
  }

  Future<void> addSearchQuery(String query) async {
    await _safetyService.addSearchQuery(query);
  }

  Future<List<String>> getSearchHistory() async {
    return await _safetyService.getSearchHistory();
  }

  Future<void> clearAllHistory() async {
    await _safetyService.clearAllHistory();
    notifyListeners();
  }

  // ============================================
  // SAFETY TIPS
  // ============================================

  Future<void> setShowSafetyTips(bool show) async {
    _showSafetyTips = show;
    await _safetyService.setShowSafetyTips(show);
    notifyListeners();
  }

  bool isProgramSensitive(String? category, List<String>? eligibility) {
    return _safetyService.isProgramSensitive(category, eligibility);
  }

  List<SafetyTip> getSafetyTips(String? category) {
    return _safetyService.getSafetyTips(category);
  }

  // ============================================
  // NETWORK MONITORING (OPT-IN)
  // ============================================

  /// Enable or disable network monitoring service
  Future<void> setNetworkMonitoringEnabled(bool enabled) async {
    _networkMonitoringEnabled = enabled;
    await _safetyService.setNetworkMonitoringEnabled(enabled);

    if (enabled) {
      // Start monitoring
      _networkStatus = await _safetyService.getNetworkPrivacyStatus();
      _networkSubscription?.cancel();
      _networkSubscription = _safetyService.networkPrivacyStream.listen((status) {
        _networkStatus = status;
        notifyListeners();
      });
    } else {
      // Stop monitoring
      _networkSubscription?.cancel();
      _networkSubscription = null;
      _networkStatus = null;
    }

    notifyListeners();
  }

  Future<void> setNetworkWarningsEnabled(bool enabled) async {
    _networkWarningsEnabled = enabled;
    await _safetyService.setNetworkWarningsEnabled(enabled);
    notifyListeners();
  }

  Future<void> refreshNetworkStatus() async {
    if (_networkMonitoringEnabled) {
      _networkStatus = await _safetyService.getNetworkPrivacyStatus();
      notifyListeners();
    }
  }

  // ============================================
  // DISGUISED APP MODE
  // ============================================

  /// Apply a disguised icon to hide the app's identity
  Future<DisguiseResult> applyDisguisedIcon(DisguisedAppIcon icon) async {
    final result = await _safetyService.applyDisguisedIcon(icon.id);
    if (result.success) {
      _disguisedModeEnabled = true;
      _currentDisguisedIcon = icon;
      notifyListeners();
    }
    return result;
  }

  /// Reset to the default app icon
  Future<DisguiseResult> resetToDefaultIcon() async {
    final result = await _safetyService.resetToDefaultIcon();
    if (result.success) {
      _disguisedModeEnabled = false;
      _currentDisguisedIcon = null;
      notifyListeners();
    }
    return result;
  }

  // ============================================
  // PIN PROTECTION
  // ============================================

  /// Validate PIN strength before setting
  PinValidation validatePinStrength(String pin) {
    return _safetyService.validatePinStrength(pin);
  }

  /// Set a new PIN (validates strength automatically)
  Future<PinSetResult> setPin(String pin) async {
    final result = await _safetyService.setPin(pin);
    if (result.success) {
      _pinProtectionEnabled = true;
      _hasPinSet = true;
      _isUnlocked = true; // Unlock after setting
      notifyListeners();
    }
    return result;
  }

  /// Verify PIN and unlock safety settings for this session
  Future<bool> unlockWithPin(String pin) async {
    final isValid = await _safetyService.validatePin(pin);
    if (isValid) {
      _isUnlocked = true;
      notifyListeners();
    }
    return isValid;
  }

  /// Lock safety settings (require PIN again)
  void lockSafetySettings() {
    _isUnlocked = false;
    notifyListeners();
  }

  /// Remove PIN protection (requires current PIN verification first)
  Future<bool> removePin(String currentPin) async {
    final isValid = await _safetyService.validatePin(currentPin);
    if (!isValid) return false;

    await _safetyService.removePin();
    _pinProtectionEnabled = false;
    _hasPinSet = false;
    _isUnlocked = false;
    notifyListeners();
    return true;
  }

  /// Change PIN (requires current PIN verification)
  Future<PinSetResult> changePin(String currentPin, String newPin) async {
    final isValid = await _safetyService.validatePin(currentPin);
    if (!isValid) {
      return PinSetResult(success: false, message: 'Current PIN is incorrect');
    }

    // Remove old PIN and set new one
    await _safetyService.removePin();
    return await setPin(newPin);
  }

  // ============================================
  // PANIC WIPE (3 FAILED PIN ATTEMPTS)
  // ============================================

  /// Enable or disable panic wipe feature
  Future<void> setPanicWipeEnabled(bool enabled) async {
    _panicWipeEnabled = enabled;
    await _safetyService.setPanicWipeEnabled(enabled);
    notifyListeners();
  }

  /// Record a failed PIN attempt
  /// Returns true if panic wipe should be triggered
  Future<bool> recordFailedPinAttempt() async {
    final shouldWipe = await _safetyService.recordFailedPinAttempt();
    _failedPinAttempts = await _safetyService.getFailedPinAttempts();
    notifyListeners();
    return shouldWipe;
  }

  /// Reset failed PIN attempts (call after successful unlock)
  Future<void> resetFailedPinAttempts() async {
    await _safetyService.resetFailedPinAttempts();
    _failedPinAttempts = 0;
    notifyListeners();
  }

  /// Execute panic wipe - deletes all data and closes app
  /// WARNING: This is destructive and cannot be undone
  Future<void> executePanicWipe() async {
    await _safetyService.executePanicWipe();
  }

  // ============================================
  // SHAKE TO CLEAR
  // ============================================

  /// Enable or disable shake-to-clear feature
  Future<void> setShakeToClearEnabled(bool enabled) async {
    _shakeToClearEnabled = enabled;
    await _safetyService.setShakeToClearEnabled(enabled);
    notifyListeners();
  }

  /// Execute shake-to-clear - clears all user data
  Future<void> executeShakeToClear() async {
    await _safetyService.executeShakeToClear();
    notifyListeners();
  }

  // ============================================
  // ENCRYPTED ON-DEVICE STORAGE
  // ============================================

  /// Enable data encryption
  Future<EncryptionResult> enableEncryption() async {
    final result = await _safetyService.enableEncryption();
    if (result.success) {
      _encryptionEnabled = true;
      notifyListeners();
    }
    return result;
  }

  /// Disable data encryption
  Future<EncryptionResult> disableEncryption() async {
    final result = await _safetyService.disableEncryption();
    if (result.success) {
      _encryptionEnabled = false;
      notifyListeners();
    }
    return result;
  }

  /// Check device security status (root/jailbreak detection)
  Future<DeviceSecurityStatus> checkDeviceSecurity() async {
    _deviceSecurityStatus = await _safetyService.checkDeviceSecurity();
    notifyListeners();
    return _deviceSecurityStatus!;
  }
}
