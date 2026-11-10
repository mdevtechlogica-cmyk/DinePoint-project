import 'package:get_it/get_it.dart';
import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/session_cache.dart';

import '../data/datasources/api_booking_datasource.dart';
import '../data/datasources/booking_datasource.dart';
import '../data/repositories/booking_repository_impl.dart';
import '../domain/repositories/booking_repository.dart';
import '../presentation/blocs/booking_detail_bloc.dart';

void registerBookingDependencies(GetIt sl) {
  sl.registerLazySingleton<BookingDetailDataSource>(
    () => ApiBookingDetailDataSource(sl<ApiClient>(), sl<SessionCache>()),
  );
  sl.registerLazySingleton<BookingDetailRepository>(
    () => BookingDetailRepositoryImpl(sl()),
  );
  sl.registerFactoryParam<BookingDetailBloc, String, void>(
    (bookingId, _) => BookingDetailBloc(sl(), bookingId: bookingId),
  );
}
