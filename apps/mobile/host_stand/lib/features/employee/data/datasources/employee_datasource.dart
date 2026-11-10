import 'package:host_stand/features/employee/data/models/employee.dart';
import 'package:host_stand/features/employee/data/models/employee_draft.dart';

abstract interface class EmployeeDataSource {
  Future<List<EmployeeModel>> fetchEmployees();
  Future<List<EmployeeModel>> saveEmployee(EmployeeDraft draft);
}
