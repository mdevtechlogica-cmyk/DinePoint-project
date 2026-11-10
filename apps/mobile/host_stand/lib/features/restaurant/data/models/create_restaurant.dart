import 'package:equatable/equatable.dart';

class CreateRestaurant extends Equatable {
  const CreateRestaurant(
      {required this.id,
      required this.name,
      required this.phone,
      required this.city,
      required this.area,
      required this.postalCode,
      required this.state,
      required this.createdAt});
  final String id, name, phone, city, area, postalCode, state;
  final DateTime createdAt;
  factory CreateRestaurant.fromJson(Map<String, dynamic> j) => CreateRestaurant(
      id: j['id'] as String,
      name: j['name'] as String,
      phone: j['phone'] as String,
      city: j['city'] as String,
      area: j['area'] as String,
      postalCode: j['postalCode'] as String,
      state: j['state'] as String,
      createdAt: DateTime.parse(j['createdAt'] as String));
  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'city': city,
        'area': area,
        'postalCode': postalCode,
        'state': state,
        'createdAt': createdAt.toIso8601String()
      };
  @override
  List<Object?> get props =>
      [id, name, phone, city, area, postalCode, state, createdAt];
}
