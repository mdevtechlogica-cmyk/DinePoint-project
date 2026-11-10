import 'package:equatable/equatable.dart';

class RestaurantProfile extends Equatable {
  final String name, phone, email, address, area, city, state, postalCode;
  const RestaurantProfile({
    required this.name,
    required this.phone,
    required this.email,
    required this.address,
    required this.area,
    required this.city,
    required this.state,
    required this.postalCode,
  });
  RestaurantProfile copyWith(
          {String? name,
          String? phone,
          String? email,
          String? address,
          String? area,
          String? city,
          String? state,
          String? postalCode}) =>
      RestaurantProfile(
        name: name ?? this.name,
        phone: phone ?? this.phone,
        email: email ?? this.email,
        address: address ?? this.address,
        area: area ?? this.area,
        city: city ?? this.city,
        state: state ?? this.state,
        postalCode: postalCode ?? this.postalCode,
      );
  @override
  List<Object?> get props =>
      [name, phone, email, address, area, city, state, postalCode];
}
