import '../entities/app_notification.dart';

abstract class NotificationsRepository {
  Future<NotificationsPage> list({int page = 1, int limit = 20});

  Future<void> markAsRead(String notificationId);
}
