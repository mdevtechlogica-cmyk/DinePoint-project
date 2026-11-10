import 'package:host_stand/features/booking/data/models/booking_detail.dart'
    as detail;
import 'package:host_stand/features/dashboard/domain/entities/booking.dart';
import 'package:host_stand/features/dashboard/domain/entities/dashboard_enums.dart';
import 'package:host_stand/features/employee/data/models/employee.dart';
import 'package:host_stand/features/spot_booking/data/models/dining_table.dart';

String formatClock(DateTime value) {
  final local = value.toLocal();
  final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
  final minute = local.minute.toString().padLeft(2, '0');
  final suffix = local.hour >= 12 ? 'PM' : 'AM';
  return '$hour:$minute $suffix';
}

BookingStatus mapDashboardStatus(String raw) {
  switch (raw.toUpperCase()) {
    case 'PENDING':
    case 'CONFIRMED':
      return BookingStatus.pending;
    case 'SEATED':
      return BookingStatus.seated;
    case 'COMPLETED':
      return BookingStatus.completed;
    case 'CANCELLED':
    case 'REJECTED':
      return BookingStatus.cancelled;
    case 'NO_SHOW':
      return BookingStatus.noShow;
    default:
      return BookingStatus.pending;
  }
}

detail.BookingStatus mapDetailStatus(String raw) {
  switch (raw.toUpperCase()) {
    case 'SEATED':
      return detail.BookingStatus.seated;
    case 'COMPLETED':
      return detail.BookingStatus.completed;
    case 'CANCELLED':
    case 'REJECTED':
      return detail.BookingStatus.cancelled;
    case 'NO_SHOW':
      return detail.BookingStatus.noShow;
    default:
      // Host detail UI has no pending; treat reserved as seated-ready.
      return detail.BookingStatus.seated;
  }
}

String toApiReservationStatus(detail.BookingStatus status) {
  return switch (status) {
    detail.BookingStatus.seated => 'SEATED',
    detail.BookingStatus.completed => 'COMPLETED',
    detail.BookingStatus.cancelled => 'CANCELLED',
    detail.BookingStatus.noShow => 'NO_SHOW',
  };
}

EmployeeRole mapEmployeeRole(String raw) {
  switch (raw.toUpperCase()) {
    case 'OWNER':
      return EmployeeRole.owner;
    case 'ADMIN':
      return EmployeeRole.admin;
    case 'MANAGER':
      return EmployeeRole.manager;
    default:
      return EmployeeRole.staff;
  }
}

String toApiEmployeeRole(EmployeeRole role) {
  return switch (role) {
    EmployeeRole.owner => 'OWNER',
    EmployeeRole.admin => 'ADMIN',
    EmployeeRole.manager => 'MANAGER',
    EmployeeRole.staff => 'STAFF',
  };
}

FloorName mapFloorName(String? raw) {
  final value = (raw ?? '').toLowerCase();
  if (value.contains('roof') || value.contains('sky')) {
    return FloorName.rooftop;
  }
  if (value.contains('first') || value.contains('1') || value.contains('upper')) {
    return FloorName.firstFloor;
  }
  return FloorName.ground;
}

Map<String, dynamic>? firstTable(Map<String, dynamic> reservation) {
  final tables = reservation['tables'];
  if (tables is! List || tables.isEmpty) return null;
  final first = tables.first;
  if (first is! Map) return null;
  final table = first['table'];
  if (table is Map<String, dynamic>) return table;
  if (table is Map) return Map<String, dynamic>.from(table);
  return null;
}

Booking bookingFromReservation(Map<String, dynamic> json) {
  final startsAt = DateTime.parse(json['startsAt'] as String);
  final table = firstTable(json);
  final tableNumber = table?['tableNumber'];
  return Booking(
    id: json['id'] as String,
    guestName: (json['guestName'] as String?) ?? 'Guest',
    phone: (json['guestPhone'] as String?) ?? '',
    partySize: (json['guestCount'] as num?)?.toInt() ?? 1,
    table: tableNumber == null ? 'No table' : 'Table $tableNumber',
    time: formatClock(startsAt),
    status: mapDashboardStatus((json['status'] as String?) ?? 'PENDING'),
    date: DateTime(startsAt.year, startsAt.month, startsAt.day),
  );
}

detail.BookingDetail bookingDetailFromReservation(Map<String, dynamic> json) {
  final startsAt = DateTime.parse(json['startsAt'] as String);
  final table = firstTable(json);
  final floor = table?['floor'];
  final room = table?['room'];
  final createdBy = json['createdBy'];
  final assignedBy = createdBy is Map && createdBy['name'] is String
      ? createdBy['name'] as String
      : 'Host stand';
  final assignedAtRaw = json['updatedAt'] ?? json['createdAt'];
  final assignedAt = assignedAtRaw is String
      ? DateTime.parse(assignedAtRaw)
      : startsAt;

  return detail.BookingDetail(
    id: json['id'] as String,
    reference: '#${(json['bookingCode'] as String?) ?? json['id']}',
    guestName: (json['guestName'] as String?) ?? 'Guest',
    phone: (json['guestPhone'] as String?) ?? '',
    partySize: (json['guestCount'] as num?)?.toInt() ?? 1,
    floor: floor is Map && floor['name'] is String
        ? floor['name'] as String
        : 'Floor',
    room: room is Map && room['name'] is String
        ? room['name'] as String
        : (table?['roomName'] as String?) ?? 'Room',
    tableNumber: (table?['tableNumber'] as num?)?.toInt() ?? 0,
    reservedTime: startsAt.toLocal(),
    status: mapDetailStatus((json['status'] as String?) ?? 'SEATED'),
    guestNote: (json['specialRequests'] as String?) ?? '',
    assignedBy: assignedBy,
    assignedAt: assignedAt.toLocal(),
    terminalId: 'HOST-STAND',
  );
}

EmployeeModel employeeFromApi(Map<String, dynamic> json) {
  return EmployeeModel(
    id: json['id'] as String,
    name: (json['name'] as String?) ?? '',
    email: (json['email'] as String?) ?? '',
    phone: (json['phone'] as String?) ?? '',
    role: mapEmployeeRole((json['role'] as String?) ?? 'STAFF'),
    active: json['isActive'] as bool? ?? true,
  );
}
