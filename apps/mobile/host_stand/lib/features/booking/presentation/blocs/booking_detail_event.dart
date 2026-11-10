import 'package:equatable/equatable.dart';
import 'package:host_stand/features/booking/data/models/booking_detail.dart';

sealed class BookingDetailEvent extends Equatable {
  const BookingDetailEvent();

  @override
  List<Object?> get props => [];
}

class BookingDetailStarted extends BookingDetailEvent {
  const BookingDetailStarted({required this.bookingId});

  final String bookingId;

  @override
  List<Object?> get props => [bookingId];
}

class BookingStatusPreviewSelected extends BookingDetailEvent {
  const BookingStatusPreviewSelected(this.status);

  final BookingStatus status;

  @override
  List<Object?> get props => [status];
}

class BookingStatusActionRequested extends BookingDetailEvent {
  const BookingStatusActionRequested(this.status);

  final BookingStatus status;

  @override
  List<Object?> get props => [status];
}

class BookingDetailRetryRequested extends BookingDetailEvent {
  const BookingDetailRetryRequested();
}
