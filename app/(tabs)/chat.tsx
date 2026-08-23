import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import * as Speech from "expo-speech";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
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

type ModelId = "gpt-5-mini" | "gpt-5" | "gemini-3-flash-preview";
type AttachedDocument = { id: string; name: string };
type QuickAction = { id: string; label: string; icon: string; prompt: string };
type Flashcard = { question: string; answer: string };
type FlashcardSet = { sourceMessageId: string; cards: Flashcard[] };
const supportedDocumentTypes = ["application/pdf", "text/plain", "text/markdown", "text/csv"];
const QUICK_ACTIONS: QuickAction[] = [
  { id: "write", label: "Write", icon: "edit-note", prompt: "Help me write a clear, engaging " },
  { id: "rewrite", label: "Rewrite", icon: "auto-fix-high", prompt: "Rewrite the following for clarity and a [tone]: " },
  { id: "translate", label: "Translate", icon: "translate", prompt: "Translate the following into [language] while preserving the meaning: " },
  { id: "summarize", label: "Summarize", icon: "summarize", prompt: "Summarize the following into concise key points: " },
  { id: "ideas", label: "Brainstorm", icon: "lightbulb", prompt: "Brainstorm 10 practical ideas for " },
  { id: "study", label: "Study guide", icon: "school", prompt: "Create a study guide with a short quiz about " },
  { id: "social", label: "Social post", icon: "campaign", prompt: "Create 3 polished social posts for " },
];

