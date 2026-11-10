import 'package:host_stand/features/employee/data/datasources/employee_datasource.dart';
import 'package:host_stand/features/employee/data/models/employee.dart';
import 'package:host_stand/features/employee/data/models/employee_draft.dart';
import 'package:host_stand/features/employee/domain/repositories/employee_repository.dart';

class EmployeeRepositoryImpl implements EmployeeRepository {
  const EmployeeRepositoryImpl(this.source);
  final EmployeeDataSource source;
  @override
  Future<List<EmployeeModel>> getEmployees() => source.fetchEmployees();
  @override
  Future<List<EmployeeModel>> saveEmployee(EmployeeDraft draft) =>
      source.saveEmployee(draft);
}
