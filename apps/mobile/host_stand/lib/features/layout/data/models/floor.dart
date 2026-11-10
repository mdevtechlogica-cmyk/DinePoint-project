import 'package:equatable/equatable.dart';
import 'package:host_stand/features/layout/data/models/room.dart';

class FloorModel extends Equatable {
  const FloorModel(
      {required this.id,
      required this.name,
      required this.active,
      required this.rooms});
  final String id, name;
  final bool active;
  final List<RoomModel> rooms;
  int get tableCount => rooms.fold(0, (n, r) => n + r.tables.length);
  FloorModel copyWith({String? name, bool? active, List<RoomModel>? rooms}) =>
      FloorModel(
          id: id,
          name: name ?? this.name,
          active: active ?? this.active,
          rooms: rooms ?? this.rooms);
  @override
  List<Object?> get props => [id, name, active, rooms];
}
