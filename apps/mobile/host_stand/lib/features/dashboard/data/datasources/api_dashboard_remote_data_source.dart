import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/api_exception.dart';
import 'package:host_stand/core/api_mappers.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/features/dashboard/domain/entities/booking.dart';
import 'package:host_stand/features/dashboard/domain/entities/booking_report.dart';
import 'package:host_stand/features/dashboard/domain/entities/dashboard_enums.dart';
import 'package:host_stand/features/dashboard/domain/entities/restaurant_profile.dart';

import 'dashboard_remote_data_source.dart';

class ApiDashboardRemoteDataSource implements DashboardRemoteDataSource {
  ApiDashboardRemoteDataSource(this._api, this._session);

  final ApiClient _api;
  final SessionCache _session;

  String get _orgId {
    final id = _session.organizationId;
    if (id == null || id.isEmpty) {
      throw const ApiException('No organization selected.');
    }
    return id;
  }

  String get _restaurantId {
    final id = _session.restaurantId;
    if (id == null || id.isEmpty) {
      throw const ApiException('Select a restaurant first.');
    }
    return id;
  }

  String get _base =>
      '/organizations/$_orgId/restaurants/$_restaurantId/reservations';

  @override
  Future<List<Booking>> fetchToday() async {
    final now = DateTime.now();
    final start = DateTime(now.year, now.month, now.day);
    final end = start.add(const Duration(days: 1));
    final list = await _api.getList(
      _base,
      query: {
        'from': start.toUtc().toIso8601String(),
        'to': end.toUtc().toIso8601String(),
      },
    );
    return list
        .whereType<Map>()
        .map((raw) => bookingFromReservation(Map<String, dynamic>.from(raw)))
        .toList();
  }

  @override
  Future<List<Booking>> fetchHistory({DateTime? from, DateTime? to}) async {
    final now = DateTime.now();
    final endDay = to == null
        ? DateTime(now.year, now.month, now.day)
        : DateTime(to.year, to.month, to.day);
    final startDay = from == null
        ? endDay.subtract(const Duration(days: 30))
        : DateTime(from.year, from.month, from.day);
    // Inclusive end day → exclusive next midnight for API range.
    final endExclusive = endDay.add(const Duration(days: 1));
    final list = await _api.getList(
      _base,
      query: {
        'from': startDay.toUtc().toIso8601String(),
        'to': endExclusive.toUtc().toIso8601String(),
      },
    );
    return list
        .whereType<Map>()
        .map((raw) => bookingFromReservation(Map<String, dynamic>.from(raw)))
        .toList();
  }

  @override
  Future<RestaurantProfile> fetchProfile() async {
    final json = await _api.get(
      '/organizations/$_orgId/restaurants/$_restaurantId',
    );
    final user = _session.currentUser;
    return RestaurantProfile(
      name: (json['name'] as String?) ??
          _session.restaurantName ??
          'Restaurant',
      address: (json['addressLine1'] as String?) ?? '',
      area: (json['area'] as String?) ?? '',
      city: (json['city'] as String?) ?? '',
      phone: (json['phone'] as String?) ?? '',
      email: (json['email'] as String?) ?? user?.email ?? '',
      state: (json['state'] as String?) ?? '',
      postalCode: (json['postalCode'] as String?) ?? '',
      ownerName: user?.name ?? '',
    );
  }

  @override
  Future<BookingReport> fetchReport({
    required DateTime from,
    required DateTime to,
  }) async {
    final start = DateTime(from.year, from.month, from.day);
    final endExclusive =
        DateTime(to.year, to.month, to.day).add(const Duration(days: 1));
    final json = await _api.get(
      '$_base/report',
      query: {
        'from': start.toUtc().toIso8601String(),
        'to': endExclusive.toUtc().toIso8601String(),
        'pageSize': '100',
      },
    );
    return BookingReport.fromJson(json);
  }

  @override
  Future<String> exportReportCsv({
    required DateTime from,
    required DateTime to,
  }) async {
    final start = DateTime(from.year, from.month, from.day);
    final endExclusive =
        DateTime(to.year, to.month, to.day).add(const Duration(days: 1));
    return _api.getText(
      '$_base/report/export',
      query: {
        'from': start.toUtc().toIso8601String(),
        'to': endExclusive.toUtc().toIso8601String(),
      },
    );
  }

  @override
  Future<DashboardPlanContext> fetchPlanContext() async {
    final json = await _api.get('/organizations/$_orgId/entitlements');
    final limits = json['limits'] as Map<String, dynamic>? ?? {};
    final flags = json['flags'] as Map<String, dynamic>? ?? {};
    final adsEnabled = flags['adsEnabled'] as bool? ?? true;
    final reportsEnabled = flags['reports'] as bool? ?? false;
    final exportReports = flags['exportReports'] as bool? ?? false;
    final days = (limits['reportHistoryDays'] as num?)?.toInt() ?? 7;
    return DashboardPlanContext(
      plan: adsEnabled ? PlanType.free : PlanType.paid,
      reportHistoryDays: days < 1 ? 7 : days,
      reportsEnabled: reportsEnabled,
      exportReports: exportReports,
      employeesEnabled: flags['employeesEnabled'] as bool? ?? false,
      planName: (json['planName'] as String?) ?? 'Starter',
    );
  }
}
