import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/api_exception.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/features/dashboard/domain/entities/restaurant_profile.dart';
import 'package:host_stand/features/owner/data/models/faq_item.dart';
import 'package:host_stand/features/owner/data/models/owner_settings_data.dart';
import 'package:host_stand/features/owner/data/models/plan_info.dart';
import 'package:host_stand/features/owner/data/models/plan_option.dart';

import 'owner_data_source.dart';

/// Owner profile from restaurant APIs; plan limits from Super Admin entitlements.
class ApiOwnerDataSource implements OwnerDataSource {
  ApiOwnerDataSource(this._api, this._session);

  final ApiClient _api;
  final SessionCache _session;

  PlanInfo _plan = const PlanInfo(
    name: 'Starter',
    status: 'Active',
    renewalText: 'Assigned by DinePoint platform',
    outlets: 1,
    tables: 10,
    reportDays: 7,
    adsEnabled: true,
  );

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

  @override
  Future<OwnerSettingsData> loadOwnerSettings() async {
    final results = await Future.wait([
      _api.get('/organizations/$_orgId/restaurants/$_restaurantId'),
      _api.get('/organizations/$_orgId/entitlements'),
    ]);
    final json = results[0];
    final entitlements = results[1];
    _plan = _planFromEntitlements(entitlements);
    _session.setEmployeesEnabled(_plan.employeesEnabled);

    final user = _session.currentUser;
    final profile = RestaurantProfile(
      name: (json['name'] as String?) ??
          _session.restaurantName ??
          'Restaurant',
      phone: (json['phone'] as String?) ?? '',
      email: (json['email'] as String?) ?? user?.email ?? '',
      address: (json['addressLine1'] as String?) ?? '',
      ownerName: user?.name ?? '',
      area: (json['area'] as String?) ?? '',
      city: (json['city'] as String?) ?? '',
      state: (json['state'] as String?) ?? '',
      postalCode: (json['postalCode'] as String?) ?? '',
    );

    return OwnerSettingsData(
      profile: profile,
      plan: _plan,
      options: const [
        PlanOption(
          name: 'Contact platform',
          price: '—',
          outletLimit: 'Plan changes are assigned by Super Admin',
          tableLimit: 'Ask your DinePoint account manager to upgrade',
          features: 'Outlets, floors, rooms, tables, SMS & WhatsApp quotas',
          recommended: true,
        ),
      ],
      faqs: const [
        FaqItem(
          'Who sets my plan limits?',
          'DinePoint Super Admin configures plans and assigns a subscription to your organization. Limits for outlets, tables, floors, rooms, reports, SMS and WhatsApp come from that plan.',
        ),
        FaqItem(
          'How do I upgrade?',
          'Contact your DinePoint account manager. They change your subscription on the platform console; Host Stand then shows the new limits automatically.',
        ),
        FaqItem(
          'How do I free a table?',
          'Open the seated booking, then tap Complete Booking. The table becomes available after the booking is completed.',
        ),
      ],
      restaurantShortAddress:
          '${profile.area.isEmpty ? profile.city : profile.area}, ${profile.city}',
      terminal: 'Host Stand',
      version: '1.0.0',
      build: 'api',
      syncStatus: 'Connected to Nest API',
    );
  }

  @override
  Future<RestaurantProfile> saveProfile(RestaurantProfile profile) async {
    await _api.patch(
      '/organizations/$_orgId/restaurants/$_restaurantId',
      body: {
        'restaurantName': profile.name.trim(),
        'branchName': profile.area.trim().isEmpty
            ? profile.name.trim()
            : profile.area.trim(),
        'phone': profile.phone.trim(),
        'email': profile.email.trim(),
        'addressLine1': profile.address.trim(),
        'area': profile.area.trim(),
        'city': profile.city.trim(),
        'state': profile.state.trim(),
        'postalCode': profile.postalCode.trim(),
      },
    );
    await _session.setSelectedRestaurant(
      restaurantId: _restaurantId,
      restaurantName: profile.name.trim(),
    );
    return profile;
  }

  @override
  Future<PlanInfo> selectPlan(PlanOption option) async {
    // Plans are assigned by Super Admin; refresh live entitlements instead.
    final entitlements = await _api.get('/organizations/$_orgId/entitlements');
    _plan = _planFromEntitlements(entitlements);
    return _plan;
  }

  PlanInfo _planFromEntitlements(Map<String, dynamic> json) {
    final limits = json['limits'] as Map<String, dynamic>? ?? {};
    final flags = json['flags'] as Map<String, dynamic>? ?? {};
    final usage = json['usage'] as Map<String, dynamic>? ?? {};
    final status = json['subscriptionStatus'] as String?;

    return PlanInfo(
      name: (json['planName'] as String?) ?? 'Starter',
      status: status ?? 'Default',
      renewalText: status == null
          ? 'No subscription yet — default Starter limits apply until Super Admin assigns a plan'
          : 'Plan assigned by DinePoint platform ($status)',
      outlets: (limits['outlets'] as num?)?.toInt() ?? 1,
      tables: (limits['tables'] as num?)?.toInt() ?? 10,
      floors: (limits['maxFloorsPerRestaurant'] as num?)?.toInt() ?? 2,
      rooms: (limits['maxRoomsPerRestaurant'] as num?)?.toInt() ?? 4,
      reportDays: (limits['reportHistoryDays'] as num?)?.toInt() ?? 7,
      smsPerMonth: (limits['smsPerMonth'] as num?)?.toInt() ?? 0,
      whatsappPerMonth: (limits['whatsappPerMonth'] as num?)?.toInt() ?? 0,
      adsEnabled: flags['adsEnabled'] as bool? ?? true,
      reportsEnabled: flags['reports'] as bool? ?? false,
      employeesEnabled: flags['employeesEnabled'] as bool? ?? false,
      exportReports: flags['exportReports'] as bool? ?? false,
      usedOutlets: (usage['restaurants'] as num?)?.toInt() ?? 0,
      usedTables: (usage['tables'] as num?)?.toInt() ?? 0,
      usedSms: (usage['smsThisMonth'] as num?)?.toInt() ?? 0,
      usedWhatsapp: (usage['whatsappThisMonth'] as num?)?.toInt() ?? 0,
    );
  }
}
