import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/push_notification_service.dart';
import 'package:host_stand/core/session_cache.dart';

import 'core/di/injection.dart';
import 'core/router/app_router.dart';
import 'core/router/app_routes.dart';
import 'core/theme.dart';
import 'features/auth/domain/repositories/auth_repository.dart';
import 'features/auth/domain/usecases/sign_in_use_case.dart';
import 'features/restaurant/domain/repositories/restaurant_repository.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await configureDependencies();
  final loggedIn = sl<SessionCache>().isLoggedIn;
  final router = createAppRouter(
    initialLocation: loggedIn ? AppRoutes.restaurants : AppRoutes.login,
  );
  final push = sl<PushNotificationService>();
  push.onForegroundMessage = (title, body) {
    final messenger = rootScaffoldMessengerKey.currentState;
    messenger?.showSnackBar(
      SnackBar(content: Text(body.isEmpty ? title : '$title — $body')),
    );
  };
  push.onNotificationOpened = (reservationId) {
    router.go(AppRoutes.bookingDetailPath(reservationId));
  };
  await push.initialize();
  runApp(DinePointApp(router: router));
}

final GlobalKey<ScaffoldMessengerState> rootScaffoldMessengerKey =
    GlobalKey<ScaffoldMessengerState>();

class DinePointApp extends StatelessWidget {
  const DinePointApp({required this.router, super.key});

  final GoRouter router;

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider<AuthRepository>.value(value: sl()),
        RepositoryProvider<SignInUseCase>.value(value: sl()),
        RepositoryProvider<RestaurantRepository>.value(value: sl()),
        RepositoryProvider<SessionCache>.value(value: sl()),
      ],
      child: MaterialApp.router(
        title: AppCopy.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        scaffoldMessengerKey: rootScaffoldMessengerKey,
        routerConfig: router,
      ),
    );
  }
}
