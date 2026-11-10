import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/router/app_routes.dart';

import '../../domain/entities/booking.dart';

void toast(BuildContext context, String text) =>
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

void openBookingDetail(BuildContext context, Booking booking) {
  context.push(AppRoutes.bookingDetailPath(booking.id));
}

/// Kept for older call sites; prefer [openBookingDetail].
void bookingDialog(BuildContext context, Booking booking) =>
    openBookingDetail(context, booking);
