import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/router/app_routes.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/notifications/domain/entities/app_notification.dart';
import 'package:host_stand/features/notifications/presentation/cubit/notifications_cubit.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 18, 8),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () {
                      if (context.canPop()) {
                        context.pop();
                      } else {
                        context.go(AppRoutes.dashboard);
                      }
                    },
                    icon: const Icon(Icons.arrow_back),
                  ),
                  const Expanded(
                    child: Text(
                      'Notifications',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink,
                      ),
                    ),
                  ),
                  BlocBuilder<NotificationsCubit, NotificationsState>(
                    builder: (context, state) {
                      if (state.unreadCount <= 0) {
                        return const SizedBox.shrink();
                      }
                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.mint,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '${state.unreadCount} unread',
                          style: const TextStyle(
                            color: AppColors.deepGreen,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.line),
            Expanded(
              child: BlocBuilder<NotificationsCubit, NotificationsState>(
                builder: (context, state) {
                  if (state.status == NotificationsStatus.loading ||
                      state.status == NotificationsStatus.initial) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (state.status == NotificationsStatus.failure &&
                      state.items.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              state.errorMessage ??
                                  'Could not load notifications.',
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 12),
                            FilledButton(
                              onPressed: () =>
                                  context.read<NotificationsCubit>().load(),
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      ),
                    );
                  }
                  if (state.items.isEmpty) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text(
                          'No notifications yet.\nNew reservations and updates will appear here.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: AppColors.muted,
                            height: 1.45,
                          ),
                        ),
                      ),
                    );
                  }
                  return RefreshIndicator(
                    onRefresh: () => context.read<NotificationsCubit>().load(),
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                      itemCount:
                          state.items.length + (state.hasMore ? 1 : 0),
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        if (index >= state.items.length) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Center(
                              child: state.loadingMore
                                  ? const CircularProgressIndicator()
                                  : TextButton(
                                      onPressed: () => context
                                          .read<NotificationsCubit>()
                                          .loadMore(),
                                      child: const Text('Load more'),
                                    ),
                            ),
                          );
                        }
                        final item = state.items[index];
                        return _NotificationTile(notification: item);
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({required this.notification});

  final AppNotification notification;

  static const _months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  String _formatTime(DateTime value) {
    final dd = value.day.toString().padLeft(2, '0');
    final hh = value.hour.toString().padLeft(2, '0');
    final mm = value.minute.toString().padLeft(2, '0');
    return '$dd ${_months[value.month - 1]} · $hh:$mm';
  }

  @override
  Widget build(BuildContext context) {
    final time = _formatTime(notification.createdAt);
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () async {
          await context.read<NotificationsCubit>().markRead(notification);
          final reservationId = notification.reservationId;
          if (reservationId != null &&
              reservationId.isNotEmpty &&
              context.mounted) {
            context.push(AppRoutes.bookingDetailPath(reservationId));
          }
        },
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: notification.isUnread
                  ? AppColors.mint
                  : AppColors.line,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 10,
                height: 10,
                margin: const EdgeInsets.only(top: 6),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: notification.isUnread
                      ? AppColors.deepGreen
                      : AppColors.line,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      notification.title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: notification.isUnread
                            ? FontWeight.w700
                            : FontWeight.w600,
                        color: AppColors.ink,
                      ),
                    ),
                    if (notification.message.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        notification.message,
                        style: const TextStyle(
                          fontSize: 14,
                          height: 1.4,
                          color: AppColors.muted,
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),
                    Text(
                      time,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.muted,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
