import 'dart:convert';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Background message handler - must be top-level function
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('Background message: ${message.messageId}');
}

/// Push Notification Service for Bay Navigator
/// Handles FCM registration and notification preferences
class PushNotificationService {
  static const String _registerEndpoint =
      'https://baynavigator-functions.azurewebsites.net/api/push-register';

  static const String _enabledKey = 'baynavigator:push_enabled';
  static const String _tokenKey = 'baynavigator:push_token';
  static const String _installationIdKey = 'baynavigator:push_installation_id';
  static const String _weatherAlertsKey = 'baynavigator:push_weather_alerts';
  static const String _weatherCountiesKey = 'baynavigator:push_weather_counties';
  static const String _programUpdatesKey = 'baynavigator:push_program_updates';
  static const String _announcementsKey = 'baynavigator:push_announcements';

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  SharedPreferences? _prefs;
  String? _fcmToken;
  bool _initialized = false;

  // Callbacks for navigation
  Function(String programId)? onOpenProgram;
  Function(String url)? onOpenUrl;
  Function()? onOpenDirectory;
  Function()? onOpenMap;

  Future<SharedPreferences> get _preferences async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  /// Initialize the push notification service
  Future<void> initialize() async {
    if (_initialized) return;

    // Skip on web - use browser Push API instead
    if (kIsWeb) {
      _initialized = true;
      return;
    }

    // Initialize local notifications
    await _initializeLocalNotifications();

    // Set up background message handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification taps when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Check for initial notification (app opened from terminated state)
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }

    // Get FCM token
    await _refreshToken();

    // Listen for token refresh
    _messaging.onTokenRefresh.listen((token) {
      _fcmToken = token;
      _registerWithBackend();
    });

