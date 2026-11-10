import 'package:flutter/material.dart';
import 'package:host_stand/core/theme/app_theme.dart';

class MenuRow extends StatelessWidget {
  const MenuRow({
    required this.icon,
    required this.title,
    required this.trailing,
    required this.onTap,
    super.key,
  });

  final IconData icon;
  final String title;
  final String trailing;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 17),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: AppColors.line)),
          ),
          child: Row(
            children: [
              Icon(icon, color: AppColors.muted, size: 23),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                  ),
                ),
              ),
              if (trailing.isNotEmpty)
                Text(
                  trailing,
                  style: const TextStyle(fontSize: 11, color: AppColors.muted),
                ),
              const SizedBox(width: 8),
              const Icon(Icons.chevron_right, color: AppColors.muted, size: 22),
            ],
          ),
        ),
      );
}

Widget menuGroup(List<Widget> children) => ClipRRect(
      borderRadius: BorderRadius.circular(17),
      child: Column(children: children),
    );
