class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.createdAt,
    this.reservationId,
    this.readAt,
  });

  final String id;
  final String title;
  final String message;
  final String type;
  final DateTime createdAt;
  final String? reservationId;
  final DateTime? readAt;

  bool get isUnread => readAt == null;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(Object? value) {
      if (value is String && value.isNotEmpty) {
        return DateTime.tryParse(value)?.toLocal();
      }
      return null;
    }

    return AppNotification(
      id: (json['id'] as String?) ?? '',
      title: (json['title'] as String?) ?? 'Notification',
      message: (json['message'] as String?) ?? '',
      type: (json['type'] as String?) ?? 'GENERAL',
      reservationId: json['reservationId'] as String?,
      readAt: parseDate(json['readAt']),
      createdAt: parseDate(json['createdAt']) ?? DateTime.now(),
    );
  }
}

class NotificationsPage {
  const NotificationsPage({
    required this.items,
    required this.unreadCount,
    required this.page,
    required this.totalPages,
  });

  final List<AppNotification> items;
  final int unreadCount;
  final int page;
  final int totalPages;

  bool get hasMore => page < totalPages;
}
