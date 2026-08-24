# Codemagic Android Debug Build for OmniMind Flutter

The repository root now includes a **manual-only Codemagic workflow** at `codemagic.yaml`. It expects the Flutter client at `omnimind-flutter/` and creates an installable Android **debug APK** after that client exists. It deliberately does not trigger from every commit, publish to Google Play, or include any secret. The current Expo client remains untouched and is still the fallback while the Flutter rewrite is underway.

> Codemagic requires a `codemagic.yaml` file to be committed at the repository root before it can use YAML workflow configuration. The debug workflow below follows Codemagic's documented Flutter build process: resolve packages, build a debug APK, then collect it as an artifact. [1] [2]

## Intended Use

| Requirement             | Included in the template                                                        | Not included yet                                                                  |
| ----------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Flutter SDK and Java 17 | Yes, the workflow selects Flutter stable and Java 17.                           | A fixed Flutter version; pin one after the Flutter project is created and tested. |
| Android test build      | Yes, it runs format, analysis, tests, and creates a debug APK.                  | Google Play upload or a production release.                                       |
| Server configuration    | Yes, it passes the existing public OmniMind API base URL through a Dart define. | API keys, Stripe secrets, OAuth secrets, or signing material.                     |
| Android signing         | No. A debug APK can be installed for private testing.                           | An uploaded release keystore and Gradle release-signing setup.                    |

## Phone-First Setup Steps

### 1. Create the Flutter client before enabling the workflow

Open the repository in a browser-based development workspace. Create a new Flutter client in a separate `omnimind-flutter` folder or, preferably, a separate repository. Copy the files from `flutter_handoff` into the Flutter project and run `flutter create .` there. This generates the essential Android `android/` directory that Codemagic needs.

Do **not** copy `codemagic.yaml` into the root of the current Expo repository. The existing root is not a Flutter project and a Codemagic Flutter build would fail. Keep the Expo app until the Flutter acceptance checklist in `README.md` has passed.

### 2. Move the template to the Flutter repository root

The root `codemagic.yaml` already targets this location:

```text
omnimind-flutter/
```

Commit and push the generated Flutter project files. Codemagic detects the root-level YAML configuration when you scan the selected branch. The workflow deliberately stops with an explanatory message until both `omnimind-flutter/pubspec.yaml` and `omnimind-flutter/android/` exist. [1]

### 3. Connect the Flutter repository in Codemagic

Create or sign in to a Codemagic account, select **Add application**, connect the GitHub repository containing the Flutter client, and scan the selected branch for `codemagic.yaml`. Start the workflow named **OmniMind Flutter — Android debug APK** manually. The configuration intentionally has no automatic branch triggers, preventing accidental use of free build minutes while the migration is incomplete.

### 4. Install the debug APK on the phone

When the build finishes, open its **Artifacts** section and download the `.apk` file on the Android phone. If Android blocks the installation, permit installations from the browser or file manager used to open the download, then install the APK. Use this build only for private testing; it is not a Google Play release.

### 5. Keep sensitive values out of the YAML file

The API base URL in the template is public. Keep Stripe private keys, webhook signing secrets, OAuth client secrets, and Android keystore passwords out of Git and out of Dart defines. The mobile app must continue to call the existing server, which retains those secrets.

## Later: Production Android Release

Create a separate release workflow only after the Flutter project has a verified Android package identifier and release build configuration. Upload an Android keystore in the Codemagic signing settings, reference it under `environment.android_signing`, and configure the generated Android Gradle files to read the build-machine signing environment variables. Codemagic documents the secure keystore-reference flow and warns that the keystore should be retained privately and not committed to a public repository. [3]

| Stage                          | Output        | Distribution                                                                              |
| ------------------------------ | ------------- | ----------------------------------------------------------------------------------------- |
| Current template               | Debug `.apk`  | Download from the build artifacts and install on a test phone.                            |
| Future signed release workflow | Signed `.aab` | Submit through Google Play Console after Play signing and release testing are configured. |

## Troubleshooting

| Build message                          | Likely cause                                                                       | Resolution                                                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `test -d android` fails                | The Flutter project has not been initialized.                                      | From the Flutter project directory, run `flutter create .`, commit the generated platform files, and retry. |
| `flutter pub get` fails                | Dependency versions have not been resolved for the chosen Flutter SDK.             | Run `flutter pub get` in the browser workspace, commit `pubspec.lock`, then rebuild.                        |
| `dart format` fails                    | Source is not formatted.                                                           | Run `dart format .`, review the changes, commit, and retry.                                                 |
| `flutter test` fails                   | A Flutter test or dependency is failing.                                           | Fix the test locally in the browser workspace before repeating the build.                                   |
| APK installs but cannot reach OmniMind | The Flutter API client has not yet been ported to consume `OMNIMIND_API_BASE_URL`. | Complete the authenticated API client first; do not move server credentials into the app.                   |

## References

[1] [Codemagic, “Using codemagic.yaml.”](https://docs.codemagic.io/yaml-basic-configuration/yaml-getting-started/)

[2] [Codemagic, “Flutter apps.”](https://docs.codemagic.io/yaml-quick-start/building-a-flutter-app/)

[3] [Codemagic, “Signing Android apps.”](https://docs.codemagic.io/yaml-code-signing/signing-android/)
