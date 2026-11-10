import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/di/injection.dart';
import 'package:host_stand/core/router/app_routes.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/core/theme/app_theme.dart';
import 'package:host_stand/features/dashboard/domain/entities/booking.dart';
import 'package:host_stand/features/dashboard/domain/entities/dashboard_enums.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_event.dart';
import 'package:host_stand/features/dashboard/presentation/bloc/dashboard_state.dart';
import 'package:host_stand/features/dashboard/presentation/widgets/dashboard_widgets.dart';

class TodayPage extends StatelessWidget {
  const TodayPage({super.key});
  @override
  Widget build(BuildContext context) =>
      BlocBuilder<DashboardBloc, DashboardState>(builder: (context, s) {
        final loading = s.status == DashboardLoadStatus.loading;
        final failure = s.status == DashboardLoadStatus.failure;
        final now = DateTime.now();
        final dateLabel = _formatTodayDate(now);
        final shiftLabel = _shiftLabel(now);
        final activeBookings = s.today.where((b) =>
            b.status != BookingStatus.cancelled &&
            b.status != BookingStatus.noShow);
        final bookingCount = activeBookings.length;
        final tableCount = activeBookings
            .map((b) => b.table.trim())
            .where((t) => t.isNotEmpty)
            .toSet()
            .length;
        final hostName = () {
          final fromProfile = s.profile.ownerName.trim();
          if (fromProfile.isNotEmpty) return fromProfile;
          final fromSession = sl<SessionCache>().currentUser?.name.trim() ?? '';
          if (fromSession.isNotEmpty) return fromSession;
          return 'Host';
        }();
        final summary = bookingCount == 0
            ? 'No active reservations yet'
            : '$bookingCount ${bookingCount == 1 ? 'reservation' : 'reservations'}'
                '${tableCount == 0 ? '' : ' across $tableCount ${tableCount == 1 ? 'table' : 'tables'}'}';
        return Stack(children: [
          Column(children: [
            Padding(
                padding: const EdgeInsets.fromLTRB(18, 0, 18, 0),
                child: Column(children: [
                  Row(children: [
                    const Text('Today',
                        style: TextStyle(
                            fontSize: 27,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink)),
                    const SizedBox(width: 9),
                    Expanded(
                        child: Text(dateLabel,
                            style: const TextStyle(
                                fontSize: 16, color: AppColors.ink))),
                    chip(shiftLabel, AppColors.softGreen, AppColors.muted)
                  ]),
                  const SizedBox(height: 9),
                  Row(children: [
                    Expanded(
                        child: Text(summary,
                            style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.ink))),
                    chip('Host: $hostName', AppColors.pale, AppColors.ink)
                  ]),
                ])),
            SizedBox(
                height: 44,
                child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: BookingFilter.values.map((f) {
                      final active = f == s.filter;
                      return Padding(
                          padding: const EdgeInsets.only(right: 9),
                          child: InkWell(
                              onTap: () => context
                                  .read<DashboardBloc>()
                                  .add(BookingFilterChanged(f)),
                              borderRadius: BorderRadius.circular(24),
                              child: Container(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 15),
                                decoration: BoxDecoration(
                                    color: active ? AppColors.green : AppColors.pale,
                                    borderRadius: BorderRadius.circular(24),
                                    border: active
                                        ? Border.all(color: AppColors.deepGreen)
                                        : null),
                                child: Row(children: [
                                  Text(f.label,
                                      style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color:
                                              active ? Colors.white : AppColors.ink)),
                                  const SizedBox(width: 7),
                                  Text('${s.count(f)}',
                                      style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color:
                                              active ? Colors.white : AppColors.muted))
                                ]),
                              )));
                    }).toList())),
            const SizedBox(height: 12),
            Expanded(
                child: loading
                    ? const LoadingState(label: 'Loading today’s bookings…')
                    : failure
                        ? ErrorState(
                            message: s.errorMessage ??
                                'We couldn’t load today’s bookings.',
                            onRetry: () => context
                                .read<DashboardBloc>()
                                .add(const DashboardReloaded()))
                        : s.filteredToday.isEmpty
                            ? const EmptyState(
                                title: 'No bookings yet',
                                subtitle: 'New reservations will appear here.')
                            : ListView.separated(
                                padding:
                                    const EdgeInsets.fromLTRB(16, 0, 16, 14),
                                itemCount: s.filteredToday.length,
                                separatorBuilder: (_, __) =>
                                    const SizedBox(height: 9),
                                itemBuilder: (context, i) => _TodayBookingCard(
                                    booking: s.filteredToday[i]))),
            if (s.plan == PlanType.free) const AdBlock(),
          ]),
          Positioned(
              right: 18,
              bottom: 18,
              child: FloatingActionButton(
                  backgroundColor: AppColors.green,
                  foregroundColor: Colors.white,
                  onPressed: () => context.push(AppRoutes.spotBooking),
                  child: const Icon(Icons.add, size: 30))),
        ]);
      });
}

