import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_bloc.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_state.dart';
import 'package:host_stand/features/owner/presentation/pages/owner_screens.dart';
import 'package:host_stand/features/owner/presentation/pages/upgrade_screen.dart';

class PlanScreen extends StatelessWidget {
  const PlanScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      BlocBuilder<OwnerBloc, OwnerState>(builder: (context, state) {
        final data = state.data!;
        return ScreenFrame(
            title: 'Plan',
            child: PageBody(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                  Row(children: [
                    const Icon(Icons.circle, size: 12, color: AppColors.green),
                    const SizedBox(width: 8),
                    const Text('SUBSCRIPTION & LIMITS',
                        style: TextStyle(
                            fontWeight: FontWeight.w700, letterSpacing: .6)),
                    const Spacer(),
                    const Tag('Owner Only')
                  ]),
                  const SizedBox(height: 18),
                  Panel(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        Row(children: [
                          Text(data.plan.name,
                              style:
                                  Theme.of(context).textTheme.headlineMedium),
                          const SizedBox(width: 12),
                          Tag('Active', color: AppColors.paleGreen),
                          const Spacer(),
                          const Icon(Icons.storefront_outlined,
                              size: 28, color: AppColors.muted)
                        ]),
                        const SizedBox(height: 8),
                        Text(data.plan.renewalText,
                            style: Theme.of(context).textTheme.bodyLarge),
                      ])),
                  const SizedBox(height: 18),
                  Panel(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        Row(children: [
                          Text('Your limits',
                              style: Theme.of(context).textTheme.titleLarge),
                          const Spacer(),
                          const Text('Single venue',
                              style: TextStyle(fontWeight: FontWeight.w600))
                        ]),
                        const SizedBox(height: 18),
                        _limitRow(
                          Icons.storefront_outlined,
                          'Outlets',
                          data.plan.limitLabel(
                            data.plan.usedOutlets,
                            data.plan.outlets,
                          ),
                        ),
                        _limitRow(
                          Icons.table_restaurant_outlined,
                          'Tables / outlet',
                          data.plan.limitLabel(
                            data.plan.usedTables,
                            data.plan.tables,
                          ),
                        ),
                        _limitRow(Icons.layers_outlined, 'Floors / outlet',
                            data.plan.floors < 0
                                ? 'Unlimited'
                                : '${data.plan.floors}'),
                        _limitRow(Icons.meeting_room_outlined, 'Rooms / outlet',
                            data.plan.rooms < 0
                                ? 'Unlimited'
                                : '${data.plan.rooms}'),
                        _limitRow(Icons.analytics_outlined, 'Reports',
                            data.plan.reportsEnabled
                                ? 'Last ${data.plan.reportDays} days'
                                : 'Basic only'),
                        _limitRow(
                          Icons.sms_outlined,
                          'SMS / month',
                          data.plan.limitLabel(
                            data.plan.usedSms,
                            data.plan.smsPerMonth,
                          ),
                        ),
                        _limitRow(
                          Icons.chat_outlined,
                          'WhatsApp / month',
                          data.plan.limitLabel(
                            data.plan.usedWhatsapp,
                            data.plan.whatsappPerMonth,
                          ),
                        ),
                        _limitRow(
                          Icons.badge_outlined,
                          'Staff accounts',
                          data.plan.employeesEnabled ? 'Enabled' : 'Not on plan',
                        ),
                        _limitRow(Icons.smartphone_outlined, 'Ads',
                            data.plan.adsEnabled ? 'On' : 'Off'),
                      ])),
                  const SizedBox(height: 20),
                  SizedBox(
                      width: double.infinity,
                      height: 58,
                      child: FilledButton.icon(
                          onPressed: () {
                            final bloc = context.read<OwnerBloc>();
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => BlocProvider.value(
                                  value: bloc,
                                  child: const UpgradeScreen(fullPage: true),
                                ),
                              ),
                            );
                          },
                          icon: const Icon(Icons.support_agent),
                          label: const Text('Request upgrade',
                              style: TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.w700)))),
                  const SizedBox(height: 28),
                  Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                          color: const Color(0xFFE4E9E4),
                          borderRadius: BorderRadius.circular(16)),
                      child: const Center(
                          child: Text('AD SPONSOR UNIT (320 × 50)',
                              style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1)))),
                  const Center(
                      child: Padding(
                          padding: EdgeInsets.all(12),
                          child: Text('Free tier operational notice'))),
                  const SizedBox(height: 50),
                  Center(
                      child: Column(children: [
                    Text('${data.profile.name}  •  Terminal 04',
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    const Text('DinePoint POS Stand • India Edition v4.8')
                  ])),
                ])));
      });
  Widget _limitRow(IconData icon, String title, String value) => Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        Icon(icon, color: AppColors.muted),
        const SizedBox(width: 12),
        Expanded(child: Text(title, style: const TextStyle(fontSize: 17))),
        Text(value,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600))
      ]));
}
