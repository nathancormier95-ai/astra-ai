# OmniMind Flutter Client

This directory is the **Flutter Android migration workspace** for OmniMind. It deliberately contains the Dart client foundation, branding assets, design plan, test scaffold, and runtime configuration, but it does **not** contain generated Android platform files yet. Flutter, Dart, Gradle, and the Android SDK are unavailable in the current workspace, so those files must be created in a Flutter-enabled development environment.

## Current Contents

| Area                        | Status                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| Flutter application package | Ready: `pubspec.yaml`, `lib/`, analysis rules, and widget test.                                  |
| OmniMind branding           | Ready: launcher, splash, favicon, and adaptive-icon source assets.                               |
| App shell                   | Ready: minimal Material 3 workspace screen using OmniMind’s theme and a non-secret API base URL. |
| Android platform            | Pending: generate with Flutter.                                                                  |
| Feature migration           | Pending: port auth and API shell first, then workspace features.                                 |

## Generate Android Platform Files

In a Flutter-enabled Codespace or computer, run the following from this directory:

```bash
flutter create --platforms=android .
flutter pub get
flutter analyze
flutter test
flutter run
```

Set the generated Android application ID to `com.app.allinoneaiassistant`, retain the `manusallinoneaiassistant` deep-link scheme until a dedicated OmniMind scheme is approved, and configure launcher/splash icons using the assets in `assets/images/`.

## Codemagic

The repository root contains `../codemagic.yaml`. It expects this directory at `omnimind-flutter/`, generates the Android platform directory automatically on its first cloud build, then runs checks and creates a debug APK. It is intentionally manual-only and contains no secret or release-signing material. Generating and committing Android files locally remains recommended before the first production release.

## Security Boundary

`OMNIMIND_API_BASE_URL` is a public server URL that may be overridden using `--dart-define`. Do not add Stripe private keys, webhook signing secrets, OAuth client secrets, or AI provider credentials to this project. The existing OmniMind backend remains responsible for secrets, authenticated user ownership checks, billing entitlements, and AI usage limits.

## Migration Order

1. Generate and commit the Android platform directory.
2. Implement OAuth, deep-link return, secure session storage, and an authenticated API client.
3. Add the bottom navigation shell and port chat/model selection.
4. Port projects, library, documents, images, voice, and flashcards.
5. Add server-backed Premium status, Stripe browser handoff, privacy controls, and account deletion.
6. Run the full Android acceptance checklist before retiring the Expo fallback.
