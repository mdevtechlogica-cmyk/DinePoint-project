import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/contact_actions.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_bloc.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_state.dart';
import 'package:host_stand/features/owner/presentation/pages/owner_screens.dart';
import 'package:host_stand/features/owner/presentation/pages/privacy_screen.dart';
import 'package:host_stand/features/owner/presentation/pages/terms_screen.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      BlocBuilder<OwnerBloc, OwnerState>(builder: (context, state) {
        final d = state.data!;
        return ScreenFrame(
            title: 'About',
            child: PageBody(
                child: Column(children: [
              const SizedBox(height: 24),
              Container(
                  width: 112,
                  height: 112,
                  decoration: BoxDecoration(
                      color: AppColors.green,
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: const [
                        BoxShadow(
                            color: Color(0x22000000),
                            blurRadius: 8,
                            offset: Offset(0, 3))
                      ]),
                  child: const Center(
                      child: Text('DP',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 42,
                              fontWeight: FontWeight.w700)))),
              const SizedBox(height: 24),
              Text('DinePoint Host Stand',
                  style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text('Version ${d.version}  •  BUILD ${d.build}',
                  style: const TextStyle(fontSize: 16, color: AppColors.muted)),
              const SizedBox(height: 18),
              const Tag('India Edition • Kerala'),
              const SizedBox(height: 28),
              Panel(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Row(children: [
                      Icon(Icons.room_service_outlined,
                          color: AppColors.deepGreen),
                      const SizedBox(width: 10),
                      const Text('OPERATIONAL PURPOSE',
                          style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppColors.muted,
                              letterSpacing: .6))
                    ]),
                    const SizedBox(height: 16),
                    const Text(
                        "DinePoint Host Stand helps restaurant staff seat walk-in guests quickly. Pick a free table, note the guest's details, and keep today's bookings in one place. Built for busy host stands in Kerala and across South India.",
                        style: TextStyle(fontSize: 17, height: 1.65)),
                  ])),
              const SizedBox(height: 18),
              Panel(
                  child: Row(children: [
                Icon(Icons.wifi_tethering,
                    color: AppColors.deepGreen, size: 30),
                const SizedBox(width: 14),
                Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                      const Text('Sync Engine',
                          style: TextStyle(
                              color: AppColors.muted,
                              fontWeight: FontWeight.w600)),
                      Text(d.syncStatus,
                          style: Theme.of(context).textTheme.titleLarge)
                    ])),
                Tag('API', color: AppColors.paleGreen)
              ])),
              const SizedBox(height: 14),
              _aboutRow(
                context,
                Icons.mail_outline,
                'Support',
                'support@dinepoint.app',
                onTap: () => launchEmail(
                  context,
                  'support@dinepoint.app',
                  subject: 'Host Stand support',
                ),
              ),
              const SizedBox(height: 12),
              _aboutRow(
                context,
                Icons.article_outlined,
                'Release Notes',
                'v${d.version}',
                onTap: () => _showReleaseNotes(context, d.version, d.build),
              ),
              const SizedBox(height: 12),
              _aboutRow(
                context,
                Icons.shield_outlined,
                'Privacy',
                '',
                onTap: () => _openOwnedPage(context, const PrivacyScreen()),
              ),
              const SizedBox(height: 12),
              _aboutRow(
                context,
                Icons.description_outlined,
                'Terms of use',
                '',
                onTap: () => _openOwnedPage(context, const TermsScreen()),
              ),
              const SizedBox(height: 28),
              const Text('© 2025 DinePoint Technologies Pvt Ltd',
                  style: TextStyle(
                      fontWeight: FontWeight.w600, color: AppColors.muted)),
              const SizedBox(height: 6),
              const Text('All rights reserved • Crafted for restaurants'),
            ])));
      });

  void _openOwnedPage(BuildContext context, Widget page) {
    final bloc = context.read<OwnerBloc>();
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(value: bloc, child: page),
      ),
    );
  }

  void _showReleaseNotes(BuildContext context, String version, String build) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('Host Stand $version'),
        content: Text(
          'Build $build\n\n'
          '• Live Today / History / Reports from Nest API\n'
          '• Floors, rooms, tables, and employees\n'
          '• Plan entitlements, notifications inbox, and alert banners\n'
          '• Password reset, opening hours, and guest messaging',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _aboutRow(
    BuildContext context,
    IconData icon,
    String title,
    String subtitle, {
    required VoidCallback onTap,
  }) =>
      Panel(
          padding: EdgeInsets.zero,
          child: ListTile(
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            leading: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                    color: AppColors.pale,
                    borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: AppColors.deepGreen)),
            title: Text(title,
                style: const TextStyle(
                    fontSize: 17, fontWeight: FontWeight.w500)),
            subtitle: subtitle.isEmpty
                ? null
                : Text(subtitle,
                    style: const TextStyle(
                        color: AppColors.deepGreen,
                        fontWeight: FontWeight.w600)),
            trailing: const Icon(Icons.chevron_right, color: AppColors.muted),
            onTap: onTap,
          ));
}
