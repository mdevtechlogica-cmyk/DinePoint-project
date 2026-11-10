import 'package:equatable/equatable.dart';

enum FormStatus { empty, editing, errors, saving, saved, failure }

sealed class FormEvent extends Equatable {
  const FormEvent();
  @override
  List<Object?> get props => [];
}

class NameChanged extends FormEvent {
  const NameChanged(this.v);
  final String v;
  @override
  List<Object?> get props => [v];
}

class PhoneChanged extends FormEvent {
  const PhoneChanged(this.v);
  final String v;
  @override
  List<Object?> get props => [v];
}

class CityChanged extends FormEvent {
  const CityChanged(this.v);
  final String v;
  @override
  List<Object?> get props => [v];
}

class AreaChanged extends FormEvent {
  const AreaChanged(this.v);
  final String v;
  @override
  List<Object?> get props => [v];
}

class PinChanged extends FormEvent {
  const PinChanged(this.v);
  final String v;
  @override
  List<Object?> get props => [v];
}

class SubmitRestaurant extends FormEvent {
  const SubmitRestaurant();
}
