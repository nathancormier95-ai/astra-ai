import 'package:flutter/material.dart';

abstract final class OmniMindTheme {
  static const _violet = Color(0xFF7558F6);
  static const _ink = Color(0xFF171B2E);
  static const _mist = Color(0xFFF7F7FC);

  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: _violet,
      brightness: Brightness.light,
      surface: Colors.white,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: _mist,
      appBarTheme: const AppBarTheme(
        backgroundColor: _mist,
        foregroundColor: _ink,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: Color(0xFFE7E7F2)),
        ),
      ),
    );
  }
}
