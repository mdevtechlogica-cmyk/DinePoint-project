

import 'package:host_stand/features/booking/data/models/booking_detail.dart';

abstract interface class BookingDetailRepository {
  Future<BookingDetail> getBooking(String bookingId);
  Future<BookingDetail> changeStatus(String bookingId, BookingStatus status);
}