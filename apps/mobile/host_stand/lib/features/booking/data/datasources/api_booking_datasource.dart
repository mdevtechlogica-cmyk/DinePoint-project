import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/api_exception.dart';
import 'package:host_stand/core/api_mappers.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/features/booking/data/models/booking_detail.dart';

import 'booking_datasource.dart';

class ApiBookingDetailDataSource implements BookingDetailDataSource {
  ApiBookingDetailDataSource(this._api, this._session);

  final ApiClient _api;
  final SessionCache _session;

  String get _base {
    final orgId = _session.organizationId;
    final restaurantId = _session.restaurantId;
    if (orgId == null ||
        orgId.isEmpty ||
        restaurantId == null ||
        restaurantId.isEmpty) {
      throw const ApiException('Select a restaurant first.');
    }
    return '/organizations/$orgId/restaurants/$restaurantId/reservations';
  }

  @override
  Future<BookingDetail> fetchBooking(String bookingId) async {
    final json = await _api.get('$_base/$bookingId');
    return bookingDetailFromReservation(json);
  }

  @override
  Future<BookingDetail> updateStatus(
    String bookingId,
    BookingStatus status,
  ) async {
    final json = await _api.patch(
      '$_base/$bookingId/status',
      body: {'status': toApiReservationStatus(status)},
    );
    return bookingDetailFromReservation(json);
  }
}