class _TodayBookingCard extends StatelessWidget {
  const _TodayBookingCard({required this.booking});
  final Booking booking;
  @override
  Widget build(BuildContext context) {
    final cancelled = booking.status == BookingStatus.cancelled;
    final color = booking.status == BookingStatus.pending
        ? AppColors.amber
        : booking.status == BookingStatus.seated
            ? AppColors.mint
            : booking.status == BookingStatus.completed
                ? AppColors.pale
                : booking.status == BookingStatus.cancelled
                    ? AppColors.rose
                    : AppColors.blush;
    final fg = booking.status == BookingStatus.pending
        ? AppColors.pendingInk
        : booking.status == BookingStatus.seated
            ? AppColors.deepGreen
            : booking.status == BookingStatus.completed
                ? AppColors.muted
                : booking.status == BookingStatus.cancelled
                    ? AppColors.danger
                    : AppColors.noShowInk;
    return Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(17),
        child: InkWell(
          borderRadius: BorderRadius.circular(17),
          onTap: () => bookingDialog(context, booking),
          child: Padding(
              padding: const EdgeInsets.all(13),
              child: Row(children: [
                Container(
                    width: 49,
                    height: 54,
                    decoration: BoxDecoration(
                        color: AppColors.pale, borderRadius: BorderRadius.circular(13)),
                    child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(booking.time.contains('PM') ? 'PM' : 'AM',
                              style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: booking.status == BookingStatus.seated
                                      ? AppColors.deepGreen
                                      : AppColors.muted)),
                          Text(
                              booking.time
                                  .replaceAll(' PM', '')
                                  .replaceAll(' AM', ''),
                              style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: booking.status == BookingStatus.seated
                                      ? AppColors.deepGreen
                                      : AppColors.ink)),
                        ])),
                const SizedBox(width: 11),
                Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                      Row(children: [
                        Flexible(
                            child: Text(booking.guestName,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: cancelled ? AppColors.muted : AppColors.ink,
                                    decoration: cancelled
                                        ? TextDecoration.lineThrough
                                        : null))),
                        const SizedBox(width: 5),
                        _party(booking.partySize)
                      ]),
                      const SizedBox(height: 6),
                      Row(children: [
                        Expanded(
                            child: Text(booking.phone,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    fontSize: 10.5, color: AppColors.muted))),
                        const Text(' • ', style: TextStyle(color: AppColors.muted)),
                        Flexible(
                            child: Text(booking.table,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                    fontSize: 10.5,
                                    color: cancelled ? AppColors.danger : AppColors.deepGreen,
                                    fontWeight: FontWeight.w600)))
                      ]),
                    ])),
                const SizedBox(width: 7),
                Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
                    decoration: BoxDecoration(
                        color: color, borderRadius: BorderRadius.circular(18)),
                    child: Text(booking.status.label,
                        style: TextStyle(
                            fontSize: 10.5,
                            color: fg,
                            fontWeight: FontWeight.w600))),
                const Icon(Icons.chevron_right, size: 22, color: AppColors.ink),
              ])),
        ));
  }

  Widget _party(int n) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
          color: AppColors.softGreen,
          borderRadius: BorderRadius.circular(15)),
      child: Text('Party $n',
          style: const TextStyle(
              fontSize: 10.5, color: AppColors.muted, fontWeight: FontWeight.w600)));
}

const _weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const _months = [
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
  'Dec',
];

String _formatTodayDate(DateTime value) {
  final weekday = _weekdays[(value.weekday - 1).clamp(0, 6)];
  return '$weekday, ${value.day} ${_months[value.month - 1]}';
}

String _shiftLabel(DateTime value) {
  final hour = value.hour;
  if (hour < 11) return '● Shift: Breakfast';
  if (hour < 16) return '● Shift: Lunch';
  if (hour < 22) return '● Shift: Dinner';
  return '● Shift: Late';
}
