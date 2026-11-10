class BookingReportTotals {
  const BookingReportTotals({
    required this.total,
    required this.pending,
    required this.confirmed,
    required this.seated,
    required this.completed,
    required this.cancelled,
    required this.rejected,
    required this.noShow,
  });

  final int total;
  final int pending;
  final int confirmed;
  final int seated;
  final int completed;
  final int cancelled;
  final int rejected;
  final int noShow;

  factory BookingReportTotals.fromJson(Map<String, dynamic> json) {
    int n(String key) => (json[key] as num?)?.toInt() ?? 0;
    return BookingReportTotals(
      total: n('total'),
      pending: n('pending'),
      confirmed: n('confirmed'),
      seated: n('seated'),
      completed: n('completed'),
      cancelled: n('cancelled'),
      rejected: n('rejected'),
      noShow: n('noShow'),
    );
  }

  static const empty = BookingReportTotals(
    total: 0,
    pending: 0,
    confirmed: 0,
    seated: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
    noShow: 0,
  );
}

class BookingReport {
  const BookingReport({
    required this.from,
    required this.to,
    required this.totals,
    this.totalCount = 0,
  });

  final DateTime from;
  final DateTime to;
  final BookingReportTotals totals;
  final int totalCount;

  factory BookingReport.fromJson(Map<String, dynamic> json) {
    final totalsRaw = json['totals'];
    return BookingReport(
      from: DateTime.tryParse(json['from'] as String? ?? '')?.toLocal() ??
          DateTime.now(),
      to: DateTime.tryParse(json['to'] as String? ?? '')?.toLocal() ??
          DateTime.now(),
      totals: totalsRaw is Map
          ? BookingReportTotals.fromJson(Map<String, dynamic>.from(totalsRaw))
          : BookingReportTotals.empty,
      totalCount: (json['totalCount'] as num?)?.toInt() ?? 0,
    );
  }
}
