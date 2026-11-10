import 'package:get_it/get_it.dart';
import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/push_notification_service.dart';
import 'package:host_stand/core/session_auth_notifier.dart';
import 'package:host_stand/core/session_cache.dart';

import '../data/datasources/auth_remote_data_source.dart';
import '../data/repositories/auth_repository_impl.dart';
import '../domain/repositories/auth_repository.dart';
import '../domain/usecases/sign_in_use_case.dart';

void registerAuthDependencies(GetIt sl) {
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => ApiAuthRemoteDataSource(sl<ApiClient>()),
  );
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      sl(),
      sl<SessionCache>(),
      sl<PushNotificationService>(),
      sl<SessionAuthNotifier>(),
    ),
  );
  sl.registerLazySingleton(() => SignInUseCase(sl()));
}
