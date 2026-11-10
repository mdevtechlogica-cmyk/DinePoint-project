import 'package:equatable/equatable.dart';

class RestaurantProfile extends Equatable {
  const RestaurantProfile({
    required this.name,
    required this.address,
    required this.area,
    required this.city,
    required this.phone,
    required this.email,
    required this.state,
    required this.postalCode,
    required this.ownerName,
  });

  final String name;
  final String address;
  final String area;
  final String city;
  final String phone;
  final String email;
  final String state;
  final String postalCode;
  final String ownerName;

  factory RestaurantProfile.fromJson(Map<String, dynamic> json) =>
      RestaurantProfile(
        name: json['name'] as String,
        address: json['address'] as String,
        area: json['area'] as String,
        city: json['city'] as String,
        phone: json['phone'] as String,
        email: json['email'] as String,
        state: json['state'] as String,
        postalCode: json['postalCode'] as String,
        ownerName: json['ownerName'] as String,
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'address': address,
        'area': area,
        'city': city,
        'phone': phone,
        'email': email,
        'state': state,
        'postalCode': postalCode,
        'ownerName': ownerName,
      };

  @override
  List<Object?> get props =>
      [name, address, area, city, phone, email, state, postalCode, ownerName];
}
