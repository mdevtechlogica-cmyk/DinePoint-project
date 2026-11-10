import 'package:equatable/equatable.dart';

class Restaurant extends Equatable {
  const Restaurant(
      {required this.id,
      required this.name,
      required this.area,
      required this.city,
      required this.phone,
      required this.isActive});
  final String id, name, area, city, phone;
  final bool isActive;
  factory Restaurant.fromJson(Map<String, dynamic> json) => Restaurant(
      id: json['id'] as String,
      name: json['name'] as String,
      area: json['area'] as String,
      city: json['city'] as String,
      phone: json['phone'] as String,
      isActive: json['isActive'] as bool);
  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'area': area,
        'city': city,
        'phone': phone,
        'isActive': isActive
      };
  @override
  List<Object?> get props => [id, name, area, city, phone, isActive];
}
