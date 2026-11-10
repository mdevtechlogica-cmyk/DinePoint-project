import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/api_exception.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/features/restaurant/data/models/create_restaurant.dart';
import 'package:host_stand/features/restaurant/data/models/restaurant.dart';

abstract interface class RestaurantDataSource {
  Future<List<Restaurant>> fetchRestaurants();
  Future<CreateRestaurant> create({
    required String name,
    required String phone,
    required String city,
    required String area,
    required String postalCode,
    required String state,
  });
}

class ApiRestaurantDataSource implements RestaurantDataSource {
  ApiRestaurantDataSource(this._api, this._session);

  final ApiClient _api;
  final SessionCache _session;

  String get _orgId {
    final id = _session.organizationId;
    if (id == null || id.isEmpty) {
      throw const ApiException(
        'No organization selected. Sign in again.',
      );
    }
    return id;
  }

  @override
  Future<List<Restaurant>> fetchRestaurants() async {
    final list = await _api.getList('/organizations/$_orgId/restaurants');
    return list
        .whereType<Map>()
        .map((raw) => _mapRestaurant(Map<String, dynamic>.from(raw)))
        .toList();
  }

  @override
  Future<CreateRestaurant> create({
    required String name,
    required String phone,
    required String city,
    required String area,
    required String postalCode,
    required String state,
  }) async {
    final json = await _api.post(
      '/organizations/$_orgId/restaurants',
      body: {
        'restaurantName': name.trim(),
        'branchName': area.trim().isEmpty ? name.trim() : area.trim(),
        'city': city.trim(),
        'area': area.trim(),
        'postalCode': postalCode.trim(),
        'state': state.trim(),
        'phone': phone.trim(),
      },
    );

    return CreateRestaurant(
      id: json['id'] as String,
      name: (json['name'] as String?) ?? name.trim(),
      phone: (json['phone'] as String?) ?? phone.trim(),
      city: (json['city'] as String?) ?? city.trim(),
      area: (json['area'] as String?) ?? area.trim(),
      postalCode: (json['postalCode'] as String?) ?? postalCode.trim(),
      state: (json['state'] as String?) ?? state.trim(),
      createdAt: json['createdAt'] is String
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  Restaurant _mapRestaurant(Map<String, dynamic> json) {
    final branch = json['branch'];
    final branchMap = branch is Map
        ? Map<String, dynamic>.from(branch)
        : <String, dynamic>{};
    return Restaurant(
      id: json['id'] as String,
      name: (json['name'] as String?) ?? 'Restaurant',
      area: (json['area'] as String?) ??
          (branchMap['name'] as String?) ??
          '',
      city: (json['city'] as String?) ??
          (branchMap['city'] as String?) ??
          '',
      phone: (json['phone'] as String?) ??
          (branchMap['phone'] as String?) ??
          '',
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}
