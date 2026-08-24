# Flutter Setup Research Notes

## Official Sources Consulted

| Topic | Key finding | Source |
|---|---|---|
| Flutter SDK installation | Install the Flutter SDK, add its `bin` directory to the system `PATH`, and use the stable release channel for a current project environment. | [Flutter installation overview](https://docs.flutter.dev/install) |
| Android environment | The Flutter plugin alone is insufficient; Android development also needs the Flutter SDK on `PATH`. Install current Android Studio, Android SDK platform/API level, Build-Tools, Command-line Tools, Emulator, Platform-Tools, CMake, and side-by-side NDK. | [Flutter Android development setup](https://docs.flutter.dev/platform-integration/android/setup) |
| Android licensing | Android SDK licenses must be accepted after prerequisite installation, then the configuration is checked with `flutter doctor`. | [Flutter Android development setup](https://docs.flutter.dev/platform-integration/android/setup) |

## OmniMind-Specific Implications

The target environment needs a real Flutter/Dart/Android toolchain; the current sandbox does not contain Flutter, Dart, Gradle, or Android tooling. Generate the Android platform folders in the target environment with `flutter create .`, retain the existing Node server and database, and preserve the Expo app until Flutter passes the Android acceptance checklist.
