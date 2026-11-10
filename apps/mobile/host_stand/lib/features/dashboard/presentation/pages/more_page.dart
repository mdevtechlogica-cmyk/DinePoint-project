import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/contact_actions.dart';
import 'package:host_stand/core/di/injection.dart';
import 'package:host_stand/core/router/app_routes.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/auth/domain/repositories/auth_repository.dart';
import 'package:host_stand/features/dashboard/domain/entities/dashboard_enums.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_state.dart';
import 'package:host_stand/features/dashboard/presentation/widgets/dashboard_widgets.dart';

class MorePage extends StatelessWidget {
  const MorePage({super.key});

  @override
  Widget build(BuildContext context) =>
      BlocBuilder<DashboardBloc, DashboardState>(builder: (context, s) {
        final owner = s.role == AccountRole.owner;
        final user = sl<SessionCache>().currentUser;
        final displayName = user?.name ?? s.profile.ownerName;
        final initials = _initials(displayName);
        final venue = s.profile.name.isEmpty
            ? (sl<SessionCache>().restaurantName ?? 'Restaurant')
            : s.profile.name;
        final location = [
          if (s.profile.area.isNotEmpty) s.profile.area,
          if (s.profile.city.isNotEmpty) s.profile.city,
        ].join(', ');
        final seated = s.count(BookingFilter.seated);
        final totalToday = s.today.length;

        return ListView(
            padding: const EdgeInsets.fromLTRB(18, 0, 18, 22),
            children: [
              Row(children: [
                const Expanded(
                    child: Text('More',
                        style: TextStyle(
                            fontSize: 27,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink))),
                chip('Host Stand', AppColors.pale, AppColors.muted)
              ]),
              const SizedBox(height: 17),
              Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18)),
                  child: Row(children: [
                    CircleAvatar(
                        radius: 31,
                        backgroundColor: AppColors.mint,
                        child: Text(initials,
                            style: const TextStyle(
                                fontSize: 21,
                                color: AppColors.deepGreen,
                                fontWeight: FontWeight.w700))),
                    const SizedBox(width: 14),
                    Expanded(
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                          Text(
                              displayName.isEmpty ? 'Host' : displayName,
                              style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.ink)),
                          const SizedBox(height: 4),
                          Row(children: [
                            chip(
                              owner ? 'OWNER' : 'STAFF',
                              AppColors.pale,
                              AppColors.muted,
                            ),
                            const SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                user?.email ?? s.profile.email,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.muted,
                                ),
                              ),
                            ),
                          ]),
                        ])),
                    Icon(
                        owner
                            ? Icons.manage_accounts_outlined
                            : Icons.badge_outlined,
                        color: AppColors.muted,
                        size: 25),
                  ])),
              const SizedBox(height: 14),
              Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                      color: AppColors.zoneSoft,
                      borderRadius: BorderRadius.circular(16)),
                  child: Row(children: [
                    const Icon(Icons.storefront_outlined,
                        color: AppColors.deepGreen, size: 24),
                    const SizedBox(width: 14),
                    Expanded(
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                          Text(venue,
                              style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.ink)),
                          const SizedBox(height: 3),
                          Text(
                              location.isEmpty
                                  ? 'Today · Seated $seated / $totalToday'
                                  : '$location · Seated $seated / $totalToday',
                              style: const TextStyle(
                                  fontSize: 12, color: AppColors.muted)),
                        ])),
                    chip('Live', AppColors.mint, AppColors.deepGreen)
                  ])),
              const SizedBox(height: 14),
              menuGroup([
                MenuRow(
                    icon: Icons.storefront_outlined,
                    title: 'Restaurant Profile',
                    trailing: venue,
                    onTap: () => context.push(AppRoutes.owner)),
                MenuRow(
                    icon: Icons.table_restaurant_outlined,
                    title: 'Floor & Tables Layout',
                    trailing: 'Manage',
                    onTap: () => context.push(AppRoutes.layout)),
                if (owner && s.employeesEnabled)
                  MenuRow(
                      icon: Icons.badge_outlined,
                      title: 'Employees',
                      trailing: 'Manage',
                      onTap: () => context.push(AppRoutes.employees)),
                if (owner && !s.employeesEnabled)
                  MenuRow(
                      icon: Icons.badge_outlined,
                      title: 'Employees',
                      trailing: 'Upgrade',
                      onTap: () => context.push(AppRoutes.ownerUpgrade)),
                if (owner)
                  MenuRow(
                      icon: Icons.workspace_premium_outlined,
                      title: 'Subscription & Add-ons',
                      trailing: s.planName,
                      onTap: () => context.push(AppRoutes.ownerPlan)),
                MenuRow(
                    icon: Icons.notifications_outlined,
                    title: 'Notifications',
                    trailing: '',
                    onTap: () => context.push(AppRoutes.notifications)),
                MenuRow(
                    icon: Icons.tune,
                    title: 'Terminal Settings',
                    trailing: '',
                    onTap: () => context.push(AppRoutes.ownerSettings)),
              ]),
              const SizedBox(height: 18),
              menuGroup([
                MenuRow(
                    icon: Icons.support_agent,
                    title: 'Host Stand Support',
                    trailing: '↗',
                    onTap: () => launchEmail(
                          context,
                          'support@dinepoint.app',
                          subject: 'Host Stand support',
                        )),
              ]),
              const SizedBox(height: 18),
              OutlinedButton.icon(
                  onPressed: () => showDialog<void>(
                      context: context,
                      builder: (context) => AlertDialog(
                              title: const Text('Sign out?'),
                              content: const Text(
                                  'You can sign in again with your account.'),
                              actions: [
                                TextButton(
                                    onPressed: () => Navigator.pop(context),
                                    child: const Text('Cancel')),
                                FilledButton(
                                    onPressed: () async {
                                      Navigator.pop(context);
                                      await sl<AuthRepository>().signOut();
                                      if (context.mounted) {
                                        context.go(AppRoutes.login);
                                      }
                                    },
                                    child: const Text('Sign out'))
                              ])),
                  icon: const Icon(Icons.logout),
                  label: const Text('Sign out'),
                  style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.danger,
                      padding: const EdgeInsets.symmetric(vertical: 16))),
            ]);
      });

  String _initials(String name) {
    final parts =
        name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return 'HS';
    if (parts.length == 1) {
      return parts.first.substring(0, parts.first.length.clamp(0, 2)).toUpperCase();
    }
    return ('${parts.first[0]}${parts.last[0]}').toUpperCase();
  }
}
