import 'package:equatable/equatable.dart';
import 'package:host_stand/features/layout/data/models/floor.dart';
import 'package:host_stand/features/layout/data/models/room.dart';

class LayoutData extends Equatable {
  const LayoutData({required this.floors,required this.selectedFloorId,required this.selectedRoomId});
  final List<FloorModel> floors; final String selectedFloorId,selectedRoomId;
  FloorModel get floor => floors.firstWhere((f)=>f.id==selectedFloorId);
  RoomModel get room => floor.rooms.firstWhere((r)=>r.id==selectedRoomId);
  @override List<Object?> get props => [floors,selectedFloorId,selectedRoomId];
}
enum LayoutPage { floors, rooms, tables, form }
enum PreviewState { owner, empty, loading, failed, addSheet, deactivate, staff, inactive, addEmpty, addFilled, edit, validation, saving, saved }