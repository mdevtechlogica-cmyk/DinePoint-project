import 'package:equatable/equatable.dart';

enum BookingStatus { seated, completed, cancelled, noShow }
extension BookingStatusLabel on BookingStatus {
  String get label => switch (this) {
    BookingStatus.seated => 'Seated',
    BookingStatus.completed => 'Completed',
    BookingStatus.cancelled => 'Cancelled',
    BookingStatus.noShow => 'No-show',
  };
}

class BookingDetail extends Equatable {
  const BookingDetail({
    required this.id,
    required this.reference,
    required this.guestName,
    required this.phone,
    required this.partySize,
    required this.floor,
    required this.room,
    required this.tableNumber,
    required this.reservedTime,
    required this.status,
    required this.guestNote,
    required this.assignedBy,
    required this.assignedAt,
    required this.terminalId,
  });

  final String id;
  final String reference;
  final String guestName;
  final String phone;
  final int partySize;
  final String floor;
  final String room;
  final int tableNumber;
  final DateTime reservedTime;
  final BookingStatus status;
  final String guestNote;
  final String assignedBy;
  final DateTime assignedAt;
  final String terminalId;

  BookingDetail copyWith({BookingStatus? status}) => BookingDetail(
    id: id,
    reference: reference,
    guestName: guestName,
    phone: phone,
    partySize: partySize,
    floor: floor,
    room: room,
    tableNumber: tableNumber,
    reservedTime: reservedTime,
    status: status ?? this.status,
    guestNote: guestNote,
    assignedBy: assignedBy,
    assignedAt: assignedAt,
    terminalId: terminalId,
  );

  factory BookingDetail.fromJson(Map<String, dynamic> json) => BookingDetail(
    id: json['id'] as String,
    reference: json['reference'] as String,
    guestName: json['guestName'] as String,
    phone: json['phone'] as String,
    partySize: json['partySize'] as int,
    floor: json['floor'] as String,
    room: json['room'] as String,
    tableNumber: json['tableNumber'] as int,
    reservedTime: DateTime.parse(json['reservedTime'] as String),
    status: BookingStatus.values.firstWhere((e) => e.name == json['status']),
    guestNote: json['guestNote'] as String,
    assignedBy: json['assignedBy'] as String,
    assignedAt: DateTime.parse(json['assignedAt'] as String),
    terminalId: json['terminalId'] as String,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'reference': reference,
    'guestName': guestName,
    'phone': phone,
    'partySize': partySize,
    'floor': floor,
    'room': room,
    'tableNumber': tableNumber,
    'reservedTime': reservedTime.toIso8601String(),
    'status': status.name,
    'guestNote': guestNote,
    'assignedBy': assignedBy,
    'assignedAt': assignedAt.toIso8601String(),
    'terminalId': terminalId,
  };

  @override
  List<Object?> get props => [
    id, reference, guestName, phone, partySize, floor, room, tableNumber,
    reservedTime, status, guestNote, assignedBy, assignedAt, terminalId,
  ];
}
