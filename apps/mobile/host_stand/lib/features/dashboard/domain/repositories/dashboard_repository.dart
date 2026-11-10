import '../entities/booking.dart';
import '../entities/booking_report.dart';
import '../entities/plan_context.dart';
import '../entities/restaurant_profile.dart';

abstract interface class DashboardRepository {
  Future<List<Booking>> getToday();
  Future<List<Booking>> getHistory({DateTime? from, DateTime? to});
  Future<RestaurantProfile> getProfile();
  Future<BookingReport> getReport({
    required DateTime from,
    required DateTime to,
  });
  Future<String> exportReportCsv({
    required DateTime from,
    required DateTime to,
  });
  Future<DashboardPlanContext> getPlanContext();
}
