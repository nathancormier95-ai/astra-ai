import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

function QuickAction({ icon, title, detail, onPress }: { icon: "chat" | "folder" | "description" | "image"; title: string; detail: string; onPress: () => void }) {
  return (
    <TouchableOpacity className="mb-3 flex-row items-center rounded-3xl border border-border bg-surface p-4" onPress={onPress} activeOpacity={0.75}>
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-primary-light"><MaterialIcons name={icon} size={22} color="#6D5EF6" /></View>
      <View className="flex-1"><Text className="font-semibold text-foreground">{title}</Text><Text className="mt-0.5 text-sm text-muted">{detail}</Text></View>
      <MaterialIcons name="arrow-forward" size={19} color="#6D5EF6" />
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const dashboardQuery = trpc.workspace.dashboard.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color="#6D5EF6" /></ScreenContainer>;
  if (!isAuthenticated) {
    return (
      <ScreenContainer className="px-5" containerClassName="bg-background">
        <View className="flex-1 justify-center">
          <View className="rounded-3xl border border-border bg-surface p-6"><View className="mb-5 h-14 w-14 items-center justify-center rounded-2xl bg-primary"><Text className="text-2xl font-bold text-white">O</Text></View><Text className="text-3xl font-bold text-foreground">Work with clarity.</Text><Text className="mt-3 text-base leading-6 text-muted">OmniMind brings chat, documents, images, code, and projects into one privacy-conscious workspace.</Text><TouchableOpacity className="mt-6 items-center rounded-full bg-primary py-3.5" onPress={() => router.push("/account")} activeOpacity={0.75}><Text className="font-semibold text-white">Create your private workspace</Text></TouchableOpacity><TouchableOpacity className="mt-4 items-center py-2" onPress={() => router.push("/chat")} activeOpacity={0.7}><Text className="font-semibold text-primary">Try a local chat first</Text></TouchableOpacity></View>
        </View>
      </ScreenContainer>
    );
  }

  const dashboard = dashboardQuery.data;
  const chatUsage = dashboard?.usage.actions.chat;
  const name = user?.name?.split(" ")[0] || "there";
  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <FlatList
        data={dashboard?.recentProjects ?? []}
        keyExtractor={(project) => project.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<View className="pt-3 pb-5"><Text className="text-3xl font-bold text-foreground">Good to see you, {name}</Text><Text className="mt-1 text-sm text-muted">Your focused AI workspace</Text><View className="mt-5 rounded-3xl bg-primary p-5"><View className="flex-row items-center justify-between"><View><Text className="text-base font-semibold text-white">{dashboard?.usage.plan === "premium" ? "Premium workspace" : "Free workspace"}</Text><Text className="mt-1 text-sm text-white/80">{chatUsage ? `${chatUsage.remaining} chats left this month` : "Loading usage…"}</Text></View><MaterialIcons name="auto-awesome" size={28} color="#FFFFFF" /></View><TouchableOpacity className="mt-5 self-start rounded-full bg-white px-4 py-2.5" onPress={() => router.push("/account")} activeOpacity={0.75}><Text className="font-semibold text-primary">View plan and usage</Text></TouchableOpacity></View><Text className="mb-3 mt-7 ml-1 text-xs font-bold uppercase tracking-wider text-muted">Start something</Text><QuickAction icon="chat" title="Ask OmniMind" detail="Chat, plan, learn, write, or code" onPress={() => router.push("/chat")} /><QuickAction icon="folder" title="Create a project" detail="Keep related work together" onPress={() => router.push("/projects")} /><QuickAction icon="description" title="Ask a document" detail="Upload a PDF or text file" onPress={() => router.push("/chat")} /><QuickAction icon="image" title="Generate an image" detail="Create a visual from a prompt" onPress={() => router.push("/chat")} /><Text className="mb-3 mt-6 ml-1 text-xs font-bold uppercase tracking-wider text-muted">Recent projects</Text></View>}
        ListEmptyComponent={dashboardQuery.isLoading ? <ActivityIndicator color="#6D5EF6" /> : <View className="rounded-3xl border border-border bg-surface p-5"><Text className="font-semibold text-foreground">No projects yet</Text><Text className="mt-1 text-sm leading-5 text-muted">Create one when you want to keep chats and documents together.</Text></View>}
        renderItem={({ item }) => <TouchableOpacity className="mb-3 flex-row items-center rounded-3xl border border-border bg-surface p-4" onPress={() => router.push("/projects")} activeOpacity={0.75}><View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-primary-light"><MaterialIcons name="folder" size={20} color="#6D5EF6" /></View><View className="flex-1"><Text className="font-semibold text-foreground">{item.name}</Text><Text className="mt-0.5 text-sm text-muted" numberOfLines={1}>{item.description || "Open workspace"}</Text></View><MaterialIcons name="chevron-right" size={22} color="#8B8A9E" /></TouchableOpacity>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ list: { paddingBottom: 104 } });
