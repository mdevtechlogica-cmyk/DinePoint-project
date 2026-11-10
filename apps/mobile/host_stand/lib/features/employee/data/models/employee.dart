import 'package:equatable/equatable.dart';

enum EmployeeRole { owner, admin, manager, staff }

extension EmployeeRoleText on EmployeeRole {
  String get label => switch (this) {
        EmployeeRole.owner => 'Owner',
        EmployeeRole.admin => 'Admin',
        EmployeeRole.manager => 'Manager',
        EmployeeRole.staff => 'Staff'
      };
}

class EmployeeModel extends Equatable {
  const EmployeeModel(
      {required this.id,
      required this.name,
      required this.email,
      required this.phone,
      required this.role,
      required this.active});
  final String id, name, email, phone;
  final EmployeeRole role;
  final bool active;
  EmployeeModel copyWith(
          {String? name,
          String? email,
          String? phone,
          EmployeeRole? role,
          bool? active}) =>
      EmployeeModel(
          id: id,
          name: name ?? this.name,
          email: email ?? this.email,
          phone: phone ?? this.phone,
          role: role ?? this.role,
          active: active ?? this.active);
  @override
  List<Object?> get props => [id, name, email, phone, role, active];
}
