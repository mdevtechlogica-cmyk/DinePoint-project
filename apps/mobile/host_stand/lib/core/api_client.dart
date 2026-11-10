import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'api_exception.dart';
import 'session_cache.dart';

typedef UnauthorizedHandler = Future<void> Function();

/// Nest API HTTP client (`/api` prefix included in [baseUrl]).
///
/// Default `http://10.0.2.2:3000/api` reaches the host machine from the
/// Android emulator. Override with:
/// `--dart-define=API_BASE_URL=http://192.168.x.x:3000/api`
///
/// In debug builds, every request/response is logged under the `ApiClient` tag.
class ApiClient {
  ApiClient({
    required SessionCache session,
    String? baseUrl,
    http.Client? httpClient,
    this.onUnauthorized,
  })  : baseUrl = baseUrl ??
            const String.fromEnvironment(
              'API_BASE_URL',
              defaultValue: 'http://10.0.2.2:3000/api',
            ),
        _session = session,
        _http = httpClient ?? http.Client() {
    if (kDebugMode) {
      debugPrint('[$_logTag] baseUrl=$baseUrl');
    }
  }

  final SessionCache _session;
  final http.Client _http;
  final String baseUrl;
  UnauthorizedHandler? onUnauthorized;
  bool _handlingUnauthorized = false;
  bool _refreshing = false;

