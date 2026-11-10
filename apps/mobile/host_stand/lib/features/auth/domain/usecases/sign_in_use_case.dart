import '../entities/auth_user.dart';
import '../repositories/auth_repository.dart';

class SignInUseCase {
  const SignInUseCase(this._repository);

  final AuthRepository _repository;

  Future<AuthUser> call({
    required String email,
    required String password,
    bool rememberMe = false,
  }) {
    return _repository.signIn(
      email: email,
      password: password,
      rememberMe: rememberMe,
    );
  }
}
