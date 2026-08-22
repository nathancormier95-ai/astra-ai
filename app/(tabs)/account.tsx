import { useCallback } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { haptic } from "@/lib/haptics";
import { startOAuthLogin } from "@/constants/oauth";
import { trpc } from "@/lib/trpc";

function UsageRow({ label, used, limit, icon }: { label: string; used: number; limit: number; icon: "chat" | "image" | "description" | "mic" }) {
  const percent = Math.min((used / limit) * 100, 100);
  return (
    <View className="mb-4">
      <View className="mb-1.5 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <MaterialIcons name={icon} size={16} color="#6D5EF6" />
          <Text className="ml-2 text-sm font-medium text-foreground">{label}</Text>
        </View>
        <Text className="text-xs text-muted">{used} / {limit}</Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-primary-light">
        <View className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </View>
    </View>
  );
}

export default function AccountScreen() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const preferencesQuery = trpc.workspace.preferences.useQuery(undefined, { enabled: isAuthenticated });
  const usageQuery = trpc.workspace.usage.useQuery(undefined, { enabled: isAuthenticated });
  const updatePrivacyMutation = trpc.workspace.updatePrivacy.useMutation({ onSuccess: () => preferencesQuery.refetch() });
  const deleteAccountMutation = trpc.workspace.deleteAccountData.useMutation();

  const beginSignIn = async () => {
    haptic.light();
    await startOAuthLogin();
  };

  const confirmDeleteData = useCallback(() => {
    Alert.alert(
      "Delete OmniMind data?",
      "This removes your saved projects, conversations, document references, preferences, and usage history. Uploaded files become inaccessible. Your sign-in provider may retain its separate identity record.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account data",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccountMutation.mutateAsync();
              await logout();
              haptic.success();
            } catch {
              haptic.error();
              Alert.alert("Couldn’t delete data", "Please try again shortly.");
            }
          },
        },
      ],
    );
  }, [deleteAccountMutation, logout]);

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator color="#6D5EF6" />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="px-5" containerClassName="bg-background">
        <View className="flex-1 justify-center">
          <View className="rounded-3xl border border-border bg-surface p-6">
            <View className="mb-5 h-14 w-14 items-center justify-center rounded-2xl bg-primary-light">
              <MaterialIcons name="shield" size={28} color="#6D5EF6" />
            </View>
            <Text className="text-2xl font-bold text-foreground">Your private workspace</Text>
            <Text className="mt-3 text-base leading-6 text-muted">
              Sign in to save projects and conversations across devices, manage your usage plan, and control your data.
            </Text>
            <TouchableOpacity
              className="mt-6 items-center rounded-full bg-primary px-5 py-3.5"
              onPress={() => void beginSignIn()}
              activeOpacity={0.75}
            >
              <Text className="font-semibold text-white">Sign in to OmniMind</Text>
            </TouchableOpacity>
            <Text className="mt-4 text-center text-xs leading-4 text-muted">
              We collect only what is needed to run your workspace. You can delete your data from this screen after signing in.
            </Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const plan = usageQuery.data?.plan ?? "free";
  const usage = usageQuery.data?.actions;
  const displayName = user?.name || user?.email || "OmniMind member";
  const allowAiTraining = preferencesQuery.data?.allowAiTraining ?? false;

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View className="pt-3 pb-5">
          <Text className="text-3xl font-bold text-foreground">Account</Text>
          <Text className="mt-1 text-sm text-muted">Privacy, plan, and workspace controls</Text>
        </View>

        <View className="flex-row items-center rounded-3xl border border-border bg-surface p-4">
          <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <Text className="text-lg font-bold text-white">{displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground" numberOfLines={1}>{displayName}</Text>
            <Text className="mt-0.5 text-sm text-muted" numberOfLines={1}>{user?.email || "Signed-in workspace"}</Text>
          </View>
          <View className={plan === "premium" ? "rounded-full bg-warning-light px-2.5 py-1" : "rounded-full bg-primary-light px-2.5 py-1"}>
            <Text className={plan === "premium" ? "text-xs font-bold text-warning" : "text-xs font-bold text-primary"}>
              {plan === "premium" ? "PREMIUM" : "FREE"}
            </Text>
          </View>
        </View>

        <Text className="mb-2 mt-7 ml-1 text-xs font-bold uppercase tracking-wider text-muted">Monthly allowance</Text>
        <View className="rounded-3xl border border-border bg-surface p-4">
          {usage ? (
            <>
              <UsageRow label="AI chats" icon="chat" used={usage.chat.used} limit={usage.chat.limit} />
              <UsageRow label="Images" icon="image" used={usage.image.used} limit={usage.image.limit} />
              <UsageRow label="Documents" icon="description" used={usage.document.used} limit={usage.document.limit} />
              <UsageRow label="Voice inputs" icon="mic" used={usage.voice.used} limit={usage.voice.limit} />
            </>
          ) : <ActivityIndicator color="#6D5EF6" />}
          <Text className="mt-1 text-xs leading-4 text-muted">Usage resets at the start of each calendar month. Limits are shown before an AI request is run.</Text>
        </View>

        <Text className="mb-2 mt-7 ml-1 text-xs font-bold uppercase tracking-wider text-muted">Premium</Text>
        <View className="rounded-3xl border border-border bg-surface p-5">
          <View className="flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-warning-light">
              <MaterialIcons name="workspace-premium" size={22} color="#E69B19" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-foreground">More room for serious work</Text>
              <Text className="mt-1 text-sm leading-5 text-muted">Premium adds larger monthly allowances plus Reason and Visual model access.</Text>
            </View>
          </View>
          <Text className="mt-4 text-xs leading-4 text-muted">Billing is intentionally not enabled in this first release. Plan benefits are visible and enforced, while payment processing is added only after the core workspace is stable.</Text>
        </View>

        <Text className="mb-2 mt-7 ml-1 text-xs font-bold uppercase tracking-wider text-muted">Privacy</Text>
        <View className="overflow-hidden rounded-3xl border border-border bg-surface">
          <View className="flex-row items-center justify-between px-4 py-4">
            <View className="mr-3 flex-1">
              <Text className="font-semibold text-foreground">Help improve OmniMind</Text>
              <Text className="mt-1 text-sm leading-5 text-muted">Off by default. This preference is recorded before any future improvement program is introduced.</Text>
            </View>
            <Switch
              value={allowAiTraining}
              onValueChange={(value) => void updatePrivacyMutation.mutateAsync({ allowAiTraining: value })}
              disabled={updatePrivacyMutation.isPending}
              trackColor={{ false: "#D8D7E6", true: "#B8B0FF" }}
              thumbColor={allowAiTraining ? "#6D5EF6" : "#FFFFFF"}
            />
          </View>
          <View className="mx-4 h-px bg-border" />
          <View className="flex-row px-4 py-4">
            <MaterialIcons name="lock-outline" size={21} color="#6D5EF6" />
            <Text className="ml-3 flex-1 text-sm leading-5 text-muted">Saved workspace content stays private to your signed-in account until you delete it. See the included privacy document for retention details.</Text>
          </View>
        </View>

        <TouchableOpacity className="mt-7 items-center rounded-2xl border border-error px-4 py-4" onPress={confirmDeleteData} activeOpacity={0.7}>
          <Text className="font-semibold text-error">Delete account data</Text>
          <Text className="mt-1 text-center text-xs text-muted">Deletes saved workspace records and signs you out</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mt-3 items-center py-3" onPress={() => void logout()} activeOpacity={0.7}>
          <Text className="font-semibold text-muted">Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 104 },
});
