import 'package:get_it/get_it.dart';
import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/session_cache.dart';

import '../data/datasources/api_layout_datasource.dart';
import '../data/datasources/layout_datasource.dart';
import '../data/repositories/layout_repository_impl.dart';
import '../domain/repositories/layout_repository.dart';
import '../presentation/blocs/layout_bloc.dart';
import '../presentation/blocs/layout_event.dart';

void registerLayoutDependencies(GetIt sl) {
  sl.registerLazySingleton<LayoutDataSource>(
    () => ApiLayoutDataSource(sl<ApiClient>(), sl<SessionCache>()),
  );
  sl.registerLazySingleton<LayoutRepository>(
    () => LayoutRepositoryImpl(sl()),
  );
  sl.registerFactory(() => LayoutBloc(sl())..add(const LayoutStarted()));
}
