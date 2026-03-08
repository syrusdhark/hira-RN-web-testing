/**
 * Gemini API client for Hira AI chat.
 * Uses @google/genai SDK with streaming, optional Google Search and thinking config.
 */

import Constants from 'expo-constants';
import { GoogleGenAI } from '@google/genai';

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
  onStream?: (chunk: string) => void;
  config?: Partial<GeminiConfig>;
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

/**
 * Convert chat messages to SDK contents format (role 'user' | 'model', parts with text).
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
 * Send a chat request via @google/genai. Sends only the conversation (no system instruction).
 * If onStream is provided, streams the response; otherwise returns the full reply.
 */
export async function sendGeminiMessage(params: SendGeminiMessageParams): Promise<string> {
  const { messages, onStream, config: configOverride } = params;

  const apiKey = configOverride?.apiKey ?? getApiKey();
  const model = configOverride?.model ?? DEFAULT_MODEL;
  const temperature = configOverride?.temperature ?? DEFAULT_TEMPERATURE;
  const maxTokens = configOverride?.maxTokens ?? DEFAULT_MAX_TOKENS;

  const contents = toGeminiContents(messages);
  if (contents.length === 0) {
    throw new Error('At least one message is required');
  }

  const ai = new GoogleGenAI({ apiKey });

  const config: Record<string, unknown> = {
    thinkingConfig: { thinkingBudget: 0 },
    temperature,
    maxOutputTokens: maxTokens,
  };

  // #region agent log
  fetch('http://127.0.0.1:7911/ingest/d3927811-4405-4a0e-8cdd-dfbe6b5cc9bd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'96148b'},body:JSON.stringify({sessionId:'96148b',location:'gemini.service.ts:preCall',message:'Before generateContentStream',data:{model,contentsLength:contents.length,hasApiKey:!!apiKey},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  try {
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    // #region agent log
    fetch('http://127.0.0.1:7911/ingest/d3927811-4405-4a0e-8cdd-dfbe6b5cc9bd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'96148b'},body:JSON.stringify({sessionId:'96148b',location:'gemini.service.ts:postAwait',message:'Got stream response',data:{responseType:typeof response,isAsyncIterable:typeof (response as any)[Symbol.asyncIterator]},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
    // #endregion

    let full = '';
    let chunkIndex = 0;
    for await (const chunk of response) {
      if (chunkIndex === 0) {
        // #region agent log
        const textVal = (chunk as { text?: string }).text;
        fetch('http://127.0.0.1:7911/ingest/d3927811-4405-4a0e-8cdd-dfbe6b5cc9bd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'96148b'},body:JSON.stringify({sessionId:'96148b',location:'gemini.service.ts:firstChunk',message:'First chunk shape',data:{chunkKeys:Object.keys(chunk as object),hasText:typeof textVal,textLen:textVal?.length},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
      }
      chunkIndex++;
      const text = (chunk as { text?: string }).text ?? '';
      if (text) {
        full += text;
        onStream?.(text);
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7911/ingest/d3927811-4405-4a0e-8cdd-dfbe6b5cc9bd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'96148b'},body:JSON.stringify({sessionId:'96148b',location:'gemini.service.ts:afterLoop',message:'After stream loop',data:{chunkCount:chunkIndex,fullLength:full.length},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

    return full;
  } catch (err) {
    // #region agent log
    const msg = err instanceof Error ? err.message : String(err);
    fetch('http://127.0.0.1:7911/ingest/d3927811-4405-4a0e-8cdd-dfbe6b5cc9bd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'96148b'},body:JSON.stringify({sessionId:'96148b',location:'gemini.service.ts:catch',message:'Gemini catch',data:{errorMessage:msg,constructorName:err instanceof Error ? err.constructor?.name : 'unknown'},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Gemini API error: ${message}`);
  }
}
