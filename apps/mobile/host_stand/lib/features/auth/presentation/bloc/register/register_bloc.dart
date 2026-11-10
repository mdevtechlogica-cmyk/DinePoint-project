import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/features/auth/data/models/registration_result.dart';
import 'package:host_stand/features/auth/domain/repositories/auth_repository.dart';
import 'package:host_stand/features/auth/presentation/bloc/register/register_event.dart';
import 'package:host_stand/features/auth/presentation/bloc/register/register_state.dart';

class RegisterBloc extends Bloc<RegisterEvent, RegisterState> {
  RegisterBloc(this.repository) : super(const RegisterState()) {
    on<OwnerNameChanged>((e, emit) => emit(_edit(emit, ownerName: e.value)));
    on<EmailChanged>((e, emit) => emit(_edit(emit, email: e.value)));
    on<PasswordChanged>((e, emit) => emit(_edit(emit, password: e.value)));
    on<OrganizationChanged>((e, emit) => emit(_edit(emit, organizationName: e.value)));
    on<PasswordVisibilityToggled>((e, emit) => emit(state.copyWith(
      passwordVisible: !state.passwordVisible, clearErrors: true)));
    on<RememberMeChanged>((e, emit) => emit(state.copyWith(rememberMe: e.value)));
    on<RegisterSubmitted>(_submit);
  }

  final AuthRepository repository;

  RegisterState _edit(Emitter<RegisterState> emit, {
    String? ownerName, String? email, String? password, String? organizationName,
  }) {
    final nextName = ownerName ?? state.ownerName;
    final nextEmail = email ?? state.email;
    final nextPassword = password ?? state.password;
    final nextOrg = organizationName ?? state.organizationName;
    final allEmpty = nextName.isEmpty && nextEmail.isEmpty &&
        nextPassword.isEmpty && nextOrg.isEmpty;
    return state.copyWith(ownerName: nextName, email: nextEmail,
      password: nextPassword, organizationName: nextOrg,
      status: allEmpty ? RegisterStatus.empty : RegisterStatus.editing,
      clearErrors: true, clearResult: true);
  }

  Map<String, String> _validate(RegisterState s) {
    final errors = <String, String>{};
    if (s.ownerName.trim().length < 2) errors['ownerName'] = 'Enter your full name';
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(s.email.trim())) {
      errors['email'] = 'Enter a valid email address';
    }
    if (s.password.length < 8) errors['password'] = 'Use at least 8 characters';
    if (s.organizationName.trim().length < 2) {
      errors['organizationName'] = 'Enter an organization name';
    }
    return errors;
  }

  Future<void> _submit(RegisterSubmitted event, Emitter<RegisterState> emit) async {
    final errors = _validate(state);
    if (errors.isNotEmpty) {
      emit(state.copyWith(status: RegisterStatus.validation, errors: errors,
        message: 'Please check the highlighted fields.', clearResult: true));
      return;
    }
    emit(state.copyWith(status: RegisterStatus.loading, clearErrors: true, clearResult: true));
    try {
      final result = await repository.registerOwner(
        ownerName: state.ownerName, email: state.email, password: state.password,
        organizationName: state.organizationName,
        rememberMe: state.rememberMe,
      );
      emit(state.copyWith(status: RegisterStatus.success, result: result, clearErrors: true));
    } on EmailAlreadyUsedException {
      emit(state.copyWith(status: RegisterStatus.emailExists,
        errors: const {'email': 'This email is already in use.'},
        message: 'An account with this email already exists. Sign in instead.'));
    } on RegistrationInputException catch (e) {
      emit(state.copyWith(status: RegisterStatus.failure, message: e.message));
    } catch (_) {
      emit(state.copyWith(status: RegisterStatus.failure,
        message: 'We couldn’t create your account. Please try again.'));
    }
  }

}