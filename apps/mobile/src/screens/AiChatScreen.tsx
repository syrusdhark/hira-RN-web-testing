import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../context/ProfileContext';
import { createConversation, sendChatMessage } from '../services/ai-chat.service';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, radius, space, typography } from '../theme';

const accentPink = '#E879F9';

type Message = { role: 'user' | 'assistant'; content: string };

type AiChatScreenProps = {
  onNavigateToWorkout?: () => void;
  onNavigateToSleep?: () => void;
  onNavigateToNutrition?: () => void;
};

const QUICK_ACTIONS = [
  {
    id: 'workout',
    label: 'Log my workout',
    icon: 'swap-horizontal' as const,
    iconColor: colors.primaryIndigo,
    gradientColors: [colors.primaryIndigo + '35', colors.primaryIndigo + '08'] as const,
    onPress: (nav: AiChatScreenProps) => nav.onNavigateToWorkout?.(),
  },
  {
    id: 'sleep',
    label: 'Give me a sleep tip',
    icon: 'weather-night' as const,
    iconColor: colors.brandBlue,
    gradientColors: [colors.brandBlue + '35', colors.brandBlue + '08'] as const,
    onPress: (nav: AiChatScreenProps) => nav.onNavigateToSleep?.(),
  },
  {
    id: 'macros',
    label: 'How are my macros?',
    icon: 'food-apple-outline' as const,
    iconColor: colors.bodyOrange,
    gradientColors: [colors.bodyOrange + '35', colors.bodyOrange + '08'] as const,
    onPress: (nav: AiChatScreenProps) => nav.onNavigateToNutrition?.(),
  },
  {
    id: 'meditation',
    label: 'Start a meditation',
    icon: 'meditation' as const,
    iconColor: accentPink,
    gradientColors: [accentPink + '35', accentPink + '08'] as const,
    sendMessage: 'Start a meditation',
  },
] as const;

export function AiChatScreen({
  onNavigateToWorkout,
  onNavigateToSleep,
  onNavigateToNutrition,
}: AiChatScreenProps) {
  const { profile } = useProfile();
  const userId = profile?.id ?? null;

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationReady, setConversationReady] = useState(false);

  const nav = { onNavigateToWorkout, onNavigateToSleep, onNavigateToNutrition };

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const id = await createConversation(userId);
        if (!cancelled) {
          setConversationId(id);
          setConversationReady(true);
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

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !userId || !conversationId || sending) return;

      setError(null);
      setInputText('');
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      setSending(true);

      try {
        const reply = await sendChatMessage(userId, conversationId, trimmed);
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
        setError(message);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setSending(false);
      }
    },
    [userId, conversationId, sending]
  );

  const handleSend = useCallback(() => {
    sendMessage(inputText);
  }, [inputText, sendMessage]);

  const handleQuickAction = useCallback(
    (action: (typeof QUICK_ACTIONS)[number]) => {
      if ('sendMessage' in action && typeof action.sendMessage === 'string') {
        sendMessage(action.sendMessage);
        return;
      }
      if ('onPress' in action && action.onPress) {
        action.onPress(nav);
      }
    },
    [sendMessage, nav]
  );

  const leftElement = (
    <Pressable style={styles.menuButton} onPress={() => {}} accessibilityLabel="Menu">
      <MaterialCommunityIcons name="menu" size={24} color={colors.textPrimary} />
    </Pressable>
  );

  const showGreeting = messages.length === 0;

  return (
    <View style={styles.root}>
      <ScreenHeader leftElement={leftElement} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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

              {conversationReady && (
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
                  <View style={[styles.bubble, styles.bubbleAssistantBg]}>
                    <ActivityIndicator size="small" color={colors.primaryViolet} />
                  </View>
                </View>
              )}
            </View>
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
            style={[styles.sendBtn, (sending || !inputText.trim()) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={sending || !inputText.trim()}
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
  bubbleText: {
    ...typography.base,
    color: colors.textPrimary,
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
});
