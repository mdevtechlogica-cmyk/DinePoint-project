import 'package:equatable/equatable.dart';

import '../../domain/entities/booking.dart';
import '../../domain/entities/booking_report.dart';
import '../../domain/entities/dashboard_enums.dart';
import '../../domain/entities/restaurant_profile.dart';

class DashboardState extends Equatable {
  DashboardState({
    this.page = DashboardPage.today,
    this.status = DashboardLoadStatus.initial,
    this.today = const [],
    this.history = const [],
    this.profile = const RestaurantProfile(
      name: 'Restaurant',
      address: '',
      area: '',
      city: '',
      phone: '',
      email: '',
      state: '',
      postalCode: '',
      ownerName: '',
    ),
    this.filter = BookingFilter.all,
    this.preview = DashboardPreview.todayMixedPaid,
    this.role = AccountRole.owner,
    this.plan = PlanType.paid,
    this.planName = 'Starter',
    this.reportHistoryDays = 7,
    this.reportsEnabled = false,
    this.exportReports = false,
    this.employeesEnabled = false,
    this.report,
    this.exportCsv,
    this.searchQuery = '',
    this.searchVisible = false,
    DateTime? historyStart,
    DateTime? historyEnd,
    this.errorMessage,
  })  : historyStart = historyStart ??
            DateTime.now().subtract(const Duration(days: 7)),
        historyEnd = historyEnd ?? DateTime.now();

  final DashboardPage page;
  final DashboardLoadStatus status;
  final List<Booking> today;
  final List<Booking> history;
  final RestaurantProfile profile;
  final BookingFilter filter;
  final DashboardPreview preview;
  final AccountRole role;
  final PlanType plan;
  final String planName;
  final int reportHistoryDays;
  final bool reportsEnabled;
  final bool exportReports;
  final bool employeesEnabled;
  final BookingReport? report;
  final String? exportCsv;
  final String searchQuery;
  final bool searchVisible;
  final DateTime historyStart;
  final DateTime historyEnd;
  final String? errorMessage;

  List<Booking> get filteredToday {
    final byStatus = _filterByStatus(today, filter);
    final q = searchQuery.trim().toLowerCase();
    if (q.isEmpty) return byStatus;
    return byStatus
        .where(
          (b) =>
              b.guestName.toLowerCase().contains(q) ||
              b.phone.toLowerCase().contains(q) ||
              b.table.toLowerCase().contains(q) ||
              b.id.toLowerCase().contains(q),
        )
        .toList();
  }

  List<Booking> get filteredHistory {
    final start =
        DateTime(historyStart.year, historyStart.month, historyStart.day);
    final end = DateTime(historyEnd.year, historyEnd.month, historyEnd.day);
    return history.where((b) {
      final d = DateTime(b.date.year, b.date.month, b.date.day);
      return !d.isBefore(start) && !d.isAfter(end);
    }).toList();
  }

  List<Booking> _filterByStatus(List<Booking> list, BookingFilter f) {
    if (f == BookingFilter.all) return list;
    final wanted = switch (f) {
      BookingFilter.all => null,
      BookingFilter.pending => BookingStatus.pending,
      BookingFilter.seated => BookingStatus.seated,
      BookingFilter.completed => BookingStatus.completed,
      BookingFilter.cancelled => BookingStatus.cancelled,
      BookingFilter.noShow => BookingStatus.noShow,
    };
    return list.where((b) => b.status == wanted).toList();
  }

  int count(BookingFilter f) => _filterByStatus(today, f).length;

  String get historyRangeLabel {
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
    return '${historyStart.day} ${months[historyStart.month - 1]} – '
        '${historyEnd.day} ${months[historyEnd.month - 1]}';
  }

  DateTime get earliestHistoryDate {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    if (reportHistoryDays < 0) {
      return today.subtract(const Duration(days: 365));
    }
    return today.subtract(Duration(days: reportHistoryDays));
  }

  @override
  List<Object?> get props => [
        page,
        status,
        today,
        history,
        profile,
        filter,
        preview,
        role,
        plan,
        planName,
        reportHistoryDays,
        reportsEnabled,
        exportReports,
        employeesEnabled,
        report,
        exportCsv,
        searchQuery,
        searchVisible,
        historyStart,
        historyEnd,
        errorMessage,
      ];
}
