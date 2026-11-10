import 'package:equatable/equatable.dart';
import 'package:host_stand/features/dashboard/domain/entities/restaurant_profile.dart';
import 'package:host_stand/features/owner/data/models/plan_option.dart';

abstract class OwnerEvent extends Equatable {
  const OwnerEvent();
  @override
  List<Object?> get props => [];
}

class OwnerStarted extends OwnerEvent {}

class ProfileSaveRequested extends OwnerEvent {
  final RestaurantProfile profile;
  const ProfileSaveRequested(this.profile);
  @override
  List<Object?> get props => [profile];
}

class PlanSelectionRequested extends OwnerEvent {
  final PlanOption option;
  const PlanSelectionRequested(this.option);
  @override
  List<Object?> get props => [option];
}

class FaqToggled extends OwnerEvent {
  final int index;
  const FaqToggled(this.index);
  @override
  List<Object?> get props => [index];
}

class EditModeChanged extends OwnerEvent {
  final bool editing;
  const EditModeChanged(this.editing);
  @override
  List<Object?> get props => [editing];
}

class SignOutRequested extends OwnerEvent {}

class SignOutCancelled extends OwnerEvent {}
