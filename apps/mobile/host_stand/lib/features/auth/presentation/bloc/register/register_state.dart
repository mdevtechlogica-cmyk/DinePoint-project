import 'package:equatable/equatable.dart';
import 'package:host_stand/features/auth/data/models/registration_result.dart';
import 'package:host_stand/features/auth/presentation/bloc/register/register_event.dart';

class RegisterState extends Equatable {
  const RegisterState({
    this.ownerName = '',
    this.email = '',
    this.password = '',
    this.organizationName = '',
    this.passwordVisible = false,
    this.rememberMe = true,
    this.status = RegisterStatus.empty,
    this.message,
    this.errors = const {},
    this.result,
  });
  final String ownerName, email, password, organizationName;
  final bool passwordVisible;
  final bool rememberMe;
  final RegisterStatus status;
  final String? message;
  final Map<String, String> errors;
  final RegistrationResult? result;
  bool get loading => status == RegisterStatus.loading;
  bool get canSubmit => ownerName.trim().isNotEmpty && email.trim().isNotEmpty &&
      password.isNotEmpty && organizationName.trim().isNotEmpty && !loading;

  RegisterState copyWith({
    String? ownerName, String? email, String? password, String? organizationName,
    bool? passwordVisible, bool? rememberMe, RegisterStatus? status, String? message,
    Map<String, String>? errors, bool clearErrors = false,
    RegistrationResult? result, bool clearResult = false,
  }) => RegisterState(
    ownerName: ownerName ?? this.ownerName,
    email: email ?? this.email,
    password: password ?? this.password,
    organizationName: organizationName ?? this.organizationName,
    passwordVisible: passwordVisible ?? this.passwordVisible,
    rememberMe: rememberMe ?? this.rememberMe,
    status: status ?? this.status,
    message: clearErrors ? null : (message ?? this.message),
    errors: clearErrors ? const {} : (errors ?? this.errors),
    result: clearResult ? null : (result ?? this.result),
  );

  @override
  List<Object?> get props => [ownerName, email, password, organizationName,
    passwordVisible, rememberMe, status, message, errors, result];
}