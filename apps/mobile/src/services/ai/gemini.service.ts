/**
 * Gemini API client for Hira AI chat.
 * Uses master prompt + structured context; supports chat and optional streaming.
 */

import { buildPrompt, type HiraRuntimeContext } from './system-prompts';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const DEFAULT_TEMPERATURE = 0.65;
const DEFAULT_MAX_TOKENS = 2048;

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface SendGeminiMessageParams {
  messages: Array<{ role: string; content: string }>;
  context?: HiraRuntimeContext;
  onStream?: (chunk: string) => void;
  config?: Partial<GeminiConfig>;
}

interface GeminiGenerateResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

function getApiKey(): string {
  let key = '';
  try {
    if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GEMINI_API_KEY != null) {
      key = String(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
    }
    if (!key && typeof require !== 'undefined') {
      const Constants = require('expo-constants').default;
      const extra = Constants?.expoConfig?.extra as { geminiApiKey?: string } | undefined;
      if (extra?.geminiApiKey) key = String(extra.geminiApiKey);
    }
  } catch {
    // ignore
  }
  if (!key || !key.trim()) {
    throw new Error(
      'Missing Gemini API key. Set EXPO_PUBLIC_GEMINI_API_KEY in apps/mobile/.env or extra.geminiApiKey in app config.'
    );
  }
  return key.trim();
}

/**
 * Convert chat messages to Gemini contents format.
 * System is sent as systemInstruction; user/assistant turn into contents.
 */
function toGeminiContents(messages: Array<{ role: string; content: string }>): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const m of messages) {
    const role = m.role === 'assistant' ? 'model' : 'user';
    contents.push({ role, parts: [{ text: m.content }] });
  }
  return contents;
}

/**
 * Send a chat request to Gemini. Uses buildPrompt for system instructions.
 * If onStream is provided, streams the response; otherwise returns the full reply.
 */
export async function sendGeminiMessage(params: SendGeminiMessageParams): Promise<string> {
  const {
    messages,
    context,
    onStream,
    config: configOverride,
  } = params;

  const apiKey = configOverride?.apiKey ?? getApiKey();
  const model = configOverride?.model ?? DEFAULT_MODEL;
  const temperature = configOverride?.temperature ?? DEFAULT_TEMPERATURE;
  const maxTokens = configOverride?.maxTokens ?? DEFAULT_MAX_TOKENS;

  const runtimeContext: HiraRuntimeContext = context ?? {
    user: { name: 'User' },
  };
  const systemInstruction = buildPrompt(runtimeContext, { useCompact: true });

  const contents = toGeminiContents(messages);
  if (contents.length === 0) {
    throw new Error('At least one message is required');
  }

  const url = `${GEMINI_BASE}/${model}:${onStream ? 'streamGenerateContent' : 'generateContent'}?key=${encodeURIComponent(apiKey)}`;
  const body = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  if (onStream && res.body != null) {
    return streamResponse(res, onStream);
  }

  const data = (await res.json()) as GeminiGenerateResponse;
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text;
}

async function streamResponse(
  res: Response,
  onStream: (chunk: string) => void
): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('{')) continue;
      try {
        const obj = JSON.parse(trimmed) as GeminiGenerateResponse;
        const text = obj.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) {
          full += text;
          onStream(text);
        }
      } catch {
        // ignore parse errors on stream chunks
      }
    }
  }
  if (buffer.trim()) {
    try {
      const obj = JSON.parse(buffer.trim()) as GeminiGenerateResponse;
      const text = obj.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (text) {
        full += text;
        onStream(text);
      }
    } catch {
      // ignore
    }
  }
  return full;
}
