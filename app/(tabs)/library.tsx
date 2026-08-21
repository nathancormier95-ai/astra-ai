import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { createConversation, DEFAULT_MODE, getMode, type Conversation } from "@/lib/astra-data";
import {
  loadConversations,
  saveConversations,
  setActiveConversationId,
} from "@/lib/astra-storage";
import { haptic } from "@/lib/haptics";

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function LibraryScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const refresh = useCallback(async () => {
    setConversations(await loadConversations());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const openConversation = async (conversation: Conversation) => {
    haptic.light();
    await setActiveConversationId(conversation.id);
    router.navigate("/");
  };

  const startNewConversation = async () => {
    haptic.light();
    const conversation = createConversation(DEFAULT_MODE);
    await saveConversations([conversation, ...conversations]);
    await setActiveConversationId(conversation.id);
    router.navigate("/");
  };

  const confirmDelete = (conversation: Conversation) => {
    Alert.alert("Delete conversation?", "This removes the conversation from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          haptic.medium();
          const nextConversations = conversations.filter((item) => item.id !== conversation.id);
          setConversations(nextConversations);
          await saveConversations(nextConversations);
        },
      },
    ]);
  };

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <View className="flex-row items-center justify-between pt-3 pb-5">
        <View>
          <Text className="text-3xl font-bold text-foreground">Library</Text>
          <Text className="mt-1 text-sm text-muted">Your recent conversations</Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Start a new conversation"
          className="h-11 w-11 items-center justify-center rounded-full bg-primary"
          onPress={startNewConversation}
          activeOpacity={0.75}
          style={styles.roundButton}
        >
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(conversation) => conversation.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={conversations.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <View className="items-center rounded-3xl border border-border bg-surface px-8 py-10">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-primary-light">
              <MaterialIcons name="forum" size={28} color="#6D5EF6" />
            </View>
            <Text className="text-lg font-semibold text-foreground">No conversations yet</Text>
            <Text className="mt-2 text-center text-sm leading-5 text-muted">
              Start a chat with Astra and it will be saved here on this device.
            </Text>
            <TouchableOpacity
              className="mt-6 rounded-full bg-primary px-5 py-3"
              onPress={startNewConversation}
              activeOpacity={0.75}
              style={styles.primaryButton}
            >
              <Text className="font-semibold text-white">Start a chat</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: conversation }) => {
          const mode = getMode(conversation.modeId);
          const preview = conversation.messages.at(-1)?.content ?? "New conversation";
          return (
            <TouchableOpacity
              className="mb-3 flex-row items-center rounded-2xl border border-border bg-surface p-4"
              onPress={() => void openConversation(conversation)}
              activeOpacity={0.75}
              style={styles.row}
            >
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-primary-light">
                <MaterialIcons name={mode.icon as "auto-awesome"} size={21} color="#6D5EF6" />
              </View>
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={1}>
                    {conversation.title}
                  </Text>
                  <Text className="text-xs text-muted">{formatUpdatedAt(conversation.updatedAt)}</Text>
                </View>
                <Text className="mt-1 text-sm text-muted" numberOfLines={1}>
                  {preview}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityLabel={`Delete ${conversation.title}`}
                className="ml-2 h-10 w-8 items-center justify-center"
                onPress={() => confirmDelete(conversation)}
                activeOpacity={0.65}
                style={styles.iconButton}
              >
                <MaterialIcons name="more-horiz" size={22} color="#5D5D71" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  emptyList: { flexGrow: 1, justifyContent: "center", paddingBottom: 96 },
  iconButton: { justifyContent: "center" },
  list: { paddingBottom: 96 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  primaryButton: { alignSelf: "center" },
  roundButton: { shadowColor: "#6D5EF6", shadowOpacity: 0.22, shadowRadius: 10, elevation: 4 },
  row: { minHeight: 80 },
});
