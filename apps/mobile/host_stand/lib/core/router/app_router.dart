import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/domain/repositories/auth_repository.dart';
import '../../features/auth/domain/usecases/sign_in_use_case.dart';
import '../../features/auth/presentation/bloc/login/login_bloc.dart';
import '../../features/auth/presentation/bloc/login/login_event.dart';
import '../../features/auth/presentation/bloc/register/register_bloc.dart';
import '../../features/auth/presentation/pages/login_screen.dart';
import '../../features/auth/presentation/pages/register_screen.dart';
import '../../features/auth/presentation/pages/reset_password_screen.dart';
import '../session_auth_notifier.dart';
import '../session_cache.dart';
import '../../features/booking/presentation/blocs/booking_detail_bloc.dart';
import '../../features/booking/presentation/blocs/booking_detail_event.dart';
import '../../features/booking/presentation/pages/booking_detail_screen.dart';
import '../../features/dashboard/presentation/bloc/dashboard_bloc.dart';
import '../../features/dashboard/presentation/bloc/dashboard_event.dart';
import '../../features/dashboard/presentation/pages/dashboard_shell_page.dart';
import '../../features/employee/presentation/blocs/employee_bloc.dart';
import '../../features/employee/presentation/pages/add_employee_screen.dart';
import '../../features/employee/presentation/pages/employee_screen.dart';
import '../../features/layout/presentation/pages/floor_screen.dart';
import '../../features/layout/presentation/pages/table_form_screen.dart';
import '../../features/layout/presentation/pages/table_screen.dart';
import '../../features/layout/presentation/widgets/layout_widgets.dart';
import '../../features/notifications/presentation/cubit/notifications_cubit.dart';
import '../../features/notifications/presentation/pages/notifications_screen.dart';
import '../../features/owner/presentation/blocs/owner_bloc.dart';
import '../../features/owner/presentation/pages/owner_screens.dart';
import '../../features/restaurant/domain/repositories/restaurant_repository.dart';
import '../../features/restaurant/presentation/bloc/choose_restaurant/restaurant_bloc.dart';
import '../../features/restaurant/presentation/bloc/choose_restaurant/restaurant_event.dart';
import '../../features/restaurant/presentation/bloc/create_restaurant/create_restaurant_bloc.dart';
import '../../features/restaurant/presentation/pages/choose_restaurant_screen.dart';
import '../../features/restaurant/presentation/pages/create_restaurant_screen.dart';
import '../../features/spot_booking/presentation/blocs/spot_booking_bloc.dart';
import '../../features/spot_booking/presentation/pages/spot_booking_screen.dart';
import '../di/injection.dart';
import 'app_routes.dart';

