import 'package:host_stand/features/auth/data/models/registration_result.dart';

import '../entities/auth_user.dart';

abstract interface class AuthRepository {
  Future<AuthUser> signIn({
    required String email,
    required String password,
    bool rememberMe = false,
  });

  Future<RegistrationResult> registerOwner({
    required String ownerName,
    required String email,
    required String password,
    required String organizationName,
    bool rememberMe = false,
  });

  Future<String> requestPasswordReset({required String email});

  Future<void> signOut();

  AuthUser? get currentUser;
  bool get isLoggedIn;
}
