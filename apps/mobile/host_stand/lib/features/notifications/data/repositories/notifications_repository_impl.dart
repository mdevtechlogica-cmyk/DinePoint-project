import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/features/notifications/domain/entities/app_notification.dart';
import 'package:host_stand/features/notifications/domain/repositories/notifications_repository.dart';

class NotificationsRepositoryImpl implements NotificationsRepository {
  NotificationsRepositoryImpl(this._api);

  final ApiClient _api;

  @override
  Future<NotificationsPage> list({int page = 1, int limit = 20}) async {
    final json = await _api.get(
      '/notifications',
      query: {
        'page': '$page',
        'limit': '$limit',
      },
    );

    final rawItems = json['items'];
    final items = rawItems is List
        ? rawItems
            .whereType<Map>()
            .map((raw) =>
                AppNotification.fromJson(Map<String, dynamic>.from(raw)))
            .where((n) => n.id.isNotEmpty)
            .toList()
        : <AppNotification>[];

    final pagination = json['pagination'];
    final pageMap =
        pagination is Map ? Map<String, dynamic>.from(pagination) : const {};

    return NotificationsPage(
      items: items,
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      page: (pageMap['page'] as num?)?.toInt() ?? page,
      totalPages: (pageMap['totalPages'] as num?)?.toInt() ?? 1,
    );
  }

  @override
  Future<void> markAsRead(String notificationId) async {
    await _api.patch('/notifications/$notificationId/read');
  }
}
