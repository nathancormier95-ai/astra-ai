import type { ChatMessage } from "../lib/astra-data";

export const ASTRA_MODEL = "gpt-5-mini";
export const MAX_CONTEXT_MESSAGES = 12;

export const OMNIMIND_MODELS = [
  {
    id: "gpt-5-mini",
    name: "Quick",
    description: "Fast, capable everyday chat",
    plan: "free",
  },
  {
    id: "gpt-5",
    name: "Reason",
    description: "Deeper reasoning for demanding work",
    plan: "premium",
  },
  {
    id: "gemini-3-flash-preview",
    name: "Visual",
    description: "Long-context and multimodal help",
    plan: "premium",
  },
] as const;

export type OmniMindModelId = (typeof OMNIMIND_MODELS)[number]["id"];

export function getOmniMindModel(modelId: string) {
  return OMNIMIND_MODELS.find((model) => model.id === modelId);
}

type AssistantMessageInput = Pick<ChatMessage, "role" | "content">;

export function buildAstraMessages(modeSystemPrompt: string, messages: AssistantMessageInput[]) {
  const boundedMessages = messages
    .slice(-MAX_CONTEXT_MESSAGES)
    .map((message) => ({ role: message.role, content: message.content.trim() }));

  return [
    {
      role: "system" as const,
      content:
        "You are OmniMind, an all-in-one AI assistant in a mobile chat app. Be accurate, approachable, and use compact Markdown only when it improves clarity. Do not claim to have completed external actions, accessed private data, or used tools unless that actually occurred.",
    },
    { role: "system" as const, content: modeSystemPrompt.trim() },
    ...boundedMessages,
  ];
}
