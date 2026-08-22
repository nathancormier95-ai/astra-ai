import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { ASSISTANT_MODES, createConversation, type AssistantMode } from "@/lib/astra-data";
import { loadConversations, saveConversations, setActiveConversationId } from "@/lib/astra-storage";
import { haptic } from "@/lib/haptics";

export default function ExploreScreen() {
  const router = useRouter();

  const useMode = async (mode: AssistantMode) => {
    haptic.selection();
    const conversation = createConversation(mode.id);
    const conversations = await loadConversations();
    await saveConversations([conversation, ...conversations]);
    await setActiveConversationId(conversation.id);
    router.navigate("/chat");
  };

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <FlatList
        data={ASSISTANT_MODES}
        keyExtractor={(mode) => mode.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View className="pt-3 pb-5">
            <Text className="text-3xl font-bold text-foreground">Explore</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">
              Choose a focused workspace for the way you want OmniMind to help.
            </Text>
          </View>
        }
        renderItem={({ item: mode }) => (
          <TouchableOpacity
            className="mb-3 rounded-3xl border border-border bg-surface p-5"
            onPress={() => void useMode(mode)}
            activeOpacity={0.76}
            style={styles.modeCard}
          >
            <View className="flex-row items-start justify-between">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-light">
                <MaterialIcons name={mode.icon as "auto-awesome"} size={24} color="#6D5EF6" />
              </View>
              <MaterialIcons name="arrow-forward" size={20} color="#6D5EF6" />
            </View>
            <Text className="mt-5 text-xl font-bold text-foreground">{mode.name}</Text>
            <Text className="mt-2 text-sm leading-5 text-muted">{mode.description}</Text>
            <View className="mt-4 self-start rounded-full bg-primary-light px-3 py-1.5">
              <Text className="text-xs font-semibold text-primary">Use {mode.name} mode</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 96 },
  modeCard: { minHeight: 178 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
});
