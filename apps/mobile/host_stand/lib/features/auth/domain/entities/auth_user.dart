import 'package:equatable/equatable.dart';

class AuthUser extends Equatable {
  const AuthUser({
    required this.id,
    required this.name,
    required this.email,
    required this.restaurantName,
    required this.role,
  });

  final String id;
  final String name;
  final String email;
  final String restaurantName;
  final String role;

  @override
  List<Object?> get props => [id, name, email, restaurantName, role];
}
