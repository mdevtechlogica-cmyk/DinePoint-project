import 'package:host_stand/features/spot_booking/data/datasources/spot_booking_datasource.dart';
import 'package:host_stand/features/spot_booking/data/models/dining_table.dart';
import 'package:host_stand/features/spot_booking/data/models/spot_booking.dart';
import 'package:host_stand/features/spot_booking/data/models/spot_guest.dart';
import 'package:host_stand/features/spot_booking/domain/repositories/spot_booking_repository.dart';

class SpotBookingRepositoryImpl implements SpotBookingRepository {
  const SpotBookingRepositoryImpl(this.source);
  final SpotBookingDataSource source;
  @override
  Future<List<DiningTable>> getTables() => source.fetchTables();
  @override
  Future<SpotBooking> seatGuest(
          {required SpotGuest guest,
          required int partySize,
          required DiningTable table}) =>
      source.seatGuest(guest: guest, partySize: partySize, table: table);
}
