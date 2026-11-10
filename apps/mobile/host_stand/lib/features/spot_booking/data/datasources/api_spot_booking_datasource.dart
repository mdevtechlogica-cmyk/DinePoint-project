import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/api_exception.dart';
import 'package:host_stand/core/api_mappers.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/features/spot_booking/data/models/dining_table.dart';
import 'package:host_stand/features/spot_booking/data/models/spot_booking.dart';
import 'package:host_stand/features/spot_booking/data/models/spot_guest.dart';

import 'spot_booking_datasource.dart';

class ApiSpotBookingDataSource implements SpotBookingDataSource {
  ApiSpotBookingDataSource(this._api, this._session);

  final ApiClient _api;
  final SessionCache _session;

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

  @override
  Future<List<DiningTable>> fetchTables() async {
    final tables = await _api.getList(
      '/organizations/$_orgId/restaurants/$_restaurantId/tables',
    );

    final now = DateTime.now();
    final start = DateTime(now.year, now.month, now.day);
    final end = start.add(const Duration(days: 1));
    final seated = await _api.getList(
      '/organizations/$_orgId/restaurants/$_restaurantId/reservations',
      query: {
        'from': start.toUtc().toIso8601String(),
        'to': end.toUtc().toIso8601String(),
        'status': 'SEATED',
      },
    );

    final busyTableIds = <String>{};
    for (final raw in seated.whereType<Map>()) {
      final reservation = Map<String, dynamic>.from(raw);
      final table = firstTable(reservation);
      final id = table?['id'];
      if (id is String) busyTableIds.add(id);
    }

    return tables
        .whereType<Map>()
        .map((raw) => Map<String, dynamic>.from(raw))
        .where((json) => json['isActive'] as bool? ?? true)
        .map((json) {
      final floor = json['floor'];
      final room = json['room'];
      final floorName = floor is Map && floor['name'] is String
          ? floor['name'] as String
          : null;
      final roomName = room is Map && room['name'] is String
          ? room['name'] as String
          : (json['roomName'] as String?) ?? 'Room';
      final id = json['id'] as String;
      final busy = busyTableIds.contains(id);
      return DiningTable(
        id: id,
        number: (json['tableNumber'] as num?)?.toInt() ?? 0,
        seats: (json['seats'] as num?)?.toInt() ?? 2,
        floor: mapFloorName(floorName),
        room: roomName,
        availability:
            busy ? TableAvailability.busy : TableAvailability.free,
        hasAc: json['isAc'] as bool? ?? false,
        family: json['isFamilyFriendly'] as bool? ?? false,
        busyNote: busy ? 'Seated' : '',
      );
    }).where((t) => t.number > 0).toList();
  }

  @override
  Future<SpotBooking> seatGuest({
    required SpotGuest guest,
    required int partySize,
    required DiningTable table,
  }) async {
    if (!table.canFit(partySize)) {
      throw Exception('Table is no longer available or too small.');
    }

    final json = await _api.post(
      '/organizations/$_orgId/restaurants/$_restaurantId/reservations',
      body: {
        'guestName': guest.name.trim(),
        'guestPhone': guest.phone.trim(),
        'guestCount': partySize,
        'tableId': table.id,
        if (guest.note.trim().isNotEmpty)
          'specialRequests': guest.note.trim(),
      },
    );

    final seatedAt = json['startsAt'] is String
        ? DateTime.parse(json['startsAt'] as String).toLocal()
        : DateTime.now();

    return SpotBooking(
      id: json['id'] as String,
      guest: guest,
      partySize: partySize,
      table: DiningTable(
        id: table.id,
        number: table.number,
        seats: table.seats,
        floor: table.floor,
        room: table.room,
        availability: TableAvailability.busy,
        hasAc: table.hasAc,
        family: table.family,
        tag: table.tag,
        busyNote: 'Just seated',
      ),
      seatedAt: seatedAt,
    );
  }
}
