import 'package:host_stand/features/restaurant/data/datasources/restaurant_data_source.dart';
import 'package:host_stand/features/restaurant/data/models/create_restaurant.dart';
import 'package:host_stand/features/restaurant/data/models/restaurant.dart';
import 'package:host_stand/features/restaurant/domain/repositories/restaurant_repository.dart';

class RestaurantRepositoryImpl implements RestaurantRepository {
  const RestaurantRepositoryImpl(this.source);
  final RestaurantDataSource source;

  @override
  Future<List<Restaurant>> getRestaurants() => source.fetchRestaurants();

  @override
  Future<CreateRestaurant> create({
    required String name,
    required String phone,
    required String city,
    required String area,
    required String postalCode,
    required String state,
  }) =>
      source.create(
        name: name,
        phone: phone,
        city: city,
        area: area,
        postalCode: postalCode,
        state: state,
      );
}
