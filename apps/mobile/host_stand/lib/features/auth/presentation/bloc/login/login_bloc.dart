import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/session_cache.dart';

import '../../../data/datasources/auth_failures.dart';
import '../../../domain/usecases/sign_in_use_case.dart';
import 'login_event.dart';
import 'login_state.dart';

class LoginBloc extends Bloc<LoginEvent, LoginState> {
  LoginBloc(this._signIn, this._session) : super(const LoginState()) {
    on<LoginHydrated>(_onHydrated);
    on<LoginEmailChanged>(_onEmailChanged);
    on<LoginPasswordChanged>(_onPasswordChanged);
    on<LoginPasswordVisibilityToggled>(_onVisibilityToggled);
    on<LoginRememberMeChanged>(_onRememberMeChanged);
    on<LoginSubmitted>(_onSubmitted);
  }

  final SignInUseCase _signIn;
  final SessionCache _session;

  void _onHydrated(LoginHydrated event, Emitter<LoginState> emit) {
    final email = _session.rememberedEmail ?? '';
    final remember = _session.rememberMe;
    emit(state.copyWith(
      email: email,
      rememberMe: remember,
      status: email.isEmpty ? LoginStatus.empty : LoginStatus.editing,
    ));
  }

  void _onEmailChanged(LoginEmailChanged event, Emitter<LoginState> emit) {
    final nextEmail = event.email;
    emit(state.copyWith(
      email: nextEmail,
      status: _editingStatus(
        email: nextEmail,
        password: state.password,
        visible: state.isPasswordVisible,
      ),
      clearError: true,
      clearUser: true,
    ));
  }

  void _onPasswordChanged(
    LoginPasswordChanged event,
    Emitter<LoginState> emit,
  ) {
    final nextPassword = event.password;
    emit(state.copyWith(
      password: nextPassword,
      status: _editingStatus(
        email: state.email,
        password: nextPassword,
        visible: state.isPasswordVisible,
      ),
      clearError: true,
      clearUser: true,
    ));
  }

  void _onVisibilityToggled(
    LoginPasswordVisibilityToggled event,
    Emitter<LoginState> emit,
  ) {
    final visible = !state.isPasswordVisible;
    emit(state.copyWith(
      isPasswordVisible: visible,
      status: visible
          ? LoginStatus.passwordVisible
          : _editingStatus(
              email: state.email,
              password: state.password,
              visible: false,
            ),
      clearError: true,
    ));
  }

  void _onRememberMeChanged(
    LoginRememberMeChanged event,
    Emitter<LoginState> emit,
  ) {
    emit(state.copyWith(rememberMe: event.value));
  }

  Future<void> _onSubmitted(
    LoginSubmitted event,
    Emitter<LoginState> emit,
  ) async {
    final email = state.email.trim();
    final password = state.password;

    if (!_isEmailValid(email)) {
      emit(state.copyWith(
        status: LoginStatus.failure,
        errorMessage: 'Enter a valid email address.',
      ));
      return;
    }
    if (password.isEmpty) {
      emit(state.copyWith(
        status: LoginStatus.failure,
        errorMessage: 'Enter your password.',
      ));
      return;
    }

    emit(state.copyWith(
      status: LoginStatus.loading,
      clearError: true,
      clearUser: true,
    ));

    try {
      final user = await _signIn(
        email: email,
        password: password,
        rememberMe: state.rememberMe,
      );
      emit(state.copyWith(
        status: LoginStatus.success,
        user: user,
        clearError: true,
      ));
    } on InvalidCredentialsFailure {
      emit(state.copyWith(
        status: LoginStatus.failure,
        errorMessage: 'Email or password is incorrect. Try again.',
      ));
    } on InvalidInputFailure catch (error) {
      emit(state.copyWith(
        status: LoginStatus.failure,
        errorMessage: error.message,
      ));
    } catch (_) {
      emit(state.copyWith(
        status: LoginStatus.failure,
        errorMessage: 'Unable to sign in right now. Please try again.',
      ));
    }
  }

  LoginStatus _editingStatus({
    required String email,
    required String password,
    required bool visible,
  }) {
    if (visible) return LoginStatus.passwordVisible;
    if (email.isEmpty && password.isEmpty) return LoginStatus.empty;
    return LoginStatus.editing;
  }

  bool _isEmailValid(String value) =>
      RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value);
}
