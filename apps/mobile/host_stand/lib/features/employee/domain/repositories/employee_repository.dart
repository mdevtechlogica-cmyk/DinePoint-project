import 'package:host_stand/features/employee/data/models/employee.dart';
import 'package:host_stand/features/employee/data/models/employee_draft.dart';

abstract interface class EmployeeRepository {
  Future<List<EmployeeModel>> getEmployees();
  Future<List<EmployeeModel>> saveEmployee(EmployeeDraft draft);
}
