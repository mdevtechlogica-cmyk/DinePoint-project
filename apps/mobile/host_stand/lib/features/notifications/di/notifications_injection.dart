import 'package:get_it/get_it.dart';
import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/features/notifications/data/repositories/notifications_repository_impl.dart';
import 'package:host_stand/features/notifications/domain/repositories/notifications_repository.dart';
import 'package:host_stand/features/notifications/presentation/cubit/notifications_cubit.dart';

void registerNotificationsDependencies(GetIt sl) {
  sl.registerLazySingleton<NotificationsRepository>(
    () => NotificationsRepositoryImpl(sl<ApiClient>()),
  );
  sl.registerFactory(() => NotificationsCubit(sl()));
}
