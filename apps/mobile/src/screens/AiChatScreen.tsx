import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  Dimensions,
} from 'react-native';
import Constants from 'expo-constants';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TAB_BAR_ROW_HEIGHT } from '../constants/layout';

type MessageItem = { id: string; text: string; sender: 'user' | 'ai' };

type SpeechRecognitionModule = {
  addListener: (event: string, cb: (e?: unknown) => void) => { remove: () => void };
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  isRecognitionAvailable: () => Promise<boolean>;
  start: (opts: { lang: string; interimResults: boolean; continuous: boolean }) => void;
  stop: () => void;
};

let ExpoSpeechRecognitionModule: SpeechRecognitionModule | null = null;
try {
  const speech = require('expo-speech-recognition') as { ExpoSpeechRecognitionModule: SpeechRecognitionModule };
  ExpoSpeechRecognitionModule = speech.ExpoSpeechRecognitionModule;
} catch {
  // expo-speech-recognition not installed or not available (e.g. Expo Go)
}

function getApiKey(): string {
  const key =
    Constants.expoConfig?.extra?.geminiApiKey ??
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
  if (!key || typeof key !== 'string' || !key.trim()) {
    throw new Error('Missing Gemini API key. Set GEMINI_API_KEY in your environment.');
  }
  return key.trim();
}

type GenerativeModel = ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

export function AiChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [model, setModel] = useState<GenerativeModel | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [keyboardBottomOffset, setKeyboardBottomOffset] = useState(0);
  const flatListRef = useRef<FlatList<MessageItem> | null>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const { height: windowHeight } = Dimensions.get('window');
        const keyboardTop = e.endCoordinates.screenY;
        let offset = windowHeight - keyboardTop;
        if (offset <= 0) offset = e.endCoordinates.height;
        if (Platform.OS === 'android') {
          offset = Math.max(0, offset - 80);
        }
        setKeyboardBottomOffset(offset);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardBottomOffset(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!ExpoSpeechRecognitionModule) return;
    const startSub = ExpoSpeechRecognitionModule.addListener('start', () => setIsListening(true));
    const endSub = ExpoSpeechRecognitionModule.addListener('end', () => setIsListening(false));
    const resultSub = ExpoSpeechRecognitionModule.addListener('result', (e?: unknown) => {
      const event = e as { results?: Array<{ transcript?: string }> } | undefined;
      const results = event?.results;
      if (results?.length) {
        const last = results[results.length - 1];
        if (last?.transcript != null) setInputText(last.transcript);
      }
    });
    const errorSub = ExpoSpeechRecognitionModule.addListener('error', (e?: unknown) => {
      const event = e as { message?: string } | undefined;
      if (event?.message) console.warn('Speech recognition error:', event.message);
    });
    return () => {
      startSub.remove();
      endSub.remove();
      resultSub.remove();
      errorSub.remove();
    };
  }, []);

  useEffect(() => {
    try {
      const key = getApiKey();
      const genAI = new GoogleGenerativeAI(key);
      setModel(genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' }));
    } catch (e) {
      setApiKeyError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const startVoice = async () => {
    if (!ExpoSpeechRecognitionModule) {
      Alert.alert(
        'Voice input',
        'Speech recognition is not available. Install expo-speech-recognition and use a development build (expo run:android / expo run:ios).'
      );
      return;
    }
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert('Microphone', 'Microphone permission is needed for voice input.');
        return;
      }
      const available = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!available) {
        Alert.alert('Voice input', 'Speech recognition is not available on this device.');
        return;
      }
      if (isListening) {
        ExpoSpeechRecognitionModule.stop();
      } else {
        ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          interimResults: true,
          continuous: false,
        });
      }
    } catch (e) {
      console.warn('Voice error:', e);
      Alert.alert('Voice input', 'Could not start voice recognition. Try again.');
    }
  };

  const sendMessage = async () => {
    if (inputText.trim() === '' || loading || !model) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user' as const,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const history = messages.map((msg) => ({
        role: (msg.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: msg.text }],
      }));

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userMessage.text);
      const response = result.response;
      const text = response.text();

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: text ?? '',
        sender: 'ai' as const,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Gemini Error:', error);
      const msg = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', msg.includes('API key') ? msg : 'Something went wrong. Check your API key or billing tier.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: MessageItem }) => (
    <View style={[styles.messageContainer, item.sender === 'user' ? styles.userMessage : styles.aiMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  const bottomPadding = insets.bottom + TAB_BAR_ROW_HEIGHT;
  const inputAreaHeight = 100;
  const listBottomPadding =
    keyboardBottomOffset > 0 ? keyboardBottomOffset + inputAreaHeight : 120;

  if (apiKeyError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{apiKeyError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* @ts-expect-error React 19 + @types/react-native FlatList JSX type mismatch */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item: MessageItem) => item.id}
        contentContainerStyle={[styles.chatList, { paddingBottom: listBottomPadding }]}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#007AFF" />
        </View>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            paddingBottom: keyboardBottomOffset > 0 ? 8 : bottomPadding,
            bottom: keyboardBottomOffset > 0 ? keyboardBottomOffset : 0,
          },
        ]}
      >
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.attachButton} accessibilityLabel="Attach">
              <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#666"
              multiline
              maxLength={4000}
            />
            <TouchableOpacity
              onPress={inputText.trim() ? sendMessage : startVoice}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.actionButtonTouchable}
              accessibilityLabel={inputText.trim() ? 'Send' : 'Voice input'}
            >
              <LinearGradient
                colors={['#E91E8C', '#9C27B0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButtonGradient}
              >
                {inputText.trim() ? (
                  <MaterialCommunityIcons name="send" size={22} color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="microphone" size={22} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={styles.disclaimer}>Hira AI can make mistakes. Check important info.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  chatList: { padding: 15 },
  messageContainer: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#222',
  },
  messageText: { color: '#fff', fontSize: 16 },
  inputWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: '#000',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 28,
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 52,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 100,
  },
  actionButtonTouchable: {
    marginLeft: 4,
  },
  actionButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimer: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  loadingContainer: { padding: 10, alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#F87171', fontSize: 14, textAlign: 'center' },
});
