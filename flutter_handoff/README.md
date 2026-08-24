# OmniMind Flutter Migration Handoff

## Purpose

This package preserves the implementation plan for moving **OmniMind** from its current Expo/React Native mobile client to a native Flutter Android client. The existing Node/TypeScript server, database schema, file storage, Stripe integration, and AI routes should remain in place during the first Flutter release. The current Expo client is a stable fallback and should not be deleted until the Flutter client passes the complete Android acceptance suite.

## Required Target Environment

The Flutter work must be performed in an environment with a supported Flutter SDK, Dart SDK, Android SDK command-line tools, Gradle, Java 17, and at least one Android emulator or physical Android device. Create the platform folders in that environment with `flutter create .` after placing the files from this directory in the target project.

## Current Product Scope to Preserve

| Area | Flutter first-release requirement |
|---|---|
| Identity | OAuth sign-in, session refresh, sign-out, account deletion, and privacy preferences. |
| Workspace | Dashboard, projects, saved conversations, documents, and project-owned flashcard sets. |
| AI assistant | Chat, curated model selection, General/Writer/Learn/Plan/Code modes, image generation, document questions, and response-to-flashcard generation. |
| Learning | Quick-action prompts, text-to-speech response playback, flashcard review, and system sharing. |
| Premium | Free/Premium usage display, Stripe-hosted `$6/month` checkout, billing portal, and server-derived entitlements. |
| Privacy | Data retention explanation, no AI-training toggle by default, explicit consent, account-data deletion, and no background monitoring. |

## Existing Backend Contract

The Flutter client should continue using the existing authenticated Node server and database. It must not place Stripe secrets, model credentials, or storage credentials on the device.

| Backend capability | Existing ownership/security boundary | Flutter client responsibility |
|---|---|---|
| Auth | Server session validates the signed-in user. | Launch OAuth, capture the app deep-link return, and persist only the session token in secure storage. |
| Workspace data | Server scopes projects, conversations, documents, and flashcards to the authenticated user. | Send authenticated requests and never infer ownership client-side. |
| AI | Server validates model access and usage limits before invoking models. | Render loading, result, and structured error states. |
| Documents | Server validates size/type and owns private storage keys. | Pick a file only after user action; send bytes over TLS; show name and status. |
| Billing | Server creates Checkout/Portal URLs and verifies Stripe webhooks before granting Premium. | Open hosted Stripe URLs using the system browser and refresh billing status after deep-link return. |

## Data Models

| Model | Essential fields |
|---|---|
| `Project` | `id`, `name`, `description`, `color`, `createdAt`, `updatedAt` |
| `Conversation` | `id`, `projectId`, `title`, `modeId`, `modelId`, `messages`, `updatedAt` |
| `ChatMessage` | `id`, `role`, `content`, `imageUrl`, `createdAt` |
| `Document` | `id`, `projectId`, `name`, `mimeType`, `byteSize`, `createdAt` |
| `FlashcardSet` | `id`, `projectId`, `sourceConversationId`, `title`, `cards`, `updatedAt` |
| `UsageSummary` | `plan`, monthly action limits, used counts, remaining counts |
| `BillingStatus` | `plan`, `subscriptionStatus`, `premiumCurrentPeriodEnd`, `canManageSubscription` |

## Expo-to-Flutter Replacement Map

| Current capability | Flutter replacement |
|---|---|
| Expo Router | `go_router` with named routes and a shell bottom navigation scaffold. |
| Expo Linking / OAuth callback | `flutter_appauth` plus `app_links` or `uni_links` for secure custom-scheme returns. |
| Expo Document Picker / FileSystem | `file_picker` and Dart `File`/byte APIs. |
| Expo Speech | `flutter_tts`. |
| Expo Haptics | `haptic_feedback` or Flutter `HapticFeedback`. |
| Expo Web Browser | `url_launcher` for Stripe-hosted Checkout and the billing portal. |
| AsyncStorage / SecureStore | `shared_preferences` for non-sensitive UI state and `flutter_secure_storage` for session data. |
| Native share sheet | `share_plus`. |

## Recommended Flutter Structure

```text
lib/
  app.dart
  core/
    api/              # authenticated API client and error types
    auth/             # OAuth/deep-link/session orchestration
    billing/          # checkout and portal launch helpers
    storage/          # secure storage and preferences
    theme/
  features/
    dashboard/
    chat/
    projects/
    library/
    flashcards/
    account/
  shared/
    models/
    widgets/
```

## First Flutter Build Sequence

1. Generate the Flutter Android project in a Flutter-capable environment and copy the launcher assets from `../assets/images/`.
2. Configure the Android package identifier as `com.app.allinoneaiassistant` and preserve the `manusallinoneaiassistant` deep-link scheme until a dedicated OmniMind scheme is approved.
3. Implement the authenticated API client and OAuth return flow before creating data-mutating screens.
4. Build the tab shell: Home, Assistant, Library, Projects, and Account.
5. Port the chat flow and model selection, then add documents, images, response playback, and flashcards.
6. Add Stripe Checkout/Portal browser handoff and refresh billing status only from the server.
7. Run the acceptance checklist below before retiring the Expo client.

## Acceptance Checklist

- [ ] Fresh Android install opens without a cache, native-module, or deep-link crash.
- [ ] Sign-in returns to the intended Flutter screen and session data is stored securely.
- [ ] A user can create a project, chat, reopen a saved conversation, and see only their own records.
- [ ] Document upload enforces the product size/type rules and document questions return safely.
- [ ] Flashcards can be generated, saved to a project, reopened, shared, and deleted only by the owner.
- [ ] Stripe Checkout opens in the system browser, Premium status comes from a server-verified webhook, and the portal opens for an existing customer.
- [ ] Account deletion removes server-owned workspace records and the local secure session.

## Explicit Deferrals

The Flutter first release should not add autonomous agents, continuous email/social scans, video generation, arbitrary model providers, or in-app card handling. These remain outside the stable core migration scope.
