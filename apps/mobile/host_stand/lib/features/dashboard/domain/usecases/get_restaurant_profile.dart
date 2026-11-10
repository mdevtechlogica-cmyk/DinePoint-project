import '../entities/restaurant_profile.dart';
import '../repositories/dashboard_repository.dart';

class GetRestaurantProfile {
  const GetRestaurantProfile(this._repository);

  final DashboardRepository _repository;

  Future<RestaurantProfile> call() => _repository.getProfile();
}
