# OmniMind Mobile Design

## Product Intent

OmniMind is an all-in-one AI chat assistant for quick everyday help. The portrait-first interface prioritizes a familiar messaging flow, clear mode selection, and compact controls that can be reached with one hand. The visual language follows iOS Human Interface Guidelines conventions—generous spacing, readable typography, obvious hierarchy, and a simple bottom tab bar—while remaining well suited to Android.

## Screen List

| Screen | Primary content and functionality |
|---|---|
| **Dashboard** | A private workspace overview with usage allowance, recent projects, active plan, and direct entry points for chat, documents, images, and code. |
| **Assistant** | A full chat view with mode-aware greeting, conversation bubbles, suggested prompts, an expandable mode selector, text composer, send action, and a start-over control. |
| **Library** | A local history of saved conversations. Users can reopen a thread, start a new conversation, or delete a saved thread. |
| **Projects** | A project list with saved context, linked conversations, document references, and a direct action to begin work in a project. |
| **Tools** | A focused catalog for document questions, image generation, and Code mode. It deliberately excludes autonomous agents and video generation in the first release. |
| **Account and Privacy** | Account sign-in, Free and Premium plan explanation, current usage allowance, local preferences, retention disclosure, and account-data deletion. |

## Key User Flows

| User goal | Flow |
|---|---|
| Start a general chat | Assistant tab → enter a message or tap a suggested prompt → send → AI reply appears in the existing conversation. |
| Sign in and save work | Dashboard → tap sign in → complete provider authentication → dashboard refreshes with account-scoped workspace data. |
| Ask about a document | Assistant → attach a PDF or text file → choose “Ask document” → send a question → the document is used only for the requested answer. |
| Create an image | Tools → Image generation → enter a prompt → generate → result appears in the workspace. |
| Manage privacy | Account → Privacy and data → review retention statement → delete individual items or delete account data. |
| Work in a specialist mode | Assistant tab → tap the active mode pill → choose a mode → greeting and suggested prompts update → send a request. |
| Continue a prior request | Library tab → tap a saved conversation → Assistant tab opens with that thread loaded. |
| Start clean | Assistant tab → tap new conversation → fresh conversation begins in the currently selected mode. |
| Adjust preferences | Settings tab → modify color appearance or haptics → preferences persist locally. |

## Layout and Interaction Details

The Assistant screen uses a large title and subtle model-status indicator at the top, a scrollable message timeline in the center, and a bottom-anchored composer. The mode selector is a compact horizontal card rather than a high-reaching toolbar, so mode changes remain near the message field. Tap targets are at least 44 points. Conversations use high-contrast bubbles with assistant replies on a soft elevated surface and user prompts on the purple brand color.

The Library screen uses a native-style list with date-group labels and concise one-line previews. Explore presents modes as large, pressable cards. Settings uses grouped, native-form-style rows. Every interaction has visual press feedback; optional haptics enhance primary actions without becoming distracting.

The expanded workspace follows the same one-handed portrait layout. Dashboard actions are large cards in the upper half of the screen. The chat composer keeps attachment, microphone, and send controls within thumb reach. Account and privacy controls are organized in grouped rows with destructive actions separated visually from routine preferences.

## Color Choices

| Token | Color | Intended use |
|---|---|---|
| **Ink** | `#121225` | Primary text and deep dark background. |
| **Violet** | `#6D5EF6` | Primary actions, active indicators, and user messages. |
| **Lilac** | `#E9E6FF` | Soft accent surfaces and selected-mode backgrounds. |
| **Cloud** | `#F7F7FC` | Light app background. |
| **Graphite** | `#5D5D71` | Secondary text. |
| **Mint** | `#2CB67D` | Live-service status and successful states. |

## Data Model

| Entity | Fields |
|---|---|
| **AssistantMode** | `id`, `name`, `description`, `systemPrompt`, `suggestions`, `icon`. |
| **ChatMessage** | `id`, `role`, `content`, `createdAt`. |
| **Conversation** | `id`, `title`, `modeId`, `messages`, `updatedAt`. |
| **AppPreferences** | `appearance`, `hapticsEnabled`. |

Chat history and preferences are stored locally on the device. The AI request itself goes to the app server, where model credentials remain protected.
