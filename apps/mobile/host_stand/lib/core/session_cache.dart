import 'dart:convert';

import 'package:host_stand/features/auth/data/models/auth_user_model.dart';
import 'package:host_stand/features/auth/domain/entities/auth_user.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Local cache for login session, JWT, org/restaurant context, and email.
class SessionCache {
  SessionCache();

  static const _kLoggedIn = 'auth_is_logged_in';
  static const _kRememberMe = 'auth_remember_me';
  static const _kUserJson = 'auth_user_json';
  static const _kEmail = 'auth_remembered_email';
  static const _kAccessToken = 'auth_access_token';
  static const _kRefreshToken = 'auth_refresh_token';
  static const _kAccessExpiresAt = 'auth_access_expires_at';
  static const _kOrganizationId = 'auth_organization_id';
  static const _kRestaurantId = 'auth_restaurant_id';
  static const _kRestaurantName = 'auth_restaurant_name';
  static const _kPushBannersEnabled = 'notif_push_banners_enabled';

  /// Design-preview ids from choose-restaurant debug UI — never valid API ids.
  static const demoRestaurantIds = {'fort', 'edappally', 'demo_1'};

  SharedPreferences? _prefs;
  bool _loggedIn = false;
  bool _rememberMe = false;
  AuthUser? _user;
  String? _rememberedEmail;
  String? _accessToken;
  String? _refreshToken;
  DateTime? _accessExpiresAt;
  String? _organizationId;
  String? _restaurantId;
  String? _restaurantName;
  bool _employeesEnabled = false;
  bool _pushBannersEnabled = true;

  bool get isLoggedIn => _loggedIn;
  bool get rememberMe => _rememberMe;
  AuthUser? get currentUser => _user;
  String? get rememberedEmail => _rememberedEmail;
  String? get accessToken => _accessToken;
  String? get refreshToken => _refreshToken;
  DateTime? get accessExpiresAt => _accessExpiresAt;
  String? get organizationId => _organizationId;
  String? get restaurantId => _restaurantId;
  String? get restaurantName => _restaurantName;
  bool get employeesEnabled => _employeesEnabled;
  bool get pushBannersEnabled => _pushBannersEnabled;

  bool get hasRestaurantContext =>
      (_organizationId?.isNotEmpty ?? false) &&
      (_restaurantId?.isNotEmpty ?? false);

  /// True when org + restaurant are set and the restaurant id is not a design preview.
  bool get hasValidRestaurantContext =>
      hasRestaurantContext && !demoRestaurantIds.contains(_restaurantId);

  bool get accessTokenNearExpiry {
    final exp = _accessExpiresAt;
    if (exp == null) return false;
    return exp.isBefore(DateTime.now().add(const Duration(minutes: 5)));
  }

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    _rememberMe = _prefs!.getBool(_kRememberMe) ?? false;
    _rememberedEmail = _prefs!.getString(_kEmail);
    _pushBannersEnabled = _prefs!.getBool(_kPushBannersEnabled) ?? true;
    final persistedLogin = _prefs!.getBool(_kLoggedIn) ?? false;
    final raw = _prefs!.getString(_kUserJson);
    final token = _prefs!.getString(_kAccessToken);