    _initialized = true;
  }

  Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _handleLocalNotificationTap,
    );

    // Create notification channel for Android
    if (Platform.isAndroid) {
      const channel = AndroidNotificationChannel(
        'baynavigator_notifications',
        'Bay Navigator Notifications',
        description: 'Notifications from Bay Navigator',
        importance: Importance.high,
      );

      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }
  }

  /// Request notification permissions
  Future<bool> requestPermission() async {
    if (kIsWeb) return false;

    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    final granted =
        settings.authorizationStatus == AuthorizationStatus.authorized ||
            settings.authorizationStatus == AuthorizationStatus.provisional;

    if (granted) {
      await _refreshToken();
      await setEnabled(true);
    }

    return granted;
  }

  /// Check if notifications are enabled
  Future<bool> isEnabled() async {
    final prefs = await _preferences;
    return prefs.getBool(_enabledKey) ?? false;
  }

  /// Enable or disable push notifications
  Future<void> setEnabled(bool enabled) async {
    final prefs = await _preferences;
    await prefs.setBool(_enabledKey, enabled);

    if (enabled) {
      await _registerWithBackend();
    } else {
      await _unregisterFromBackend();
    }
  }

  /// Get weather alerts preference
  Future<bool> getWeatherAlertsEnabled() async {
    final prefs = await _preferences;
    return prefs.getBool(_weatherAlertsKey) ?? true;
  }

  /// Set weather alerts preference
  Future<void> setWeatherAlertsEnabled(bool enabled) async {
    final prefs = await _preferences;
    await prefs.setBool(_weatherAlertsKey, enabled);
    await _updatePreferencesOnBackend();
  }

  /// Get weather counties
  Future<List<String>> getWeatherCounties() async {
    final prefs = await _preferences;
    return prefs.getStringList(_weatherCountiesKey) ?? [];
  }

  /// Set weather counties
  Future<void> setWeatherCounties(List<String> counties) async {
    final prefs = await _preferences;
    await prefs.setStringList(_weatherCountiesKey, counties);
    await _updatePreferencesOnBackend();
  }

  /// Get program updates preference
  Future<bool> getProgramUpdatesEnabled() async {
    final prefs = await _preferences;
    return prefs.getBool(_programUpdatesKey) ?? true;
  }

  /// Set program updates preference
  Future<void> setProgramUpdatesEnabled(bool enabled) async {
    final prefs = await _preferences;
    await prefs.setBool(_programUpdatesKey, enabled);
    await _updatePreferencesOnBackend();
  }

  /// Get announcements preference
  Future<bool> getAnnouncementsEnabled() async {
    final prefs = await _preferences;
    return prefs.getBool(_announcementsKey) ?? true;
  }

  /// Set announcements preference
  Future<void> setAnnouncementsEnabled(bool enabled) async {
    final prefs = await _preferences;
    await prefs.setBool(_announcementsKey, enabled);
    await _updatePreferencesOnBackend();
  }

  /// Get or create installation ID
  Future<String> _getInstallationId() async {
    final prefs = await _preferences;
    var id = prefs.getString(_installationIdKey);

    if (id == null) {
      id = DateTime.now().millisecondsSinceEpoch.toString() +
          '-' +
          (DateTime.now().microsecond * 1000).toRadixString(36);
      await prefs.setString(_installationIdKey, id);
    }

    return id;
  }

  /// Refresh FCM token
  Future<void> _refreshToken() async {
    try {
      _fcmToken = await _messaging.getToken();
      debugPrint('FCM Token: $_fcmToken');

      if (_fcmToken != null) {
        final prefs = await _preferences;
        await prefs.setString(_tokenKey, _fcmToken!);
      }
    } catch (e) {
      debugPrint('Failed to get FCM token: $e');
    }
  }

  /// Register device with backend
  Future<void> _registerWithBackend() async {
    if (_fcmToken == null) return;

    final enabled = await isEnabled();
    if (!enabled) return;

    try {
      final installationId = await _getInstallationId();
      final preferences = await _getPreferences();

      final response = await http.post(
        Uri.parse(_registerEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'platform': 'android',
          'token': _fcmToken,
          'installationId': installationId,
          'preferences': preferences,
        }),
      );

      if (response.statusCode == 200) {
        debugPrint('Registered with push backend');
      } else {
        debugPrint('Registration failed: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Backend registration error: $e');
    }
  }

  /// Unregister from backend
  Future<void> _unregisterFromBackend() async {
    if (_fcmToken == null) return;

    try {
      await http.delete(
        Uri.parse(_registerEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'platform': 'android',
          'token': _fcmToken,
        }),
      );
      debugPrint('Unregistered from push backend');
    } catch (e) {
      debugPrint('Backend unregistration error: $e');
    }
  }

  /// Update preferences on backend
  Future<void> _updatePreferencesOnBackend() async {
    if (_fcmToken == null) return;

    final enabled = await isEnabled();
    if (!enabled) return;

    try {
      final installationId = await _getInstallationId();
      final preferences = await _getPreferences();

      await http.post(
        Uri.parse(_registerEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'platform': 'android',
          'token': _fcmToken,
          'installationId': installationId,
          'preferences': preferences,
        }),
      );
    } catch (e) {
      debugPrint('Failed to update preferences: $e');
    }
  }

  /// Get current preferences map
  Future<Map<String, dynamic>> _getPreferences() async {
    return {
      'weatherAlerts': await getWeatherAlertsEnabled(),
      'weatherCounties': await getWeatherCounties(),
      'programUpdates': await getProgramUpdatesEnabled(),
      'announcements': await getAnnouncementsEnabled(),
    };
  }

  /// Handle foreground message
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('Foreground message: ${message.notification?.title}');

    final notification = message.notification;
    if (notification == null) return;

    // Show local notification
    _localNotifications.show(
      message.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          'baynavigator_notifications',
          'Bay Navigator Notifications',
          channelDescription: 'Notifications from Bay Navigator',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: jsonEncode(message.data),
    );
  }

  /// Handle notification tap (from FCM)
  void _handleNotificationTap(RemoteMessage message) {
    _processNotificationData(message.data);
  }

  /// Handle local notification tap
  void _handleLocalNotificationTap(NotificationResponse response) {
    if (response.payload == null) return;

    try {
      final data = jsonDecode(response.payload!) as Map<String, dynamic>;
      _processNotificationData(data);
    } catch (e) {
      debugPrint('Failed to parse notification payload: $e');
    }
  }

  /// Process notification data for navigation
  void _processNotificationData(Map<String, dynamic> data) {
    final type = data['type'] as String?;

    switch (type) {
      case 'weather':
        final url = data['url'] as String?;
        if (url != null) {
          onOpenUrl?.call(url);
        } else {
          onOpenMap?.call();
        }
        break;

      case 'program':
        final programId = data['programId'] as String?;
        if (programId != null) {
          onOpenProgram?.call(programId);
        } else {
          onOpenDirectory?.call();
        }
        break;

      case 'status':
        final programId = data['programId'] as String?;
        if (programId != null) {
          onOpenProgram?.call(programId);
        }
        break;

      case 'announcement':
        final url = data['url'] as String?;
        if (url != null) {
          onOpenUrl?.call(url);
        }
        break;
    }
  }

  /// Subscribe to a topic
  Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
  }

  /// Unsubscribe from a topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
  }

  /// Get the current FCM token
  String? get fcmToken => _fcmToken;
}
