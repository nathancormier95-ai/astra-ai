# OmniMind Flutter Mobile Interface Design

## Product Context

OmniMind is a privacy-conscious AI workspace for Android. The Flutter migration retains the focused, Android-first workflow: users begin an AI task, organize work into projects, return to saved conversations and documents, and manage plan and privacy controls. The design assumes portrait orientation, approximately 9:16, with primary actions reachable in the lower half of the screen.

## Screen List and Primary Content

| Screen              | Primary content                                                              | Core function                                                          |
| ------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Welcome and sign-in | Product summary, privacy promise, sign-in action                             | Start an authenticated private workspace.                              |
| Home                | Usage snapshot, recent work, quick start actions                             | Resume a task or enter the assistant.                                  |
| Assistant           | Mode selector, model selector, messages, file action, voice action, composer | Ask questions, generate content, attach documents, and review results. |
| Library             | Searchable saved conversations and documents                                 | Reopen, rename, or continue prior work.                                |
| Projects            | Project list, create action, project detail                                  | Group conversations, documents, and flashcard sets.                    |
| Flashcard review    | One card at a time, reveal/review/share actions                              | Study generated learning material.                                     |
| Account             | Plan and usage, privacy controls, subscription actions, account deletion     | Control billing, retention, and account data.                          |

## Key User Flows

The primary AI flow is: user opens **Assistant** → chooses a mode or quick action → writes or dictates a prompt → optionally attaches a document → sends → receives a structured response → optionally saves the conversation or generates flashcards.

The project flow is: user opens **Projects** → taps the lower-right create action → names a project → opens it → starts an assistant conversation or adds a document → later reopens that project from the list.

The Premium flow is: user opens **Account** → reads the feature and usage comparison → taps subscribe → the app opens Stripe Checkout in the system browser → the user returns via deep link → the app refreshes server-derived billing status.

## Layout and Interaction Rules

The Flutter app uses a five-item bottom navigation shell: Home, Assistant, Library, Projects, and Account. The composer, primary create action, and send controls remain in the lower-thumb zone. Full-screen vertical lists use Material `ListView` or `CustomScrollView`; the assistant message feed and project lists must not be constructed from a static scrolling column. Every networked action exposes idle, sending, success, empty, and error states.

## Color Choices

| Token           | Color     | Intended use                                        |
| --------------- | --------- | --------------------------------------------------- |
| Omni violet     | `#7558F6` | Primary actions, selected navigation, focus states. |
| Deep ink        | `#171B2E` | Titles and high-contrast content.                   |
| Cloud mist      | `#F7F7FC` | Screen background.                                  |
| White           | `#FFFFFF` | Cards and raised content surfaces.                  |
| Lavender border | `#E7E7F2` | Card boundaries and quiet separators.               |
| Success green   | `#168A57` | Successful usage, upload, and billing states.       |
| Alert red       | `#C63754` | Destructive account actions and recoverable errors. |

## Accessibility and Privacy

Tap targets must be at least 48 logical pixels. Text alternatives and semantics labels are required for icon-only controls. Billing and destructive-account actions require clear confirmation. The app shows only public runtime configuration; credentials, payment secrets, and provider secrets remain server-side.
