export type AssistantModeId = "general" | "writer" | "learn" | "plan" | "code";

export type AssistantMode = {
  id: AssistantModeId;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  suggestions: string[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  modeId: AssistantModeId;
  messages: ChatMessage[];
  updatedAt: string;
};

export type AppPreferences = {
  hapticsEnabled: boolean;
};

export const DEFAULT_MODE: AssistantModeId = "general";

export const ASSISTANT_MODES: AssistantMode[] = [
  {
    id: "general",
    name: "General",
    description: "Everyday answers, ideas, and clear explanations.",
    icon: "auto-awesome",
    systemPrompt:
      "You are Astra, a thoughtful all-purpose AI assistant. Be warm, clear, practical, and concise. Ask a focused clarifying question only when needed.",
    suggestions: ["Help me think through an idea", "Explain a topic simply", "Give me a fresh perspective"],
  },
  {
    id: "writer",
    name: "Writer",
    description: "Draft, revise, summarize, and sharpen your words.",
    icon: "edit-note",
    systemPrompt:
      "You are Astra in Writer mode. Help users draft and improve writing with strong structure, concise language, and an appropriate tone. Offer polished text when requested.",
    suggestions: ["Rewrite this more clearly", "Draft a professional email", "Help me outline an article"],
  },
  {
    id: "learn",
    name: "Learn",
    description: "Build understanding with plain-language teaching.",
    icon: "school",
    systemPrompt:
      "You are Astra in Learn mode. Teach through intuitive explanations, small examples, and encouraging step-by-step guidance. Match the user’s apparent knowledge level.",
    suggestions: ["Teach me a concept", "Quiz me on a topic", "Make a study plan"],
  },
  {
    id: "plan",
    name: "Plan",
    description: "Turn goals into realistic next steps and checklists.",
    icon: "event-note",
    systemPrompt:
      "You are Astra in Plan mode. Turn goals into a practical, prioritized plan. State assumptions, identify dependencies, and keep the next action easy to start.",
    suggestions: ["Plan my week", "Break down a big project", "Create a decision framework"],
  },
  {
    id: "code",
    name: "Code",
    description: "Debug, explain, and write clean code with context.",
    icon: "terminal",
    systemPrompt:
      "You are Astra in Code mode. Give technically accurate, secure, and maintainable programming guidance. Explain trade-offs and provide focused examples when useful.",
    suggestions: ["Help debug an error", "Explain this code", "Sketch a small feature"],
  },
];

export function getMode(modeId: AssistantModeId): AssistantMode {
  return ASSISTANT_MODES.find((mode) => mode.id === modeId) ?? ASSISTANT_MODES[0];
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createAssistantMessage(modeId: AssistantModeId): ChatMessage {
  const mode = getMode(modeId);
  return {
    id: createId("message"),
    role: "assistant",
    content: `Hi, I’m Astra. You’re in ${mode.name} mode. What would you like to work on?`,
    createdAt: new Date().toISOString(),
  };
}

export function createConversation(modeId: AssistantModeId = DEFAULT_MODE): Conversation {
  const now = new Date().toISOString();
  return {
    id: createId("conversation"),
    title: "New conversation",
    modeId,
    messages: [createAssistantMessage(modeId)],
    updatedAt: now,
  };
}

export function makeConversationTitle(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= 42) return normalized || "New conversation";
  return `${normalized.slice(0, 42).trim()}…`;
}

export function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort(
    (first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
  );
}
