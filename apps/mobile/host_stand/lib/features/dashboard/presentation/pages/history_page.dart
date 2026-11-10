import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/theme/app_theme.dart';
import 'package:host_stand/features/dashboard/domain/entities/booking.dart';
import 'package:host_stand/features/dashboard/domain/entities/dashboard_enums.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_event.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_state.dart';
import 'package:host_stand/features/dashboard/presentation/widgets/dashboard_widgets.dart';

class HistoryPage extends StatelessWidget {
  const HistoryPage({super.key});
  @override
  Widget build(BuildContext context) =>
      BlocBuilder<DashboardBloc, DashboardState>(builder: (context, s) {
        final grouped = <DateTime, List<Booking>>{};
        for (final b in s.filteredHistory) {
          final d = DateTime(b.date.year, b.date.month, b.date.day);
          grouped.putIfAbsent(d, () => []).add(b);
        }
        return Column(children: [
          Expanded(
            child: s.status == DashboardLoadStatus.loading
                ? const LoadingState(label: 'Loading booking history…')
                : s.filteredHistory.isEmpty
                    ? const EmptyState(
                        title: 'No bookings in this range',
                        subtitle: 'Try selecting a different date range.')
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                        children: [
                            Row(children: [
                              const Expanded(
                                  child: Text('History',
                                      style: TextStyle(
                                          fontSize: 26,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.ink))),
                              chip(
                                  '${s.filteredHistory.length} reservations',
                                  AppColors.pale,
                                  AppColors.muted)
                            ]),
                            const SizedBox(height: 18),
                            InkWell(
                                onTap: () async {
                                  final now = DateTime.now();
                                  final picked = await showDateRangePicker(
                                    context: context,
                                    firstDate: s.earliestHistoryDate,
                                    lastDate: DateTime(
                                      now.year,
                                      now.month,
                                      now.day,
                                    ),
                                    initialDateRange: DateTimeRange(
                                      start: s.historyStart.isBefore(
                                              s.earliestHistoryDate)
                                          ? s.earliestHistoryDate
                                          : s.historyStart,
                                      end: s.historyEnd,
                                    ),
                                  );
                                  if (picked == null || !context.mounted) {
                                    return;
                                  }
                                  context.read<DashboardBloc>().add(
                                        HistoryRangeChanged(
                                          start: picked.start,
                                          end: picked.end,
                                        ),
                                      );
                                },
                                borderRadius: BorderRadius.circular(16),
                                child: Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius:
                                            BorderRadius.circular(16)),
                                    child: Row(children: [
                                      const Icon(Icons.calendar_today_outlined,
                                          color: AppColors.green, size: 22),
                                      const SizedBox(width: 14),
                                      Expanded(
                                          child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                            const Text('HISTORICAL RANGE',
                                                style: TextStyle(
                                                    fontSize: 11,
                                                    color: AppColors.muted,
                                                    fontWeight: FontWeight.w700,
                                                    letterSpacing: .5)),
                                            const SizedBox(height: 3),
                                            Text(s.historyRangeLabel,
                                                style: const TextStyle(
                                                    fontSize: 17,
                                                    fontWeight: FontWeight.w700,
                                                    color: AppColors.ink)),
                                          ])),
                                      const Icon(Icons.keyboard_arrow_down,
                                          color: AppColors.muted)
                                    ]))),
                            const SizedBox(height: 16),
                            ...grouped.entries.map((entry) {
                              final day = entry.key;
                              final items = entry.value;
                              final seated = items
                                  .where((b) =>
                                      b.status == BookingStatus.completed ||
                                      b.status == BookingStatus.seated)
                                  .length;
                              return Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Padding(
                                        padding: const EdgeInsets.fromLTRB(
                                            4, 2, 4, 8),
                                        child: Row(children: [
                                          Expanded(
                                              child: Text(_dayLabel(day),
                                                  style: const TextStyle(
                                                      fontSize: 12,
                                                      fontWeight:
                                                          FontWeight.w700,
                                                      color: AppColors.muted,
                                                      letterSpacing: .5))),
                                          Text('$seated seated',
                                              style: const TextStyle(
                                                  fontSize: 11,
                                                  color: AppColors.muted,
                                                  fontWeight: FontWeight.w600)),
                                        ])),
                                    ...items.map((b) => Padding(
                                        padding:
                                            const EdgeInsets.only(bottom: 8),
                                        child: _HistoryCard(booking: b))),
                                    const SizedBox(height: 7),
                                  ]);
                            }),
                            if (s.plan == PlanType.free) const AdBlock(),
                          ]),
          ),
        ]);
      });
}

String _dayLabel(DateTime day) {
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];
  return '${weekdays[day.weekday - 1]}, ${day.day} ${months[day.month - 1]}'
      .toUpperCase();
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.booking});
  final Booking booking;
  @override
  Widget build(BuildContext context) {
    final cancelled = booking.status == BookingStatus.cancelled;
    final statusBg = cancelled
        ? AppColors.rose
        : booking.status == BookingStatus.noShow
            ? AppColors.rose
            : AppColors.pale;
    final statusFg = cancelled || booking.status == BookingStatus.noShow
        ? AppColors.danger
        : AppColors.muted;
    return Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        child: InkWell(
          onTap: () => bookingDialog(context, booking),
          borderRadius: BorderRadius.circular(15),
          child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Expanded(
                          child: Text(booking.time,
                              style: const TextStyle(
                                  fontSize: 12, color: AppColors.muted))),
                      Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                              color: statusBg,
                              borderRadius: BorderRadius.circular(7)),
                          child: Text(booking.status.label,
                              style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w600,
                                  color: statusFg))),
                      const Icon(Icons.chevron_right,
                          size: 20, color: AppColors.muted)
                    ]),
                    const SizedBox(height: 6),
                    Text(booking.guestName,
                        style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink)),
                    const SizedBox(height: 6),
                    Row(children: [
                      const Icon(Icons.people_outline,
                          size: 16, color: AppColors.deepGreen),
                      const SizedBox(width: 5),
                      Text('Party ${booking.partySize}',
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.muted)),
                      const SizedBox(width: 12),
                      const Text('·', style: TextStyle(color: AppColors.muted)),
                      const SizedBox(width: 12),
                      const Icon(Icons.table_restaurant_outlined,
                          size: 16, color: AppColors.deepGreen),
                      const SizedBox(width: 5),
                      Text(booking.table,
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.muted)),
                    ]),
                  ])),
        ));
  }
}
