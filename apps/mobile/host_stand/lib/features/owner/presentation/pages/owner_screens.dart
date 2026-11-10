import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_bloc.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_event.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_state.dart';
import 'package:host_stand/features/owner/presentation/pages/plan_screen.dart';
import 'package:host_stand/features/owner/presentation/pages/restaurant_profile_screen.dart';
import 'package:host_stand/features/owner/presentation/pages/settings_screen.dart';
import 'package:host_stand/features/owner/presentation/pages/upgrade_screen.dart';

class OwnerShell extends StatelessWidget {
  const OwnerShell({super.key, this.initialTab = 0});

  final int initialTab;

  @override
  Widget build(BuildContext context) =>
      BlocBuilder<OwnerBloc, OwnerState>(builder: (context, state) {
        if (state.status == OwnerStatus.initial ||
            state.status == OwnerStatus.loading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (state.status == OwnerStatus.failure && state.data == null) {
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Could not load restaurant settings'),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () =>
                        context.read<OwnerBloc>().add(OwnerStarted()),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          );
        }
        return OwnerHome(initialTab: initialTab);
      });
}

class OwnerHome extends StatefulWidget {
  const OwnerHome({super.key, this.initialTab = 0});

  final int initialTab;

  @override
  State<OwnerHome> createState() => _OwnerHomeState();
}

class _OwnerHomeState extends State<OwnerHome> {
  late int page = widget.initialTab.clamp(0, 3);

  @override
  Widget build(BuildContext context) {
    final state = context.watch<OwnerBloc>().state;
    final data = state.data!;
    final pages = <Widget>[
      RestaurantProfileScreen(profile: data.profile, editing: state.editing),
      const PlanScreen(),
      const UpgradeScreen(),
      const SettingsScreen(),
    ];
    return Scaffold(
      body: SafeArea(child: IndexedStack(index: page, children: pages)),
      bottomNavigationBar: NavigationBar(
        selectedIndex: page,
        onDestinationSelected: (i) => setState(() => page = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.store_outlined),
            label: 'Profile',
          ),
          NavigationDestination(
            icon: Icon(Icons.workspace_premium_outlined),
            label: 'Plan',
          ),
          NavigationDestination(
            icon: Icon(Icons.bolt_outlined),
            label: 'Upgrade',
          ),
          NavigationDestination(icon: Icon(Icons.menu), label: 'Settings'),
        ],
      ),
    );
  }
}

class ScreenFrame extends StatelessWidget {
  const ScreenFrame({
    super.key,
    required this.title,
    required this.child,
    this.subtitle,
    this.trailing,
  });

  final String title;
  final Widget child;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 14),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.maybePop(context),
                  icon: const Icon(Icons.arrow_back, size: 27),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      if (subtitle != null)
                        Text(
                          subtitle!,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                    ],
                  ),
                ),
                trailing ??
                    const CircleAvatar(
                      backgroundColor: AppColors.deepGreen,
                      child: Icon(Icons.person_outline, color: Colors.white),
                    ),
              ],
            ),
          ),
          Expanded(child: child),
        ],
      );
}

class PageBody extends StatelessWidget {
  const PageBody({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
        child: child,
      );
}

class Panel extends StatelessWidget {
  const Panel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(22),
  });

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: padding,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          boxShadow: const [
            BoxShadow(
              color: Color(0x08002A1A),
              blurRadius: 12,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: child,
      );
}

class Tag extends StatelessWidget {
  const Tag(this.text, {super.key, this.color = AppColors.pale});

  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.muted,
          ),
        ),
      );
}

