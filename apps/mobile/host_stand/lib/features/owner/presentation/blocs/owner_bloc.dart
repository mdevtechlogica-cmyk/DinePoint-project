import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/features/owner/data/models/owner_settings_data.dart';
import 'package:host_stand/features/owner/domain/repositories/owner_repository.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_event.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_state.dart';

class OwnerBloc extends Bloc<OwnerEvent, OwnerState> {
  final OwnerRepository repository;
  OwnerBloc(this.repository) : super(const OwnerState()) {
    on<OwnerStarted>(_onStarted);
    on<ProfileSaveRequested>(_onSave);
    on<PlanSelectionRequested>(_onPlan);
    on<FaqToggled>((e, emit) => emit(state.copyWith(
        openFaqIndex: state.openFaqIndex == e.index ? null : e.index,
        clearOpenFaq: state.openFaqIndex == e.index)));
    on<EditModeChanged>((e, emit) =>
        emit(state.copyWith(editing: e.editing, status: OwnerStatus.loaded)));
    on<SignOutRequested>(
        (e, emit) => emit(state.copyWith(showSignOutConfirm: true)));
    on<SignOutCancelled>(
        (e, emit) => emit(state.copyWith(showSignOutConfirm: false)));
  }
  Future<void> _onStarted(OwnerStarted event, Emitter<OwnerState> emit) async {
    emit(state.copyWith(status: OwnerStatus.loading));
    try {
      emit(state.copyWith(
          status: OwnerStatus.loaded, data: await repository.load()));
    } catch (_) {
      emit(state.copyWith(
          status: OwnerStatus.failure,
          error: 'Unable to load owner settings. Please retry.'));
    }
  }

  Future<void> _onSave(
      ProfileSaveRequested event, Emitter<OwnerState> emit) async {
    final current = state.data;
    if (current == null) return;
    emit(state.copyWith(status: OwnerStatus.saving));
    try {
      final profile = await repository.saveProfile(event.profile);
      final next = OwnerSettingsData(
          profile: profile,
          plan: current.plan,
          options: current.options,
          faqs: current.faqs,
          restaurantShortAddress: current.restaurantShortAddress,
          terminal: current.terminal,
          version: current.version,
          build: current.build,
          syncStatus: current.syncStatus);
      emit(state.copyWith(
          status: OwnerStatus.success, data: next, editing: false));
    } catch (_) {
      emit(state.copyWith(
          status: OwnerStatus.failure, error: 'Could not save profile.'));
    }
  }

  Future<void> _onPlan(
      PlanSelectionRequested event, Emitter<OwnerState> emit) async {
    final current = state.data;
    if (current == null) return;
    emit(state.copyWith(status: OwnerStatus.saving));
    try {
      final plan = await repository.choosePlan(event.option);
      final next = OwnerSettingsData(
          profile: current.profile,
          plan: plan,
          options: current.options,
          faqs: current.faqs,
          restaurantShortAddress: current.restaurantShortAddress,
          terminal: current.terminal,
          version: current.version,
          build: current.build,
          syncStatus: current.syncStatus);
      emit(state.copyWith(status: OwnerStatus.success, data: next));
    } catch (_) {
      emit(state.copyWith(
          status: OwnerStatus.failure, error: 'Plan selection failed.'));
    }
  }
}
