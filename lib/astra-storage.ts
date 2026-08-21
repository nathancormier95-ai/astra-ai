import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AppPreferences, Conversation } from "@/lib/astra-data";
import { sortConversations } from "@/lib/astra-data";

const CONVERSATIONS_KEY = "astra.conversations.v1";
const ACTIVE_CONVERSATION_KEY = "astra.active-conversation.v1";
const PREFERENCES_KEY = "astra.preferences.v1";

const DEFAULT_PREFERENCES: AppPreferences = {
  hapticsEnabled: true,
};

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function loadConversations(): Promise<Conversation[]> {
  const saved = await AsyncStorage.getItem(CONVERSATIONS_KEY);
  const conversations = parseJson<Conversation[]>(saved, []);
  return Array.isArray(conversations) ? sortConversations(conversations) : [];
}

export async function saveConversations(conversations: Conversation[]): Promise<void> {
  await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(sortConversations(conversations)));
}

export async function loadActiveConversationId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_CONVERSATION_KEY);
}

export async function setActiveConversationId(id: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
}

export async function loadPreferences(): Promise<AppPreferences> {
  const saved = await AsyncStorage.getItem(PREFERENCES_KEY);
  return { ...DEFAULT_PREFERENCES, ...parseJson<Partial<AppPreferences>>(saved, {}) };
}

export async function savePreferences(preferences: AppPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export async function clearAstraData(): Promise<void> {
  await AsyncStorage.multiRemove([CONVERSATIONS_KEY, ACTIVE_CONVERSATION_KEY]);
}
