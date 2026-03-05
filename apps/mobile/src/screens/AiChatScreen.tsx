// @ts-nocheck
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Pressable,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendGeminiMessage } from '../services/ai/gemini.service';
import { useWorkoutSessions, type WorkoutSessionSummary } from '../hooks/useWorkoutSessions';

const COLORS = {
  bg: '#000000',
  surface: '#000000',
  surfaceHigh: '#0a0a0a',
  border: '#1a1a1a',
  accent: '#6C63FF',
  accentLight: '#8B84FF',
  accentGlow: 'rgba(108,99,255,0.18)',
  userBubble: '#6C63FF',
  aiBubble: '#252525',
  text: '#E8E9F3',
  textMuted: '#7B7D96',
  textLight: '#FFFFFF',
  success: '#4ADE80',
  error: '#F87171',
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatSessionDate(performedAt: string) {
  try {
    const d = new Date(performedAt);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return performedAt;
  }
}

function formatWorkoutHistoryForPrompt(sessions: WorkoutSessionSummary[]): string {
  if (!sessions.length) return 'No workouts recorded yet.';
  return sessions
    .map((s, i) => {
      const date = formatSessionDate(s.performed_at);
      const duration = s.duration_minutes != null ? `${s.duration_minutes} min` : '';
      const type = s.session_type || 'general';
      const volume = s.total_weight_kg != null ? `volume ${s.total_weight_kg} kg` : '';
      const parts = [`${i + 1}. ${date}: ${s.title} (${type})`, duration, volume].filter(Boolean);
      return parts.join(', ');
    })
    .join('\n');
}

function buildWorkoutHistoryMessage(sessions: WorkoutSessionSummary[]): string {
  const block = formatWorkoutHistoryForPrompt(sessions);
  return (
    'Show my workout history. Here is my recorded data (you can present it in whatever order I ask for—e.g. most recent first, by date, by workout type):\n\n' +
    block +
    '\n\nPresent it clearly. If I want a different order or filter, I will say so.'
  );
}

function ThinkingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 350, useNativeDriver: true }),
        ])
      ).start();
    pulse(dot1, 0);
    pulse(dot2, 200);
    pulse(dot3, 400);
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.thinkingRow}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.thinkingDot, { opacity: dot }]} />
      ))}
    </View>
  );
}

