import '../entities/booking.dart';
import '../repositories/dashboard_repository.dart';

class GetTodayBookings {
  const GetTodayBookings(this._repository);

  final DashboardRepository _repository;

  Future<List<Booking>> call() => _repository.getToday();
}
