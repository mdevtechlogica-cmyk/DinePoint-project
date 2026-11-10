import 'package:host_stand/features/booking/data/models/booking_detail.dart';

abstract interface class BookingDetailDataSource {
  Future<BookingDetail> fetchBooking(String bookingId);
  Future<BookingDetail> updateStatus(String bookingId, BookingStatus status);
}
