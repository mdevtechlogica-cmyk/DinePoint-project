import 'package:equatable/equatable.dart';
import 'package:host_stand/features/restaurant/data/models/restaurant.dart';
import 'package:host_stand/features/restaurant/presentation/bloc/choose_restaurant/restaurant_event.dart';

class RestaurantState extends Equatable {
  const RestaurantState({
    this.status = RestaurantStatus.initial,
    this.restaurants = const [],
    this.selectedId,
    this.error,
  });
  final RestaurantStatus status;
  final List<Restaurant> restaurants;
  final String? selectedId, error;

  Restaurant? get selected {
    for (final restaurant in restaurants) {
      if (restaurant.id == selectedId) return restaurant;
    }
    return null;
  }

  bool get canContinue =>
      status == RestaurantStatus.success && selected != null;

  @override
  List<Object?> get props => [status, restaurants, selectedId, error];
}
