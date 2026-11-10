import 'package:equatable/equatable.dart';
import 'package:host_stand/features/restaurant/data/models/create_restaurant.dart';
import 'package:host_stand/features/restaurant/presentation/bloc/create_restaurant/create_restaurant_event.dart';

class FormStateData extends Equatable {
  const FormStateData({
    this.name = '',
    this.phone = '',
    this.city = '',
    this.area = '',
    this.pin = '',
    this.stateName = 'Kerala',
    this.status = FormStatus.empty,
    this.errors = const {},
    this.message,
    this.restaurant,
  });
  final String name, phone, city, area, pin, stateName;
  final FormStatus status;
  final Map<String, String> errors;
  final String? message;
  final CreateRestaurant? restaurant;
  bool get busy => status == FormStatus.saving;
  FormStateData copyWith({
    String? name,
    String? phone,
    String? city,
    String? area,
    String? pin,
    FormStatus? status,
    Map<String, String>? errors,
    bool clearErrors = false,
    String? message,
    bool clearMessage = false,
    CreateRestaurant? restaurant,
    bool clearRestaurant = false,
  }) =>
      FormStateData(
        name: name ?? this.name,
        phone: phone ?? this.phone,
        city: city ?? this.city,
        area: area ?? this.area,
        pin: pin ?? this.pin,
        stateName: stateName,
        status: status ?? this.status,
        errors: clearErrors ? const {} : (errors ?? this.errors),
        message: clearMessage ? null : (message ?? this.message),
        restaurant: clearRestaurant ? null : (restaurant ?? this.restaurant),
      );
  @override
  List<Object?> get props => [
        name,
        phone,
        city,
        area,
        pin,
        stateName,
        status,
        errors,
        message,
        restaurant,
      ];
}
