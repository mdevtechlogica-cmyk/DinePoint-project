import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/contact_actions.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/owner/data/models/plan_option.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_bloc.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_event.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_state.dart';
import 'package:host_stand/features/owner/presentation/pages/owner_screens.dart';

class UpgradeScreen extends StatelessWidget {
  const UpgradeScreen({super.key, this.fullPage = false});

  final bool fullPage;

  @override
  Widget build(BuildContext context) =>
      BlocBuilder<OwnerBloc, OwnerState>(builder: (context, state) {
        final data = state.data!;
        final plan = data.plan;
        final used = plan.usedTables;
        final max = plan.tables;
        final unlimited = max < 0;
        final ratio = unlimited
            ? 0.0
            : max == 0
                ? 1.0
                : (used / max).clamp(0.0, 1.0);
        final usedLabel = unlimited ? '$used / Unlimited' : '$used of $max';

        return ScreenFrame(
          title: 'Upgrade Plan',
          child: PageBody(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.lock_outline, color: Colors.deepOrange),
                    SizedBox(width: 8),
                    Text(
                      'CAPACITY',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        letterSpacing: .8,
                      ),
                    ),
                    Spacer(),
                    Tag('Contact platform'),
                  ],
                ),
                const SizedBox(height: 22),
                Text(
                  plan.name,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(plan.renewalText),
                const SizedBox(height: 18),
                Panel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'TABLES',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              letterSpacing: .6,
                            ),
                          ),
                          const Spacer(),
                          Tag(
                            unlimited
                                ? 'Unlimited'
                                : '${(ratio * 100).round()}% used',
                            color: AppColors.amber,
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Text(
                            usedLabel,
                            style: Theme.of(context).textTheme.headlineMedium,
                          ),
                          const Spacer(),
                          Text(plan.name),
                        ],
                      ),
                      const SizedBox(height: 14),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: LinearProgressIndicator(
                          value: unlimited ? 0.05 : ratio,
                          minHeight: 8,
                          color: Colors.orange,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Tables in use at ${data.profile.name}',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'HOW TO UPGRADE',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    letterSpacing: .5,
                  ),
                ),
                const SizedBox(height: 14),
                ...data.options.map(
                  (o) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: _planCard(context, o),
                  ),
                ),
                if (!fullPage)
                  Center(
                    child: TextButton(
                      onPressed: () => Navigator.of(context).maybePop(),
                      child: const Text('Not now'),
                    ),
                  ),
                const SizedBox(height: 12),
                const Center(
                  child: Text(
                    'Plans are assigned by DinePoint Super Admin. Host Stand refreshes limits after they update your subscription.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
        );
      });

  Widget _planCard(BuildContext context, PlanOption option) => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: option.recommended ? AppColors.deepGreen : Colors.white,
            width: option.recommended ? 1.5 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(option.name, style: Theme.of(context).textTheme.titleLarge),
                const Spacer(),
                if (option.recommended)
                  const Tag('NEXT STEP', color: AppColors.paleGreen),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              option.price,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _feature(Icons.storefront_outlined, option.outletLimit),
                  _feature(Icons.table_restaurant_outlined, option.tableLimit),
                  _feature(Icons.verified_outlined, option.features),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: () async {
                  context.read<OwnerBloc>().add(PlanSelectionRequested(option));
                  await launchEmail(
                    context,
                    'support@dinepoint.app',
                    subject: 'Plan upgrade request — Host Stand',
                  );
                },
                icon: const Icon(Icons.mail_outline),
                label: const Text('Contact platform'),
              ),
            ),
          ],
        ),
      );

  Widget _feature(IconData icon, String text) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 19, color: AppColors.deepGreen),
            const SizedBox(width: 10),
            Expanded(child: Text(text)),
          ],
        ),
      );
}
