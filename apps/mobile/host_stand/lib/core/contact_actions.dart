import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

String normalizePhone(String phone) {
  final digits = phone.replaceAll(RegExp(r'\D'), '');
  if (digits.startsWith('91') && digits.length > 10) {
    return '+$digits';
  }
  if (digits.length == 10) return '+91$digits';
  return digits.startsWith('+') ? digits : '+$digits';
}

Future<void> launchPhoneCall(BuildContext context, String phone) async {
  final uri = Uri(scheme: 'tel', path: normalizePhone(phone));
  await _launch(context, uri, 'Could not open the phone dialer.');
}

Future<void> launchSms(
  BuildContext context,
  String phone, {
  String? body,
}) async {
  final uri = Uri(
    scheme: 'sms',
    path: normalizePhone(phone),
    queryParameters: body == null || body.isEmpty ? null : {'body': body},
  );
  await _launch(context, uri, 'Could not open SMS.');
}

Future<void> launchWhatsApp(
  BuildContext context,
  String phone, {
  String? message,
}) async {
  final digits = normalizePhone(phone).replaceAll('+', '');
  final uri = Uri.parse(
    message == null || message.isEmpty
        ? 'https://wa.me/$digits'
        : 'https://wa.me/$digits?text=${Uri.encodeComponent(message)}',
  );
  await _launch(context, uri, 'Could not open WhatsApp.');
}

Future<void> launchEmail(
  BuildContext context,
  String email, {
  String? subject,
  String? body,
}) async {
  final uri = Uri(
    scheme: 'mailto',
    path: email,
    queryParameters: {
      if (subject != null) 'subject': subject,
      if (body != null) 'body': body,
    },
  );
  await _launch(context, uri, 'Could not open email.');
}

Future<void> _launch(BuildContext context, Uri uri, String error) async {
  try {
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(error)));
    }
  } catch (_) {
    if (context.mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(error)));
    }
  }
}
