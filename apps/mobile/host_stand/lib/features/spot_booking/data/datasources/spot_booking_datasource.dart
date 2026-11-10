import 'package:host_stand/features/spot_booking/data/models/dining_table.dart';
import 'package:host_stand/features/spot_booking/data/models/spot_booking.dart';
import 'package:host_stand/features/spot_booking/data/models/spot_guest.dart';

abstract interface class SpotBookingDataSource {
  Future<List<DiningTable>> fetchTables();
  Future<SpotBooking> seatGuest({
    required SpotGuest guest,
    required int partySize,
    required DiningTable table,
  });
}
