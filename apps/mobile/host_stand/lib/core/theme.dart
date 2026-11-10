import 'package:flutter/material.dart';

/// Shared brand colors for every Host Stand screen.
abstract final class AppColors {
  static const background = Color(0xFFF5F9F3);
  static const ink = Color(0xFF111713);
  static const muted = Color(0xFF59645D);
  static const line = Color(0xFFE4E9E2);
  static const lineSoft = Color(0xFFDDE4DC);
  static const green = Color(0xFF1F5C3A);
  static const pressedGreen = Color(0xFF18462C);
  static const deepGreen = Color(0xFF00452D);
  static const paleGreen = Color(0xFFF0F5F0);
  static const pale = Color(0xFFE5E9E4);
  static const paleSoft = Color(0xFFEBF0EA);
  static const previewTrack = Color(0xFFE8ECE7);
  static const active = Color(0xFFA8EFC7);
  static const danger = Color(0xFFB42318);
  static const dangerSoft = Color(0xFFFFF3F1);
  static const dangerBorder = Color(0xFFF4C7C2);
  static const dangerChip = Color(0xFFF8D7D4);
  static const successSoft = Color(0xFFEAF7EE);
  static const successBorder = Color(0xFFB7E2C5);
  static const disabled = Color(0xFFB8C9BF);
  static const disabledAlt = Color(0xFFB9C9BD);
  static const caption = Color(0xFF818A83);
  static const hint = Color(0xFF7B857D);
  static const white = Colors.white;

  /// Status / chip accents
  static const mint = Color(0xFFB9F3D6);
  static const amber = Color(0xFFFFF0BF);
  static const rose = Color(0xFFFFD9D6);
  static const softGreen = Color(0xFFDCE5DD);
  static const blush = Color(0xFFFBE5EE);
  static const pendingInk = Color(0xFF8A3900);
  static const noShowInk = Color(0xFF9C2850);
  static const noShowDeep = Color(0xFF8C0012);
  static const zoneSoft = Color(0xFFEEF4ED);
  static const adTrack = Color(0xFFE5E5E5);
  static const adLabel = Color(0xFF555555);
}

/// Shared elevations used by cards and pills.
abstract final class AppShadows {
  static const card = [
    BoxShadow(
      color: Color(0x08000000),
      blurRadius: 4,
      offset: Offset(0, 2),
    ),
  ];

  static const soft = [
    BoxShadow(
      color: Color(0x10000000),
      blurRadius: 4,
      offset: Offset(0, 2),
    ),
  ];

  static const brand = [
    BoxShadow(
      color: Color(0x18000000),
      blurRadius: 4,
      offset: Offset(0, 2),
    ),
  ];
}

/// Shared corner radii.
abstract final class AppRadii {
  static const card = 20.0;
  static const field = 12.0;
  static const button = 14.0;
  static const pill = 30.0;
  static const chip = 20.0;
  static const back = 18.0;
}

/// Shared product copy used across screens.
abstract final class AppCopy {
  static const appName = 'DinePoint Host Stand';
  static const staffSignIn = 'Staff sign in';
  static const indiaEdition =
      'DinePoint Host Stand • India Edition (IST UTC+5:30)';
  static const posEdition = 'DinePoint POS Stand • India Edition';
  static const bohSync = 'DinePoint Back-of-House Sync v3.4';
  static const terminalLunch = 'TERMINAL POS 04 • LUNCH SHIFT';
}

abstract final class AppTheme {
  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.green,
      primary: AppColors.green,
      error: AppColors.danger,
      surface: AppColors.white,
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.background,
      fontFamily: 'Inter',
      textTheme: const TextTheme(
        bodyLarge: TextStyle(color: AppColors.ink),
        bodyMedium: TextStyle(color: AppColors.ink),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.green,
          foregroundColor: AppColors.white,
          disabledBackgroundColor: AppColors.disabled,
          disabledForegroundColor: AppColors.white,
          elevation: 0,
          minimumSize: const Size.fromHeight(54),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.button),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.white,
        hintStyle: const TextStyle(color: AppColors.muted, fontSize: 16),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 17,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.field),
          borderSide: const BorderSide(color: AppColors.line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.field),
          borderSide: const BorderSide(color: AppColors.line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.field),
          borderSide: const BorderSide(color: AppColors.green, width: 1.5),
        ),
      ),
    );
  }
}
