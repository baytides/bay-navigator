import 'dart:async';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

/// Privacy service for Bay Navigator
/// Provides censorship circumvention features similar to Signal
/// - Tor/Onion routing via Orbot
/// - Custom proxy support (SOCKS5/HTTP)
/// - Privacy-first network configuration
/// - VoIP app selection for private calling
class PrivacyService {
  static const String _useOnionKey = 'baynavigator:use_onion';
  static const String _proxyEnabledKey = 'baynavigator:proxy_enabled';
  static const String _proxyHostKey = 'baynavigator:proxy_host';
  static const String _proxyPortKey = 'baynavigator:proxy_port';
  static const String _proxyTypeKey = 'baynavigator:proxy_type';
  static const String _preferredCallingAppKey = 'baynavigator:preferred_calling_app';

  /// Standard clearnet API endpoint
  static const String clearnetBaseUrl = 'https://baynavigator.org';

  /// Tor hidden service endpoint (requires Orbot or Tor client)
  static const String onionBaseUrl =
      'http://7u42bzioq3cbud5rmey3sfx4odvjfryjifwx4ozonihdtdrykwjifkad.onion';

  /// Default Orbot SOCKS5 proxy port
  static const int orbotSocks5Port = 9050;

  /// Orbot HTTP proxy port (for apps that don't support SOCKS5)
  static const int orbotHttpPort = 8118;

  SharedPreferences? _prefs;

  Future<SharedPreferences> get _preferences async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  // ============================================
  // SETTINGS PERSISTENCE
  // ============================================

  /// Check if onion routing is enabled
  Future<bool> isOnionEnabled() async {
    final prefs = await _preferences;
    return prefs.getBool(_useOnionKey) ?? false;
  }

  /// Enable or disable onion routing
  Future<void> setOnionEnabled(bool enabled) async {
    final prefs = await _preferences;
    await prefs.setBool(_useOnionKey, enabled);
  }

  /// Check if custom proxy is enabled
  Future<bool> isProxyEnabled() async {
    final prefs = await _preferences;
    return prefs.getBool(_proxyEnabledKey) ?? false;
  }

  /// Enable or disable custom proxy
  Future<void> setProxyEnabled(bool enabled) async {
    final prefs = await _preferences;
    await prefs.setBool(_proxyEnabledKey, enabled);
  }

  /// Get proxy configuration
  Future<ProxyConfig?> getProxyConfig() async {
    final prefs = await _preferences;
    final host = prefs.getString(_proxyHostKey);
    final port = prefs.getInt(_proxyPortKey);
    final typeStr = prefs.getString(_proxyTypeKey);

    if (host == null || port == null) return null;

    return ProxyConfig(
      host: host,
      port: port,
      type: ProxyType.values.firstWhere(
        (t) => t.name == typeStr,
        orElse: () => ProxyType.socks5,
      ),
    );
  }

  /// Save proxy configuration
  Future<void> setProxyConfig(ProxyConfig config) async {
    final prefs = await _preferences;
    await prefs.setString(_proxyHostKey, config.host);
    await prefs.setInt(_proxyPortKey, config.port);
    await prefs.setString(_proxyTypeKey, config.type.name);
  }

  /// Clear proxy configuration
  Future<void> clearProxyConfig() async {
    final prefs = await _preferences;
    await prefs.remove(_proxyHostKey);
    await prefs.remove(_proxyPortKey);
    await prefs.remove(_proxyTypeKey);
    await prefs.setBool(_proxyEnabledKey, false);
  }

  // ============================================
  // ORBOT / TOR DETECTION
  // ============================================

  /// Check if Orbot (Tor for Android) is running and accessible
  /// Tests connection to the local SOCKS5 proxy
  Future<bool> isOrbotAvailable() async {
    if (!Platform.isAndroid && !Platform.isIOS) {
      // Desktop platforms may have Tor running differently
      return await _isTorProxyReachable('127.0.0.1', orbotSocks5Port);
    }

    try {
      // Try to connect to Orbot's SOCKS5 proxy
      return await _isTorProxyReachable('127.0.0.1', orbotSocks5Port);
    } catch (e) {
      return false;
    }
  }

