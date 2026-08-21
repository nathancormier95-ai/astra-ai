import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { clearAstraData, loadPreferences, savePreferences } from "@/lib/astra-storage";
import { haptic } from "@/lib/haptics";

export default function SettingsScreen() {
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  useEffect(() => {
    loadPreferences().then((preferences) => setHapticsEnabled(preferences.hapticsEnabled));
  }, []);

  const updateHaptics = async (enabled: boolean) => {
    setHapticsEnabled(enabled);
    haptic.medium(enabled);
    await savePreferences({ hapticsEnabled: enabled });
  };

  const clearHistory = useCallback(() => {
    Alert.alert(
      "Clear saved chats?",
      "This permanently removes every conversation stored on this device. Your preferences stay unchanged.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear history",
          style: "destructive",
          onPress: async () => {
            haptic.medium(hapticsEnabled);
            await clearAstraData();
          },
        },
      ],
    );
  }, [hapticsEnabled]);

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <View className="pt-3 pb-6">
        <Text className="text-3xl font-bold text-foreground">Settings</Text>
        <Text className="mt-1 text-sm text-muted">Control your Astra experience</Text>
      </View>

      <Text className="mb-2 ml-1 text-xs font-bold uppercase tracking-wider text-muted">Experience</Text>
      <View className="overflow-hidden rounded-3xl border border-border bg-surface">
        <View className="flex-row items-center justify-between px-4 py-4">
          <View className="mr-4 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
              <MaterialIcons name="vibration" size={21} color="#6D5EF6" />
            </View>
            <View>
              <Text className="font-semibold text-foreground">Haptic feedback</Text>
              <Text className="mt-0.5 text-sm text-muted">Gentle feedback for key actions</Text>
            </View>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={(value) => void updateHaptics(value)}
            trackColor={{ false: "#D8D7E6", true: "#B8B0FF" }}
            thumbColor={hapticsEnabled ? "#6D5EF6" : "#FFFFFF"}
          />
        </View>
        <View className="mx-4 h-px bg-border" />
        <View className="flex-row items-center px-4 py-4">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
            <MaterialIcons name="phone-android" size={21} color="#6D5EF6" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-foreground">Local-first history</Text>
            <Text className="mt-0.5 text-sm leading-5 text-muted">
              Your saved chats remain on this device unless you remove them.
            </Text>
          </View>
        </View>
      </View>

      <Text className="mb-2 mt-7 ml-1 text-xs font-bold uppercase tracking-wider text-muted">Data</Text>
      <View className="overflow-hidden rounded-3xl border border-border bg-surface">
        <TouchableOpacity
          className="flex-row items-center justify-between px-4 py-4"
          onPress={clearHistory}
          activeOpacity={0.7}
          style={styles.row}
        >
          <View className="flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-error-light">
              <MaterialIcons name="delete-outline" size={22} color="#E5484D" />
            </View>
            <View>
              <Text className="font-semibold text-error">Clear saved chats</Text>
              <Text className="mt-0.5 text-sm text-muted">Remove all conversations from this device</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#A4A3B3" />
        </TouchableOpacity>
      </View>

      <View className="mt-auto items-center pb-7">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary">
          <Text className="text-xl font-bold text-white">A</Text>
        </View>
        <Text className="mt-3 text-sm font-semibold text-foreground">Astra AI Assistant</Text>
        <Text className="mt-1 text-xs text-muted">Version 1.0.0</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  row: { minHeight: 72 },
});
