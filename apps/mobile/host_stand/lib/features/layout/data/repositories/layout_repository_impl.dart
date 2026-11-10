import 'package:host_stand/features/layout/data/datasources/layout_datasource.dart';
import 'package:host_stand/features/layout/data/models/layout.dart';
import 'package:host_stand/features/layout/data/models/table_draft.dart';
import 'package:host_stand/features/layout/domain/repositories/layout_repository.dart';

class LayoutRepositoryImpl implements LayoutRepository {
  const LayoutRepositoryImpl(this.source);
  final LayoutDataSource source;

  @override
  Future<LayoutData> getLayout() => source.load();

  @override
  Future<LayoutData> saveTable(String f, String r, TableDraft d) =>
      source.saveTable(f, r, d);

  @override
  Future<LayoutData> createFloor(String name) => source.createFloor(name);

  @override
  Future<LayoutData> createFloorWithRoom({
    required String floorName,
    required String roomName,
  }) =>
      source.createFloorWithRoom(floorName: floorName, roomName: roomName);

  @override
  Future<LayoutData> renameFloor(String floorId, String name) =>
      source.renameFloor(floorId, name);

  @override
  Future<LayoutData> deactivateFloor(String f) => source.deactivateFloor(f);

  @override
  Future<LayoutData> createRoom(String floorId, String name) =>
      source.createRoom(floorId, name);

  @override
  Future<LayoutData> renameRoom(String floorId, String roomId, String name) =>
      source.renameRoom(floorId, roomId, name);

  @override
  Future<LayoutData> deactivateRoom(String f, String r) =>
      source.deactivateRoom(f, r);
}
