import 'package:get_it/get_it.dart';
import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/session_cache.dart';

import '../data/datasources/restaurant_data_source.dart';
import '../data/repositories/restaurant_repository_impl.dart';
import '../domain/repositories/restaurant_repository.dart';

void registerRestaurantDependencies(GetIt sl) {
  sl.registerLazySingleton<RestaurantDataSource>(
    () => ApiRestaurantDataSource(sl<ApiClient>(), sl<SessionCache>()),
  );
  sl.registerLazySingleton<RestaurantRepository>(
    () => RestaurantRepositoryImpl(sl()),
  );
}
