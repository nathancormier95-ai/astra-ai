import { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { haptic } from "@/lib/haptics";
import { trpc } from "@/lib/trpc";

export default function ProjectsScreen() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const projectsQuery = trpc.workspace.projects.list.useQuery(undefined, { enabled: isAuthenticated });
  const createProject = trpc.workspace.projects.create.useMutation({
    onSuccess: async () => {
      setName("");
      setDescription("");
      setIsCreating(false);
      await projectsQuery.refetch();
      haptic.success();
    },
  });

  const submitProject = async () => {
    if (!name.trim() || createProject.isPending) return;
    haptic.light();
    await createProject.mutateAsync({ name: name.trim(), description: description.trim() || undefined, color: "violet" });
  };

  if (loading) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color="#6D5EF6" /></ScreenContainer>;
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="px-5" containerClassName="bg-background">
        <View className="flex-1 items-center justify-center rounded-3xl border border-border bg-surface px-7">
          <View className="mb-5 h-14 w-14 items-center justify-center rounded-2xl bg-primary-light"><MaterialIcons name="folder-open" size={28} color="#6D5EF6" /></View>
          <Text className="text-xl font-bold text-foreground">Projects are private</Text>
          <Text className="mt-2 text-center text-sm leading-5 text-muted">Sign in to keep project context, documents, and conversations together across devices.</Text>
          <TouchableOpacity className="mt-6 rounded-full bg-primary px-5 py-3" onPress={() => router.push("/account")} activeOpacity={0.75}><Text className="font-semibold text-white">Go to account</Text></TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <FlatList
        data={projectsQuery.data ?? []}
        keyExtractor={(project) => project.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View className="pt-3 pb-5">
            <View className="flex-row items-center justify-between">
              <View><Text className="text-3xl font-bold text-foreground">Projects</Text><Text className="mt-1 text-sm text-muted">Organize work that matters</Text></View>
              <TouchableOpacity className="h-11 w-11 items-center justify-center rounded-full bg-primary" onPress={() => setIsCreating((value) => !value)} activeOpacity={0.75}><MaterialIcons name={isCreating ? "close" : "add"} size={24} color="#FFFFFF" /></TouchableOpacity>
            </View>
            {isCreating ? (
              <View className="mt-5 rounded-3xl border border-border bg-surface p-4">
                <Text className="font-semibold text-foreground">New project</Text>
                <TextInput value={name} onChangeText={setName} placeholder="Project name" placeholderTextColor="#8B8A9E" className="mt-4 rounded-xl border border-border px-3 py-3 text-base text-foreground" returnKeyType="next" />
                <TextInput value={description} onChangeText={setDescription} placeholder="What are you working on? (optional)" placeholderTextColor="#8B8A9E" multiline className="mt-3 min-h-20 rounded-xl border border-border px-3 py-3 text-base text-foreground" />
                <TouchableOpacity className="mt-4 items-center rounded-full bg-primary py-3" onPress={() => void submitProject()} activeOpacity={0.75}><Text className="font-semibold text-white">{createProject.isPending ? "Creating…" : "Create project"}</Text></TouchableOpacity>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={projectsQuery.isLoading ? <ActivityIndicator color="#6D5EF6" /> : <View className="items-center rounded-3xl border border-border bg-surface px-7 py-10"><MaterialIcons name="folder" size={30} color="#6D5EF6" /><Text className="mt-4 text-lg font-semibold text-foreground">Start a focused workspace</Text><Text className="mt-2 text-center text-sm leading-5 text-muted">Create a project to group its chats and documents in one private place.</Text></View>}
        renderItem={({ item: project }) => (
          <TouchableOpacity className="mb-3 rounded-3xl border border-border bg-surface p-5" onPress={() => router.push("/chat")} activeOpacity={0.75}>
            <View className="flex-row items-start"><View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-primary-light"><MaterialIcons name="folder" size={22} color="#6D5EF6" /></View><View className="flex-1"><Text className="text-lg font-bold text-foreground">{project.name}</Text>{project.description ? <Text className="mt-1 text-sm leading-5 text-muted" numberOfLines={2}>{project.description}</Text> : <Text className="mt-1 text-sm text-muted">No project description yet</Text>}</View><MaterialIcons name="chevron-right" size={22} color="#8B8A9E" /></View>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ list: { paddingBottom: 104 } });
