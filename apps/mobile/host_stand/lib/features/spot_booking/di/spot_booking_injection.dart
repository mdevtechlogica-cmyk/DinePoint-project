import 'package:get_it/get_it.dart';
import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/session_cache.dart';

import '../data/datasources/api_spot_booking_datasource.dart';
import '../data/datasources/spot_booking_datasource.dart';
import '../data/repositories/spot_booking_repository_impl.dart';
import '../domain/repositories/spot_booking_repository.dart';
import '../presentation/blocs/spot_booking_bloc.dart';
import '../presentation/blocs/spot_booking_event.dart';

void registerSpotBookingDependencies(GetIt sl) {
  sl.registerLazySingleton<SpotBookingDataSource>(
    () => ApiSpotBookingDataSource(sl<ApiClient>(), sl<SessionCache>()),
  );
  sl.registerLazySingleton<SpotBookingRepository>(
    () => SpotBookingRepositoryImpl(sl()),
  );
  sl.registerFactory(
    () => SpotBookingBloc(sl())..add(const Started()),
  );
}
