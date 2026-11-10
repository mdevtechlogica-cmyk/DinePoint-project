import 'package:flutter/material.dart';
import 'package:host_stand/core/theme/app_theme.dart';

class AdBlock extends StatelessWidget {
  const AdBlock({super.key});

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        height: 54,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.adTrack,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Text(
          'Ad',
          style: TextStyle(
            color: AppColors.adLabel,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
}

class LoadingState extends StatelessWidget {
  const LoadingState({required this.label, super.key});

  final String label;

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: AppColors.green),
            const SizedBox(height: 12),
            Text(label, style: const TextStyle(color: AppColors.muted)),
          ],
        ),
      );
}

class ErrorState extends StatelessWidget {
  const ErrorState({required this.message, required this.onRetry, super.key});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off_outlined,
                  size: 42, color: AppColors.muted),
              const SizedBox(height: 12),
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
}

class EmptyState extends StatelessWidget {
  const EmptyState({required this.title, required this.subtitle, super.key});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.event_busy_outlined,
                size: 40, color: AppColors.muted),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 5),
            Text(subtitle, style: const TextStyle(color: AppColors.muted)),
          ],
        ),
      );
}
