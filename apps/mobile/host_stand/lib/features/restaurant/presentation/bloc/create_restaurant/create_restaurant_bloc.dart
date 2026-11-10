import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/features/restaurant/domain/repositories/restaurant_repository.dart';
import 'package:host_stand/features/restaurant/presentation/bloc/create_restaurant/create_restaurant_event.dart';
import 'package:host_stand/features/restaurant/presentation/bloc/create_restaurant/create_restaurant_state.dart';

class CreateRestaurantBloc extends Bloc<FormEvent, FormStateData> {
  CreateRestaurantBloc(this.repo) : super(const FormStateData()) {
    on<NameChanged>((e, emit) => emit(_edit(name: e.v)));
    on<PhoneChanged>((e, emit) => emit(_edit(phone: e.v)));
    on<CityChanged>((e, emit) => emit(_edit(city: e.v)));
    on<AreaChanged>((e, emit) => emit(_edit(area: e.v)));
    on<PinChanged>((e, emit) => emit(_edit(pin: e.v)));
    on<SubmitRestaurant>(_submit);
  }
  final RestaurantRepository repo;
  FormStateData _edit(
          {String? name,
          String? phone,
          String? city,
          String? area,
          String? pin}) =>
      state.copyWith(
          name: name ?? state.name,
          phone: phone ?? state.phone,
          city: city ?? state.city,
          area: area ?? state.area,
          pin: pin ?? state.pin,
          status: FormStatus.editing,
          clearErrors: true,
          clearMessage: true,
          clearRestaurant: true);
  Map<String, String> _validate(FormStateData s) {
    final e = <String, String>{};
    if (s.name.trim().length < 2) e['name'] = 'Enter a restaurant name.';
    final d = s.phone.replaceAll(RegExp(r'\D'), '');
    final n = d.startsWith('91') && d.length == 12 ? d.substring(2) : d;
    if (n.length != 10)
      e['phone'] = 'Enter a valid 10-digit Indian phone number.';
    if (s.city.trim().length < 2) e['city'] = 'Enter a city.';
    if (!RegExp(r'^\d{6}$').hasMatch(s.pin.trim()))
      e['pin'] = 'Enter a valid 6-digit PIN code.';
    return e;
  }

  Future<void> _submit(
      SubmitRestaurant event, Emitter<FormStateData> emit) async {
    final e = _validate(state);
    if (e.isNotEmpty) {
      emit(state.copyWith(
          status: FormStatus.errors,
          errors: e,
          message: 'Please fix the highlighted fields and try again.',
          clearRestaurant: true));
      return;
    }
    emit(state.copyWith(
        status: FormStatus.saving,
        clearErrors: true,
        clearMessage: true,
        clearRestaurant: true));
    try {
      final r = await repo.create(
          name: state.name,
          phone: state.phone,
          city: state.city,
          area: state.area,
          postalCode: state.pin,
          state: state.stateName);
      emit(state.copyWith(
          status: FormStatus.saved,
          restaurant: r,
          message: 'Restaurant created successfully.'));
    } catch (_) {
      emit(state.copyWith(
          status: FormStatus.failure,
          message: 'We couldn’t create the restaurant. Please try again.'));
    }
  }
}
