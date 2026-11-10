import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/api_exception.dart';
import 'package:host_stand/core/router/app_routes.dart';
import 'package:host_stand/core/theme/app_theme.dart';

/// Surfaces Nest plan-limit (403) messages with an optional Upgrade CTA.
void showPlanLimitOrError(BuildContext context, Object error) {
  final message = error is ApiException
      ? error.message
      : error.toString().replaceFirst('Exception: ', '');
  final lower = message.toLowerCase();
  final isLimit = (error is ApiException && error.statusCode == 403) ||
      lower.contains('plan allows') ||
      lower.contains('upgrade to add') ||
      lower.contains('plan limit');

  if (!isLimit) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    return;
  }

  showDialog<void>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Plan limit reached'),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Close'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: AppColors.deepGreen),
          onPressed: () {
            Navigator.pop(ctx);
            context.push(AppRoutes.ownerUpgrade);
          },
          child: const Text('View plan'),
        ),
      ],
    ),
  );
}