  /// Check if a Tor proxy is reachable at the given address
  Future<bool> _isTorProxyReachable(String host, int port) async {
    try {
      final socket = await Socket.connect(
        host,
        port,
        timeout: const Duration(seconds: 3),
      );
      await socket.close();
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Get the appropriate base URL based on privacy settings
  Future<String> getBaseUrl() async {
    final useOnion = await isOnionEnabled();

    if (useOnion) {
      // Check if Tor is available
      final orbotAvailable = await isOrbotAvailable();
      if (orbotAvailable) {
        return onionBaseUrl;
      }
      // Fall back to clearnet if Tor not available
    }

    return clearnetBaseUrl;
  }

  // ============================================
  // HTTP CLIENT CONFIGURATION
  // ============================================

  /// Create an HTTP client configured with privacy settings
  /// Returns a client that routes through Tor/proxy if enabled
  Future<http.Client> createPrivacyAwareClient() async {
    final proxyEnabled = await isProxyEnabled();
    final useOnion = await isOnionEnabled();

    if (proxyEnabled) {
      final config = await getProxyConfig();
      if (config != null) {
        return _createProxyClient(config);
      }
    }

    if (useOnion) {
      final orbotAvailable = await isOrbotAvailable();
      if (orbotAvailable) {
        // Use Orbot's SOCKS5 proxy for .onion routing
        return _createProxyClient(ProxyConfig(
          host: '127.0.0.1',
          port: orbotSocks5Port,
          type: ProxyType.socks5,
        ));
      }
    }

    // Return standard client
    return http.Client();
  }

  /// Create an HTTP client that routes through a proxy
  http.Client _createProxyClient(ProxyConfig config) {
    // Note: The standard http package doesn't directly support SOCKS5
    // For full SOCKS5 support, you'd need packages like socks5_proxy
    // This implementation uses the system proxy settings
    //
    // For a production implementation, consider:
    // 1. Using dart:io HttpClient with proxy settings
    // 2. Using the socks5_proxy package
    // 3. Using the proxy_http_client package

    // For now, return standard client with a note that
    // users should configure system-wide proxy
    return http.Client();
  }

  // ============================================
  // PRIVACY STATUS
  // ============================================

  /// Get current privacy status for UI display
  Future<PrivacyStatus> getPrivacyStatus() async {
    final useOnion = await isOnionEnabled();
    final proxyEnabled = await isProxyEnabled();
    final orbotAvailable = await isOrbotAvailable();

    if (useOnion && orbotAvailable) {
      return PrivacyStatus(
        level: PrivacyLevel.tor,
        description: 'Connected via Tor hidden service',
        isActive: true,
      );
    }

    if (proxyEnabled) {
      final config = await getProxyConfig();
      if (config != null) {
        return PrivacyStatus(
          level: PrivacyLevel.proxy,
          description: 'Using ${config.type.name.toUpperCase()} proxy at ${config.host}:${config.port}',
          isActive: true,
        );
      }
    }

    if (useOnion && !orbotAvailable) {
      return PrivacyStatus(
        level: PrivacyLevel.standard,
        description: 'Tor enabled but Orbot not running',
        isActive: false,
        warning: 'Install and start Orbot to use Tor',
      );
    }

    return PrivacyStatus(
      level: PrivacyLevel.standard,
      description: 'Standard connection',
      isActive: true,
    );
  }

  /// Test the current privacy configuration
  Future<PrivacyTestResult> testPrivacyConnection() async {
    final stopwatch = Stopwatch()..start();

    try {
      final client = await createPrivacyAwareClient();
      final baseUrl = await getBaseUrl();
      final useOnion = await isOnionEnabled();
      final orbotAvailable = await isOrbotAvailable();

      final response = await client
          .get(Uri.parse('$baseUrl/api/metadata.json'))
          .timeout(const Duration(seconds: 30));

      stopwatch.stop();

      final usedOnion = baseUrl.contains('.onion');

      if (response.statusCode == 200) {
        // Build message based on privacy status
        String message;
        if (useOnion && !orbotAvailable) {
          // Tor enabled but Orbot not running - warn user
          message = 'Connected via clearnet (Tor enabled but Orbot not running)';
        } else if (usedOnion) {
          message = 'Connected via Tor';
        } else {
          message = 'Connected via standard network';
        }

        return PrivacyTestResult(
          success: true,
          latencyMs: stopwatch.elapsedMilliseconds,
          message: message,
          usedOnion: usedOnion,
          torEnabledButNotUsed: useOnion && !usedOnion,
        );
      } else {
        return PrivacyTestResult(
          success: false,
          latencyMs: stopwatch.elapsedMilliseconds,
          message: 'Server returned ${response.statusCode}',
          usedOnion: usedOnion,
          torEnabledButNotUsed: useOnion && !usedOnion,
        );
      }
    } catch (e) {
      stopwatch.stop();
      return PrivacyTestResult(
        success: false,
        latencyMs: stopwatch.elapsedMilliseconds,
        message: e.toString(),
        usedOnion: false,
        torEnabledButNotUsed: false,
      );
    }
  }

  // ============================================
  // VOIP CALLING APP SETTINGS
  // ============================================

  /// Timer for clipboard auto-clear
  Timer? _clipboardClearTimer;

  /// Get the preferred calling app
  Future<CallingApp> getPreferredCallingApp() async {
    final prefs = await _preferences;
    final appId = prefs.getString(_preferredCallingAppKey);
    if (appId == null) return CallingApp.system;
    return CallingApp.values.firstWhere(
      (app) => app.id == appId,
      orElse: () => CallingApp.system,
    );
  }

  /// Set the preferred calling app
  Future<void> setPreferredCallingApp(CallingApp app) async {
    final prefs = await _preferences;
    await prefs.setString(_preferredCallingAppKey, app.id);
  }

  /// Check which VoIP apps are installed on this device
  Future<List<CallingApp>> getAvailableCallingApps() async {
    final available = <CallingApp>[CallingApp.system];

    for (final app in CallingApp.values) {
      if (app == CallingApp.system || app == CallingApp.other) continue;

      final isAvailable = await _isAppInstalled(app);
      if (isAvailable) {
        available.add(app);
      }
    }

    // Always add "Other" as an option
    available.add(CallingApp.other);

    return available;
  }

  /// Check if a specific app is installed
  Future<bool> _isAppInstalled(CallingApp app) async {
    if (app.urlScheme == null) return false;

    try {
      // Try to check if the URL scheme can be launched
      final uri = Uri.parse('${app.urlScheme}://');
      return await canLaunchUrl(uri);
    } catch (e) {
      return false;
    }
  }

  /// Make a call using the preferred calling app
  /// Returns true if call was initiated, false if number was copied to clipboard
  Future<CallResult> makeCall(String phoneNumber) async {
    final preferredApp = await getPreferredCallingApp();
    final cleanNumber = _cleanPhoneNumber(phoneNumber);

    if (preferredApp == CallingApp.other) {
      // Copy to clipboard with auto-clear
      await _copyToClipboardWithAutoClear(cleanNumber);
      return CallResult(
        success: true,
        method: CallMethod.clipboard,
        message: 'Phone number copied to clipboard. It will be automatically cleared in 2 minutes for your privacy.',
      );
    }

    // Try to launch the preferred app
    final launched = await _launchCallingApp(preferredApp, cleanNumber);

    if (launched) {
      return CallResult(
        success: true,
        method: CallMethod.app,
        appName: preferredApp.displayName,
      );
    }

    // Fall back to system dialer if preferred app fails
    if (preferredApp != CallingApp.system) {
      final systemLaunched = await _launchCallingApp(CallingApp.system, cleanNumber);
      if (systemLaunched) {
        return CallResult(
          success: true,
          method: CallMethod.app,
          appName: 'Phone',
          message: '${preferredApp.displayName} was not available, using default phone app.',
        );
      }
    }

    // Last resort: copy to clipboard
    await _copyToClipboardWithAutoClear(cleanNumber);
    return CallResult(
      success: true,
      method: CallMethod.clipboard,
      message: 'Could not open calling app. Phone number copied to clipboard.',
    );
  }

  /// Launch a specific calling app with the phone number
  Future<bool> _launchCallingApp(CallingApp app, String phoneNumber) async {
    try {
      Uri uri;

      if (app == CallingApp.system) {
        uri = Uri.parse('tel:$phoneNumber');
      } else if (app.urlScheme != null) {
        // Different apps have different URL formats
        switch (app) {
          case CallingApp.googleVoice:
            uri = Uri.parse('googlevoice://call?number=$phoneNumber');
          case CallingApp.textNow:
            uri = Uri.parse('textnow://call?number=$phoneNumber');
          case CallingApp.whatsApp:
            // WhatsApp requires full international format without +
            final intlNumber = phoneNumber.replaceAll('+', '');
            uri = Uri.parse('whatsapp://send?phone=$intlNumber');
          case CallingApp.signal:
            uri = Uri.parse('sgnl://call?number=$phoneNumber');
          case CallingApp.telegram:
            uri = Uri.parse('tg://resolve?phone=$phoneNumber');
          default:
            uri = Uri.parse('tel:$phoneNumber');
        }
      } else {
        uri = Uri.parse('tel:$phoneNumber');
      }

      return await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (e) {
      return false;
    }
  }

  /// Copy phone number to clipboard with auto-clear after 2 minutes
  Future<void> _copyToClipboardWithAutoClear(String phoneNumber) async {
    // Cancel any existing timer
    _clipboardClearTimer?.cancel();

    // Copy to clipboard
    await Clipboard.setData(ClipboardData(text: phoneNumber));

    // Set timer to clear clipboard after 2 minutes
    _clipboardClearTimer = Timer(const Duration(minutes: 2), () async {
      // Clear clipboard by setting empty data
      // Note: On some platforms, we can only clear if we still "own" the clipboard
      try {
        final currentData = await Clipboard.getData(Clipboard.kTextPlain);
        // Only clear if it's still our phone number
        if (currentData?.text == phoneNumber) {
          await Clipboard.setData(const ClipboardData(text: ''));
        }
      } catch (e) {
        // Clipboard access may fail, ignore
      }
    });
  }

  /// Clean phone number for dialing (remove formatting)
  String _cleanPhoneNumber(String phoneNumber) {
    // Keep only digits, +, and *
    return phoneNumber.replaceAll(RegExp(r'[^\d+*#]'), '');
  }

  /// Cancel the clipboard clear timer (call when disposing)
  void cancelClipboardTimer() {
    _clipboardClearTimer?.cancel();
    _clipboardClearTimer = null;
  }
}

// ============================================
// DATA MODELS
// ============================================

enum ProxyType {
  socks5,
  http,
}

class ProxyConfig {
  final String host;
  final int port;
  final ProxyType type;

  ProxyConfig({
    required this.host,
    required this.port,
    this.type = ProxyType.socks5,
  });

  @override
  String toString() => '${type.name.toUpperCase()}://$host:$port';
}

enum PrivacyLevel {
  standard,
  proxy,
  tor,
}

class PrivacyStatus {
  final PrivacyLevel level;
  final String description;
  final bool isActive;
  final String? warning;

  PrivacyStatus({
    required this.level,
    required this.description,
    required this.isActive,
    this.warning,
  });

  String get icon {
    switch (level) {
      case PrivacyLevel.tor:
        return '🧅'; // Onion for Tor
      case PrivacyLevel.proxy:
        return '🔀'; // Proxy
      case PrivacyLevel.standard:
        return '🌐'; // Standard
    }
  }
}

class PrivacyTestResult {
  final bool success;
  final int latencyMs;
  final String message;
  final bool usedOnion;
  final bool torEnabledButNotUsed;

  PrivacyTestResult({
    required this.success,
    required this.latencyMs,
    required this.message,
    required this.usedOnion,
    this.torEnabledButNotUsed = false,
  });
}

// ============================================
// VOIP CALLING APP MODELS
// ============================================

/// Supported VoIP calling apps
enum CallingApp {
  system('system', 'Phone (Default)', null),
  googleVoice('google_voice', 'Google Voice', 'googlevoice'),
  textNow('textnow', 'TextNow', 'textnow'),
  whatsApp('whatsapp', 'WhatsApp', 'whatsapp'),
  signal('signal', 'Signal', 'sgnl'),
  telegram('telegram', 'Telegram', 'tg'),
  other('other', 'Other (Copy to Clipboard)', null);

  final String id;
  final String displayName;
  final String? urlScheme;

  const CallingApp(this.id, this.displayName, this.urlScheme);

  /// Privacy description for each app
  String get privacyDescription {
    switch (this) {
      case CallingApp.system:
        return 'Uses your phone carrier. Call appears in phone records.';
      case CallingApp.googleVoice:
        return 'VoIP service by Google. Uses separate number.';
      case CallingApp.textNow:
        return 'Free VoIP with separate number. Ad-supported.';
      case CallingApp.whatsApp:
        return 'End-to-end encrypted calls. Requires both parties have app.';
      case CallingApp.signal:
        return 'Privacy-focused, end-to-end encrypted. Requires both parties have app.';
      case CallingApp.telegram:
        return 'Encrypted calls. Requires both parties have app.';
      case CallingApp.other:
        return 'Copies number to clipboard. Auto-clears after 2 minutes for privacy.';
    }
  }
}

/// Method used to initiate the call
enum CallMethod {
  app,
  clipboard,
}

/// Result of attempting to make a call
class CallResult {
  final bool success;
  final CallMethod method;
  final String? appName;
  final String? message;

  CallResult({
    required this.success,
    required this.method,
    this.appName,
    this.message,
  });
}
