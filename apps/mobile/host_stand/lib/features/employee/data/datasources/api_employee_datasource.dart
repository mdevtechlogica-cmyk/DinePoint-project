import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/api_exception.dart';
import 'package:host_stand/core/api_mappers.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/features/employee/data/models/employee.dart';
import 'package:host_stand/features/employee/data/models/employee_draft.dart';

import 'employee_datasource.dart';

class ApiEmployeeDataSource implements EmployeeDataSource {
  ApiEmployeeDataSource(this._api, this._session);

  final ApiClient _api;
  final SessionCache _session;

  String get _orgId {
    final id = _session.organizationId;
    if (id == null || id.isEmpty) {
      throw const ApiException('No organization selected.');
    }
    return id;
  }

  @override
  Future<List<EmployeeModel>> fetchEmployees() async {
    final list = await _api.getList('/organizations/$_orgId/employees');
    return list
        .whereType<Map>()
        .map((raw) => employeeFromApi(Map<String, dynamic>.from(raw)))
        .toList();
  }

  @override
  Future<List<EmployeeModel>> saveEmployee(EmployeeDraft draft) async {
    if (draft.name.trim().isEmpty) throw Exception('Name is required.');
    final email = draft.email.trim().toLowerCase();
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      throw Exception('Enter a valid email address.');
    }
    if (draft.id == null && draft.password.length < 8) {
      throw Exception('Password must contain at least 8 characters.');
    }

    final phone = draft.phone.trim().isEmpty ? '+910000000000' : draft.phone.trim();

    if (draft.id == null) {
      await _api.post(
        '/organizations/$_orgId/employees',
        body: {
          'name': draft.name.trim(),
          'email': email,
          'phone': phone,
          'role': toApiEmployeeRole(draft.role),
          'password': draft.password,
        },
      );
    } else {
      await _api.patch(
        '/organizations/$_orgId/employees/${draft.id}',
        body: {
          'name': draft.name.trim(),
          'email': email,
          'phone': phone,
          'role': toApiEmployeeRole(draft.role),
          'isActive': draft.active,
          if (draft.password.trim().isNotEmpty) 'password': draft.password,
        },
      );
    }

    return fetchEmployees();
  }
}
