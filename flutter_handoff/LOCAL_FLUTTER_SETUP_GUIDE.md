# OmniMind: Local Flutter and Android Setup Guide

**Author:** Manus AI  
**Purpose:** Set up a local Flutter Android environment, bootstrap the OmniMind Flutter project, and prepare it for a staged migration from the existing Expo/React Native client.

> **Scope boundary:** This guide prepares the Flutter client environment. The existing Node/TypeScript server, database, private storage, AI routes, and Stripe logic remain server-side. Do **not** copy Stripe secret keys, webhook signing secrets, database URLs, or model credentials into the Flutter project.

## 1. What You Need Before Starting

Use a supported Windows, macOS, or Linux computer with administrator access for Android Studio installation and enough free disk space for the Android SDK, emulator images, Gradle caches, and the Flutter SDK. Flutter’s official setup requires both the Flutter SDK and Android tooling; installing an editor plugin alone does not provide the `flutter` command.[1] [2]

| Requirement | Why OmniMind needs it | Recommended choice |
|---|---|---|
| Flutter SDK | Builds and runs the new client. | Latest **stable** channel. |
| Dart SDK | Installed with Flutter. | Use the Dart version bundled with Flutter. |
| Android Studio | Installs Android SDK components and creates emulators. | Latest stable release. |
| Java 17 | Required by modern Android Gradle builds. | Android Studio’s bundled runtime or a standalone JDK 17. |
| Android device or emulator | Validates the real app lifecycle, deep links, documents, and browser handoffs. | Physical device preferred for first release checks. |
| Git | Retrieves the OmniMind source and Flutter SDK updates. | Current stable Git. |

## 2. Preserve the Current Working Baseline

Before creating Flutter files, preserve the latest OmniMind checkpoint and source. The existing Expo project remains the fallback while the Flutter version is incomplete.

```bash
git clone https://github.com/nathancormier95-ai/astra-ai.git omnimind-source
cd omnimind-source
git status
```

Create a new sibling directory for Flutter rather than overwriting the Expo application.

```text
workspace/
├── omnimind-source/       # Existing Expo/Node project; preserve unchanged initially
└── omnimind-flutter/      # New Flutter Android client
```

## 3. Install the Flutter SDK

Download Flutter from the official installer page for your operating system and use the stable channel.[1] Extract it to a path without spaces or restricted permissions, such as `C:\src\flutter` on Windows, `~/development/flutter` on macOS, or `~/development/flutter` on Linux.

| Operating system | Recommended SDK location | Add this directory to `PATH` |
|---|---|---|
| Windows | `C:\src\flutter` | `C:\src\flutter\bin` |
| macOS | `~/development/flutter` | `$HOME/development/flutter/bin` |
| Linux | `~/development/flutter` | `$HOME/development/flutter/bin` |

### Windows PATH

Open **Start → Edit the system environment variables → Environment Variables**, select your user `Path`, choose **Edit**, and add the Flutter `bin` directory. Close and reopen PowerShell, then run:

```powershell
flutter --version
dart --version
```

### macOS or Linux PATH

Add the following line to `~/.zshrc` (macOS default) or `~/.bashrc` (many Linux installations), adjusting the directory if needed.

```bash
export PATH="$PATH:$HOME/development/flutter/bin"
```

Reload the shell and verify the SDK.

```bash
source ~/.zshrc   # macOS zsh example
flutter --version
dart --version
```

## 4. Install Android Studio and Android Components

Install the current stable Android Studio. Flutter’s Android setup guide identifies Android Studio as the standard way to install the SDK and manage either emulators or physical-device deployments.[2]

Open **Android Studio → More Actions → SDK Manager**. In an open project, use **Tools → SDK Manager** instead. Install the Android platform API level recommended by the current Flutter documentation, then install these SDK tools:[2]

| Android SDK Manager area | Required selection |
|---|---|
| SDK Platforms | The current Android platform API recommended by Flutter’s Android setup documentation. |
| SDK Tools | Android SDK Build-Tools, Android SDK Command-line Tools, Android Emulator, Android SDK Platform-Tools, CMake, and NDK (Side by side). |

