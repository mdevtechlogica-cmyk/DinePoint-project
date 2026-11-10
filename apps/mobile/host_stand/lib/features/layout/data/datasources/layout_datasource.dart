import 'package:host_stand/features/layout/data/models/layout.dart';
import 'package:host_stand/features/layout/data/models/table_draft.dart';

abstract interface class LayoutDataSource {
  Future<LayoutData> load();
  Future<LayoutData> saveTable(String floorId, String roomId, TableDraft draft);
  Future<LayoutData> createFloor(String name);
  Future<LayoutData> createFloorWithRoom({
    required String floorName,
    required String roomName,
  });
  Future<LayoutData> renameFloor(String floorId, String name);
  Future<LayoutData> deactivateFloor(String floorId);
  Future<LayoutData> createRoom(String floorId, String name);
  Future<LayoutData> renameRoom(String floorId, String roomId, String name);
  Future<LayoutData> deactivateRoom(String floorId, String roomId);
}
