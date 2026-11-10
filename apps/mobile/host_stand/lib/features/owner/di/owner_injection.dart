import 'package:get_it/get_it.dart';
import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/session_cache.dart';

import '../data/datasources/api_owner_data_source.dart';
import '../data/datasources/owner_data_source.dart';
import '../data/repositories/owner_repository_impl.dart';
import '../domain/repositories/owner_repository.dart';
import '../presentation/blocs/owner_bloc.dart';
import '../presentation/blocs/owner_event.dart';

void registerOwnerDependencies(GetIt sl) {
  sl.registerLazySingleton<OwnerDataSource>(
    () => ApiOwnerDataSource(sl<ApiClient>(), sl<SessionCache>()),
  );
  sl.registerLazySingleton<OwnerRepository>(
    () => OwnerRepositoryImpl(sl()),
  );
  sl.registerFactory(
    () => OwnerBloc(sl())..add(OwnerStarted()),
  );
}
