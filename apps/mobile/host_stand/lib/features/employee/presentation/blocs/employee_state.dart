import 'package:equatable/equatable.dart';
import 'package:host_stand/features/employee/data/models/employee.dart';
import 'package:host_stand/features/employee/data/models/employee_draft.dart';
import 'package:host_stand/features/employee/presentation/blocs/employee_event.dart';

class EmployeeState extends Equatable {
  const EmployeeState(
      {this.phase = EmployeePhase.initial,
      this.items = const [],
      this.page = EmployeePage.list,
      this.preview = EmployeePreview.all,
      this.filter = EmployeeFilter.all,
      this.query = '',
      this.draft = const EmployeeDraft(),
      this.error,
      this.message});
  final EmployeePhase phase;
  final List<EmployeeModel> items;
  final EmployeePage page;
  final EmployeePreview preview;
  final EmployeeFilter filter;
  final String query;
  final EmployeeDraft draft;
  final String? error, message;
  List<EmployeeModel> get visibleItems {
    Iterable<EmployeeModel> result = items;
    if (filter == EmployeeFilter.active) result = result.where((e) => e.active);
    if (filter == EmployeeFilter.inactive)
      result = result.where((e) => !e.active);
    final q = query.trim().toLowerCase();
    if (q.isNotEmpty)
      result = result.where((e) =>
          e.name.toLowerCase().contains(q) ||
          e.phone.toLowerCase().contains(q) ||
          e.email.toLowerCase().contains(q));
    return result.toList();
  }

  EmployeeState copyWith(
          {EmployeePhase? phase,
          List<EmployeeModel>? items,
          EmployeePage? page,
          EmployeePreview? preview,
          EmployeeFilter? filter,
          String? query,
          EmployeeDraft? draft,
          String? error,
          String? message,
          bool clearError = false,
          bool clearMessage = false}) =>
      EmployeeState(
          phase: phase ?? this.phase,
          items: items ?? this.items,
          page: page ?? this.page,
          preview: preview ?? this.preview,
          filter: filter ?? this.filter,
          query: query ?? this.query,
          draft: draft ?? this.draft,
          error: clearError ? null : error ?? this.error,
          message: clearMessage ? null : message ?? this.message);
  @override
  List<Object?> get props =>
      [phase, items, page, preview, filter, query, draft, error, message];
}
