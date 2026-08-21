import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import {
  ASSISTANT_MODES,
  createConversation,
  getMode,
  makeConversationTitle,
  sortConversations,
  type AssistantMode,
  type ChatMessage,
  type Conversation,
} from "@/lib/astra-data";
import {
  loadActiveConversationId,
  loadConversations,
  loadPreferences,
  saveConversations,
  setActiveConversationId,
} from "@/lib/astra-storage";
import { haptic } from "@/lib/haptics";
import { trpc } from "@/lib/trpc";

function ModeSelector({ modeId, onChange }: { modeId: string; onChange: (mode: AssistantMode) => void }) {
  return (
    <FlatList
      horizontal
      data={ASSISTANT_MODES}
      keyExtractor={(mode) => mode.id}
      showsHorizontalScrollIndicator={false}
      style={styles.modeScroll}
      contentContainerStyle={styles.modeList}
      renderItem={({ item: mode }) => {
        const isSelected = mode.id === modeId;
        return (
          <TouchableOpacity
            className={isSelected ? "mr-2 flex-row items-center rounded-full bg-primary px-3 py-2" : "mr-2 flex-row items-center rounded-full border border-border bg-surface px-3 py-2"}
            onPress={() => onChange(mode)}
            activeOpacity={0.75}
            style={styles.modePill}
          >
            <MaterialIcons name={mode.icon as "auto-awesome"} size={16} color={isSelected ? "#FFFFFF" : "#6D5EF6"} />
            <Text className={isSelected ? "ml-1.5 text-sm font-semibold text-white" : "ml-1.5 text-sm font-semibold text-foreground"}>
              {mode.name}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

export default function HomeScreen() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const messageListRef = useRef<FlatList<ChatMessage>>(null);
  const chatMutation = trpc.assistant.chat.useMutation();

  const hydrate = useCallback(async () => {
    const [savedConversations, activeId, preferences] = await Promise.all([
      loadConversations(),
      loadActiveConversationId(),
      loadPreferences(),
    ]);
    const activeConversation = savedConversations.find((item) => item.id === activeId) ?? savedConversations[0];
    const nextConversation = activeConversation ?? createConversation();
    const nextConversations = activeConversation ? savedConversations : [nextConversation];
    if (!activeConversation) {
      await saveConversations(nextConversations);
      await setActiveConversationId(nextConversation.id);
    }
    setHapticsEnabled(preferences.hapticsEnabled);
    setConversations(nextConversations);
    setConversation(nextConversation);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void hydrate();
    }, [hydrate]),
  );

  const mode = useMemo(() => getMode(conversation?.modeId ?? "general"), [conversation?.modeId]);

  const persistConversation = useCallback(async (nextConversation: Conversation) => {
    const nextConversations = sortConversations([
      nextConversation,
      ...conversations.filter((item) => item.id !== nextConversation.id),
    ]);
    setConversation(nextConversation);
    setConversations(nextConversations);
    await saveConversations(nextConversations);
    await setActiveConversationId(nextConversation.id);
  }, [conversations]);

  const startNewConversation = async (modeId = mode.id) => {
    haptic.light(hapticsEnabled);
    const nextConversation = createConversation(modeId);
    await persistConversation(nextConversation);
    setInput("");
  };

  const selectMode = async (nextMode: AssistantMode) => {
    if (nextMode.id === mode.id) return;
    haptic.selection(hapticsEnabled);
    if (!conversation || conversation.messages.length > 1) {
      await startNewConversation(nextMode.id);
      return;
    }
    const updatedConversation: Conversation = {
      ...conversation,
      modeId: nextMode.id,
      messages: [
        {
          ...conversation.messages[0],
          content: `Hi, I’m Astra. You’re in ${nextMode.name} mode. What would you like to work on?`,
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    await persistConversation(updatedConversation);
  };

  const submitMessage = async (text = input) => {
    const content = text.trim();
    if (!content || !conversation || isThinking) return;
    haptic.light(hapticsEnabled);
    setInput("");
    const userMessage: ChatMessage = {
      id: `message-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    const updatedConversation: Conversation = {
      ...conversation,
      title: conversation.title === "New conversation" ? makeConversationTitle(content) : conversation.title,
      messages: [...conversation.messages, userMessage],
      updatedAt: new Date().toISOString(),
    };
    await persistConversation(updatedConversation);
    setIsThinking(true);
    try {
      const response = await chatMutation.mutateAsync({
        modeSystemPrompt: mode.systemPrompt,
        messages: updatedConversation.messages.slice(-12).map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });
      const assistantMessage: ChatMessage = {
        id: `message-${Date.now()}-astra`,
        role: "assistant",
        content: response.content,
        createdAt: new Date().toISOString(),
      };
      await persistConversation({
        ...updatedConversation,
        messages: [...updatedConversation.messages, assistantMessage],
        updatedAt: new Date().toISOString(),
      });
      haptic.success(hapticsEnabled);
    } catch {
      const errorMessage: ChatMessage = {
        id: `message-${Date.now()}-error`,
        role: "assistant",
        content: "I couldn’t complete that request right now. Please check your connection and try again.",
        createdAt: new Date().toISOString(),
      };
      await persistConversation({
        ...updatedConversation,
        messages: [...updatedConversation.messages, errorMessage],
        updatedAt: new Date().toISOString(),
      });
      haptic.error(hapticsEnabled);
    } finally {
      setIsThinking(false);
    }
  };

  if (isLoading || !conversation) {
    return (
      <ScreenContainer className="items-center justify-center" containerClassName="bg-background">
        <ActivityIndicator size="small" color="#6D5EF6" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
          <View>
            <View className="flex-row items-center">
              <Text className="text-3xl font-bold text-foreground">Astra</Text>
              <View className="ml-2 flex-row items-center rounded-full bg-success-light px-2 py-1">
                <View className="mr-1 h-1.5 w-1.5 rounded-full bg-success" />
                <Text className="text-xs font-semibold text-success">Online</Text>
              </View>
            </View>
            <Text className="mt-1 text-sm text-muted">Your all-in-one AI assistant</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Start a new conversation"
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
            onPress={() => void startNewConversation()}
            activeOpacity={0.75}
            style={styles.newButton}
          >
            <MaterialIcons name="edit-square" size={21} color="#6D5EF6" />
          </TouchableOpacity>
        </View>

        <ModeSelector modeId={mode.id} onChange={(nextMode) => void selectMode(nextMode)} />

        <FlatList
          ref={messageListRef}
          className="flex-1 px-5"
          data={conversation.messages}
          keyExtractor={(message) => message.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => messageListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item: message }) => (
            <View className={message.role === "user" ? "mb-4 items-end" : "mb-4 items-start"}>
              <View className={message.role === "user" ? "max-w-[88%] rounded-3xl rounded-br-md bg-primary px-4 py-3" : "max-w-[90%] rounded-3xl rounded-bl-md border border-border bg-surface px-4 py-3"}>
                <Text className={message.role === "user" ? "text-base leading-6 text-white" : "text-base leading-6 text-foreground"}>
                  {message.content}
                </Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            isThinking ? (
              <View className="mb-4 items-start">
                <View className="flex-row items-center rounded-3xl rounded-bl-md border border-border bg-surface px-4 py-3">
                  <ActivityIndicator size="small" color="#6D5EF6" />
                  <Text className="ml-2 text-sm font-medium text-muted">Astra is thinking…</Text>
                </View>
              </View>
            ) : null
          }
        />

        <View className="border-t border-border bg-background px-5 pt-3">
          {conversation.messages.length === 1 && !isThinking ? (
            <FlatList
              horizontal
              data={mode.suggestions}
              keyExtractor={(suggestion) => suggestion}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionList}
              renderItem={({ item: suggestion }) => (
                <TouchableOpacity
                  className="mr-2 rounded-full border border-border bg-surface px-3 py-2"
                  onPress={() => void submitMessage(suggestion)}
                  activeOpacity={0.75}
                  style={styles.suggestion}
                >
                  <Text className="text-sm text-foreground">{suggestion}</Text>
                </TouchableOpacity>
              )}
            />
          ) : null}
          <View className="mb-1 flex-row items-end rounded-3xl border border-border bg-surface px-3 py-2">
            <TextInput
              className="max-h-28 min-h-11 flex-1 px-2 py-2 text-base text-foreground"
              value={input}
              onChangeText={setInput}
              placeholder={`Ask Astra in ${mode.name} mode…`}
              placeholderTextColor="#8B8A9E"
              multiline
              editable={!isThinking}
              returnKeyType="send"
              onSubmitEditing={() => void submitMessage()}
            />
            <TouchableOpacity
              accessibilityLabel="Send message"
              disabled={!input.trim() || isThinking}
              className={input.trim() && !isThinking ? "mb-1 h-10 w-10 items-center justify-center rounded-full bg-primary" : "mb-1 h-10 w-10 items-center justify-center rounded-full bg-border"}
              onPress={() => void submitMessage()}
              activeOpacity={0.75}
              style={styles.sendButton}
            >
              <MaterialIcons name="arrow-upward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text className="pb-2 text-center text-xs text-muted">Astra can make mistakes. Verify important details.</Text>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  messages: { flexGrow: 1, justifyContent: "flex-end", paddingTop: 20, paddingBottom: 12 },
  modeList: { paddingHorizontal: 20, paddingVertical: 10 },
  modePill: { minHeight: 36 },
  modeScroll: { flexGrow: 0, height: 56 },
  newButton: { shadowColor: "#6D5EF6", shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  sendButton: { minWidth: 40 },
  suggestion: { minHeight: 36 },
  suggestionList: { paddingBottom: 10 },
});
