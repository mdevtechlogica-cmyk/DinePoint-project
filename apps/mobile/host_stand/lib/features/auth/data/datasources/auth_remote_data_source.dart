import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/api_exception.dart';
import 'package:host_stand/features/auth/data/models/auth_user_model.dart';
import 'package:host_stand/features/auth/data/models/registration_result.dart';

import 'auth_failures.dart';

class AuthSessionResult {
  const AuthSessionResult({
    required this.user,
    required this.accessToken,
    this.refreshToken,
    this.expiresInSeconds,
    this.organizationId,
  });

  final AuthUserModel user;
  final String accessToken;
  final String? refreshToken;
  final int? expiresInSeconds;
  final String? organizationId;
}

abstract interface class AuthRemoteDataSource {
  Future<AuthSessionResult> signIn({
    required String email,
    required String password,
  });

  Future<AuthSessionResult> createOwner({
    required String ownerName,
    required String email,
    required String password,
    required String organizationName,
  });

  Future<String> requestPasswordReset({required String email});

  Future<void> signOut();
}

class ApiAuthRemoteDataSource implements AuthRemoteDataSource {
  ApiAuthRemoteDataSource(this._api);

  final ApiClient _api;

  @override
  Future<AuthSessionResult> signIn({
    required String email,
    required String password,
  }) async {
    final normalizedEmail = email.trim().toLowerCase();
    if (!_isEmailValid(normalizedEmail)) {
      throw const InvalidInputFailure('Enter a valid email address.');
    }
    if (password.length < 8) {
      throw const InvalidInputFailure('Password must be at least 8 characters.');
    }

    try {
      final json = await _api.post(
        '/auth/login',
        auth: false,
        body: {
          'email': normalizedEmail,
          'password': password,
        },
      );

      final userJson = json['user'] as Map<String, dynamic>? ?? {};
      final memberships = json['memberships'] as List<dynamic>? ?? const [];
      final first = memberships.isNotEmpty && memberships.first is Map
          ? Map<String, dynamic>.from(memberships.first as Map)
          : null;
      final org = first?['organization'];
      final orgName = org is Map && org['name'] is String
          ? org['name'] as String
          : 'Your restaurant';
      final role = _titleRole((first?['role'] as String?) ?? 'STAFF');

      return AuthSessionResult(
        user: AuthUserModel(
          id: userJson['id'] as String,
          name: (userJson['name'] as String?) ?? 'Staff',
          email: (userJson['email'] as String?) ?? normalizedEmail,
          restaurantName: orgName,
          role: role,
        ),
        accessToken: json['accessToken'] as String,
        refreshToken: json['refreshToken'] as String?,
        expiresInSeconds: (json['expiresInSeconds'] as num?)?.toInt(),
        organizationId: first?['organizationId'] as String?,
      );
    } on ApiException catch (error) {
      if (error.statusCode == 401) {
        throw const InvalidCredentialsFailure();
      }
      throw InvalidInputFailure(error.message);
    }
  }

  @override
  Future<AuthSessionResult> createOwner({
    required String ownerName,
    required String email,
    required String password,
    required String organizationName,
  }) async {
    final normalizedEmail = email.trim().toLowerCase();
    if (ownerName.trim().length < 2 ||
        !_isEmailValid(normalizedEmail) ||
        password.length < 8 ||
        organizationName.trim().length < 2) {
      throw const RegistrationInputException('Please check the form fields.');
    }

    try {
      final json = await _api.post(
        '/auth/register',
        auth: false,
        body: {
          'name': ownerName.trim(),
          'email': normalizedEmail,
          'password': password,
          'organizationName': organizationName.trim(),
        },
      );

      final userJson = json['user'] as Map<String, dynamic>? ?? {};
      final organization = json['organization'] as Map<String, dynamic>? ?? {};

      return AuthSessionResult(
        user: AuthUserModel(
          id: userJson['id'] as String,
          name: (userJson['name'] as String?) ?? ownerName.trim(),
          email: (userJson['email'] as String?) ?? normalizedEmail,
          restaurantName:
              (organization['name'] as String?) ?? organizationName.trim(),
          role: 'Owner',
        ),
        accessToken: json['accessToken'] as String,
        refreshToken: json['refreshToken'] as String?,
        expiresInSeconds: (json['expiresInSeconds'] as num?)?.toInt(),
        organizationId: organization['id'] as String?,
      );
    } on ApiException catch (error) {
      if (error.statusCode == 409) {
        throw const EmailAlreadyUsedException();
      }
      throw RegistrationInputException(error.message);
    }
  }

  @override
  Future<String> requestPasswordReset({required String email}) async {
    final normalizedEmail = email.trim().toLowerCase();
    if (!_isEmailValid(normalizedEmail)) {
      throw const InvalidInputFailure('Enter a valid email address.');
    }
    try {
      final json = await _api.post(
        '/auth/forgot-password',
        auth: false,
        body: {'email': normalizedEmail},
      );
      return (json['message'] as String?) ??
          'If an account exists for that email, password reset instructions were sent.';
    } on ApiException catch (error) {
      throw InvalidInputFailure(error.message);
    }
  }

  @override
  Future<void> signOut() async {}

  bool _isEmailValid(String email) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
  }

  String _titleRole(String raw) {
    final lower = raw.toLowerCase();
    if (lower.isEmpty) return 'Staff';
    return '${lower[0].toUpperCase()}${lower.substring(1)}';
  }
}
