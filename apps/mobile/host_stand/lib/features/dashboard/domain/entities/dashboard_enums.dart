enum BookingStatus { pending, seated, completed, cancelled, noShow }

extension BookingStatusLabel on BookingStatus {
  String get label => switch (this) {
        BookingStatus.pending => 'Pending',
        BookingStatus.seated => 'Seated',
        BookingStatus.completed => 'Completed',
        BookingStatus.cancelled => 'Cancelled',
        BookingStatus.noShow => 'No-show',
      };
}

enum BookingFilter { all, pending, seated, completed, cancelled, noShow }

extension BookingFilterLabel on BookingFilter {
  String get label => switch (this) {
        BookingFilter.all => 'All',
        BookingFilter.pending => 'Pending',
        BookingFilter.seated => 'Seated',
        BookingFilter.completed => 'Completed',
        BookingFilter.cancelled => 'Cancelled',
        BookingFilter.noShow => 'No-show',
      };
}

enum DashboardPage { today, history, reports, more }

enum DashboardLoadStatus { initial, loading, success, failure }

enum DashboardPreview {
  todayMixedPaid,
  todaySeated,
  todayEmpty,
  todayLoading,
  todayError,
  todayFree,
  historyWeek,
  historyEmpty,
  historyLoading,
  historyFree,
  historyPaid,
  reportsPaid,
  reportsZeros,
  reportsLoading,
  reportsFree,
  reportsPro,
  moreOwner,
  moreStaff,
}

enum AccountRole { owner, staff }

enum PlanType { free, paid }
