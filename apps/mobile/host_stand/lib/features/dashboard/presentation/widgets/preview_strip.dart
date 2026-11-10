import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/theme/app_theme.dart';
import 'package:host_stand/features/dashboard/domain/entities/dashboard_enums.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_event.dart';

class PreviewStrip extends StatelessWidget {
  const PreviewStrip({required this.selected, required this.options});
  final DashboardPreview selected;
  final List<DashboardPreview> options;
  String label(DashboardPreview p) => switch (p) {
        DashboardPreview.todayMixedPaid => '1. Mixed (Paid)',
        DashboardPreview.todaySeated => '2. Seated (3)',
        DashboardPreview.todayEmpty => '3. Empty (0)',
        DashboardPreview.todayLoading => '4. Loading',
        DashboardPreview.todayError => '5. Error',
        DashboardPreview.todayFree => '6. Free Ad',
        DashboardPreview.historyWeek => '1. Week of Bookings (Paid)',
        DashboardPreview.historyEmpty => '2. Empty Range',
        DashboardPreview.historyLoading => '3. Loading',
        DashboardPreview.historyFree => '4. Free Ad',
        DashboardPreview.historyPaid => '5. Paid',
        DashboardPreview.reportsPaid => '1. Paid',
        DashboardPreview.reportsZeros => '2. Zeros',
        DashboardPreview.reportsLoading => '3. Load',
        DashboardPreview.reportsFree => '4. Free Ad',
        DashboardPreview.reportsPro => '5. Pro',
        DashboardPreview.moreOwner => '1. Owner (Suresh Pillai)',
        DashboardPreview.moreStaff => '2. Staff (Latha Menon)',
      };
  @override
  Widget build(BuildContext context) {
    if (!kDebugMode) return const SizedBox.shrink();
    return Container(
        margin: const EdgeInsets.fromLTRB(16, 9, 16, 14),
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
            color: AppColors.pale, borderRadius: BorderRadius.circular(15)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Icon(Icons.circle, size: 7, color: AppColors.green),
            const SizedBox(width: 6),
            const Expanded(
                child: Text('PREVIEW STATES',
                    style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: .7,
                        color: AppColors.muted))),
            const Text('390×844 Android',
                style: TextStyle(
                    fontSize: 10, color: AppColors.muted, fontWeight: FontWeight.w600))
          ]),
          const SizedBox(height: 7),
          SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                  children: options.map((p) {
                final active = p == selected;
                return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: InkWell(
                      onTap: () =>
                          context.read<DashboardBloc>().add(PreviewChanged(p)),
                      borderRadius: BorderRadius.circular(22),
                      child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                              color: active ? AppColors.green : Colors.white,
                              borderRadius: BorderRadius.circular(22),
                              border:
                                  active ? Border.all(color: AppColors.deepGreen) : null),
                          child: Text(label(p),
                              style: TextStyle(
                                  color: active ? Colors.white : AppColors.muted,
                                  fontSize: 11,
                                  fontWeight: active
                                      ? FontWeight.w700
                                      : FontWeight.w500))),
                    ));
              }).toList())),
        ]),
      );
  }
}
