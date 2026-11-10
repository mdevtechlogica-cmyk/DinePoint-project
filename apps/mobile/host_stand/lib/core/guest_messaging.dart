import 'package:flutter/material.dart';
import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/api_exception.dart';
import 'package:host_stand/core/contact_actions.dart';
import 'package:host_stand/core/di/injection.dart';
import 'package:host_stand/core/plan_limit_ui.dart';
import 'package:host_stand/core/session_cache.dart';

enum GuestMessageChannel { sms, whatsapp }

/// Reserves plan quota via Nest, then either relies on Twilio or opens the
/// device SMS / WhatsApp app.
Future<void> sendGuestMessage(
  BuildContext context, {
  required GuestMessageChannel channel,
  required String phone,
  required String body,
  String? reservationId,
}) async {
  final session = sl<SessionCache>();
  final orgId = session.organizationId;
  if (orgId == null || orgId.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('No organization selected.')),
    );
    return;
  }

  Map<String, dynamic> result;
  try {
    result = await sl<ApiClient>().post(
      '/organizations/$orgId/messages',
      body: {
        'channel': channel == GuestMessageChannel.sms ? 'SMS' : 'WHATSAPP',
        'phone': phone,
        'body': body,
        if (session.restaurantId != null) 'restaurantId': session.restaurantId,
        if (reservationId != null) 'reservationId': reservationId,
      },
    );
  } on ApiException catch (error) {
    if (!context.mounted) return;
    showPlanLimitOrError(context, error);
    return;
  } catch (error) {
    if (!context.mounted) return;
    showPlanLimitOrError(context, error);
    return;
  }

  if (!context.mounted) return;

  final dispatch = result['dispatch'] as String? ?? 'DEVICE';
  if (dispatch == 'PROVIDER') {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          channel == GuestMessageChannel.sms
              ? 'SMS sent via Twilio.'
              : 'WhatsApp message sent via Twilio.',
        ),
      ),
    );
    return;
  }

  if (channel == GuestMessageChannel.sms) {
    await launchSms(context, phone, body: body);
  } else {
    await launchWhatsApp(context, phone, message: body);
  }
}
