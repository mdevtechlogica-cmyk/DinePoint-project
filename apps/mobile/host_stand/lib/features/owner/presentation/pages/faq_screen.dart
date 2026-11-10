import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_bloc.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_event.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_state.dart';
import 'package:host_stand/features/owner/presentation/pages/owner_screens.dart';

class FaqScreen extends StatelessWidget {
  const FaqScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      BlocBuilder<OwnerBloc, OwnerState>(builder: (context, state) {
        final data = state.data!;
        return ScreenFrame(
            title: 'FAQ',
            subtitle: 'Quick answers for restaurant staff.',
            trailing: const Tag('TERMINAL HELP'),
            child: PageBody(
                child: Column(children: [
              ...List.generate(data.faqs.length, (i) {
                final open = state.openFaqIndex == i;
                return Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: Panel(
                        padding: const EdgeInsets.all(18),
                        child: Column(children: [
                          InkWell(
                              onTap: () =>
                                  context.read<OwnerBloc>().add(FaqToggled(i)),
                              child: Row(children: [
                                Expanded(
                                    child: Text(data.faqs[i].question,
                                        style: const TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.w600))),
                                Icon(
                                    open
                                        ? Icons.keyboard_arrow_up
                                        : Icons.keyboard_arrow_down,
                                    color: AppColors.muted),
                              ])),
                          if (open) ...[
                            const Divider(height: 24),
                            Align(
                                alignment: Alignment.centerLeft,
                                child: Text(data.faqs[i].answer,
                                    style: const TextStyle(
                                        fontSize: 16,
                                        height: 1.6,
                                        color: AppColors.muted)))
                          ],
                        ])));
              }),
              const SizedBox(height: 8),
              Panel(
                  child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Icon(Icons.info_outline, color: AppColors.deepGreen),
                    const SizedBox(width: 12),
                    const Expanded(
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                          Text('Host Stand Quick Tip',
                              style: TextStyle(
                                  fontSize: 17, fontWeight: FontWeight.w600)),
                          SizedBox(height: 6),
                          Text(
                              'Open Terminal Settings to enable alert banners, or check Notifications in More for your inbox of booking updates.'),
                        ])),
                  ])),
              const SizedBox(height: 28),
              const Text(
                  'Still have questions? Ask your restaurant manager or contact support via Terminal Settings.',
                  textAlign: TextAlign.center),
              const SizedBox(height: 10),
              const Text('DinePoint Host Stand 1.0.0 • Help Center'),
            ])));
      });
}
