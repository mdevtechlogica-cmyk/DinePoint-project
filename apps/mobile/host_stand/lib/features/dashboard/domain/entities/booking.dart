import 'package:equatable/equatable.dart';

import 'dashboard_enums.dart';

class Booking extends Equatable {
  const Booking({
    required this.id,
    required this.guestName,
    required this.phone,
    required this.partySize,
    required this.table,
    required this.time,
    required this.status,
    required this.date,
  });

  final String id;
  final String guestName;
  final String phone;
  final String table;
  final String time;
  final int partySize;
  final BookingStatus status;
  final DateTime date;

  factory Booking.fromJson(Map<String, dynamic> json) => Booking(
        id: json['id'] as String,
        guestName: json['guestName'] as String,
        phone: json['phone'] as String,
        partySize: json['partySize'] as int,
        table: json['table'] as String,
        time: json['time'] as String,
        status: BookingStatus.values
            .firstWhere((e) => e.name == json['status']),
        date: DateTime.parse(json['date'] as String),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'guestName': guestName,
        'phone': phone,
        'partySize': partySize,
        'table': table,
        'time': time,
        'status': status.name,
        'date': date.toIso8601String(),
      };

  @override
  List<Object?> get props =>
      [id, guestName, phone, partySize, table, time, status, date];
}
