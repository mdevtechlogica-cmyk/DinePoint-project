import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/features/employee/data/models/employee_draft.dart';
import 'package:host_stand/features/employee/domain/repositories/employee_repository.dart';
import 'package:host_stand/features/employee/presentation/blocs/employee_event.dart';
import 'package:host_stand/features/employee/presentation/blocs/employee_state.dart';

class EmployeeBloc extends Bloc<EmployeeEvent, EmployeeState> {
  EmployeeBloc(this.repo) : super(const EmployeeState()) {
    on<EmployeesStarted>(_load);
    on<SearchChanged>((e, emit) => emit(state.copyWith(query: e.value)));
    on<FilterChanged>((e, emit) => emit(state.copyWith(filter: e.value)));
    on<EmployeeFormOpened>((e, emit) {
      final x = e.employee;
      emit(state.copyWith(
          page: EmployeePage.form,
          preview:
              x == null ? EmployeePreview.addEmpty : EmployeePreview.editLatha,
          draft: x == null
              ? const EmployeeDraft()
              : EmployeeDraft(
                  id: x.id,
                  name: x.name,
                  email: x.email,
                  phone: x.phone,
                  role: x.role,
                  active: x.active),
          clearError: true,
          clearMessage: true));
    });
    on<DraftChanged>(
        (e, emit) => emit(state.copyWith(draft: e.value, clearError: true)));
    on<EmployeeSaveRequested>(_save);
  }
  final EmployeeRepository repo;
  Future<void> _load(EmployeesStarted e, Emitter<EmployeeState> emit) async {
    emit(state.copyWith(phase: EmployeePhase.loading, clearError: true));
    try {
      emit(state.copyWith(
          phase: EmployeePhase.ready,
          items: await repo.getEmployees(),
          preview: EmployeePreview.all,
          clearError: true));
    } catch (_) {
      emit(state.copyWith(
          phase: EmployeePhase.failure,
          error: 'Could not load employees. Please retry.'));
    }
  }

  Future<void> _save(
      EmployeeSaveRequested e, Emitter<EmployeeState> emit) async {
    emit(state.copyWith(
        phase: EmployeePhase.saving,
        preview: EmployeePreview.saving,
        clearError: true,
        clearMessage: true));
    try {
      final items = await repo.saveEmployee(state.draft);
      emit(state.copyWith(
          phase: EmployeePhase.ready,
          items: items,
          page: EmployeePage.list,
          preview: EmployeePreview.saved,
          message: 'Employee saved successfully.',
          clearError: true));
    } catch (ex) {
      emit(state.copyWith(
          phase: EmployeePhase.ready,
          preview: EmployeePreview.validation,
          error: ex.toString().replaceFirst('Exception: ', '')));
    }
  }
}
