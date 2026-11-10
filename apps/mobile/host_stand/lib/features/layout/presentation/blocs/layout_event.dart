import 'package:equatable/equatable.dart';
import 'package:host_stand/features/layout/data/models/table.dart';
import 'package:host_stand/features/layout/data/models/table_draft.dart';

sealed class LayoutEvent extends Equatable {
  const LayoutEvent();
  @override
  List<Object?> get props => [];
}

class LayoutStarted extends LayoutEvent {
  const LayoutStarted();
}

class SelectFloor extends LayoutEvent {
  const SelectFloor(this.id);
  final String id;
  @override
  List<Object?> get props => [id];
}

class SelectRoom extends LayoutEvent {
  const SelectRoom(this.id, {this.floorId});
  final String id;
  final String? floorId;
  @override
  List<Object?> get props => [id, floorId];
}

class OpenTableForm extends LayoutEvent {
  const OpenTableForm({this.table});
  final TableModel? table;
  @override
  List<Object?> get props => [table];
}

class DraftChanged extends LayoutEvent {
  const DraftChanged(this.draft);
  final TableDraft draft;
  @override
  List<Object?> get props => [draft];
}

class SaveTable extends LayoutEvent {
  const SaveTable();
}

class CreateFloorRequested extends LayoutEvent {
  const CreateFloorRequested(this.name);
  final String name;
  @override
  List<Object?> get props => [name];
}

class CreateFloorWithRoomRequested extends LayoutEvent {
  const CreateFloorWithRoomRequested({
    required this.floorName,
    required this.roomName,
  });
  final String floorName;
  final String roomName;
  @override
  List<Object?> get props => [floorName, roomName];
}

class RenameFloorRequested extends LayoutEvent {
  const RenameFloorRequested({required this.floorId, required this.name});
  final String floorId;
  final String name;
  @override
  List<Object?> get props => [floorId, name];
}

class DeactivateFloor extends LayoutEvent {
  const DeactivateFloor(this.floorId);
  final String floorId;
  @override
  List<Object?> get props => [floorId];
}

class CreateRoomRequested extends LayoutEvent {
  const CreateRoomRequested(this.name, {this.floorId});
  final String name;
  final String? floorId;
  @override
  List<Object?> get props => [name, floorId];
}

class RenameRoomRequested extends LayoutEvent {
  const RenameRoomRequested({
    required this.roomId,
    required this.name,
    this.floorId,
  });
  final String roomId;
  final String name;
  final String? floorId;
  @override
  List<Object?> get props => [roomId, name, floorId];
}

class DeactivateRoom extends LayoutEvent {
  const DeactivateRoom(this.roomId, {this.floorId});
  final String roomId;
  final String? floorId;
  @override
  List<Object?> get props => [roomId, floorId];
}
