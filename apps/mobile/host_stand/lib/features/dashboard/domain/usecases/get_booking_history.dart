import '../entities/booking.dart';
import '../repositories/dashboard_repository.dart';

class GetBookingHistory {
  const GetBookingHistory(this._repository);

  final DashboardRepository _repository;

  Future<List<Booking>> call({DateTime? from, DateTime? to}) =>
      _repository.getHistory(from: from, to: to);
}
