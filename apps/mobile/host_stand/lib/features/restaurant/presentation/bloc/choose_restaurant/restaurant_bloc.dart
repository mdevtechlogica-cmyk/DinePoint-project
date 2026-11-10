import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/features/restaurant/domain/repositories/restaurant_repository.dart';
import 'package:host_stand/features/restaurant/presentation/bloc/choose_restaurant/restaurant_event.dart';
import 'package:host_stand/features/restaurant/presentation/bloc/choose_restaurant/restaurant_state.dart';

class RestaurantBloc extends Bloc<RestaurantEvent, RestaurantState> {
  RestaurantBloc(this.repository) : super(const RestaurantState()) {
    on<RestaurantsRequested>(_load);
    on<RestaurantSelected>(
      (e, emit) => emit(
        RestaurantState(
          status: state.status,
          restaurants: state.restaurants,
          selectedId: e.id,
          error: state.error,
        ),
      ),
    );
  }

  final RestaurantRepository repository;

  static bool isDemoRestaurantId(String? id) =>
      id != null && SessionCache.demoRestaurantIds.contains(id);

  Future<void> _load(
    RestaurantsRequested event,
    Emitter<RestaurantState> emit,
  ) async {
    emit(const RestaurantState(status: RestaurantStatus.loading));
    try {
      final list = await repository.getRestaurants();
      emit(RestaurantState(
        status: RestaurantStatus.success,
        restaurants: list,
        selectedId: list.isEmpty ? null : list.first.id,
      ));
    } catch (_) {
      emit(const RestaurantState(
        status: RestaurantStatus.failure,
        error:
            'We couldn’t load your restaurants. Check your connection and try again.',
      ));
    }
  }
}
