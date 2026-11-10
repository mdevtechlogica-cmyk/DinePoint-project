import 'package:get_it/get_it.dart';

import '../../features/auth/di/auth_injection.dart';
import '../../features/booking/di/booking_injection.dart';
import '../../features/dashboard/di/dashboard_injection.dart';
import '../../features/employee/di/employee_injection.dart';
import '../../features/layout/di/layout_injection.dart';
import '../../features/notifications/di/notifications_injection.dart';
import '../../features/owner/di/owner_injection.dart';
import '../../features/restaurant/di/restaurant_injection.dart';
import '../../features/spot_booking/di/spot_booking_injection.dart';
import '../api_client.dart';
import '../push_notification_service.dart';
import '../session_auth_notifier.dart';
import '../session_cache.dart';

/// Global service locator. Prefer constructor injection; resolve from [sl]
/// only at the composition root (main / router).
final GetIt sl = GetIt.instance;

/// Registers app-wide dependencies. Call once from [main] before [runApp].
Future<void> configureDependencies() async {
  final session = SessionCache();
  await session.init();
  sl.registerSingleton<SessionCache>(session);
  sl.registerSingleton<SessionAuthNotifier>(SessionAuthNotifier());
  sl.registerLazySingleton<ApiClient>(
    () => ApiClient(session: sl<SessionCache>()),
  );
  sl.registerLazySingleton<PushNotificationService>(
    () => PushNotificationService(
      api: sl<ApiClient>(),
      session: sl<SessionCache>(),
    ),
  );

  registerAuthDependencies(sl);
  registerRestaurantDependencies(sl);
  registerDashboardDependencies(sl);
  registerSpotBookingDependencies(sl);
  registerBookingDependencies(sl);
  registerLayoutDependencies(sl);
  registerEmployeeDependencies(sl);
  registerOwnerDependencies(sl);
  registerNotificationsDependencies(sl);

  final api = sl<ApiClient>();
  final authNotifier = sl<SessionAuthNotifier>();
  api.onUnauthorized = () async {
    // Refresh already attempted inside ApiClient; clear local session.
    if (!session.isLoggedIn && session.accessToken == null) return;
    await session.clearSession();
    authNotifier.refresh();
  };
}
