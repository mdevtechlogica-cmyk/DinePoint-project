import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/theme/app_theme.dart';
import 'package:host_stand/features/dashboard/domain/entities/booking_report.dart';
import 'package:host_stand/features/dashboard/domain/entities/dashboard_enums.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_event.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_state.dart';
import 'package:host_stand/features/dashboard/presentation/widgets/dashboard_widgets.dart';

class ReportsPage extends StatelessWidget {
  const ReportsPage({super.key});

  @override
  Widget build(BuildContext context) =>
      BlocConsumer<DashboardBloc, DashboardState>(
        listenWhen: (p, c) => p.exportCsv != c.exportCsv && c.exportCsv != null,
        listener: (context, s) async {
          final csv = s.exportCsv;
          if (csv == null) return;
          await Clipboard.setData(ClipboardData(text: csv));
          if (!context.mounted) return;
          context.read<DashboardBloc>().add(const ReportExportConsumed());
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Report CSV copied (${csv.split('\n').length - 1} data rows).',
              ),
            ),
          );
        },
        builder: (context, s) {
          final loading = s.status == DashboardLoadStatus.loading;
          final totals = s.report?.totals ?? BookingReportTotals.empty;
          final rangeLabel = s.historyRangeLabel;
          return Column(children: [
            Expanded(
              child: loading
                  ? const LoadingState(label: 'Loading reports…')
                  : !s.reportsEnabled
                      ? const EmptyState(
                          title: 'Reports not on your plan',
                          subtitle:
                              'Ask your DinePoint account manager to enable reports.',
                        )
                      : ListView(
                          padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
                          children: [
                            Row(children: [
                              const Text(
                                'Reports',
                                style: TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.ink,
                                ),
                              ),
                              const SizedBox(width: 9),
                              chip(
                                rangeLabel,
                                AppColors.softGreen,
                                AppColors.muted,
                              ),
                              const Spacer(),
                              Text(
                                s.planName,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.ink,
                                ),
                              ),
                            ]),
                            const SizedBox(height: 17),
                            Container(
                              padding: const EdgeInsets.all(22),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(18),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Row(children: [
                                    Expanded(
                                      child: Text(
                                        'TOTAL BOOKINGS',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: AppColors.muted,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: .7,
                                        ),
                                      ),
                                    ),
                                    Icon(
                                      Icons.calendar_month_outlined,
                                      color: AppColors.muted,
                                    ),
                                  ]),
                                  const SizedBox(height: 10),
                                  Text(
                                    '${totals.total}',
                                    style: const TextStyle(
                                      fontSize: 38,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.ink,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Across $rangeLabel',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.muted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 14),
                            GridView.count(
                              crossAxisCount: 2,
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              crossAxisSpacing: 10,
                              mainAxisSpacing: 10,
                              childAspectRatio: 1.5,
                              children: [
                                _metric(
                                  'Seated now',
                                  '${totals.seated}',
                                  'In service',
                                  AppColors.green,
                                ),
                                _metric(
                                  'Completed',
                                  '${totals.completed}',
                                  'Settled',
                                  AppColors.muted,
                                ),
                                _metric(
                                  'Cancelled',
                                  '${totals.cancelled}',
                                  'Cancelled + rejected',
                                  AppColors.danger,
                                ),
                                _metric(
                                  'No-show',
                                  '${totals.noShow}',
                                  'Missed arrivals',
                                  AppColors.noShowDeep,
                                ),
                              ],
                            ),
                            if (s.plan == PlanType.free) ...[
                              const SizedBox(height: 14),
                              const AdBlock(),
                            ],
                            const SizedBox(height: 14),
                            Row(children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: s.exportReports
                                      ? () => context
                                          .read<DashboardBloc>()
                                          .add(const ReportExportRequested())
                                      : null,
                                  icon: const Icon(Icons.ios_share),
                                  label: const Text('Export CSV'),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.ink,
                                    backgroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 14,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: FilledButton.icon(
                                  onPressed: () => showDialog<void>(
                                    context: context,
                                    builder: (ctx) => AlertDialog(
                                      title: const Text('Shift summary'),
                                      content: Text(
                                        '${s.profile.name}\n'
                                        'Range: $rangeLabel\n'
                                        'Total: ${totals.total}\n'
                                        'Completed: ${totals.completed}\n'
                                        'Seated: ${totals.seated}\n'
                                        'Cancelled: ${totals.cancelled}\n'
                                        'No-show: ${totals.noShow}',
                                      ),
                                      actions: [
                                        TextButton(
                                          onPressed: () => Navigator.pop(ctx),
                                          child: const Text('Done'),
                                        ),
                                      ],
                                    ),
                                  ),
                                  icon: const Icon(Icons.print_outlined),
                                  label: const Text('Print Summary'),
                                  style: FilledButton.styleFrom(
                                    backgroundColor: AppColors.deepGreen,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 14,
                                    ),
                                  ),
                                ),
                              ),
                            ]),
                          ],
                        ),
            ),
          ]);
        },
      );

  Widget _metric(String title, String value, String caption, Color dot) =>
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.muted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Icon(Icons.circle, size: 10, color: dot),
            ]),
            const Spacer(),
            Text(
              value,
              style: TextStyle(
                fontSize: 25,
                fontWeight: FontWeight.w700,
                color: title == 'Cancelled' && value != '0'
                    ? AppColors.danger
                    : AppColors.ink,
              ),
            ),
            Text(
              caption,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.muted,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
}
