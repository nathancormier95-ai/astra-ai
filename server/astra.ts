import type { ChatMessage } from "../lib/astra-data";

export const ASTRA_MODEL = "gpt-5-mini";
export const MAX_CONTEXT_MESSAGES = 12;

type AssistantMessageInput = Pick<ChatMessage, "role" | "content">;

export function buildAstraMessages(modeSystemPrompt: string, messages: AssistantMessageInput[]) {
  const boundedMessages = messages
    .slice(-MAX_CONTEXT_MESSAGES)
    .map((message) => ({ role: message.role, content: message.content.trim() }));

  return [
    {
      role: "system" as const,
      content:
        "You are Astra, an all-in-one AI assistant in a mobile chat app. Be accurate, approachable, and use compact Markdown only when it improves clarity. Do not claim to have completed external actions, accessed private data, or used tools unless that actually occurred.",
    },
    { role: "system" as const, content: modeSystemPrompt.trim() },
    ...boundedMessages,
  ];
}
