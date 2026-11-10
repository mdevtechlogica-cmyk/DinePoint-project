import '../../domain/entities/booking.dart';
import '../../domain/entities/booking_report.dart';
import '../../domain/entities/plan_context.dart';
import '../../domain/entities/restaurant_profile.dart';

export '../../domain/entities/plan_context.dart';

abstract interface class DashboardRemoteDataSource {
  Future<List<Booking>> fetchToday();
  Future<List<Booking>> fetchHistory({DateTime? from, DateTime? to});
  Future<RestaurantProfile> fetchProfile();
  Future<BookingReport> fetchReport({
    required DateTime from,
    required DateTime to,
  });
  Future<String> exportReportCsv({
    required DateTime from,
    required DateTime to,
  });
  Future<DashboardPlanContext> fetchPlanContext();
}
