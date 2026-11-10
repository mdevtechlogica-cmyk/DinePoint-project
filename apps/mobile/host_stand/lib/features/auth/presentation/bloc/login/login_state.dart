import 'package:equatable/equatable.dart';

import '../../../domain/entities/auth_user.dart';

enum LoginStatus {
  empty,
  editing,
  passwordVisible,
  validating,
  loading,
  success,
  failure,
}

class LoginState extends Equatable {
  const LoginState({
    this.email = '',
    this.password = '',
    this.isPasswordVisible = false,
    this.rememberMe = false,
    this.status = LoginStatus.empty,
    this.errorMessage,
    this.user,
  });

  final String email;
  final String password;
  final bool isPasswordVisible;
  final bool rememberMe;
  final LoginStatus status;
  final String? errorMessage;
  final AuthUser? user;

  bool get isLoading => status == LoginStatus.loading;
  bool get canSubmit =>
      email.trim().isNotEmpty && password.isNotEmpty && !isLoading;

  LoginState copyWith({
    String? email,
    String? password,
    bool? isPasswordVisible,
    bool? rememberMe,
    LoginStatus? status,
    String? errorMessage,
    bool clearError = false,
    AuthUser? user,
    bool clearUser = false,
  }) {
    return LoginState(
      email: email ?? this.email,
      password: password ?? this.password,
      isPasswordVisible: isPasswordVisible ?? this.isPasswordVisible,
      rememberMe: rememberMe ?? this.rememberMe,
      status: status ?? this.status,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      user: clearUser ? null : (user ?? this.user),
    );
  }

  @override
  List<Object?> get props => [
        email,
        password,
        isPasswordVisible,
        rememberMe,
        status,
        errorMessage,
        user,
      ];
}
