import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/router/app_routes.dart';

/// Legacy rooms route — floors and rooms are managed on one screen now.
class RoomsScreen extends StatelessWidget {
  const RoomsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (context.mounted) context.go(AppRoutes.layout);
    });
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
