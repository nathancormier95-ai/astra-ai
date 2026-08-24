/// Non-secret runtime configuration for the Flutter client.
///
/// The API URL may be overridden by Codemagic or a local command using
/// `--dart-define=OMNIMIND_API_BASE_URL=https://example.com`. Credentials,
/// Stripe private keys, and OAuth secrets must remain on the server.
abstract final class AppConfig {
  static const appName = 'OmniMind';
  static const androidApplicationId = 'com.app.allinoneaiassistant';
  static const deepLinkScheme = 'manusallinoneaiassistant';
  static const apiBaseUrl = String.fromEnvironment(
    'OMNIMIND_API_BASE_URL',
    defaultValue: 'https://astraai-pnqxhfej.manus.space',
  );
}
