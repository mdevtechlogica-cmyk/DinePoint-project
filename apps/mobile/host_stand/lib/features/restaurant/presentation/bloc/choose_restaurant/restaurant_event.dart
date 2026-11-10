import 'package:equatable/equatable.dart';

enum RestaurantStatus { initial, loading, success, failure }

sealed class RestaurantEvent extends Equatable {
  const RestaurantEvent();
  @override
  List<Object?> get props => [];
}

class RestaurantsRequested extends RestaurantEvent {
  const RestaurantsRequested();
}

class RestaurantSelected extends RestaurantEvent {
  const RestaurantSelected(this.id);
  final String id;
  @override
  List<Object?> get props => [id];
}
