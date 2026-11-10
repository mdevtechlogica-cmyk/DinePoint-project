import 'package:flutter/material.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/owner/presentation/pages/owner_screens.dart';

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) => ScreenFrame(
        title: 'Terms Of Service',
        subtitle: 'Last updated 23 Oct 2026',
        trailing: const Tag('v1.0.0'),
        child: PageBody(
          child: Column(
            children: [
              const Align(
                alignment: Alignment.centerLeft,
                child: Tag('● HOST STAND OPERATING AGREEMENT'),
              ),
              const SizedBox(height: 18),
              Panel(
                child: Column(
                  children: [
                    _termSection(
                      Icons.table_restaurant_outlined,
                      '1. Using the app',
                      "DinePoint Host Stand is for restaurant staff to seat walk-in guests and manage bookings. Use it only for your restaurant's work and only with an account your restaurant gave you.",
                    ),
                    _termSection(
                      Icons.lock_outline,
                      '2. Your account',
                      'Keep your password private. Don’t share your sign-in with others. Tell your owner if you think someone else has used your account.',
                    ),
                    _termSection(
                      Icons.badge_outlined,
                      '3. Guest information',
                      "Enter guest details accurately and only for seating and service. Don't copy, share or use guest details for anything else.",
                    ),
                    _termSection(
                      Icons.admin_panel_settings_outlined,
                      '4. What owners can do',
                      'Owners and admins can manage floors, rooms, tables and employees. They can also deactivate an account that is no longer needed.',
                    ),
                    _termSection(
                      Icons.verified_outlined,
                      '5. Plans and ads',
                      'Free plans may show a small banner ad on some screens. Paid plans remove ads and raise your limits. Ads never appear while you are seating a guest.',
                    ),
                    _termSection(
                      Icons.help_outline,
                      '6. Changes and support',
                      'We may update these terms and the app. If you have questions, write to support@dinepoint.app.',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              Panel(
                padding: const EdgeInsets.all(16),
                child: const Row(
                  children: [
                    Icon(Icons.mail_outline, color: AppColors.deepGreen),
                    SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Questions about our terms?',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                          Text('support@dinepoint.app'),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              const Text(
                '© 2026 DinePoint Technologies Pvt Ltd • DinePoint Host Stand 1.0.0',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                '◈ STRICT BACK-OF-HOUSE ENTERPRISE CONFIDENTIALITY',
                textAlign: TextAlign.center,
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
              ),
            ],
          ),
        ),
      );

  Widget _termSection(IconData icon, String title, String text) => Padding(
        padding: const EdgeInsets.only(bottom: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.pale,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: AppColors.deepGreen, size: 19),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.only(left: 40, top: 10),
              child: Text(text, style: const TextStyle(fontSize: 15.5, height: 1.65)),
            ),
            const Padding(
              padding: EdgeInsets.only(top: 22),
              child: Divider(color: AppColors.line),
            ),
          ],
        ),
      );
}
