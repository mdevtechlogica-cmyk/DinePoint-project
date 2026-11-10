import 'package:equatable/equatable.dart';
import 'package:host_stand/features/employee/data/models/employee.dart';
import 'package:host_stand/features/employee/data/models/employee_draft.dart';

enum EmployeePage { list, form }

enum EmployeePhase { initial, loading, ready, saving, failure }

/// Internal form/list markers (not demo UI switcher values).
enum EmployeePreview {
  all,
  addEmpty,
  editLatha,
  validation,
  saving,
  saved,
}

enum EmployeeFilter { all, active, inactive }

sealed class EmployeeEvent extends Equatable {
  const EmployeeEvent();
  @override
  List<Object?> get props => [];
}

class EmployeesStarted extends EmployeeEvent {
  const EmployeesStarted();
}

class SearchChanged extends EmployeeEvent {
  const SearchChanged(this.value);
  final String value;
  @override
  List<Object?> get props => [value];
}

class FilterChanged extends EmployeeEvent {
  const FilterChanged(this.value);
  final EmployeeFilter value;
  @override
  List<Object?> get props => [value];
}

class EmployeeFormOpened extends EmployeeEvent {
  const EmployeeFormOpened({this.employee});
  final EmployeeModel? employee;
  @override
  List<Object?> get props => [employee];
}

class DraftChanged extends EmployeeEvent {
  const DraftChanged(this.value);
  final EmployeeDraft value;
  @override
  List<Object?> get props => [value];
}

class EmployeeSaveRequested extends EmployeeEvent {
  const EmployeeSaveRequested();
}