Record the SDK path displayed by Android Studio. Common defaults are shown below.

| Operating system | Typical Android SDK path |
|---|---|
| Windows | `%LOCALAPPDATA%\Android\Sdk` |
| macOS | `$HOME/Library/Android/sdk` |
| Linux | `$HOME/Android/Sdk` |

On macOS or Linux, add the SDK tools to the shell profile if `adb` or `sdkmanager` is not found.

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin"
```

On Windows, add the matching `platform-tools`, `emulator`, and `cmdline-tools\latest\bin` subdirectories through the Environment Variables interface.

## 5. Complete Flutter and Android Validation

Run the Flutter diagnostic and resolve every red failure before copying OmniMind source files. Accept Android SDK licenses after all required SDK components are installed.[2]

```bash
flutter doctor -v
flutter doctor --android-licenses
flutter doctor -v
```

The expected result is a check mark for **Flutter**, **Android toolchain**, and **Android Studio**. If the Java check fails, point Flutter to JDK 17 or Android Studio’s bundled JBR.

```bash
flutter config --jdk-dir "/absolute/path/to/jdk-17"
flutter doctor -v
```

> Do not continue to an OmniMind build while `flutter doctor` reports an Android toolchain failure. Fix the SDK path, Java path, licenses, or missing SDK packages first.

## 6. Configure a Test Device

For a physical Android phone, enable **Developer options** and **USB debugging**, connect it with a trusted cable, and confirm the device appears.

```bash
adb devices
flutter devices
```

For an emulator, open **Android Studio → Device Manager → Create Device**, select a current Pixel profile and a system image for the installed Android API level, then start it. Hardware/VM acceleration should be enabled for acceptable emulator performance.[2]

## 7. Create the Flutter Client Project

Create the Flutter app in a separate directory. The initial Android package should match the existing OmniMind package so the migration can retain its intended Android identity, but confirm that the existing installed app is uninstalled before testing a package change.

```bash
mkdir -p ../omnimind-flutter
cd ../omnimind-flutter
flutter create --platforms=android --org com.app omnimind_flutter
cd omnimind_flutter
```

Set the Android application ID to the existing OmniMind identifier in `android/app/build.gradle.kts` or `android/app/build.gradle`, depending on the generated template.

```text
com.app.allinoneaiassistant
```

Set the application label to **OmniMind** in `android/app/src/main/AndroidManifest.xml` or the Android resource file generated by Flutter. Retain the existing custom deep-link scheme, `manusallinoneaiassistant`, until the OAuth server configuration is migrated and tested.

## 8. Copy the OmniMind Flutter Handoff Files

Copy the files from the existing project’s `flutter_handoff/` directory into the new Flutter project. The handoff includes the migration contract, image assets, and starter package manifest.

```bash
# Run from the new Flutter project directory
cp -R ../../omnimind-source/flutter_handoff/assets ./
cp ../../omnimind-source/flutter_handoff/pubspec.yaml ./pubspec.yaml
cp ../../omnimind-source/flutter_handoff/README.md ./OMNIMIND_MIGRATION.md
cp ../../omnimind-source/flutter_handoff/LOCAL_FLUTTER_SETUP_GUIDE.md ./
flutter pub get
```

Resolve package versions in the Flutter environment rather than copying a dependency lockfile from React Native. Start with the packages listed in the handoff `pubspec.yaml`:

| Flutter package | OmniMind role |
|---|---|
| `go_router` | Tab shell and authenticated navigation. |
| `flutter_riverpod` | Predictable state for auth, workspace data, and chat. |
| `http` | Authenticated API requests to the existing server. |
| `flutter_secure_storage` | Stores session material only. |
| `file_picker` | Explicit user-selected document attachment. |
| `flutter_tts` | Assistant reply playback. |
| `url_launcher` | Opens hosted Stripe Checkout and billing portal. |
| `share_plus` | Shares generated flashcards. |

## 9. Configure OmniMind Runtime Settings Safely

The Flutter client requires the public API base URL and non-secret app identifiers. Do **not** add Stripe secret keys, database credentials, LLM keys, or webhooks to Dart source or Android resources.

Create a local ignored file such as `.env.local` for development notes only, or prefer `--dart-define` for public build configuration.

```bash
flutter run \
  --dart-define=OMNIMIND_API_BASE_URL=https://astraai-pnqxhfej.manus.space \
  --dart-define=OMNIMIND_DEEP_LINK_SCHEME=manusallinoneaiassistant
