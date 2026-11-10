import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/api_exception.dart';
import 'package:host_stand/features/notifications/domain/entities/app_notification.dart';
import 'package:host_stand/features/notifications/domain/repositories/notifications_repository.dart';

enum NotificationsStatus { initial, loading, ready, failure }

class NotificationsState extends Equatable {
  const NotificationsState({
    this.status = NotificationsStatus.initial,
    this.items = const [],
    this.unreadCount = 0,
    this.page = 1,
    this.hasMore = false,
    this.loadingMore = false,
    this.errorMessage,
  });

  final NotificationsStatus status;
  final List<AppNotification> items;
  final int unreadCount;
  final int page;
  final bool hasMore;
  final bool loadingMore;
  final String? errorMessage;

  NotificationsState copyWith({
    NotificationsStatus? status,
    List<AppNotification>? items,
    int? unreadCount,
    int? page,
    bool? hasMore,
    bool? loadingMore,
    String? errorMessage,
    bool clearError = false,
  }) =>
      NotificationsState(
        status: status ?? this.status,
        items: items ?? this.items,
        unreadCount: unreadCount ?? this.unreadCount,
        page: page ?? this.page,
        hasMore: hasMore ?? this.hasMore,
        loadingMore: loadingMore ?? this.loadingMore,
        errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      );

  @override
  List<Object?> get props =>
      [status, items, unreadCount, page, hasMore, loadingMore, errorMessage];
}

class NotificationsCubit extends Cubit<NotificationsState> {
  NotificationsCubit(this._repository) : super(const NotificationsState());

  final NotificationsRepository _repository;

  Future<void> load() async {
    emit(state.copyWith(
      status: NotificationsStatus.loading,
      clearError: true,
    ));
    try {
      final page = await _repository.list(page: 1);
      emit(state.copyWith(
        status: NotificationsStatus.ready,
        items: page.items,
        unreadCount: page.unreadCount,
        page: page.page,
        hasMore: page.hasMore,
        loadingMore: false,
        clearError: true,
      ));
    } on ApiException catch (error) {
      emit(state.copyWith(
        status: NotificationsStatus.failure,
        errorMessage: error.message,
      ));
    } catch (_) {
      emit(state.copyWith(
        status: NotificationsStatus.failure,
        errorMessage: 'Could not load notifications.',
      ));
    }
  }

  Future<void> loadMore() async {
    if (!state.hasMore || state.loadingMore) return;
    emit(state.copyWith(loadingMore: true));
    try {
      final next = state.page + 1;
      final page = await _repository.list(page: next);
      emit(state.copyWith(
        items: [...state.items, ...page.items],
        unreadCount: page.unreadCount,
        page: page.page,
        hasMore: page.hasMore,
        loadingMore: false,
      ));
    } on ApiException catch (error) {
      emit(state.copyWith(
        loadingMore: false,
        errorMessage: error.message,
      ));
    } catch (_) {
      emit(state.copyWith(
        loadingMore: false,
        errorMessage: 'Could not load more notifications.',
      ));
    }
  }

  Future<void> markRead(AppNotification notification) async {
    if (!notification.isUnread) return;
    final previousItems = state.items;
    final previousUnread = state.unreadCount;
    final updated = previousItems
        .map(
          (item) => item.id == notification.id
              ? AppNotification(
                  id: item.id,
                  title: item.title,
                  message: item.message,
                  type: item.type,
                  createdAt: item.createdAt,
                  reservationId: item.reservationId,
                  readAt: DateTime.now(),
                )
              : item,
        )
        .toList();
    emit(state.copyWith(
      items: updated,
      unreadCount: (previousUnread - 1).clamp(0, 1 << 30),
    ));
    try {
      await _repository.markAsRead(notification.id);
    } catch (_) {
      emit(state.copyWith(
        items: previousItems,
        unreadCount: previousUnread,
      ));
    }
  }
}
