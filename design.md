# Astra Mobile Design

## Product Intent

Astra is an all-in-one AI chat assistant for quick everyday help. The portrait-first interface prioritizes a familiar messaging flow, clear mode selection, and compact controls that can be reached with one hand. The visual language follows iOS Human Interface Guidelines conventions—generous spacing, readable typography, obvious hierarchy, and a simple bottom tab bar—while remaining well suited to Android.

## Screen List

| Screen | Primary content and functionality |
|---|---|
| **Assistant** | A full chat view with mode-aware greeting, conversation bubbles, suggested prompts, an expandable mode selector, text composer, send action, and a start-over control. |
| **Library** | A local history of saved conversations. Users can reopen a thread, start a new conversation, or delete a saved thread. |
| **Explore** | A compact catalog of assistant modes—General, Writer, Learn, Plan, and Code—with a short explanation of each mode and a direct “use this mode” action. |
| **Settings** | Appearance preference, haptics preference, information about on-device chat history, and a data-reset control. |

## Key User Flows

| User goal | Flow |
|---|---|
| Start a general chat | Assistant tab → enter a message or tap a suggested prompt → send → AI reply appears in the existing conversation. |
| Work in a specialist mode | Assistant tab → tap the active mode pill → choose a mode → greeting and suggested prompts update → send a request. |
| Continue a prior request | Library tab → tap a saved conversation → Assistant tab opens with that thread loaded. |
| Start clean | Assistant tab → tap new conversation → fresh conversation begins in the currently selected mode. |
| Adjust preferences | Settings tab → modify color appearance or haptics → preferences persist locally. |

## Layout and Interaction Details

The Assistant screen uses a large title and subtle model-status indicator at the top, a scrollable message timeline in the center, and a bottom-anchored composer. The mode selector is a compact horizontal card rather than a high-reaching toolbar, so mode changes remain near the message field. Tap targets are at least 44 points. Conversations use high-contrast bubbles with assistant replies on a soft elevated surface and user prompts on the purple brand color.

The Library screen uses a native-style list with date-group labels and concise one-line previews. Explore presents modes as large, pressable cards. Settings uses grouped, native-form-style rows. Every interaction has visual press feedback; optional haptics enhance primary actions without becoming distracting.

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