```

Read values in Dart with compile-time constants.

```dart
const apiBaseUrl = String.fromEnvironment('OMNIMIND_API_BASE_URL');
const deepLinkScheme = String.fromEnvironment('OMNIMIND_DEEP_LINK_SCHEME');
```

The Flutter client should call the server for AI, document processing, usage limits, billing status, checkout URLs, and the billing portal. Premium access must be rendered from the server’s billing-status response, not inferred from a completed browser return.

## 10. Start the Migration in a Safe Order

Port a narrow vertical slice first. This avoids rebuilding every screen before sign-in, networking, and device lifecycle behavior are proven.

| Order | Build milestone | Acceptance condition |
|---|---|---|
| 1 | Theme, launcher assets, and bottom navigation shell | App launches cleanly on a physical Android device. |
| 2 | OAuth/deep link and secure session storage | Sign-in returns to the intended Flutter screen. |
| 3 | Authenticated API client and dashboard | The user sees only their account’s workspace summary. |
| 4 | Chat with modes and model selection | Send, loading, error, and usage-limit states work. |
| 5 | Projects, conversations, and documents | Records persist and follow server ownership checks. |
| 6 | Flashcards, TTS, and sharing | Cards review locally and share through the system sheet. |
| 7 | Stripe Checkout and billing portal | Browser handoff returns safely; entitlement remains server-derived. |

## 11. Run Locally During Development

Use these commands from the Flutter project directory.

```bash
flutter pub get
flutter analyze
flutter test
flutter run --dart-define=OMNIMIND_API_BASE_URL=https://astraai-pnqxhfej.manus.space
```

For a debug APK that can be installed on a connected device:

```bash
flutter build apk --debug
```

For a release candidate, configure Android signing first, then build an Android App Bundle for Play distribution.

```bash
flutter build appbundle --release \
  --dart-define=OMNIMIND_API_BASE_URL=https://astraai-pnqxhfej.manus.space
```

Keep signing material in a local ignored `key.properties` file or secure CI secret store. Never commit keystores, passwords, Stripe keys, webhook secrets, or production OAuth client secrets.

## 12. Pre-Release Device Checklist

| Test | Expected result |
|---|---|
| Fresh install | OmniMind opens without a cache warning, native-module error, or immediate close. |
| Sign-in | OAuth returns through the registered deep-link scheme and restores the intended screen. |
| Chat | A signed-in user can send a prompt, see an actionable error if offline, and view usage limits. |
| Data ownership | Projects, documents, conversations, and flashcards are visible only to their owner. |
| Billing | Checkout and billing portal open externally; Premium changes only after server-verified Stripe updates. |
| Privacy | Account deletion and disconnect controls are visible before any connected-account scans are introduced. |
| Upgrade | Install the new release over a prior test build and verify the app opens normally. |

## 13. Troubleshooting

| Symptom | First response |
|---|---|
| `flutter` not found | Recheck the Flutter `bin` path, restart the terminal, and run `flutter --version`. |
| Android licenses rejected | Install Command-line Tools in Android Studio, run `flutter doctor --android-licenses`, then rerun `flutter doctor -v`. |
| No device appears | Run `adb devices`; reconnect a physical device or start an emulator from Device Manager. |
| Gradle uses an unsupported Java version | Run `flutter config --jdk-dir` with a JDK 17 path, then clean and rebuild. |
| Deep link does not return from OAuth or Stripe | Verify the custom scheme is registered in Android manifest metadata and on the server-side OAuth/billing return configuration. |
| App opens but cannot access user data | Check the public API base URL and the secure session/deep-link return flow; never work around ownership errors client-side. |

## References

[1] [Flutter documentation: Install Flutter](https://docs.flutter.dev/install)  
[2] [Flutter documentation: Set up Android development](https://docs.flutter.dev/platform-integration/android/setup)
