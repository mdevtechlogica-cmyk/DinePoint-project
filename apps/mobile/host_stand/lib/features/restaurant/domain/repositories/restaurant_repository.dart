import 'package:host_stand/features/restaurant/data/models/create_restaurant.dart';
import 'package:host_stand/features/restaurant/data/models/restaurant.dart';

abstract interface class RestaurantRepository {
  Future<List<Restaurant>> getRestaurants();

  Future<CreateRestaurant> create(
      {required String name,
      required String phone,
      required String city,
      required String area,
      required String postalCode,
      required String state});
}
