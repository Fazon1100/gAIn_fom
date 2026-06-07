import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { xAlert } from '../../lib/presentation/alert';
import {
  PROVIDER_LABELS,
  PROVIDER_MODELS,
  QUICK_PROMPTS,
  sendMessage,
  type AiMessage,
  type AiProvider,
} from '../../lib/application/ai';
import { colors, spacing } from '../../constants/theme';
import { useDb } from '../../context/DbProvider';
import * as repo from '../../lib/data/repository';
import type { ChatMessage, Profile } from '../../lib/data/types';

export default function AiScreen() {
  const { db } = useDb();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [provider, setProvider] = useState<AiProvider>('gemini');
  const [modelId, setModelId] = useState<string>('gemini-2.0-flash');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const loadSettings = useCallback(async () => {
    if (!db) return;
    const [savedProvider, savedModel, msgs, prof] = await Promise.all([
      repo.getSetting(db, 'ai_provider'),
      repo.getSetting(db, 'ai_model'),
      repo.listChatMessages(db),
      repo.getProfile(db),
    ]);
    const prov = (savedProvider as AiProvider) || 'gemini';
    setProvider(prov);
    if (savedModel) setModelId(savedModel);
    const key = await repo.getSetting(db, `ai_key_${prov}`);
    setApiKey(key);
    setMessages(msgs);
    setProfile(prof);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const content = (text ?? inputText).trim();
    if (!content || !apiKey || isLoading || !db) return;
    setInputText('');

    const userMsgId = await repo.insertChatMessage(db, 'user', content);
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history: AiMessage[] = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const reply = await sendMessage(provider, apiKey, modelId, history, profile);
      const asstMsgId = await repo.insertChatMessage(db, 'assistant', reply);
      setMessages((prev) => [
        ...prev,
        { id: asstMsgId, role: 'assistant', content: reply, createdAt: new Date().toISOString() },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      xAlert('Fehler', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    xAlert('Chat leeren', 'Alle Nachrichten löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Leeren',
        style: 'destructive',
        onPress: async () => {
          if (!db) return;
          await repo.clearChatMessages(db);
          setMessages([]);
        },
      },
    ]);
  };

  if (!apiKey) {
    return <NoApiKeyView />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.modelPicker}>
          {PROVIDER_MODELS[provider].map((m) => (
            <Pressable
              key={m.id}
              style={[styles.modelBtn, modelId === m.id && styles.modelBtnActive]}
              onPress={() => {
                setModelId(m.id);
                if (db) repo.setSetting(db, 'ai_model', m.id);
              }}
            >
              <Text style={[styles.modelBtnText, modelId === m.id && styles.modelBtnTextActive]}
                numberOfLines={1}
              >
                {m.label.split(' (')[0]}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.providerBadge}>
          <Text style={styles.providerBadgeText}>
            {PROVIDER_LABELS[provider].split(' ').slice(1).join(' ')}
          </Text>
        </View>
        {messages.length > 0 && (
          <Pressable style={styles.clearBtn} onPress={handleClear}>
            <FontAwesome name="trash" size={14} color={colors.danger} />
          </Pressable>
        )}
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <EmptyChat onQuickPrompt={(q) => handleSend(q)} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => <MessageBubble message={item} />}
          ListFooterComponent={
            isLoading ? (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.loadingText}>gAIn AI denkt …</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Frag deinen KI-Coach …"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={2000}
          onSubmitEditing={() => handleSend()}
          blurOnSubmit={false}
        />
        <Pressable
          style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
        >
          <FontAwesome name="send" size={16} color={!inputText.trim() || isLoading ? colors.muted : '#0d0d12'} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.bubbleRight : styles.bubbleLeft]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <FontAwesome name="magic" size={12} color={colors.accent} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : {}]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function EmptyChat({ onQuickPrompt }: { onQuickPrompt: (q: string) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <FontAwesome name="magic" size={36} color={colors.accent} />
      </View>
      <Text style={styles.emptyTitle}>Dein KI-Fitness-Coach</Text>
      <Text style={styles.emptySubtitle}>
        Frag mich alles über Training, Ernährung und Regeneration.
      </Text>
      <Text style={styles.quickTitle}>Schnellstart</Text>
      <View style={styles.quickGrid}>
        {QUICK_PROMPTS.map((q) => (
          <Pressable
            key={q}
            style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.7 }]}
            onPress={() => onQuickPrompt(q)}
          >
            <Text style={styles.quickChipText}>{q}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function NoApiKeyView() {
  return (
    <View style={styles.noKeyContainer}>
      <FontAwesome name="key" size={40} color={colors.accent} style={{ marginBottom: spacing.lg }} />
      <Text style={styles.noKeyTitle}>API-Schlüssel fehlt</Text>
      <Text style={styles.noKeyText}>
        Um den KI-Coach zu nutzen, brauchst du einen kostenlosen Anthropic API-Schlüssel.
      </Text>
      <View style={styles.noKeyStep}>
        <Text style={styles.noKeyStepNum}>1</Text>
        <Text style={styles.noKeyStepText}>
          Geh auf <Text style={styles.link}>console.anthropic.com</Text> und erstelle ein kostenloses Konto.
        </Text>
      </View>
      <View style={styles.noKeyStep}>
        <Text style={styles.noKeyStepNum}>2</Text>
        <Text style={styles.noKeyStepText}>Erstelle einen API-Key unter „API Keys".</Text>
      </View>
      <View style={styles.noKeyStep}>
        <Text style={styles.noKeyStepNum}>3</Text>
        <Text style={styles.noKeyStepText}>
          Füge den Key im <Text style={styles.link}>Profil → KI-Einstellungen</Text> ein.
        </Text>
      </View>
      <Text style={styles.noKeyHint}>
        Das Modell „Haiku" ist sehr günstig – ca. $0.001 pro Nachricht.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  modelPicker: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  modelBtn: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  modelBtnActive: { backgroundColor: colors.accent },
  modelBtnText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  modelBtnTextActive: { color: '#0d0d12' },
  clearBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerBadge: {
    backgroundColor: '#14532d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  providerBadgeText: { color: colors.accent, fontSize: 11, fontWeight: '700' },

  messageList: { padding: spacing.md, gap: 12, paddingBottom: 16 },
  bubbleWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleLeft: { alignSelf: 'flex-start', maxWidth: '85%' },
  bubbleRight: { alignSelf: 'flex-end', maxWidth: '85%', flexDirection: 'row-reverse' },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    borderRadius: 16,
    padding: spacing.md,
  },
  bubbleUser: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: '#0d0d12', fontWeight: '500' },

  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  loadingText: { color: colors.muted, fontSize: 14 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 120,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },

  emptyContainer: { padding: spacing.lg, alignItems: 'center', paddingBottom: 40 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  quickTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  quickGrid: { gap: 8, width: '100%' },
  quickChip: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  quickChipText: { color: colors.text, fontSize: 14 },

  noKeyContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noKeyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  noKeyText: {
    color: colors.muted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  noKeyStep: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    width: '100%',
  },
  noKeyStepNum: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 16,
    width: 20,
  },
  noKeyStepText: { color: colors.text, fontSize: 14, lineHeight: 21, flex: 1 },
  link: { color: colors.accent, fontWeight: '600' },
  noKeyHint: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
  },
});
