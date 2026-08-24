import 'package:flutter/material.dart';

import 'core/config/app_config.dart';
import 'core/theme/omnimind_theme.dart';

class OmniMindApp extends StatelessWidget {
  const OmniMindApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: OmniMindTheme.light(),
      home: const FlutterWorkspaceHome(),
    );
  }
}

class FlutterWorkspaceHome extends StatelessWidget {
  const FlutterWorkspaceHome({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 28, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'OmniMind',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.8,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Flutter Android workspace',
                style: TextStyle(
                  color: colors.onSurfaceVariant,
                  fontSize: 16,
                ),
              ),
              const Spacer(),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Image.asset(
                        'assets/images/icon.png',
                        width: 56,
                        height: 56,
                      ),
                      const SizedBox(height: 22),
                      const Text(
                        'The Flutter foundation is ready.',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.4,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Next, generate the Android platform files, then port secure sign-in and the assistant shell before the remaining workspace features.',
                        style: TextStyle(
                          color: colors.onSurfaceVariant,
                          height: 1.45,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: colors.primaryContainer,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Text(
                  'Server: ${AppConfig.apiBaseUrl}',
                  style: TextStyle(
                    color: colors.onPrimaryContainer,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
