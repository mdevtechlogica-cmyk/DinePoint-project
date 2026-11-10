import 'package:equatable/equatable.dart';
import 'package:host_stand/features/employee/data/models/employee.dart';

class EmployeeDraft extends Equatable {
  const EmployeeDraft(
      {this.id,
      this.name = '',
      this.email = '',
      this.phone = '',
      this.role = EmployeeRole.staff,
      this.password = '',
      this.active = true});
  final String? id;
  final String name, email, phone, password;
  final EmployeeRole role;
  final bool active;
  bool get isEdit => id != null;
  EmployeeDraft copyWith(
          {String? name,
          String? email,
          String? phone,
          String? password,
          EmployeeRole? role,
          bool? active}) =>
      EmployeeDraft(
          id: id,
          name: name ?? this.name,
          email: email ?? this.email,
          phone: phone ?? this.phone,
          password: password ?? this.password,
          role: role ?? this.role,
          active: active ?? this.active);
  @override
  List<Object?> get props => [id, name, email, phone, password, role, active];
}
