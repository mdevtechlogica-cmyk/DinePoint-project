import 'package:equatable/equatable.dart';

sealed class LoginEvent extends Equatable {
  const LoginEvent();

  @override
  List<Object?> get props => [];
}

final class LoginEmailChanged extends LoginEvent {
  const LoginEmailChanged(this.email);
  final String email;

  @override
  List<Object?> get props => [email];
}

final class LoginPasswordChanged extends LoginEvent {
  const LoginPasswordChanged(this.password);
  final String password;

  @override
  List<Object?> get props => [password];
}

final class LoginPasswordVisibilityToggled extends LoginEvent {
  const LoginPasswordVisibilityToggled();
}

final class LoginRememberMeChanged extends LoginEvent {
  const LoginRememberMeChanged(this.value);
  final bool value;

  @override
  List<Object?> get props => [value];
}

final class LoginHydrated extends LoginEvent {
  const LoginHydrated();
}

final class LoginSubmitted extends LoginEvent {
  const LoginSubmitted();
}