function MessageContent({ content, isUser }: { content: string, isUser: boolean }) {
  const baseColor = isUser ? COLORS.textLight : COLORS.text;
  const segments = content.split(/(```[\s\S]*?```)/g);

  return (
    <View>
      {segments.map((seg, idx) => {
        if (seg.startsWith('```') && seg.endsWith('```')) {
          const inner = seg.replace(/^```[^\n]*\n?/, '').replace(/```$/, '');
          return (
            <View key={idx} style={styles.codeBlock}>
              <Text style={styles.codeText}>{inner.trim()}</Text>
            </View>
          );
        }
        const boldParts = seg.split(/(\*\*[^*]+\*\*)/g);
        return (
          <Text key={idx} style={[styles.msgText, { color: baseColor }]}>
            {boldParts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <Text key={j} style={styles.boldText}>
                    {part.slice(2, -2)}
                  </Text>
                );
              }
              const codeParts = part.split(/(`[^`]+`)/g);
              return codeParts.map((cp, k) => {
                if (cp.startsWith('`') && cp.endsWith('`')) {
                  return (
                    <Text key={j + '-' + k} style={styles.inlineCode}>
                      {cp.slice(1, -1)}
                    </Text>
                  );
                }
                return <Text key={j + '-' + k}>{cp}</Text>;
              });
            })}
          </Text>
        );
      })}
    </View>
  );
}

function ChatBubble({ message }: { message: any }) {
  const isUser = message.role === 'user';
  const isThinking = message.status === 'thinking';
  const isError = message.status === 'error';

  return (
    <View style={[styles.bubbleRow, isUser ? styles.rowRight : styles.rowLeft]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
          isError && styles.errorBubble,
        ]}
      >
        {isThinking ? (
          <ThinkingDots />
        ) : isError ? (
          <Text style={styles.errorText}>{message.content}</Text>
        ) : (
          <MessageContent content={message.content} isUser={isUser} />
        )}
      </View>
    </View>
  );
}

const ICON_TRANSITION_MS = 180;

function MicOrSendButton({ hasText, onSend }: { hasText: boolean; onSend: () => void }) {
  const micOpacity = useRef(new Animated.Value(1)).current;
  const sendOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(micOpacity, {
        toValue: hasText ? 0 : 1,
        duration: ICON_TRANSITION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(sendOpacity, {
        toValue: hasText ? 1 : 0,
        duration: ICON_TRANSITION_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [hasText, micOpacity, sendOpacity]);

  const handlePress = () => {
    if (!hasText) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onSend();
  };

  return (
    <Pressable onPress={handlePress} style={styles.circleBtnWrap}>
      <Animated.View style={[styles.sendBtn, { transform: [{ scale }] }]}>
        <Animated.View style={[styles.iconOverlay, { opacity: micOpacity }]} pointerEvents="none">
          <MaterialCommunityIcons name="microphone" size={22} color={COLORS.textLight} />
        </Animated.View>
        <Animated.View style={[styles.iconOverlay, { opacity: sendOpacity }]} pointerEvents="none">
          <MaterialCommunityIcons name="arrow-up" size={22} color={COLORS.textLight} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export function AiChatScreen({ onNavigateToWorkout }: { onNavigateToWorkout?: () => void }) {
  const { data: workoutSessions = [] } = useWorkoutSessions();
  const [messages, setMessages] = useState<any[]>([
    {
      id: generateId(),
      role: 'assistant',
      content: 'Hello! I\'m Hira, your AI assistant. You can log history, add workouts, create workout plans and programs, and more—with more features coming to Hira soon. How can I help you today?',
      status: 'done',
      time: formatTime(new Date()),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showAttachOverlay, setShowAttachOverlay] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const streamingIdRef = useRef<string | null>(null);

  const quickActions = React.useMemo(
    () => [
      { id: 'log-history', label: 'Log History', icon: 'history' as const, iconColor: '#60A5FA', message: null as string | null },
      { id: 'calories', label: 'Check Calories', icon: 'fire' as const, iconColor: '#FBBF24', message: 'Check calories' },
      { id: 'not-well', label: "I'm not well", icon: 'heart' as const, iconColor: COLORS.error, message: "I'm not well" },
      { id: 'workout-day', label: 'My workout for the day', icon: 'dumbbell' as const, iconColor: COLORS.accent, message: 'My workout for the day' },
      { id: 'focus', label: 'What should I focus on more?', icon: 'target' as const, iconColor: COLORS.success, message: 'What should I focus on more?' },
      { id: 'pullups', label: 'What is the best workout for pull ups', icon: 'arm-flex' as const, iconColor: '#A78BFA', message: 'What is the best workout for pull ups' },
      { id: 'improve', label: 'How to improve myself', icon: 'trending-up' as const, iconColor: '#FBBF24', message: 'How to improve myself' },
    ],
    []
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 60);
  }, []);

  React.useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const now = new Date();
      const userMsg = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        status: 'done' as const,
        time: formatTime(now),
      };

      const thinkingId = generateId();
      const thinkingMsg = {
        id: thinkingId,
        role: 'assistant' as const,
        content: '',
        status: 'thinking' as const,
        time: formatTime(now),
      };

      setIsLoading(true);
      setMessages((prev) => [...prev, userMsg, thinkingMsg]);
      scrollToBottom();

      const history = [...messages, userMsg].map(({ role, content: c }) => ({ role, content: c }));

      try {
        const streamId = generateId();
        streamingIdRef.current = streamId;
        let accumulated = '';

        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinkingId
              ? { ...m, id: streamId, status: 'streaming' as const, content: '' }
              : m
          )
        );

        await sendGeminiMessage({
          messages: history,
          onStream: (delta) => {
            accumulated += delta;
            setMessages((prev) =>
              prev.map((m) => (m.id === streamId ? { ...m, content: accumulated } : m))
            );
            scrollToBottom();
          },
        });

        setMessages((prev) =>
          prev.map((m) => (m.id === streamId ? { ...m, status: 'done' as const } : m))
        );
      } catch (err: any) {
        const errId = streamingIdRef.current || thinkingId;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === errId || m.id === thinkingId
              ? { ...m, status: 'error' as const, content: '\u26a0\ufe0f ' + err.message }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        scrollToBottom();
      }
    },
    [isLoading, messages, scrollToBottom]
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    handleSendMessage(text);
  }, [input, handleSendMessage]);

  const insets = useSafeAreaInsets();
  const headerPaddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 44;

  return (
    <View style={styles.safeArea}>
      {/* Single-row header: menu | Hira | spacer */}
      <View style={[styles.headerRow, { paddingTop: headerPaddingTop }]}>
        <Pressable style={styles.headerMenuBtn} onPress={() => { }} accessibilityLabel="Menu">
          <MaterialCommunityIcons name="menu" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Hira</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Messages + Quick actions + Input */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 56 : 0}
      >
        <FlatList
          style={{ flex: 1 }}
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        />

        {/* Quick action pills – only when input is empty and no user messages yet */}
        {!input.trim() && messages.length <= 1 && (
          <ScrollView
            horizontal
            style={styles.quickActionsScroll}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsRow}
            decelerationRate={0.998}
          >
            {quickActions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.quickActionPill}
                onPress={() =>
                  handleSendMessage(
                    item.message === null ? buildWorkoutHistoryMessage(workoutSessions) : item.message
                  )
                }
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <MaterialCommunityIcons name={item.icon} size={14} color={item.iconColor} />
                <Text style={styles.quickActionText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input Bar: single rounded input with Plus | TextInput | Mic/Send inside */}
        <View style={[styles.inputBar, { marginTop: 10, paddingBottom: isKeyboardVisible ? 10 : 10 + insets.bottom }]}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputLeftBtn}>
              <Pressable style={styles.circleBtnWrap} onPress={() => setShowAttachOverlay(true)} accessibilityLabel="Attach">
                <View style={styles.sendBtn}>
                  <MaterialCommunityIcons name="plus" size={22} color={COLORS.textLight} />
                </View>
              </Pressable>
            </View>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Ask me anything"
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={4000}
              returnKeyType="default"
              blurOnSubmit={false}
              textAlign="left"
            />
            {isLoading ? (
              <View style={styles.loadingBtn}>
                <ActivityIndicator size="small" color={COLORS.accentLight} />
              </View>
            ) : (
              <View style={styles.inputRightBtn}>
                <MicOrSendButton hasText={!!input.trim()} onSend={handleSend} />
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showAttachOverlay}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachOverlay(false)}
      >
        <Pressable style={styles.attachOverlayBackdrop} onPress={() => setShowAttachOverlay(false)}>
          <Pressable style={styles.attachOverlayPanel} onPress={(e) => e.stopPropagation()}>
            <Pressable
              style={styles.attachOverlayRow}
              onPress={() => { setShowAttachOverlay(false); }}
            >
              <MaterialCommunityIcons name="camera" size={22} color={COLORS.text} />
              <Text style={styles.attachOverlayRowText}>Capture</Text>
            </Pressable>
            <Pressable
              style={styles.attachOverlayRow}
              onPress={() => { setShowAttachOverlay(false); }}
            >
              <MaterialCommunityIcons name="file-document-outline" size={22} color={COLORS.text} />
              <Text style={styles.attachOverlayRowText}>Add files</Text>
            </Pressable>
            <Pressable
              style={styles.attachOverlayRow}
              onPress={() => { setShowAttachOverlay(false); }}
            >
              <MaterialCommunityIcons name="image-outline" size={22} color={COLORS.text} />
              <Text style={styles.attachOverlayRowText}>Upload photo</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },

  // Header (single row)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerMenuBtn: { padding: 8 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textLight,
    textAlign: 'center',
  },
  headerSpacer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 52,
  },

  // Quick action pills (small by default, low height)
  quickActionsScroll: {
    flexGrow: 0,
    maxHeight: 60,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingRight: 24,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionText: {
    fontSize: 12,
    color: COLORS.text,
    marginLeft: 4,
    fontWeight: '500',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },

  // Bubble row
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    gap: 8,
  },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },

  // Bubble
  bubble: {
    maxWidth: '78%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  userBubble: {
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 4,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  aiBubble: {
    backgroundColor: COLORS.aiBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorBubble: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderColor: COLORS.error,
  },

  // Text
  msgText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.accentLight,
  },
  inlineCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'rgba(108,99,255,0.15)',
    color: COLORS.accentLight,
    paddingHorizontal: 4,
    borderRadius: 4,
    fontSize: 13,
  },
  codeBlock: {
    backgroundColor: '#0A0B10',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#A8FF78',
    lineHeight: 20,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    lineHeight: 20,
  },

  // Thinking dots
  thinkingRow: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  thinkingDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.textLight,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    maxHeight: 130,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingLeft: 4,
    paddingRight: 4,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingLeft: 15,
    paddingRight: 52,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 130,
    lineHeight: 22,
    textAlign: 'left',
  },
  inputLeftBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRightBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBtnWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  iconOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  loadingBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  attachOverlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 120,
  },
  attachOverlayPanel: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  attachOverlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  attachOverlayRowText: {
    fontSize: 15,
    color: COLORS.text,
  },
});
