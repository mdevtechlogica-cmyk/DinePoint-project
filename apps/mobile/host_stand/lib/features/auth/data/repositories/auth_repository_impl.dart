import 'package:host_stand/core/push_notification_service.dart';
import 'package:host_stand/core/session_auth_notifier.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/features/auth/data/models/registration_result.dart';
import 'package:host_stand/features/auth/domain/entities/auth_user.dart';

import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';

class AuthRepositoryImpl implements AuthRepository {
  const AuthRepositoryImpl(
    this._dataSource,
    this._session,
    this._push,
    this._authNotifier,
  );

  final AuthRemoteDataSource _dataSource;
  final SessionCache _session;
  final PushNotificationService _push;
  final SessionAuthNotifier _authNotifier;

  @override
  AuthUser? get currentUser => _session.currentUser;

  @override
  bool get isLoggedIn => _session.isLoggedIn;

  @override
  Future<AuthUser> signIn({
    required String email,
    required String password,
    bool rememberMe = false,
  }) async {
    final session = await _dataSource.signIn(email: email, password: password);
    await _session.saveSession(
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresInSeconds: session.expiresInSeconds,
      rememberMe: rememberMe,
      organizationId: session.organizationId,
    );
    _authNotifier.refresh();
    await _push.syncTokenWithBackend();
    return session.user;
  }

  @override
  Future<String> requestPasswordReset({required String email}) {
    return _dataSource.requestPasswordReset(email: email);
  }

  @override
  Future<RegistrationResult> registerOwner({
    required String ownerName,
    required String email,
    required String password,
    required String organizationName,
    bool rememberMe = false,
  }) async {
    final session = await _dataSource.createOwner(
      ownerName: ownerName,
      email: email,
      password: password,
      organizationName: organizationName,
    );
    await _session.saveSession(
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresInSeconds: session.expiresInSeconds,
      rememberMe: rememberMe,
      organizationId: session.organizationId,
    );
    _authNotifier.refresh();
    await _push.syncTokenWithBackend();
    return RegistrationResult(
      accountId: session.organizationId ?? session.user.id,
      ownerName: session.user.name,
      email: session.user.email,
      organizationName: session.user.restaurantName,
      createdAt: DateTime.now(),
    );
  }

  @override
  Future<void> signOut() async {
    await _push.unregisterCurrentToken();
    await _dataSource.signOut();
    await _session.clearSession();
    _authNotifier.refresh();
  }
}
