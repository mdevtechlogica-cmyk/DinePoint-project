import '../../domain/entities/booking.dart';
import '../../domain/entities/booking_report.dart';
import '../../domain/entities/restaurant_profile.dart';
import '../../domain/repositories/dashboard_repository.dart';
import '../datasources/dashboard_remote_data_source.dart';

class DashboardRepositoryImpl implements DashboardRepository {
  const DashboardRepositoryImpl(this._remote);

  final DashboardRemoteDataSource _remote;

  @override
  Future<List<Booking>> getToday() => _remote.fetchToday();

  @override
  Future<List<Booking>> getHistory({DateTime? from, DateTime? to}) =>
      _remote.fetchHistory(from: from, to: to);

  @override
  Future<RestaurantProfile> getProfile() => _remote.fetchProfile();

  @override
  Future<BookingReport> getReport({
    required DateTime from,
    required DateTime to,
  }) =>
      _remote.fetchReport(from: from, to: to);

  @override
  Future<String> exportReportCsv({
    required DateTime from,
    required DateTime to,
  }) =>
      _remote.exportReportCsv(from: from, to: to);

  @override
  Future<DashboardPlanContext> getPlanContext() => _remote.fetchPlanContext();
}
