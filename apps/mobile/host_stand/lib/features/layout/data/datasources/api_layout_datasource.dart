import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/api_exception.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/features/layout/data/models/floor.dart';
import 'package:host_stand/features/layout/data/models/layout.dart';
import 'package:host_stand/features/layout/data/models/room.dart';
import 'package:host_stand/features/layout/data/models/table.dart';
import 'package:host_stand/features/layout/data/models/table_draft.dart';

import 'layout_datasource.dart';

class ApiLayoutDataSource implements LayoutDataSource {
  ApiLayoutDataSource(this._api, this._session);

  final ApiClient _api;
  final SessionCache _session;
  LayoutData? _cache;

  String get _orgId {
    final id = _session.organizationId;
    if (id == null || id.isEmpty) {
      throw const ApiException('No organization selected.');
    }
    return id;
  }

  String get _restaurantId {
    final id = _session.restaurantId;
    if (id == null || id.isEmpty) {
      throw const ApiException('Select a restaurant first.');
    }
    return id;
  }

  String get _floorsBase =>
      '/organizations/$_orgId/restaurants/$_restaurantId/floors';
  String get _tablesBase =>
      '/organizations/$_orgId/restaurants/$_restaurantId/tables';

  @override
  Future<LayoutData> load() async {
    final floorsJson = await _api.getList(_floorsBase);
    final floors = floorsJson.whereType<Map>().map((raw) {
      final floor = Map<String, dynamic>.from(raw);
      final roomsJson = floor['rooms'] as List<dynamic>? ?? const [];
      final rooms = roomsJson.whereType<Map>().map((roomRaw) {
        final room = Map<String, dynamic>.from(roomRaw);
        final tablesJson = room['tables'] as List<dynamic>? ?? const [];
        final tables = tablesJson.whereType<Map>().map((tableRaw) {
          final table = Map<String, dynamic>.from(tableRaw);
          return TableModel(
            id: table['id'] as String,
            number: (table['tableNumber'] as num?)?.toInt() ?? 0,
            seats: (table['seats'] as num?)?.toInt() ?? 2,
            ac: table['isAc'] as bool? ?? false,
            family: table['isFamilyFriendly'] as bool? ?? false,
            active: table['isActive'] as bool? ?? true,
          );
        }).toList();
        return RoomModel(
          id: room['id'] as String,
          name: (room['name'] as String?) ?? 'Room',
          active: room['isActive'] as bool? ?? true,
          tables: tables,
        );
      }).toList();
      return FloorModel(
        id: floor['id'] as String,
        name: (floor['name'] as String?) ?? 'Floor',
        active: floor['isActive'] as bool? ?? true,
        rooms: rooms,
      );
    }).toList();

    final selectedFloorId = floors.isNotEmpty
        ? floors.firstWhere((f) => f.active, orElse: () => floors.first).id
        : '';
    final selectedFloor = floors.cast<FloorModel?>().firstWhere(
          (f) => f?.id == selectedFloorId,
          orElse: () => floors.isEmpty ? null : floors.first,
        );
    final selectedRoomId = selectedFloor != null &&
            selectedFloor.rooms.isNotEmpty
        ? selectedFloor.rooms
            .firstWhere((r) => r.active, orElse: () => selectedFloor.rooms.first)
            .id
        : '';

    _cache = LayoutData(
      floors: floors,
      selectedFloorId: selectedFloorId,
      selectedRoomId: selectedRoomId,
    );
    return _cache!;
  }

  @override
  Future<LayoutData> saveTable(
    String floorId,
    String roomId,
    TableDraft draft,
  ) async {
    final number = int.tryParse(draft.numberText.trim());
    if (number == null || number < 1) {
      throw Exception('Enter a valid table number.');
    }
    if (draft.seats < 1 || draft.seats > 20) {
      throw Exception('Seats must be between 1 and 20.');
    }

    if (draft.id == null) {
      await _api.post(
        _tablesBase,
        body: {
          'tableNumber': number,
          'seats': draft.seats,
          'floorId': floorId,
          'roomId': roomId,
          'isAc': draft.ac,
          'isFamilyFriendly': draft.family,
        },
      );
    } else {
      await _api.patch(
        '$_tablesBase/${draft.id}',
        body: {
          'tableNumber': number,
          'seats': draft.seats,
          'floorId': floorId,
          'roomId': roomId,
          'isAc': draft.ac,
          'isFamilyFriendly': draft.family,
          'isActive': draft.active,
        },
      );
    }

    return load();
  }

  @override
  Future<LayoutData> createFloor(String name) async {
    final trimmed = name.trim();
    if (trimmed.isEmpty) throw Exception('Enter a floor name.');
    await _api.post(_floorsBase, body: {'name': trimmed});
    return load();
  }

  @override
  Future<LayoutData> createFloorWithRoom({
    required String floorName,
    required String roomName,
  }) async {
    final floor = floorName.trim();
    final room = roomName.trim();
    if (floor.isEmpty) throw Exception('Enter a floor name.');
    if (room.isEmpty) throw Exception('Enter a room name.');
    final created = await _api.post(_floorsBase, body: {'name': floor});
    final floorId = created['id'] as String?;
    if (floorId == null || floorId.isEmpty) {
      throw Exception('Floor was created but no id was returned.');
    }
    await _api.post(
      '$_floorsBase/$floorId/rooms',
      body: {'name': room},
    );
    return load();
  }

  @override
  Future<LayoutData> renameFloor(String floorId, String name) async {
    final trimmed = name.trim();
    if (trimmed.isEmpty) throw Exception('Enter a floor name.');
    await _api.patch(
      '$_floorsBase/$floorId',
      body: {'name': trimmed},
    );
    return load();
  }

  @override
  Future<LayoutData> deactivateFloor(String floorId) async {
    await _api.patch(
      '$_floorsBase/$floorId',
      body: {'isActive': false},
    );
    return load();
  }

  @override
  Future<LayoutData> createRoom(String floorId, String name) async {
    final trimmed = name.trim();
    if (trimmed.isEmpty) throw Exception('Enter a room name.');
    await _api.post(
      '$_floorsBase/$floorId/rooms',
      body: {'name': trimmed},
    );
    return load();
  }

  @override
  Future<LayoutData> renameRoom(
    String floorId,
    String roomId,
    String name,
  ) async {
    final trimmed = name.trim();
    if (trimmed.isEmpty) throw Exception('Enter a room name.');
    await _api.patch(
      '$_floorsBase/$floorId/rooms/$roomId',
      body: {'name': trimmed},
    );
    return load();
  }

  @override
  Future<LayoutData> deactivateRoom(String floorId, String roomId) async {
    await _api.patch(
      '$_floorsBase/$floorId/rooms/$roomId',
      body: {'isActive': false},
    );
    return load();
  }
}
