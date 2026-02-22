import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../context/ProfileContext';
import {
  createConversation,
  sendMessage,
  getUserUsage,
  clearConversation,
  getConversationHistory,
  shouldUseLocalAi,
  DAILY_LIMIT_REACHED,
} from '../services/ai';
import * as LocalAi from '../services/ai/local-ai.service';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, radius, space, typography } from '../theme';

const accentPink = '#E879F9';

type Message = { role: 'user' | 'assistant'; content: string };

type AiChatScreenProps = {
  onNavigateToWorkout?: () => void;
};

type QuickAction = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor: string;
  gradientColors: [string, string];
} & (
    | { sendMessage: string; onPress?: never }
    | { onPress: (nav: Record<string, any>) => void; sendMessage?: never }
  );

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'workout-today',
    label: 'Should I workout today?',
    icon: 'dumbbell',
    iconColor: '#A78BFA',
    gradientColors: ['#1e1b4b', '#312e81'],
    sendMessage: 'Should I workout today?',
  },
  {
    id: 'progress',
    label: 'How am I progressing?',
    icon: 'chart-line',
    iconColor: '#34D399',
    gradientColors: ['#064e3b', '#065f46'],
    sendMessage: 'How am I progressing?',
  },
  {
    id: 'recovery',
    label: 'Tips for recovery',
    icon: 'bed',
    iconColor: '#60A5FA',
    gradientColors: ['#1e3a5f', '#1e40af'],
    sendMessage: 'What are some tips for recovery?',
  },
  {
    id: 'motivation',
    label: 'I need motivation',
    icon: 'fire',
    iconColor: '#FBBF24',
    gradientColors: ['#78350f', '#92400e'],
    sendMessage: 'I need some motivation to stay consistent.',
  },
];

