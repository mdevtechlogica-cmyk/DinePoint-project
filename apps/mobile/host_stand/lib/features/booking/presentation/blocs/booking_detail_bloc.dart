import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/features/booking/data/models/booking_detail.dart';
import 'package:host_stand/features/booking/domain/repositories/booking_repository.dart';
import 'package:host_stand/features/booking/presentation/blocs/booking_detail_event.dart';
import 'package:host_stand/features/booking/presentation/blocs/booking_detail_state.dart';

class BookingDetailBloc extends Bloc<BookingDetailEvent, BookingDetailState> {
  BookingDetailBloc(this.repository, {required String bookingId})
      : super(BookingDetailState(bookingId: bookingId)) {
    on<BookingDetailStarted>(_onStarted);
    on<BookingDetailRetryRequested>(_load);
    on<BookingStatusPreviewSelected>((event, emit) {
      final current = state.booking;
      emit(
        state.copyWith(
          previewStatus: event.status,
          booking:
              current == null ? null : current.copyWith(status: event.status),
          phase: BookingDetailPhase.ready,
          clearError: true,
          clearSuccess: true,
        ),
      );
    });
    on<BookingStatusActionRequested>(_changeStatus);
  }

  final BookingDetailRepository repository;

  Future<void> _onStarted(
    BookingDetailStarted event,
    Emitter<BookingDetailState> emit,
  ) async {
    emit(state.copyWith(bookingId: event.bookingId));
    await _load(event, emit);
  }

  Future<void> _load(
    BookingDetailEvent event,
    Emitter<BookingDetailState> emit,
  ) async {
    emit(
      state.copyWith(
        phase: BookingDetailPhase.loading,
        clearError: true,
        clearSuccess: true,
      ),
    );
    try {
      final booking = await repository.getBooking(state.bookingId);
      emit(
        state.copyWith(
          phase: BookingDetailPhase.ready,
          booking: booking,
          previewStatus: booking.status,
          clearError: true,
        ),
      );
    } catch (_) {
      emit(
        state.copyWith(
          phase: BookingDetailPhase.failure,
          errorMessage: 'Could not load booking details. Please retry.',
        ),
      );
    }
  }

  Future<void> _changeStatus(
    BookingStatusActionRequested event,
    Emitter<BookingDetailState> emit,
  ) async {
    emit(
      state.copyWith(
        phase: BookingDetailPhase.updating,
        clearError: true,
        clearSuccess: true,
      ),
    );
    try {
      final booking =
          await repository.changeStatus(state.bookingId, event.status);
      emit(
        state.copyWith(
          phase: BookingDetailPhase.ready,
          booking: booking,
          previewStatus: booking.status,
          successMessage: 'Booking marked ${event.status.label.toLowerCase()}.',
        ),
      );
    } catch (_) {
      emit(
        state.copyWith(
          phase: BookingDetailPhase.ready,
          errorMessage:
              'The booking status could not be updated. Please try again.',
        ),
      );
    }
  }
}
