import 'package:equatable/equatable.dart';
import 'package:host_stand/features/booking/data/models/booking_detail.dart';

enum BookingDetailPhase { initial, loading, ready, updating, failure }

class BookingDetailState extends Equatable {
  const BookingDetailState({
    this.phase = BookingDetailPhase.initial,
    this.bookingId = '',
    this.booking,
    this.previewStatus = BookingStatus.seated,
    this.errorMessage,
    this.successMessage,
  });

  final BookingDetailPhase phase;
  final String bookingId;
  final BookingDetail? booking;
  final BookingStatus previewStatus;
  final String? errorMessage;
  final String? successMessage;

  BookingDetailState copyWith({
    BookingDetailPhase? phase,
    String? bookingId,
    BookingDetail? booking,
    BookingStatus? previewStatus,
    String? errorMessage,
    String? successMessage,
    bool clearError = false,
    bool clearSuccess = false,
  }) =>
      BookingDetailState(
        phase: phase ?? this.phase,
        bookingId: bookingId ?? this.bookingId,
        booking: booking ?? this.booking,
        previewStatus: previewStatus ?? this.previewStatus,
        errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
        successMessage:
            clearSuccess ? null : successMessage ?? this.successMessage,
      );

  @override
  List<Object?> get props =>
      [phase, bookingId, booking, previewStatus, errorMessage, successMessage];
}
