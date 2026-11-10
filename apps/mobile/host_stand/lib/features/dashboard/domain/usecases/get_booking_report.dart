import '../entities/booking_report.dart';
import '../repositories/dashboard_repository.dart';

class GetBookingReport {
  const GetBookingReport(this._repository);

  final DashboardRepository _repository;

  Future<BookingReport> call({
    required DateTime from,
    required DateTime to,
  }) =>
      _repository.getReport(from: from, to: to);
}

class ExportBookingReportCsv {
  const ExportBookingReportCsv(this._repository);

  final DashboardRepository _repository;

  Future<String> call({
    required DateTime from,
    required DateTime to,
  }) =>
      _repository.exportReportCsv(from: from, to: to);
}