function base64ByteSize(value: string): number {
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return Math.floor((value.length * 3) / 4) - padding;
}

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
        const selected = mode.id === modeId;
        return (
          <TouchableOpacity
            className={selected ? "mr-2 flex-row items-center rounded-full bg-primary px-3 py-2" : "mr-2 flex-row items-center rounded-full border border-border bg-surface px-3 py-2"}
            onPress={() => onChange(mode)}
            activeOpacity={0.75}
          >
            <MaterialIcons name={mode.icon as "auto-awesome"} size={16} color={selected ? "#FFFFFF" : "#6D5EF6"} />
            <Text className={selected ? "ml-1.5 text-sm font-semibold text-white" : "ml-1.5 text-sm font-semibold text-foreground"}>{mode.name}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

function QuickActionSelector({ onSelect }: { onSelect: (action: QuickAction) => void }) {
  return (
    <FlatList
      horizontal
      data={QUICK_ACTIONS}
      keyExtractor={(action) => action.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickActionList}
      renderItem={({ item }) => (
        <TouchableOpacity className="mr-2 flex-row items-center rounded-full border border-border bg-surface px-3 py-2" onPress={() => onSelect(item)} activeOpacity={0.75}>
          <MaterialIcons name={item.icon as "edit-note"} size={16} color="#6D5EF6" />
          <Text className="ml-1.5 text-sm font-semibold text-foreground">{item.label}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

function FlashcardDeck({ cards, activeIndex, onChange, onShare }: { cards: Flashcard[]; activeIndex: number; onChange: (index: number) => void; onShare: () => void }) {
  const card = cards[activeIndex];
  return (
    <View className="mt-3 rounded-2xl border border-primary bg-primary-light p-3">
      <View className="flex-row items-center justify-between"><Text className="text-xs font-bold uppercase tracking-wide text-primary">Study card {activeIndex + 1} of {cards.length}</Text><TouchableOpacity onPress={onShare} activeOpacity={0.7}><MaterialIcons name="share" size={18} color="#6D5EF6" /></TouchableOpacity></View>
      <Text className="mt-2 text-sm font-semibold leading-5 text-foreground">{card.question}</Text>
      <Text className="mt-2 text-sm leading-5 text-muted">{card.answer}</Text>
      <View className="mt-3 flex-row justify-between"><TouchableOpacity disabled={activeIndex === 0} className={activeIndex === 0 ? "rounded-full bg-border px-3 py-1.5" : "rounded-full bg-surface px-3 py-1.5"} onPress={() => onChange(activeIndex - 1)} activeOpacity={0.7}><Text className={activeIndex === 0 ? "text-xs font-semibold text-muted" : "text-xs font-semibold text-primary"}>Previous</Text></TouchableOpacity><TouchableOpacity disabled={activeIndex === cards.length - 1} className={activeIndex === cards.length - 1 ? "rounded-full bg-border px-3 py-1.5" : "rounded-full bg-surface px-3 py-1.5"} onPress={() => onChange(activeIndex + 1)} activeOpacity={0.7}><Text className={activeIndex === cards.length - 1 ? "text-xs font-semibold text-muted" : "text-xs font-semibold text-primary"}>Next</Text></TouchableOpacity></View>
    </View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState<ModelId>("gpt-5-mini");
  const [attachedDocument, setAttachedDocument] = useState<AttachedDocument | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState(0);
  const messageListRef = useRef<FlatList<ChatMessage>>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const chatMutation = trpc.assistant.chat.useMutation();
  const saveConversationMutation = trpc.workspace.conversations.save.useMutation();
  const documentUploadMutation = trpc.workspace.documents.upload.useMutation();
  const documentQuestionMutation = trpc.assistant.documentQuestion.useMutation();
  const imageMutation = trpc.assistant.image.useMutation();
  const transcribeMutation = trpc.assistant.transcribe.useMutation();
  const flashcardMutation = trpc.assistant.flashcards.useMutation();
  const modelsQuery = trpc.assistant.models.useQuery(undefined, { enabled: isAuthenticated });

  const hydrate = useCallback(async () => {
    const [saved, activeId, preferences] = await Promise.all([loadConversations(), loadActiveConversationId(), loadPreferences()]);
    const active = saved.find((item) => item.id === activeId) ?? saved[0];
    const next = active ?? createConversation();
    const all = active ? saved : [next];
    if (!active) {
      await saveConversations(all);
      await setActiveConversationId(next.id);
    }
    setConversations(all);
    setConversation(next);
    setHapticsEnabled(preferences.hapticsEnabled);
    setIsLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void hydrate(); }, [hydrate]));
  useEffect(() => () => { void Speech.stop(); }, []);

  const mode = useMemo(() => getMode(conversation?.modeId ?? "general"), [conversation?.modeId]);

  const persistConversation = useCallback(async (next: Conversation) => {
    const all = sortConversations([next, ...conversations.filter((item) => item.id !== next.id)]);
    setConversation(next);
    setConversations(all);
    await saveConversations(all);
    await setActiveConversationId(next.id);
    if (isAuthenticated) {
      try {
        await saveConversationMutation.mutateAsync({
          id: next.id,
          title: next.title,
          modeId: next.modeId,
          modelId: selectedModelId,
          messagesJson: JSON.stringify(next.messages),
        });
      } catch {
        // Local persistence remains available if a network sync needs to retry.
      }
    }
  }, [conversations, isAuthenticated, saveConversationMutation, selectedModelId]);

  const requireAccount = () => {
    if (isAuthenticated) return true;
    Alert.alert("Sign in required", "Sign in to use private AI chat, selected models, documents, images, and voice input.", [
      { text: "Not now", style: "cancel" },
      { text: "Go to account", onPress: () => router.push("/account") },
    ]);
    return false;
  };

  const newConversation = async (modeId = mode.id) => {
    const next = createConversation(modeId);
    haptic.light(hapticsEnabled);
    await persistConversation(next);
    setAttachedDocument(null);
    setInput("");
  };

  const changeMode = async (nextMode: AssistantMode) => {
    if (nextMode.id === mode.id) return;
    haptic.selection(hapticsEnabled);
    if (!conversation || conversation.messages.length > 1) {
      await newConversation(nextMode.id);
      return;
    }
    await persistConversation({
      ...conversation,
      modeId: nextMode.id,
      messages: [{ ...conversation.messages[0], content: `Hi, I’m OmniMind. You’re in ${nextMode.name} mode. What would you like to work on?` }],
      updatedAt: new Date().toISOString(),
    });
  };

  const chooseQuickAction = (action: QuickAction) => {
    haptic.selection(hapticsEnabled);
    setInput(action.prompt);
  };

  const toggleReplySpeech = async (message: ChatMessage) => {
    if (speakingMessageId === message.id) {
      await Speech.stop();
      setSpeakingMessageId(null);
      return;
    }
    await Speech.stop();
    const speechText = message.content.replace(/[`*_>#]/g, " ").replace(/\s+/g, " ").trim();
    if (!speechText) return;
    setSpeakingMessageId(message.id);
    Speech.speak(speechText, {
      rate: 0.98,
      onDone: () => setSpeakingMessageId(null),
      onStopped: () => setSpeakingMessageId(null),
      onError: () => setSpeakingMessageId(null),
    });
  };

  const createFlashcards = async (message: ChatMessage) => {
    if (!requireAccount()) return;
    try {
      haptic.light(hapticsEnabled);
      const result = await flashcardMutation.mutateAsync({ source: message.content });
      setFlashcardSet({ sourceMessageId: message.id, cards: result.cards });
      setActiveFlashcardIndex(0);
      haptic.success(hapticsEnabled);
    } catch (error) {
      haptic.error(hapticsEnabled);
      Alert.alert("Couldn’t make flashcards", error instanceof Error ? error.message : "Try a longer assistant response.");
    }
  };

  const shareFlashcards = async () => {
    if (!flashcardSet) return;
    const content = flashcardSet.cards.map((card, index) => `${index + 1}. ${card.question}\n${card.answer}`).join("\n\n");
    try {
      await Share.share({ message: `OmniMind study cards\n\n${content}` });
    } catch {
      Alert.alert("Couldn’t open sharing", "Try again shortly.");
    }
  };

  const chooseModel = (model: { id: ModelId; available: boolean; plan: "free" | "premium" }) => {
    if (!model.available) {
      Alert.alert("Premium model", "Reason and Visual are available with the Premium plan once billing is enabled.");
      return;
    }
    haptic.selection(hapticsEnabled);
    setSelectedModelId(model.id);
  };

  const attachDocument = async () => {
    if (!requireAccount()) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: supportedDocumentTypes, copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.mimeType || !supportedDocumentTypes.includes(asset.mimeType)) throw new Error("Unsupported file type");
      const source = new File(asset.uri);
      const contentBase64 = await source.base64();
      const byteSize = base64ByteSize(contentBase64);
      if (byteSize > 5 * 1024 * 1024) throw new Error("File is larger than 5 MB");
      const uploaded = await documentUploadMutation.mutateAsync({
        name: asset.name,
        mimeType: asset.mimeType as "application/pdf" | "text/plain" | "text/markdown" | "text/csv",
        byteSize,
        contentBase64,
      });
      setAttachedDocument({ id: uploaded.id, name: uploaded.name });
      haptic.success(hapticsEnabled);
    } catch (error) {
      haptic.error(hapticsEnabled);
      Alert.alert("Couldn’t attach document", error instanceof Error ? error.message : "Choose a PDF, text, Markdown, or CSV file under 5 MB.");
    }
  };

  const toggleRecording = async () => {
    if (!requireAccount()) return;
    try {
      if (recorderState.isRecording) {
        await recorder.stop();
        if (!recorder.uri) throw new Error("Recording unavailable");
        const audioFile = new File(recorder.uri);
        const contentBase64 = await audioFile.base64();
        const result = await transcribeMutation.mutateAsync({ fileName: `voice-${Date.now()}.m4a`, mimeType: "audio/m4a", contentBase64 });
        setInput((current) => (current ? `${current} ${result.text}` : result.text));
        haptic.success(hapticsEnabled);
        return;
      }
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Microphone access", "Allow microphone access to dictate a message.");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      haptic.light(hapticsEnabled);
    } catch {
      haptic.error(hapticsEnabled);
      Alert.alert("Voice input unavailable", "Try again or type your message instead.");
    }
  };

  const appendAssistantMessage = async (base: Conversation, content: string, imageUrl?: string) => {
    await persistConversation({
      ...base,
      messages: [...base.messages, { id: `message-${Date.now()}-assistant`, role: "assistant", content, imageUrl, createdAt: new Date().toISOString() }],
      updatedAt: new Date().toISOString(),
    });
  };

  const sendMessage = async (value = input) => {
    const content = value.trim();
    if (!content || !conversation || isWorking || !requireAccount()) return;
    haptic.light(hapticsEnabled);
    setInput("");
    const userMessage: ChatMessage = { id: `message-${Date.now()}`, role: "user", content, createdAt: new Date().toISOString() };
    const base: Conversation = {
      ...conversation,
      title: conversation.title === "New conversation" ? makeConversationTitle(content) : conversation.title,
      messages: [...conversation.messages, userMessage],
      updatedAt: new Date().toISOString(),
    };
    await persistConversation(base);
    setIsWorking(true);
    try {
      const response = attachedDocument
        ? await documentQuestionMutation.mutateAsync({ documentId: attachedDocument.id, question: content, modelId: selectedModelId })
        : await chatMutation.mutateAsync({ modeId: mode.id, modelId: selectedModelId, messages: base.messages.slice(-12).map((message) => ({ role: message.role, content: message.content })) });
      await appendAssistantMessage(base, response.content);
      haptic.success(hapticsEnabled);
    } catch {
      await appendAssistantMessage(base, "I couldn’t complete that request right now. Please check your plan, connection, and try again.");
      haptic.error(hapticsEnabled);
    } finally {
      setIsWorking(false);
    }
  };

  const createImage = async () => {
    const prompt = input.trim();
    if (!prompt || !conversation || isWorking || !requireAccount()) return;
    haptic.light(hapticsEnabled);
    setInput("");
    const userMessage: ChatMessage = { id: `message-${Date.now()}`, role: "user", content: `Create an image: ${prompt}`, createdAt: new Date().toISOString() };
    const base: Conversation = {
      ...conversation,
      title: conversation.title === "New conversation" ? makeConversationTitle(prompt) : conversation.title,
      messages: [...conversation.messages, userMessage],
      updatedAt: new Date().toISOString(),
    };
    await persistConversation(base);
    setIsWorking(true);
    try {
      const result = await imageMutation.mutateAsync({ prompt });
      await appendAssistantMessage(base, "Here’s the image I created from your prompt.", result.url);
      haptic.success(hapticsEnabled);
    } catch {
      await appendAssistantMessage(base, "I couldn’t generate that image right now. Please try again.");
      haptic.error(hapticsEnabled);
    } finally {
      setIsWorking(false);
    }
  };

  const renderMessage = ({ item: message }: { item: ChatMessage }) => (
    <View className={message.role === "user" ? "mb-4 items-end" : "mb-4 items-start"}>
      <View className={message.role === "user" ? "max-w-[88%] rounded-3xl rounded-br-md bg-primary px-4 py-3" : "max-w-[90%] rounded-3xl rounded-bl-md border border-border bg-surface px-4 py-3"}>
        <Text className={message.role === "user" ? "text-base leading-6 text-white" : "text-base leading-6 text-foreground"}>{message.content}</Text>
        {message.imageUrl ? <Image source={{ uri: message.imageUrl }} resizeMode="cover" style={styles.generatedImage} /> : null}
        {message.role === "assistant" ? (
          <View className="mt-3 flex-row gap-2">
            <TouchableOpacity className="flex-row items-center rounded-full bg-primary-light px-2.5 py-1.5" onPress={() => void toggleReplySpeech(message)} activeOpacity={0.7}><MaterialIcons name={speakingMessageId === message.id ? "stop-circle" : "volume-up"} size={16} color="#6D5EF6" /><Text className="ml-1 text-xs font-semibold text-primary">{speakingMessageId === message.id ? "Stop" : "Listen"}</Text></TouchableOpacity>
            <TouchableOpacity disabled={message.content.length < 80 || flashcardMutation.isPending} className={message.content.length < 80 ? "flex-row items-center rounded-full bg-border px-2.5 py-1.5" : "flex-row items-center rounded-full bg-primary-light px-2.5 py-1.5"} onPress={() => void createFlashcards(message)} activeOpacity={0.7}><MaterialIcons name="style" size={16} color="#6D5EF6" /><Text className="ml-1 text-xs font-semibold text-primary">Cards</Text></TouchableOpacity>
          </View>
        ) : null}
        {flashcardSet?.sourceMessageId === message.id ? <FlashcardDeck cards={flashcardSet.cards} activeIndex={activeFlashcardIndex} onChange={setActiveFlashcardIndex} onShare={() => void shareFlashcards()} /> : null}
      </View>
    </View>
  );

  if (isLoading || !conversation) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color="#6D5EF6" /></ScreenContainer>;
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
          <View>
            <View className="flex-row items-center"><Text className="text-3xl font-bold text-foreground">OmniMind</Text><View className="ml-2 flex-row items-center rounded-full bg-success-light px-2 py-1"><View className="mr-1 h-1.5 w-1.5 rounded-full bg-success" /><Text className="text-xs font-semibold text-success">Private</Text></View></View>
            <Text className="mt-1 text-sm text-muted">{mode.name} workspace</Text>
          </View>
          <TouchableOpacity className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface" onPress={() => void newConversation()} activeOpacity={0.75}><MaterialIcons name="edit-square" size={21} color="#6D5EF6" /></TouchableOpacity>
        </View>

        <ModeSelector modeId={mode.id} onChange={(next) => void changeMode(next)} />
        {isAuthenticated && modelsQuery.data ? (
          <FlatList
            horizontal
            data={modelsQuery.data}
            keyExtractor={(model) => model.id}
            showsHorizontalScrollIndicator={false}
            style={styles.modelScroll}
            contentContainerStyle={styles.modelList}
            renderItem={({ item }) => <TouchableOpacity className={item.id === selectedModelId ? "mr-2 rounded-full bg-primary px-3 py-1.5" : "mr-2 rounded-full border border-border bg-surface px-3 py-1.5"} onPress={() => chooseModel(item as { id: ModelId; available: boolean; plan: "free" | "premium" })} activeOpacity={0.75}><Text className={item.id === selectedModelId ? "text-xs font-semibold text-white" : item.available ? "text-xs font-semibold text-foreground" : "text-xs font-semibold text-muted"}>{item.name}{item.plan === "premium" ? " · Premium" : ""}</Text></TouchableOpacity>}
          />
        ) : null}
        {attachedDocument ? <View className="mx-5 mb-2 flex-row items-center justify-between rounded-xl bg-primary-light px-3 py-2"><View className="flex-row items-center"><MaterialIcons name="description" size={17} color="#6D5EF6" /><Text className="ml-2 max-w-64 text-xs font-semibold text-primary" numberOfLines={1}>{attachedDocument.name}</Text></View><TouchableOpacity onPress={() => setAttachedDocument(null)} activeOpacity={0.7}><MaterialIcons name="close" size={18} color="#6D5EF6" /></TouchableOpacity></View> : null}

        <FlatList
          ref={messageListRef}
          className="flex-1 px-5"
          data={conversation.messages}
          keyExtractor={(message) => message.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => messageListRef.current?.scrollToEnd({ animated: true })}
          renderItem={renderMessage}
          ListFooterComponent={isWorking ? <View className="mb-4 items-start"><View className="flex-row items-center rounded-3xl border border-border bg-surface px-4 py-3"><ActivityIndicator size="small" color="#6D5EF6" /><Text className="ml-2 text-sm font-medium text-muted">OmniMind is working…</Text></View></View> : null}
        />

        <View className="border-t border-border bg-background px-5 pt-3">
          {conversation.messages.length === 1 && !isWorking ? <FlatList horizontal data={mode.suggestions} keyExtractor={(suggestion) => suggestion} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionList} renderItem={({ item }) => <TouchableOpacity className="mr-2 rounded-full border border-border bg-surface px-3 py-2" onPress={() => void sendMessage(item)} activeOpacity={0.75}><Text className="text-sm text-foreground">{item}</Text></TouchableOpacity>} /> : null}
          <QuickActionSelector onSelect={chooseQuickAction} />
          <View className="mb-1 flex-row items-end rounded-3xl border border-border bg-surface px-2 py-2">
            <TouchableOpacity className="mb-1 h-10 w-9 items-center justify-center" onPress={() => void attachDocument()} activeOpacity={0.7}><MaterialIcons name="attach-file" size={20} color="#6D5EF6" /></TouchableOpacity>
            <TextInput className="max-h-28 min-h-11 flex-1 px-1 py-2 text-base text-foreground" value={input} onChangeText={setInput} placeholder={`Ask OmniMind in ${mode.name} mode…`} placeholderTextColor="#8B8A9E" multiline editable={!isWorking} returnKeyType="send" onSubmitEditing={() => void sendMessage()} />
            <TouchableOpacity disabled={!input.trim() || isWorking} className="mb-1 h-10 w-9 items-center justify-center" onPress={() => void createImage()} activeOpacity={0.7}><MaterialIcons name="image" size={19} color={input.trim() && !isWorking ? "#6D5EF6" : "#A4A3B3"} /></TouchableOpacity>
            <TouchableOpacity disabled={transcribeMutation.isPending} className={recorderState.isRecording ? "mb-1 h-10 w-9 items-center justify-center rounded-full bg-error-light" : "mb-1 h-10 w-9 items-center justify-center"} onPress={() => void toggleRecording()} activeOpacity={0.7}><MaterialIcons name={recorderState.isRecording ? "stop" : "mic"} size={19} color={recorderState.isRecording ? "#E5484D" : "#6D5EF6"} /></TouchableOpacity>
            <TouchableOpacity disabled={!input.trim() || isWorking} className={input.trim() && !isWorking ? "mb-1 h-10 w-10 items-center justify-center rounded-full bg-primary" : "mb-1 h-10 w-10 items-center justify-center rounded-full bg-border"} onPress={() => void sendMessage()} activeOpacity={0.75}><MaterialIcons name="arrow-upward" size={20} color="#FFFFFF" /></TouchableOpacity>
          </View>
          <Text className="pb-2 text-center text-xs text-muted">Private workspace. Verify important details.</Text>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  generatedImage: { width: 220, height: 220, borderRadius: 16, marginTop: 10, backgroundColor: "#E9E6FF" },
  messages: { flexGrow: 1, justifyContent: "flex-end", paddingTop: 16, paddingBottom: 12 },
  modeList: { paddingHorizontal: 20, paddingVertical: 10 },
  modeScroll: { flexGrow: 0, height: 56 },
  modelList: { paddingHorizontal: 20, paddingBottom: 6 },
  modelScroll: { flexGrow: 0, height: 36 },
  quickActionList: { paddingBottom: 10 },
  suggestionList: { paddingBottom: 10 },
});