    if (persistedLogin &&
        _rememberMe &&
        raw != null &&
        raw.isNotEmpty &&
        token != null &&
        token.isNotEmpty) {
      try {
        _user = AuthUserModel.fromJson(
          jsonDecode(raw) as Map<String, dynamic>,
        );
        _accessToken = token;
        _refreshToken = _prefs!.getString(_kRefreshToken);
        final expMs = _prefs!.getInt(_kAccessExpiresAt);
        _accessExpiresAt =
            expMs == null ? null : DateTime.fromMillisecondsSinceEpoch(expMs);
        _organizationId = _prefs!.getString(_kOrganizationId);
        _restaurantId = _prefs!.getString(_kRestaurantId);
        _restaurantName = _prefs!.getString(_kRestaurantName);
        _loggedIn = true;
        await _clearDemoRestaurantIfNeeded();
      } catch (_) {
        await clearAll();
      }
    } else {
      _loggedIn = false;
      _user = null;
      _accessToken = null;
      _refreshToken = null;
      _accessExpiresAt = null;
      _organizationId = null;
      _restaurantId = null;
      _restaurantName = null;
      if (!_rememberMe) {
        await _prefs!.remove(_kUserJson);
        await _prefs!.remove(_kAccessToken);
        await _prefs!.remove(_kRefreshToken);
        await _prefs!.remove(_kAccessExpiresAt);
        await _prefs!.remove(_kOrganizationId);
        await _prefs!.remove(_kRestaurantId);
        await _prefs!.remove(_kRestaurantName);
        await _prefs!.setBool(_kLoggedIn, false);
      }
    }
  }

  Future<void> saveSession({
    required AuthUser user,
    required String accessToken,
    required bool rememberMe,
    String? refreshToken,
    int? expiresInSeconds,
    String? organizationId,
  }) async {
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    _prefs = prefs;
    _user = user;
    _rememberMe = rememberMe;
    _loggedIn = true;
    _rememberedEmail = user.email;
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    _accessExpiresAt = expiresInSeconds == null
        ? null
        : DateTime.now().add(Duration(seconds: expiresInSeconds));
    _restaurantId = null;
    _restaurantName = null;
    _organizationId =
        (organizationId != null && organizationId.isNotEmpty)
            ? organizationId
            : null;

    await prefs.setBool(_kRememberMe, rememberMe);
    await prefs.setString(_kEmail, user.email);

    if (rememberMe) {
      await prefs.setBool(_kLoggedIn, true);
      await prefs.setString(_kAccessToken, accessToken);
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await prefs.setString(_kRefreshToken, refreshToken);
      } else {
        await prefs.remove(_kRefreshToken);
      }
      if (_accessExpiresAt != null) {
        await prefs.setInt(
          _kAccessExpiresAt,
          _accessExpiresAt!.millisecondsSinceEpoch,
        );
      } else {
        await prefs.remove(_kAccessExpiresAt);
      }
      await prefs.setString(
        _kUserJson,
        jsonEncode(
          AuthUserModel(
            id: user.id,
            name: user.name,
            email: user.email,
            restaurantName: user.restaurantName,
            role: user.role,
          ).toJson(),
        ),
      );
      if (_organizationId != null) {
        await prefs.setString(_kOrganizationId, _organizationId!);
      } else {
        await prefs.remove(_kOrganizationId);
      }
      await prefs.remove(_kRestaurantId);
      await prefs.remove(_kRestaurantName);
    } else {
      await prefs.setBool(_kLoggedIn, false);
      await prefs.remove(_kUserJson);
      await prefs.remove(_kAccessToken);
      await prefs.remove(_kRefreshToken);
      await prefs.remove(_kAccessExpiresAt);
      await prefs.remove(_kOrganizationId);
      await prefs.remove(_kRestaurantId);
      await prefs.remove(_kRestaurantName);
    }
  }

  Future<void> updateTokens({
    required String accessToken,
    String? refreshToken,
    int? expiresInSeconds,
  }) async {
    _accessToken = accessToken;
    if (refreshToken != null && refreshToken.isNotEmpty) {
      _refreshToken = refreshToken;
    }
    if (expiresInSeconds != null) {
      _accessExpiresAt =
          DateTime.now().add(Duration(seconds: expiresInSeconds));
    }
    if (!_rememberMe) return;
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    _prefs = prefs;
    await prefs.setString(_kAccessToken, accessToken);
    if (_refreshToken != null) {
      await prefs.setString(_kRefreshToken, _refreshToken!);
    }
    if (_accessExpiresAt != null) {
      await prefs.setInt(
        _kAccessExpiresAt,
        _accessExpiresAt!.millisecondsSinceEpoch,
      );
    }
  }

  void setEmployeesEnabled(bool enabled) {
    _employeesEnabled = enabled;
  }

  Future<void> setPushBannersEnabled(bool enabled) async {
    _pushBannersEnabled = enabled;
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    _prefs = prefs;
    await prefs.setBool(_kPushBannersEnabled, enabled);
  }

  Future<void> setOrganizationId(String organizationId) async {
    _organizationId = organizationId;
    if (!_rememberMe) return;
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    _prefs = prefs;
    await prefs.setString(_kOrganizationId, organizationId);
  }

  Future<void> _clearDemoRestaurantIfNeeded() async {
    if (_restaurantId == null || !demoRestaurantIds.contains(_restaurantId)) {
      return;
    }
    clearDemoRestaurantContext();
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    _prefs = prefs;
    await prefs.remove(_kRestaurantId);
    await prefs.remove(_kRestaurantName);
  }

  /// Sync clear for router redirects when a preview id was persisted.
  void clearDemoRestaurantContext() {
    if (_restaurantId == null || !demoRestaurantIds.contains(_restaurantId)) {
      return;
    }
    _restaurantId = null;
    _restaurantName = null;
    final prefs = _prefs;
    if (prefs != null) {
      prefs.remove(_kRestaurantId);
      prefs.remove(_kRestaurantName);
    }
  }

  Future<void> setSelectedRestaurant({
    required String restaurantId,
    required String restaurantName,
  }) async {
    if (demoRestaurantIds.contains(restaurantId)) {
      throw ArgumentError.value(
        restaurantId,
        'restaurantId',
        'Demo/preview restaurant ids cannot be saved to the session.',
      );
    }
    _restaurantId = restaurantId;
    _restaurantName = restaurantName;
    if (_user != null) {
      _user = AuthUserModel(
        id: _user!.id,
        name: _user!.name,
        email: _user!.email,
        restaurantName: restaurantName,
        role: _user!.role,
      );
    }
    if (!_rememberMe) return;
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    _prefs = prefs;
    await prefs.setString(_kRestaurantId, restaurantId);
    await prefs.setString(_kRestaurantName, restaurantName);
    if (_user != null) {
      await prefs.setString(
        _kUserJson,
        jsonEncode(
          AuthUserModel(
            id: _user!.id,
            name: _user!.name,
            email: _user!.email,
            restaurantName: restaurantName,
            role: _user!.role,
          ).toJson(),
        ),
      );
    }
  }

  /// Clears the active session. Keeps remembered email if Remember me was on.
  Future<void> clearSession() async {
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    _prefs = prefs;
    final keepRemember = _rememberMe;
    final keepEmail = _rememberedEmail;
    _loggedIn = false;
    _user = null;
    _accessToken = null;
    _refreshToken = null;
    _accessExpiresAt = null;
    _organizationId = null;
    _restaurantId = null;
    _restaurantName = null;
    await prefs.setBool(_kLoggedIn, false);
    await prefs.remove(_kUserJson);
    await prefs.remove(_kAccessToken);
    await prefs.remove(_kRefreshToken);
    await prefs.remove(_kAccessExpiresAt);
    await prefs.remove(_kOrganizationId);
    await prefs.remove(_kRestaurantId);
    await prefs.remove(_kRestaurantName);
    if (keepRemember && keepEmail != null) {
      await prefs.setBool(_kRememberMe, true);
      await prefs.setString(_kEmail, keepEmail);
      _rememberMe = true;
      _rememberedEmail = keepEmail;
    } else {
      await prefs.setBool(_kRememberMe, false);
      await prefs.remove(_kEmail);
      _rememberMe = false;
      _rememberedEmail = null;
    }
  }

  Future<void> clearAll() async {
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    _prefs = prefs;
    _loggedIn = false;
    _rememberMe = false;
    _user = null;
    _rememberedEmail = null;
    _accessToken = null;
    _refreshToken = null;
    _accessExpiresAt = null;
    _organizationId = null;
    _restaurantId = null;
    _restaurantName = null;
    await prefs.remove(_kLoggedIn);
    await prefs.remove(_kRememberMe);
    await prefs.remove(_kUserJson);
    await prefs.remove(_kEmail);
    await prefs.remove(_kAccessToken);
    await prefs.remove(_kRefreshToken);
    await prefs.remove(_kAccessExpiresAt);
    await prefs.remove(_kOrganizationId);
    await prefs.remove(_kRestaurantId);
    await prefs.remove(_kRestaurantName);
  }
}
