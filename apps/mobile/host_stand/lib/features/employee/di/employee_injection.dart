import 'package:get_it/get_it.dart';
import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/session_cache.dart';

import '../data/datasources/api_employee_datasource.dart';
import '../data/datasources/employee_datasource.dart';
import '../data/repositories/employee_repository_impl.dart';
import '../domain/repositories/employee_repository.dart';
import '../presentation/blocs/employee_bloc.dart';
import '../presentation/blocs/employee_event.dart';

void registerEmployeeDependencies(GetIt sl) {
  sl.registerLazySingleton<EmployeeDataSource>(
    () => ApiEmployeeDataSource(sl<ApiClient>(), sl<SessionCache>()),
  );
  sl.registerLazySingleton<EmployeeRepository>(
    () => EmployeeRepositoryImpl(sl()),
  );
  sl.registerFactory(
    () => EmployeeBloc(sl())..add(const EmployeesStarted()),
  );
}