export function AiChatScreen({
  onNavigateToWorkout,
}: AiChatScreenProps) {
  const { profile } = useProfile();
  const userId = profile?.id ?? null;

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationReady, setConversationReady] = useState(false);
  const [isOllamaReady, setIsOllamaReady] = useState<boolean | null>(null);
  const [isWarming, setIsWarming] = useState(false);
  const [usage, setUsage] = useState<{ tokensUsed: number; limit: number; limitReached: boolean } | null>(null);

  const nav = { onNavigateToWorkout };

  const refreshUsage = useCallback(async () => {
    if (!userId) return;
    const u = await getUserUsage(userId);
    setUsage({ tokensUsed: u.tokensUsed, limit: u.limit, limitReached: u.limitReached });
  }, [userId]);

  const checkOllama = useCallback(async () => {
    const useLocal = shouldUseLocalAi();
    if (!useLocal) return;
    setIsOllamaReady(null);
    const available = await LocalAi.isAvailable();
    setIsOllamaReady(available);
    if (available) {
      setIsWarming(true);
      await LocalAi.warmup();
      setIsWarming(false);
    }
  }, []);

  useEffect(() => {
    if (shouldUseLocalAi()) {
      checkOllama();
    } else {
      setIsOllamaReady(true);
    }
  }, [checkOllama]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const id = await createConversation(userId);
        if (!cancelled) {
          setConversationId(id);
          setConversationReady(true);
          const history = await getConversationHistory(id);
          if (!cancelled) setMessages(history);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to start conversation');
          setConversationReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !conversationReady) return;
    refreshUsage();
  }, [userId, conversationReady, refreshUsage]);

  const sendMessageHandler = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !userId || sending) return;
      if (usage?.limitReached) {
        setError("You've reached your daily limit. Try again tomorrow.");
        return;
      }

      setError(null);
      setInputText('');
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      setSending(true);

      try {
        const { reply, conversationId: cid } = await sendMessage(userId, trimmed, conversationId);
        if (cid !== conversationId) setConversationId(cid);
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        refreshUsage();
      } catch (e) {
        const err = e as Error & { code?: string };
        const message =
          err.code === DAILY_LIMIT_REACHED
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Something went wrong. Please try again.';
        setError(message);
        setMessages((prev) => prev.slice(0, -1));
        refreshUsage();
      } finally {
        setSending(false);
      }
    },
    [userId, conversationId, sending, usage?.limitReached, refreshUsage]
  );

  const handleSend = useCallback(() => {
    sendMessageHandler(inputText);
  }, [inputText, sendMessageHandler]);

  const handleQuickAction = useCallback(
    (action: (typeof QUICK_ACTIONS)[number]) => {
      if ('sendMessage' in action && typeof action.sendMessage === 'string') {
        sendMessageHandler(action.sendMessage);
        return;
      }
      if ('onPress' in action && action.onPress) {
        action.onPress(nav);
      }
    },
    [sendMessageHandler, nav]
  );

  const handleClearChat = useCallback(async () => {
    if (!conversationId) return;
    setError(null);
    try {
      await clearConversation(conversationId);
      setMessages([]);
    } catch {
      setError('Failed to clear chat.');
    }
  }, [conversationId]);

  const leftElement = (
    <Pressable style={styles.menuButton} onPress={() => {}} accessibilityLabel="Menu">
      <MaterialCommunityIcons name="menu" size={24} color={colors.textPrimary} />
    </Pressable>
  );

  const showGreeting = messages.length === 0;
  const useLocal = shouldUseLocalAi();
  const showNotReadyCard = useLocal && isOllamaReady === false;
  const showWarmingCard = useLocal && isWarming;
  const showCheckingCard = useLocal && isOllamaReady === null;

  if (showCheckingCard) {
    return (
      <View style={styles.root}>
        <ScreenHeader leftElement={leftElement} />
        <View style={styles.centeredCard}>
          <ActivityIndicator size="large" color={colors.primaryViolet} />
          <Text style={styles.warmingSubtext}>Checking connection...</Text>
        </View>
      </View>
    );
  }

  if (showNotReadyCard) {
    return (
      <View style={styles.root}>
        <ScreenHeader leftElement={leftElement} />
        <View style={styles.centeredCard}>
          <Text style={styles.errorCardTitle}>Local AI not running</Text>
          <Text style={styles.errorCardText}>
            Ollama is not running or not reachable. Start it on your computer:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>ollama serve</Text>
          </View>
          <Text style={styles.errorCardSubtext}>
            Then ensure the model is installed: ollama pull phi4-mini:latest
          </Text>
          <Pressable style={styles.retryButton} onPress={checkOllama}>
            <Text style={styles.retryButtonText}>Retry connection</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (showWarmingCard) {
    return (
      <View style={styles.root}>
        <ScreenHeader leftElement={leftElement} />
        <View style={styles.centeredCard}>
          <ActivityIndicator size="large" color={colors.primaryViolet} />
          <Text style={styles.warmingTitle}>Warming up AI model...</Text>
          <Text style={styles.warmingSubtext}>First load can take 10–30 seconds</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader
        leftElement={leftElement}
        rightBadges={
          usage && usage.limit > 0
            ? [
                {
                  value: usage.limitReached
                    ? 'Limit reached'
                    : `${usage.tokensUsed.toLocaleString()} / ${usage.limit.toLocaleString()}`,
                  accent: usage.limitReached ? 'amber' : 'violet',
                },
              ]
            : undefined
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showGreeting ? (
            <>
              <View style={styles.hero}>
                <Text style={styles.heroTitle}>Hello, I'm Hira,</Text>
                <Text style={styles.heroSubtitle}>
                  your <Text style={styles.heroAccent}>AI</Text> wellness <Text style={styles.heroAccent}>coach.</Text>
                </Text>
                <Text style={styles.heroPrompt}>How can I help you today?</Text>
              </View>

              {conversationReady && QUICK_ACTIONS.length > 0 && (
                <View style={styles.quickActions}>
                  {QUICK_ACTIONS.map((action) => (
                    <Pressable
                      key={action.id}
                      style={styles.quickCard}
                      onPress={() => handleQuickAction(action)}
                    >
                      <LinearGradient
                        colors={[...action.gradientColors]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.quickCardGradient}
                      >
                        <View style={[styles.quickIconWrap, { backgroundColor: action.iconColor + '22' }]}>
                          <MaterialCommunityIcons
                            name={action.icon}
                            size={24}
                            color={action.iconColor}
                          />
                        </View>
                        <Text style={styles.quickLabel} numberOfLines={2}>
                          {action.label}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.messageList}>
              {messages.map((msg, i) => (
                <View
                  key={i}
                  style={[styles.bubbleWrap, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}
                >
                  <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUserBg : styles.bubbleAssistantBg]}>
                    <Text style={styles.bubbleText}>{msg.content}</Text>
                  </View>
                </View>
              ))}
              {sending && (
                <View style={[styles.bubbleWrap, styles.bubbleAssistant]}>
                  <View style={[styles.bubble, styles.bubbleAssistantBg, styles.thinkingBubble]}>
                    <ActivityIndicator size="small" color={colors.primaryViolet} />
                    <Text style={styles.thinkingText}>Hira is thinking…</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {messages.length > 0 && conversationReady && (
            <Pressable style={styles.clearChatWrap} onPress={handleClearChat}>
              <MaterialCommunityIcons name="broom" size={18} color={colors.textTertiary} />
              <Text style={styles.clearChatText}>Clear chat</Text>
            </Pressable>
          )}

          {error ? (
            <View style={styles.errorWrap}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.inputRow}>
          <Pressable style={styles.inputIconBtn} onPress={() => {}} accessibilityLabel="Attach">
            <MaterialCommunityIcons name="plus" size={22} color={colors.textPrimary} />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            editable={!sending && !!conversationId}
            multiline={false}
            maxLength={2000}
          />
          <Pressable style={styles.inputIconBtn} onPress={() => {}} accessibilityLabel="Voice input">
            <MaterialCommunityIcons name="microphone-outline" size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            style={[
              styles.sendBtn,
              (sending || !inputText.trim() || usage?.limitReached) && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={sending || !inputText.trim() || !!usage?.limitReached}
            accessibilityLabel="Send"
          >
            <MaterialCommunityIcons name="arrow-up" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgMidnight,
  },
  flex: {
    flex: 1,
  },
  menuButton: {
    padding: space.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space.md,
    paddingBottom: space.lg,
  },
  hero: {
    marginTop: space['2xl'],
    marginBottom: space.xl,
  },
  heroTitle: {
    ...typography['3xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: space.xs,
  },
  heroSubtitle: {
    ...typography.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: space.sm,
  },
  heroAccent: {
    color: accentPink,
  },
  heroPrompt: {
    ...typography.lg,
    color: colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: space.sm,
  },
  quickCard: {
    width: '48%',
    marginBottom: space.md,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  quickCardGradient: {
    flex: 1,
    padding: space.md,
    borderRadius: radius['2xl'],
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  quickLabel: {
    ...typography.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  messageList: {
    paddingVertical: space.sm,
  },
  bubbleWrap: {
    marginBottom: space.sm,
  },
  bubbleUser: {
    alignItems: 'flex-end',
  },
  bubbleAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
  },
  bubbleUserBg: {
    backgroundColor: colors.primaryViolet,
  },
  bubbleAssistantBg: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  thinkingBubble: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  thinkingText: {
    ...typography.sm,
    color: colors.textTertiary,
    marginTop: space.xs,
  },
  bubbleText: {
    ...typography.base,
    color: colors.textPrimary,
  },
  clearChatWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
  },
  clearChatText: {
    ...typography.sm,
    color: colors.textTertiary,
  },
  errorWrap: {
    paddingVertical: space.sm,
  },
  errorText: {
    ...typography.sm,
    color: colors.bodyOrange,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.xl,
    marginHorizontal: space.md,
    marginBottom: space.md,
    paddingVertical: space.xs,
    paddingLeft: space.sm,
    paddingRight: space.xs,
    gap: space.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  inputIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.borderDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    ...typography.base,
    color: colors.textPrimary,
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
    minHeight: 40,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryViolet,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  centeredCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.xl,
  },
  errorCardTitle: {
    ...typography.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: space.sm,
    textAlign: 'center',
  },
  errorCardText: {
    ...typography.base,
    color: colors.textSecondary,
    marginBottom: space.md,
    textAlign: 'center',
  },
  errorCardSubtext: {
    ...typography.sm,
    color: colors.textTertiary,
    marginBottom: space.lg,
    textAlign: 'center',
  },
  codeBlock: {
    backgroundColor: colors.bgCharcoal,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    marginBottom: space.md,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: colors.textPrimary,
  },
  retryButton: {
    backgroundColor: colors.primaryViolet,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
  },
  retryButtonText: {
    ...typography.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  warmingTitle: {
    ...typography.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: space.lg,
  },
  warmingSubtext: {
    ...typography.sm,
    color: colors.textSecondary,
    marginTop: space.xs,
  },
});