  static const _logTag = 'ApiClient';
  static const _maxBodyLogChars = 2000;
  static const _sensitiveKeys = {
    'password',
    'currentPassword',
    'newPassword',
    'confirmPassword',
    'accessToken',
    'refreshToken',
    'token',
    'authorization',
    'resetToken',
  };

  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, String>? query,
    bool auth = true,
  }) {
    return _send('GET', path, query: query, auth: auth);
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) {
    return _send('POST', path, body: body, auth: auth);
  }

  Future<Map<String, dynamic>> patch(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) {
    return _send('PATCH', path, body: body, auth: auth);
  }

  Future<Map<String, dynamic>> put(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) {
    return _send('PUT', path, body: body, auth: auth);
  }

  Future<Map<String, dynamic>> delete(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) {
    return _send('DELETE', path, body: body, auth: auth);
  }

  Future<List<dynamic>> getList(
    String path, {
    Map<String, String>? query,
    bool auth = true,
  }) async {
    final decoded = await _sendRaw('GET', path, query: query, auth: auth);
    if (decoded is List) return decoded;
    throw const ApiException('Expected a list response from the API.');
  }

  /// GET that returns raw response body (e.g. CSV export).
  Future<String> getText(
    String path, {
    Map<String, String>? query,
    bool auth = true,
  }) async {
    await _ensureFreshAccessToken(auth: auth);
    final response = await _rawRequest(
      'GET',
      path,
      query: query,
      auth: auth,
      accept: 'text/csv, application/json, text/plain, */*',
    );

    if (response.statusCode == 401 && auth) {
      final retried = await _retryAfterRefresh(
        () => _rawRequest(
          'GET',
          path,
          query: query,
          auth: true,
          accept: 'text/csv, application/json, text/plain, */*',
        ),
      );
      if (retried != null) {
        if (retried.statusCode >= 200 && retried.statusCode < 300) {
          return retried.body;
        }
      } else {
        await _notifyUnauthorized();
        throw const UnauthorizedApiException();
      }
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response.body;
    }

    dynamic decoded;
    try {
      decoded = jsonDecode(response.body);
    } catch (_) {
      decoded = null;
    }
    throw ApiException(
      _messageFromBody(decoded) ??
          'Request failed (${response.statusCode}).',
      statusCode: response.statusCode,
    );
  }

  Future<bool> tryRefreshAccessToken() async {
    final refresh = _session.refreshToken;
    if (refresh == null || refresh.isEmpty) return false;
    if (_refreshing) return false;
    _refreshing = true;
    try {
      _log('→ refreshing access token');
      final response = await _rawRequest(
        'POST',
        '/auth/refresh',
        body: {'refreshToken': refresh},
        auth: false,
      );
      if (response.statusCode < 200 || response.statusCode >= 300) {
        _log('← refresh failed (${response.statusCode})');
        return false;
      }
      final decoded = jsonDecode(response.body);
      if (decoded is! Map) return false;
      final access = decoded['accessToken'] as String?;
      if (access == null || access.isEmpty) return false;
      await _session.updateTokens(
        accessToken: access,
        refreshToken: decoded['refreshToken'] as String?,
        expiresInSeconds: (decoded['expiresInSeconds'] as num?)?.toInt(),
      );
      _log('← refresh ok');
      return true;
    } catch (error) {
      _log('← refresh error: $error');
      return false;
    } finally {
      _refreshing = false;
    }
  }

  Future<Map<String, dynamic>> _send(
    String method,
    String path, {
    Map<String, String>? query,
    Map<String, dynamic>? body,
    bool auth = true,
  }) async {
    final decoded = await _sendRaw(
      method,
      path,
      query: query,
      body: body,
      auth: auth,
    );
    if (decoded is Map<String, dynamic>) return decoded;
    if (decoded is Map) return Map<String, dynamic>.from(decoded);
    throw const ApiException('Expected an object response from the API.');
  }

  Future<dynamic> _sendRaw(
    String method,
    String path, {
    Map<String, String>? query,
    Map<String, dynamic>? body,
    bool auth = true,
  }) async {
    await _ensureFreshAccessToken(auth: auth);
    final response = await _rawRequest(
      method,
      path,
      query: query,
      body: body,
      auth: auth,
    );

    if (response.statusCode == 401 && auth) {
      final retried = await _retryAfterRefresh(
        () => _rawRequest(
          method,
          path,
          query: query,
          body: body,
          auth: true,
        ),
      );
      if (retried != null) {
        return _decodeResponse(retried);
      }
      await _notifyUnauthorized();
      throw const UnauthorizedApiException();
    }

    return _decodeResponse(response);
  }

  Future<void> _ensureFreshAccessToken({required bool auth}) async {
    if (!auth) return;
    if (!_session.accessTokenNearExpiry) return;
    await tryRefreshAccessToken();
  }

  Future<http.Response?> _retryAfterRefresh(
    Future<http.Response> Function() retry,
  ) async {
    final ok = await tryRefreshAccessToken();
    if (!ok) return null;
    return retry();
  }

  Future<http.Response> _rawRequest(
    String method,
    String path, {
    Map<String, String>? query,
    Map<String, dynamic>? body,
    bool auth = true,
    String accept = 'application/json',
  }) async {
    final uri = Uri.parse('$baseUrl$path').replace(
      queryParameters: query == null || query.isEmpty ? null : query,
    );

    final headers = <String, String>{
      'Accept': accept,
      if (body != null) 'Content-Type': 'application/json',
    };

    if (auth) {
      final token = _session.accessToken;
      if (token == null || token.isEmpty) {
        await _notifyUnauthorized();
        throw const UnauthorizedApiException('Not signed in.');
      }
      headers['Authorization'] = 'Bearer $token';
    }

    final started = DateTime.now();
    _logRequest(method, uri, body: body, auth: auth);

    try {
      late final http.Response response;
      switch (method) {
        case 'GET':
          response = await _http.get(uri, headers: headers);
        case 'POST':
          response = await _http.post(
            uri,
            headers: headers,
            body: body == null ? null : jsonEncode(body),
          );
        case 'PATCH':
          response = await _http.patch(
            uri,
            headers: headers,
            body: body == null ? null : jsonEncode(body),
          );
        case 'PUT':
          response = await _http.put(
            uri,
            headers: headers,
            body: body == null ? null : jsonEncode(body),
          );
        case 'DELETE':
          response = await _http.delete(
            uri,
            headers: headers,
            body: body == null ? null : jsonEncode(body),
          );
        default:
          throw ApiException('Unsupported HTTP method: $method');
      }

      final elapsedMs =
          DateTime.now().difference(started).inMilliseconds;
      _logResponse(method, uri, response, elapsedMs);
      return response;
    } catch (error) {
      final elapsedMs =
          DateTime.now().difference(started).inMilliseconds;
      _log(
        '✗ $method $uri failed after ${elapsedMs}ms: $error',
      );
      if (error is ApiException) rethrow;
      throw const ApiException(
        'Unable to reach the server. Check that the API is running.',
      );
    }
  }

  dynamic _decodeResponse(http.Response response) {
    if (response.body.isEmpty) {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return <String, dynamic>{};
      }
      throw ApiException(
        'Request failed (${response.statusCode}).',
        statusCode: response.statusCode,
      );
    }

    dynamic decoded;
    try {
      decoded = jsonDecode(response.body);
    } catch (_) {
      throw ApiException(
        'Invalid JSON response (${response.statusCode}).',
        statusCode: response.statusCode,
      );
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    }

    throw ApiException(
      _messageFromBody(decoded) ??
          'Request failed (${response.statusCode}).',
      statusCode: response.statusCode,
    );
  }

  Future<void> _notifyUnauthorized() async {
    if (_handlingUnauthorized) return;
    final handler = onUnauthorized;
    if (handler == null) return;
    _handlingUnauthorized = true;
    try {
      await handler();
    } finally {
      _handlingUnauthorized = false;
    }
  }

  String? _messageFromBody(dynamic decoded) {
    if (decoded is! Map) return null;
    final message = decoded['message'];
    if (message is String && message.isNotEmpty) return message;
    if (message is List && message.isNotEmpty) {
      return message.map((e) => e.toString()).join(', ');
    }
    final error = decoded['error'];
    if (error is String && error.isNotEmpty) return error;
    return null;
  }

  void _logRequest(
    String method,
    Uri uri, {
    Map<String, dynamic>? body,
    required bool auth,
  }) {
    final buffer = StringBuffer('→ $method $uri');
    buffer.write(auth ? ' (auth)' : ' (public)');
    if (body != null && body.isNotEmpty) {
      buffer.write(' body=${_formatJson(_redactMap(body))}');
    }
    _log(buffer.toString());
  }

  void _logResponse(
    String method,
    Uri uri,
    http.Response response,
    int elapsedMs,
  ) {
    final buffer = StringBuffer(
      '← $method $uri → ${response.statusCode} (${elapsedMs}ms)',
    );
    final body = response.body;
    if (body.isNotEmpty) {
      buffer.write(' body=${_previewBody(body)}');
    }
    _log(buffer.toString());
  }

  void _log(String message) {
    if (!kDebugMode) return;
    debugPrint('[$_logTag] $message');
  }

  Object _redactMap(Map<String, dynamic> input) {
    final out = <String, dynamic>{};
    input.forEach((key, value) {
      if (_sensitiveKeys.contains(key.toLowerCase())) {
        out[key] = '***';
      } else if (value is Map<String, dynamic>) {
        out[key] = _redactMap(value);
      } else if (value is Map) {
        out[key] = _redactMap(Map<String, dynamic>.from(value));
      } else if (value is List) {
        out[key] = value.map((item) {
          if (item is Map<String, dynamic>) return _redactMap(item);
          if (item is Map) return _redactMap(Map<String, dynamic>.from(item));
          return item;
        }).toList();
      } else {
        out[key] = value;
      }
    });
    return out;
  }

  String _previewBody(String body) {
    final trimmed = body.trim();
    if (trimmed.isEmpty) return '{}';
    try {
      final decoded = jsonDecode(trimmed);
      if (decoded is Map) {
        return _formatJson(
          _redactMap(Map<String, dynamic>.from(decoded)),
        );
      }
      return _truncate(trimmed);
    } catch (_) {
      return _truncate(trimmed);
    }
  }

  String _formatJson(Object value) {
    try {
      return _truncate(const JsonEncoder.withIndent('  ').convert(value));
    } catch (_) {
      return _truncate(value.toString());
    }
  }

  String _truncate(String value) {
    if (value.length <= _maxBodyLogChars) return value;
    return '${value.substring(0, _maxBodyLogChars)}…(+${value.length - _maxBodyLogChars} chars)';
  }
}
