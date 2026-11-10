import 'package:flutter/material.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/owner/presentation/pages/owner_screens.dart';

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});
  @override
  Widget build(BuildContext context) => ScreenFrame(
      title: 'Privacy',
      subtitle: 'Last updated 23 Oct 2026',
      trailing: const Tag('V1.0.0'),
      child: PageBody(
          child: Column(children: [
        const Align(
            alignment: Alignment.centerLeft,
            child: Tag('🛡  DinePoint POS Stand Security')),
        const SizedBox(height: 18),
        Panel(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Row(children: [
            Icon(Icons.shield_outlined, size: 28, color: AppColors.deepGreen),
            SizedBox(width: 14),
            Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                  Text('Operational Privacy Policy',
                      style:
                          TextStyle(fontSize: 19, fontWeight: FontWeight.w600)),
                  Text('Internal Back-of-House Standard')
                ]))
          ]),
          const SizedBox(height: 34),
          _policySection(Icons.badge_outlined, 'What we collect',
              "We store your name, email and phone number so you can sign in. When you seat a guest, we store the guest's name, phone number, party size, table and any note you add."),
          _policySection(Icons.table_restaurant_outlined, 'How we use it',
              "We use this only to run your restaurant's host stand: showing today's bookings, history and reports. We don't sell your data or your guests' data."),
          _policySection(Icons.visibility_outlined, 'Who can see it',
              "Your restaurant's owner and admins can see bookings and staff details for that restaurant. Other restaurants cannot."),
          _policySection(Icons.assignment_ind_outlined, 'Guest details',
              "Only enter what you need to seat a guest. Don't put sensitive details in the note field."),
          _policySection(Icons.manage_accounts_outlined, 'Your choices',
              'Ask your restaurant owner to update or remove your account. To ask about your data, write to support@dinepoint.app.'),
          Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(14)),
              child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline, color: AppColors.deepGreen),
                    SizedBox(width: 12),
                    Expanded(
                        child: Text(
                            "Shift logs and seated party records are retained according to your restaurant's automated 90-day back-of-house compliance policy."))
                  ])),
        ])),
        const SizedBox(height: 18),
        SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
                onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content:
                            Text('Support contact: support@dinepoint.app'))),
                icon: const Icon(Icons.mail_outline),
                label: const Text('Questions about your data?  →'))),
        const SizedBox(height: 22),
        const Text(
            '© 2026 DinePoint Technologies Pvt Ltd • DinePoint Host Stand 1.0.0',
            textAlign: TextAlign.center),
        const SizedBox(height: 8),
        const Text('Strict Back-of-House Enterprise Confidentiality',
            textAlign: TextAlign.center,
            style: TextStyle(fontWeight: FontWeight.w600)),
      ])));
}

Widget _policySection(IconData icon, String title, String text) => Padding(
    padding: const EdgeInsets.only(bottom: 26),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Icon(icon, color: AppColors.deepGreen),
        const SizedBox(width: 10),
        Text(title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600))
      ]),
      Padding(
          padding: const EdgeInsets.only(left: 32, top: 8),
          child:
              Text(text, style: const TextStyle(fontSize: 16, height: 1.65))),
    ]));
