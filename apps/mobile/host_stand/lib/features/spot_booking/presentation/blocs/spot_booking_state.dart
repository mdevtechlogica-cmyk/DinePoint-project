import 'package:equatable/equatable.dart';
import 'package:host_stand/features/spot_booking/data/models/dining_table.dart';
import 'package:host_stand/features/spot_booking/data/models/spot_booking.dart';

class SpotState extends Equatable {
  const SpotState(
      {this.step = SpotStep.partySize,
      this.status = LoadStatus.initial,
      this.party = 2,
      this.floor = FloorName.ground,
      this.tables = const [],
      this.selected,
      this.name = '',
      this.phone = '',
      this.note = '',
      this.validation,
      this.error,
      this.booking,
      this.preview = Preview.partyDefault,
      this.freePlan = true,
      this.showUpgrade = true});
  final SpotStep step;
  final LoadStatus status;
  final int party;
  final FloorName floor;
  final List<DiningTable> tables;
  final DiningTable? selected;
  final String name, phone, note;
  final String? validation, error;
  final SpotBooking? booking;
  final Preview preview;
  final bool freePlan, showUpgrade;
  bool get canGoTable => party >= 1 && party <= 12;
  bool get canGoGuest => selected != null && selected!.canFit(party);
  bool get validGuest =>
      name.trim().length >= 2 &&
      RegExp(r'^[6-9]\d{9}$').hasMatch(
          phone.replaceAll(RegExp(r'\D'), '').replaceFirst(RegExp(r'^91'), ''));
  List<DiningTable> get currentTables =>
      tables.where((t) => t.floor == floor).toList();
  @override
  List<Object?> get props => [
        step,
        status,
        party,
        floor,
        tables,
        selected,
        name,
        phone,
        note,
        validation,
        error,
        booking,
        preview,
        freePlan,
        showUpgrade
      ];
}
