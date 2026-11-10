import 'package:host_stand/features/booking/data/datasources/booking_datasource.dart';
import 'package:host_stand/features/booking/data/models/booking_detail.dart';
import 'package:host_stand/features/booking/domain/repositories/booking_repository.dart';

class BookingDetailRepositoryImpl implements BookingDetailRepository {
  const BookingDetailRepositoryImpl(this.dataSource);
  final BookingDetailDataSource dataSource;

  @override
  Future<BookingDetail> getBooking(String bookingId) => dataSource.fetchBooking(bookingId);

  @override
  Future<BookingDetail> changeStatus(String bookingId, BookingStatus status) =>
      dataSource.updateStatus(bookingId, status);
}