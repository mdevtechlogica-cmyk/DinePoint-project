import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/router/app_routes.dart';
import 'package:host_stand/core/theme/app_theme.dart';
import 'package:host_stand/features/dashboard/domain/entities/dashboard_enums.dart';
import 'package:host_stand/features/dashboard/domain/entities/restaurant_profile.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_event.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_state.dart';
import 'package:host_stand/features/dashboard/presentation/pages/history_page.dart';
import 'package:host_stand/features/dashboard/presentation/pages/more_page.dart';
import 'package:host_stand/features/dashboard/presentation/pages/reports_page.dart';
import 'package:host_stand/features/dashboard/presentation/pages/today_page.dart';

class DashboardShell extends StatelessWidget {
  const DashboardShell({super.key});

  @override
  Widget build(BuildContext context) =>
      BlocBuilder<DashboardBloc, DashboardState>(
        builder: (context, s) => Scaffold(
          backgroundColor: AppColors.background,
          body: SafeArea(
            child: Column(
              children: [
                _AppHeader(
                  profile: s.profile,
                  compact: s.page != DashboardPage.today,
                  searchVisible: s.searchVisible,
                  searchQuery: s.searchQuery,
                  onToday: s.page == DashboardPage.today,
                ),
                Expanded(
                  child: switch (s.page) {
                    DashboardPage.today => const TodayPage(),
                    DashboardPage.history => const HistoryPage(),
                    DashboardPage.reports => const ReportsPage(),
                    DashboardPage.more => const MorePage(),
                  },
                ),
              ],
            ),
          ),
          bottomNavigationBar: _BottomNav(
            page: s.page,
            onTap: (p) => context.read<DashboardBloc>().add(PageChanged(p)),
          ),
        ),
      );
}

class _AppHeader extends StatelessWidget {
  const _AppHeader({
    required this.profile,
    required this.compact,
    required this.searchVisible,
    required this.searchQuery,
    required this.onToday,
  });

  final RestaurantProfile profile;
  final bool compact;
  final bool searchVisible;
  final String searchQuery;
  final bool onToday;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<DashboardBloc>();
    return Container(
      padding: EdgeInsets.fromLTRB(18, compact ? 12 : 9, 18, compact ? 13 : 10),
      decoration: const BoxDecoration(
        color: AppColors.background,
        border: Border(bottom: BorderSide(color: AppColors.line)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () => context.push(AppRoutes.restaurants),
                  borderRadius: BorderRadius.circular(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (!compact)
                        const Text(
                          'HOST STAND',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.muted,
                            letterSpacing: 1.0,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              profile.name,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: compact ? 19 : 20,
                                fontWeight: FontWeight.w700,
                                color: AppColors.ink,
                              ),
                            ),
                          ),
                          const Icon(
                            Icons.keyboard_arrow_down,
                            size: 22,
                            color: AppColors.muted,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              if (onToday)
                IconButton(
                  onPressed: () => bloc.add(
                    SearchVisibilityChanged(!searchVisible),
                  ),
                  icon: Icon(
                    searchVisible ? Icons.close : Icons.search,
                    size: 27,
                  ),
                ),
              CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.deepGreen,
                child: IconButton(
                  padding: EdgeInsets.zero,
                  onPressed: () => context.push(AppRoutes.ownerSettings),
                  icon: const Icon(
                    Icons.person_outline,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
              ),
            ],
          ),
          if (onToday && searchVisible) ...[
            const SizedBox(height: 10),
            TextField(
              autofocus: true,
              onChanged: (v) => bloc.add(SearchQueryChanged(v)),
              decoration: InputDecoration(
                hintText: 'Search guest, phone, or table',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  const _BottomNav({required this.page, required this.onTap});

  final DashboardPage page;
  final ValueChanged<DashboardPage> onTap;

  @override
  Widget build(BuildContext context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.line)),
        ),
        padding: const EdgeInsets.fromLTRB(8, 5, 8, 7),
        child: Row(
          children: [
            _item(DashboardPage.today, Icons.event_available_outlined, 'Today'),
            _item(DashboardPage.history, Icons.history, 'History'),
            _item(DashboardPage.reports, Icons.bar_chart, 'Reports'),
            _item(DashboardPage.more, Icons.more_horiz, 'More'),
          ],
        ),
      );

  Widget _item(DashboardPage p, IconData icon, String label) => Expanded(
        child: InkWell(
          onTap: () => onTap(p),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 34,
                height: 3,
                decoration: BoxDecoration(
                  color: page == p ? AppColors.green : Colors.transparent,
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
              const SizedBox(height: 5),
              Icon(icon, color: page == p ? AppColors.green : AppColors.muted, size: 24),
              const SizedBox(height: 3),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: page == p ? AppColors.deepGreen : AppColors.ink,
                  fontWeight: page == p ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      );
}
