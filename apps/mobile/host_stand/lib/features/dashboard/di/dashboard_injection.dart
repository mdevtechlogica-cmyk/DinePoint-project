import 'package:get_it/get_it.dart';
import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/session_cache.dart';

import '../data/datasources/api_dashboard_remote_data_source.dart';
import '../data/datasources/dashboard_remote_data_source.dart';
import '../data/repositories/dashboard_repository_impl.dart';
import '../domain/repositories/dashboard_repository.dart';
import '../domain/usecases/get_booking_history.dart';
import '../domain/usecases/get_booking_report.dart';
import '../domain/usecases/get_restaurant_profile.dart';
import '../domain/usecases/get_today_bookings.dart';
import '../presentation/bloc/dashboard_bloc.dart';

void registerDashboardDependencies(GetIt sl) {
  sl.registerLazySingleton<DashboardRemoteDataSource>(
    () => ApiDashboardRemoteDataSource(sl<ApiClient>(), sl<SessionCache>()),
  );
  sl.registerLazySingleton<DashboardRepository>(
    () => DashboardRepositoryImpl(sl()),
  );
  sl.registerLazySingleton(() => GetTodayBookings(sl()));
  sl.registerLazySingleton(() => GetBookingHistory(sl()));
  sl.registerLazySingleton(() => GetRestaurantProfile(sl()));
  sl.registerLazySingleton(() => GetBookingReport(sl()));
  sl.registerLazySingleton(() => ExportBookingReportCsv(sl()));

  sl.registerFactory(
    () => DashboardBloc(
      getTodayBookings: sl(),
      getBookingHistory: sl(),
      getRestaurantProfile: sl(),
      getBookingReport: sl(),
      exportBookingReportCsv: sl(),
      dashboardRepository: sl(),
      session: sl(),
    ),
  );
}
