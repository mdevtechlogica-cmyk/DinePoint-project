import 'package:equatable/equatable.dart';
import 'dining_table.dart';
import 'spot_guest.dart';

class SpotBooking extends Equatable {
  const SpotBooking(
      {required this.id,
      required this.guest,
      required this.partySize,
      required this.table,
      required this.seatedAt});
  final String id;
  final SpotGuest guest;
  final int partySize;
  final DiningTable table;
  final DateTime seatedAt;
  factory SpotBooking.fromJson(Map<String, dynamic> j) => SpotBooking(
      id: j['id'],
      guest: SpotGuest.fromJson(j['guest']),
      partySize: j['partySize'],
      table: DiningTable.fromJson(j['table']),
      seatedAt: DateTime.parse(j['seatedAt']));
  Map<String, dynamic> toJson() => {
        'id': id,
        'guest': guest.toJson(),
        'partySize': partySize,
        'table': table.toJson(),
        'seatedAt': seatedAt.toIso8601String()
      };
  @override
  List<Object?> get props => [id, guest, partySize, table, seatedAt];
}
