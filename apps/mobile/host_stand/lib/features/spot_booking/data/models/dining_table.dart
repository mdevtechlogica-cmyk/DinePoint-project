import 'package:equatable/equatable.dart';

enum FloorName { ground, firstFloor, rooftop }

extension FloorLabel on FloorName {
  String get label => switch (this) {
        FloorName.ground => 'Ground',
        FloorName.firstFloor => 'First floor',
        FloorName.rooftop => 'Rooftop'
      };
}

enum TableAvailability { free, busy }

enum SpotStep { partySize, chooseTable, guestDetails, success }

enum LoadStatus { initial, loading, ready, seating, failure }

enum Preview {
  partyDefault,
  partyEight,
  partyDisabled,
  tableDefault,
  tableFour,
  tableAllBusy,
  tableEmpty,
  tableLoading,
  guestEmpty,
  guestFilled,
  guestValidation,
  guestSeating,
  successFree,
  successPaid
}

class DiningTable extends Equatable {
  const DiningTable(
      {required this.id,
      required this.number,
      required this.seats,
      required this.floor,
      required this.room,
      required this.availability,
      this.hasAc = false,
      this.family = false,
      this.tag = '',
      this.busyNote = ''});
  final String id, room, tag, busyNote;
  final int number, seats;
  final FloorName floor;
  final TableAvailability availability;
  final bool hasAc, family;
  bool canFit(int party) =>
      availability == TableAvailability.free && seats >= party;
  factory DiningTable.fromJson(Map<String, dynamic> j) => DiningTable(
      id: j['id'],
      number: j['number'],
      seats: j['seats'],
      floor: FloorName.values.byName(j['floor']),
      room: j['room'],
      availability: TableAvailability.values.byName(j['availability']),
      hasAc: j['hasAc'] ?? false,
      family: j['family'] ?? false,
      tag: j['tag'] ?? '',
      busyNote: j['busyNote'] ?? '');
  Map<String, dynamic> toJson() => {
        'id': id,
        'number': number,
        'seats': seats,
        'floor': floor.name,
        'room': room,
        'availability': availability.name,
        'hasAc': hasAc,
        'family': family,
        'tag': tag,
        'busyNote': busyNote
      };
  @override
  List<Object?> get props => [
        id,
        number,
        seats,
        floor,
        room,
        availability,
        hasAc,
        family,
        tag,
        busyNote
      ];
}