GoRouter createAppRouter({String initialLocation = AppRoutes.login}) {
  return GoRouter(
    initialLocation: initialLocation,
    refreshListenable: sl<SessionAuthNotifier>(),
    redirect: (context, state) {
      // Custom scheme: dinepoint://reset-password?token=...
      if (state.uri.scheme == 'dinepoint' &&
          state.uri.host == 'reset-password') {
        final token = state.uri.queryParameters['token'];
        final q = token == null || token.isEmpty
            ? ''
            : '?token=${Uri.encodeComponent(token)}';
        return '${AppRoutes.resetPassword}$q';
      }

      final session = sl<SessionCache>();
      final loggedIn = session.isLoggedIn;
      final loc = state.matchedLocation;
      final onAuth = loc == AppRoutes.login ||
          loc == AppRoutes.register ||
          loc == AppRoutes.resetPassword;
      final onRestaurantPick = loc == AppRoutes.restaurants ||
          loc == AppRoutes.createRestaurant;
      if (!loggedIn && !onAuth) return AppRoutes.login;
      if (loggedIn &&
          (loc == AppRoutes.login || loc == AppRoutes.register)) {
        return AppRoutes.restaurants;
      }
      // Drop stale design-preview ids (e.g. `fort`) so API calls never use them.
      if (loggedIn &&
          session.restaurantId != null &&
          SessionCache.demoRestaurantIds.contains(session.restaurantId)) {
        session.clearDemoRestaurantContext();
      }
      if (loggedIn &&
          !onAuth &&
          !onRestaurantPick &&
          !session.hasValidRestaurantContext) {
        return AppRoutes.restaurants;
      }
      if (loggedIn &&
          loc.startsWith(AppRoutes.employees) &&
          !session.employeesEnabled) {
        return AppRoutes.ownerUpgrade;
      }
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.login,
        name: 'login',
        builder: (context, state) => BlocProvider(
          create: (_) => LoginBloc(sl<SignInUseCase>(), sl<SessionCache>())
            ..add(const LoginHydrated()),
          child: const LoginScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.register,
        name: 'register',
        builder: (context, state) => BlocProvider(
          create: (_) => RegisterBloc(sl<AuthRepository>()),
          child: const RegisterScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.resetPassword,
        name: 'resetPassword',
        builder: (context, state) => ResetPasswordScreen(
          initialToken: state.uri.queryParameters['token'] ?? '',
        ),
      ),
      GoRoute(
        path: AppRoutes.restaurants,
        name: 'restaurants',
        builder: (context, state) => BlocProvider(
          create: (_) => RestaurantBloc(sl<RestaurantRepository>())
            ..add(const RestaurantsRequested()),
          child: const ChooseRestaurantScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.createRestaurant,
        name: 'createRestaurant',
        builder: (context, state) => BlocProvider(
          create: (_) => CreateRestaurantBloc(sl<RestaurantRepository>()),
          child: const CreateRestaurantScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.dashboard,
        name: 'dashboard',
        builder: (context, state) => BlocProvider(
          create: (_) => sl<DashboardBloc>()..add(const DashboardStarted()),
          child: const DashboardShell(),
        ),
      ),
      GoRoute(
        path: AppRoutes.spotBooking,
        name: 'spotBooking',
        builder: (context, state) => BlocProvider(
          create: (_) => sl<SpotBookingBloc>(),
          child: const SpotBookingScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.bookingDetail,
        name: 'bookingDetail',
        builder: (context, state) {
          final bookingId = state.pathParameters['bookingId']?.trim() ?? '';
          if (bookingId.isEmpty) {
            return Scaffold(
              body: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Booking not found'),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: () => context.go(AppRoutes.dashboard),
                        child: const Text('Back to today'),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }
          return BlocProvider(
            create: (_) => sl<BookingDetailBloc>(param1: bookingId)
              ..add(BookingDetailStarted(bookingId: bookingId)),
            child: const BookingDetailScreen(),
          );
        },
      ),
      ShellRoute(
        builder: (context, state, child) => LayoutBlocScope(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.layout,
            name: 'layout',
            builder: (context, state) => const FloorsScreen(),
            routes: [
              // Legacy rooms screen — floors & rooms are combined now.
              GoRoute(
                path: 'rooms',
                name: 'layoutRooms',
                redirect: (context, state) => AppRoutes.layout,
              ),
              GoRoute(
                path: 'tables',
                name: 'layoutTables',
                builder: (context, state) => const TablesScreen(),
                routes: [
                  GoRoute(
                    path: 'form',
                    name: 'layoutTableForm',
                    builder: (context, state) => const TableFormScreen(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      ShellRoute(
        builder: (context, state, child) => BlocProvider(
          key: const ValueKey('employee-shell-bloc'),
          create: (_) => sl<EmployeeBloc>(),
          child: child,
        ),
        routes: [
          GoRoute(
            path: AppRoutes.employees,
            name: 'employees',
            builder: (context, state) => const EmployeesScreen(),
            routes: [
              GoRoute(
                path: 'form',
                name: 'employeesForm',
                builder: (context, state) => const EmployeeFormScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: AppRoutes.notifications,
        name: 'notifications',
        builder: (context, state) => BlocProvider(
          create: (_) => sl<NotificationsCubit>()..load(),
          child: const NotificationsScreen(),
        ),
      ),
      ShellRoute(
        builder: (context, state, child) => BlocProvider(
          key: const ValueKey('owner-shell-bloc'),
          create: (_) => sl<OwnerBloc>(),
          child: child,
        ),
        routes: [
          GoRoute(
            path: AppRoutes.owner,
            name: 'owner',
            builder: (context, state) {
              final tab =
                  int.tryParse(state.uri.queryParameters['tab'] ?? '') ?? 0;
              return OwnerShell(initialTab: tab);
            },
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Route not found',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(state.uri.toString()),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => context.go(AppRoutes.login),
                child: const Text('Back to sign in'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
