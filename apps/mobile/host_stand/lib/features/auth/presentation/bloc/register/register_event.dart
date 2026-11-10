import 'package:equatable/equatable.dart';

enum RegisterStatus { empty, editing, loading, validation, emailExists, failure, success }

sealed class RegisterEvent extends Equatable {
  const RegisterEvent();
  @override
  List<Object?> get props => [];
}
class OwnerNameChanged extends RegisterEvent {
  const OwnerNameChanged(this.value);
  final String value;
  @override
  List<Object?> get props => [value];
}
class EmailChanged extends RegisterEvent {
  const EmailChanged(this.value);
  final String value;
  @override
  List<Object?> get props => [value];
}
class PasswordChanged extends RegisterEvent {
  const PasswordChanged(this.value);
  final String value;
  @override
  List<Object?> get props => [value];
}
class OrganizationChanged extends RegisterEvent {
  const OrganizationChanged(this.value);
  final String value;
  @override
  List<Object?> get props => [value];
}
class PasswordVisibilityToggled extends RegisterEvent {
  const PasswordVisibilityToggled();
}
class RememberMeChanged extends RegisterEvent {
  const RememberMeChanged(this.value);
  final bool value;
  @override
  List<Object?> get props => [value];
}
class RegisterSubmitted extends RegisterEvent {
  const RegisterSubmitted();
}