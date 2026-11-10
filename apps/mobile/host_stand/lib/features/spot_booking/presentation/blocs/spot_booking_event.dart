import 'package:equatable/equatable.dart';
import 'package:host_stand/features/spot_booking/data/models/dining_table.dart';

sealed class SpotEvent extends Equatable {
  const SpotEvent();
  @override
  List<Object?> get props => [];
}

class Started extends SpotEvent {
  const Started();
}

class PartyChanged extends SpotEvent {
  const PartyChanged(this.value);
  final int value;
  @override
  List<Object?> get props => [value];
}

class FloorChanged extends SpotEvent {
  const FloorChanged(this.value);
  final FloorName value;
  @override
  List<Object?> get props => [value];
}

class TablePicked extends SpotEvent {
  const TablePicked(this.value);
  final DiningTable value;
  @override
  List<Object?> get props => [value];
}

class GuestChanged extends SpotEvent {
  const GuestChanged(this.name, this.phone, this.note);
  final String name, phone, note;
  @override
  List<Object?> get props => [name, phone, note];
}

class GoTable extends SpotEvent {
  const GoTable();
}

class GoParty extends SpotEvent {
  const GoParty();
}

class GoGuest extends SpotEvent {
  const GoGuest();
}

class SeatPressed extends SpotEvent {
  const SeatPressed();
}

class GoBackTable extends SpotEvent {
  const GoBackTable();
}

class CloseFlow extends SpotEvent {
  const CloseFlow();
}

class PreviewChanged extends SpotEvent {
  const PreviewChanged(this.value);
  final Preview value;
  @override
  List<Object?> get props => [value];
}

class PlanChanged extends SpotEvent {
  const PlanChanged(this.free);
  final bool free;
  @override
  List<Object?> get props => [free];
}

class UpgradeDismissed extends SpotEvent {
  const UpgradeDismissed();
}
