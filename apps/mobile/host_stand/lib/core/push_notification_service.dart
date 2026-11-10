import 'dart:async';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/api_exception.dart';
import 'package:host_stand/core/firebase_messaging_background.dart';
import 'package:host_stand/core/firebase_options.dart';
import 'package:host_stand/core/session_cache.dart';

/// Handles FCM permission, token sync with Nest, and foreground banners.
class PushNotificationService {
  PushNotificationService({
    required ApiClient api,
    required SessionCache session,
  })  : _api = api,
        _session = session;

  final ApiClient _api;
  final SessionCache _session;
  final FlutterLocalNotificationsPlugin _local =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;
  bool _firebaseReady = false;
  String? _currentToken;
  StreamSubscription<String>? _registeredSub;
  Completer<String?>? _registrationCompleter;

  /// Optional UI hooks set by the app shell.
  void Function(String title, String body)? onForegroundMessage;
  void Function(String reservationId)? onNotificationOpened;

  bool get isReady => _firebaseReady;

  static const _channel = AndroidNotificationChannel(
    'dinepoint_alerts',
    'DinePoint alerts',
    description: 'Booking and host-stand notifications',
    importance: Importance.high,
  );

  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    await _initLocalNotifications();

    if (!DefaultFirebaseOptions.isConfigured) {
      debugPrint(
        'PushNotificationService: Firebase is not configured; push disabled.',
      );
      return;
    }

    try {
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
      _firebaseReady = true;

      final messaging = FirebaseMessaging.instance;
      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
      await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      FirebaseMessaging.onMessage.listen((message) async {
        final title = message.notification?.title ?? 'DinePoint';
        final body = message.notification?.body ?? '';
        debugPrint('FCM foreground: $title $body');
        onForegroundMessage?.call(title, body);
        if (!_session.pushBannersEnabled) return;
        await _showLocalBanner(
          title: title,
          body: body,
          payload: message.data['reservationId'] ??
              message.data['bookingId'] ??
              message.data['id'],
        );
      });

      FirebaseMessaging.onMessageOpenedApp.listen((message) {
        _openFromData(message.data);
      });

      final initial = await messaging.getInitialMessage();
      if (initial != null) {
        _openFromData(initial.data);
      }

      _registeredSub = messaging.onRegistered.listen((token) async {
        _currentToken = token;
        _registrationCompleter?.complete(token);
        _registrationCompleter = null;
        if (_session.isLoggedIn) {
          await _registerToken(token);
        }
      });

      await messaging.register();

      if (_session.isLoggedIn) {
        await syncTokenWithBackend();
      }
    } catch (error, stack) {
      _firebaseReady = false;
      debugPrint('PushNotificationService init failed: $error\n$stack');
    }
  }

  Future<void> syncTokenWithBackend() async {
    if (!_firebaseReady || !_session.isLoggedIn) return;

    try {
      if (_currentToken != null && _currentToken!.isNotEmpty) {
        await _registerToken(_currentToken!);
        return;
      }

      _registrationCompleter = Completer<String?>();
      await FirebaseMessaging.instance.register();
      final token = await _registrationCompleter!.future.timeout(
        const Duration(seconds: 8),
        onTimeout: () => _currentToken,
      );
      if (token == null || token.isEmpty) return;
      _currentToken = token;
      await _registerToken(token);
    } catch (error) {
      debugPrint('FCM token sync failed: $error');
    }
  }

  Future<void> unregisterCurrentToken() async {
    final token = _currentToken;
    if (token == null || token.isEmpty) {
      if (_firebaseReady) {
        try {
          await FirebaseMessaging.instance.unregister();
        } catch (_) {}
      }
      return;
    }

    try {
      await _api.delete(
        '/device-tokens',
        body: {'token': token},
      );
    } on ApiException catch (error) {
      debugPrint('FCM unregister failed: ${error.message}');
    } catch (error) {
      debugPrint('FCM unregister failed: $error');
    } finally {
      _currentToken = null;
      if (_firebaseReady) {
        try {
          await FirebaseMessaging.instance.unregister();
        } catch (_) {}
      }
    }
  }

  Future<void> dispose() async {
    await _registeredSub?.cancel();
    _registeredSub = null;
  }

  Future<void> _initLocalNotifications() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    await _local.initialize(
      settings: const InitializationSettings(android: android, iOS: ios),
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload != null && payload.isNotEmpty) {
          onNotificationOpened?.call(payload);
        }
      },
    );

    if (Platform.isAndroid) {
      await _local
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel);
    }
  }

  Future<void> _showLocalBanner({
    required String title,
    required String body,
    String? payload,
  }) async {
    await _local.show(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: title,
      body: body,
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(),
      ),
      payload: payload,
    );
  }

  void _openFromData(Map<String, dynamic> data) {
    final reservationId =
        data['reservationId'] ?? data['bookingId'] ?? data['id'];
    if (reservationId is String && reservationId.isNotEmpty) {
      onNotificationOpened?.call(reservationId);
    }
  }

  Future<void> _registerToken(String token) async {
    final platform = Platform.isIOS
        ? 'IOS'
        : Platform.isAndroid
            ? 'ANDROID'
            : 'WEB';

    await _api.post(
      '/device-tokens',
      body: {
        'token': token,
        'platform': platform,
      },
    );
  }
}
