import 'package:flutter/material.dart';

Widget dashboardChip(String text, Color bg, Color fg) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(
        text,
        style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );

/// Legacy alias used by existing screens.
Widget chip(String text, Color bg, Color fg) => dashboardChip(text, bg, fg);
