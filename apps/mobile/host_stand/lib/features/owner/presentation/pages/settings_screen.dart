import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/di/injection.dart';
import 'package:host_stand/core/router/app_routes.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/auth/domain/repositories/auth_repository.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_bloc.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_event.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_state.dart';
import 'package:host_stand/features/owner/presentation/pages/about_screen.dart';
import 'package:host_stand/features/owner/presentation/pages/faq_screen.dart';
import 'package:host_stand/features/owner/presentation/pages/owner_screens.dart';
import 'package:host_stand/features/owner/presentation/pages/privacy_screen.dart';
import 'package:host_stand/features/owner/presentation/pages/opening_hours_screen.dart';
import 'package:host_stand/features/owner/presentation/pages/terms_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late bool _pushBanners = sl<SessionCache>().pushBannersEnabled;

  @override
  Widget build(BuildContext context) =>
      BlocBuilder<OwnerBloc, OwnerState>(builder: (context, state) {
        final data = state.data!;
        final venue = data.profile.name.isEmpty
            ? (sl<SessionCache>().restaurantName ?? 'Restaurant')
            : data.profile.name;
        return ScreenFrame(
          title: 'Settings',
          child: PageBody(
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.circle, size: 12, color: AppColors.green),
                    const SizedBox(width: 8),
                    const Text(
                      'HOST STAND ACTIVE',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        letterSpacing: .5,
                      ),
                    ),
                    const Spacer(),
                    Tag(data.terminal),
                  ],
                ),
                const SizedBox(height: 14),
                Panel(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      _settingsRow(
                        context,
                        Icons.storefront_outlined,
                        'Change restaurant',
                        data.restaurantShortAddress,
                        () => context.go(AppRoutes.restaurants),
                      ),
                      _settingsRow(
                        context,
                        Icons.notifications_outlined,
                        'Notifications',
                        'Inbox & booking alerts',
                        () => context.push(AppRoutes.notifications),
                      ),
                      _pushToggleRow(),
                      _settingsRow(
                        context,
                        Icons.schedule_outlined,
                        'Opening hours',
                        'Set weekly schedule',
                        () => _openPage(context, const OpeningHoursScreen()),
                      ),
                      _settingsRow(
                        context,
                        Icons.help_outline,
                        'FAQ',
                        '',
                        () => _openPage(context, const FaqScreen()),
                      ),
                      _settingsRow(
                        context,
                        Icons.info_outline,
                        'About',
                        '',
                        () => _openPage(context, const AboutScreen()),
                      ),
                      _settingsRow(
                        context,
                        Icons.shield_outlined,
                        'Privacy',
                        '',
                        () => _openPage(context, const PrivacyScreen()),
                      ),
                      _settingsRow(
                        context,
                        Icons.description_outlined,
                        'Terms',
                        '',
                        () => _openPage(context, const TermsScreen()),
                        last: true,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                Panel(
                  padding: EdgeInsets.zero,
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 10,
                    ),
                    leading: const CircleAvatar(
                      backgroundColor: Color(0xFFFFF0F0),
                      child: Icon(Icons.logout, color: AppColors.danger),
                    ),
                    title: const Text(
                      'Sign out',
                      style: TextStyle(
                        color: AppColors.danger,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    onTap: () => _showSignOut(context),
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.pale,
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'CONNECTION',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.muted,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        venue,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        data.syncStatus,
                        style: const TextStyle(color: AppColors.deepGreen),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 34),
                Text(
                  'DinePoint Host Stand ${data.version}',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 5),
                Text(
                  '${data.terminal} · India Edition (IST UTC+5:30)',
                  style: const TextStyle(color: AppColors.muted),
                ),
              ],
            ),
          ),
        );
      });

  Widget _pushToggleRow() => Column(
        children: [
          SwitchListTile(
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 18, vertical: 2),
            secondary: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.pale,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.notifications_active_outlined,
                color: AppColors.ink,
              ),
            ),
            title: const Text(
              'Alert banners',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
            ),
            subtitle: const Text(
              'Foreground tray banners only — inbox still updates',
            ),
            value: _pushBanners,
            activeThumbColor: AppColors.deepGreen,
            onChanged: (value) async {
              setState(() => _pushBanners = value);
              await sl<SessionCache>().setPushBannersEnabled(value);
            },
          ),
          const Divider(
            height: 1,
            indent: 20,
            endIndent: 20,
            color: AppColors.line,
          ),
        ],
      );

  void _openPage(BuildContext context, Widget page) {
    final bloc = context.read<OwnerBloc>();
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(value: bloc, child: page),
      ),
    );
  }

  Widget _settingsRow(
    BuildContext context,
    IconData icon,
    String title,
    String subtitle,
    VoidCallback onTap, {
    bool last = false,
  }) =>
      Column(
        children: [
          ListTile(
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 18, vertical: 5),
            leading: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.pale,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: AppColors.ink),
            ),
            title: Text(
              title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
            ),
            subtitle: subtitle.isEmpty ? null : Text(subtitle),
            trailing: const Icon(Icons.chevron_right, color: AppColors.muted),
            onTap: onTap,
          ),
          if (!last)
            const Divider(
              height: 1,
              indent: 20,
              endIndent: 20,
              color: AppColors.line,
            ),
        ],
      );

  void _showSignOut(BuildContext context) => showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: const Text('Sign out?'),
          content: const Text(
            'You will need to sign in again to use this host stand.',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext);
                context.read<OwnerBloc>().add(SignOutCancelled());
              },
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () async {
                Navigator.pop(dialogContext);
                await sl<AuthRepository>().signOut();
                if (context.mounted) {
                  context.go(AppRoutes.login);
                }
              },
              child: const Text('Sign out'),
            ),
          ],
        ),
      );
}
