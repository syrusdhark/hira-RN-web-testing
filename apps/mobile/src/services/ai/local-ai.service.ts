import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_TIMEOUT_MS = 120_000;
const AVAILABILITY_TIMEOUT_MS = 3000;
const WARMUP_TIMEOUT_MS = 120_000;

function getLocalAiUrl(): string {
  const url =
    Constants.expoConfig?.extra?.localAiUrl ||
    process.env.EXPO_PUBLIC_LOCAL_AI_URL;
  return typeof url === 'string' ? url.trim() : '';
}

function getLocalAiModel(): string {
  const model =
    Constants.expoConfig?.extra?.localAiModel ||
    process.env.EXPO_PUBLIC_LOCAL_AI_MODEL;
  return typeof model === 'string' ? model.trim() : 'phi4-mini:latest';
}

/**
 * Check if Ollama is running and the configured model is available.
 */
export async function isAvailable(): Promise<boolean> {
  const baseUrl = getLocalAiUrl();
  const model = getLocalAiModel();
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/cd660e56-307d-4b97-a0b1-1e6647da9f0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'local-ai.service.ts:isAvailable',message:'isAvailable start',data:{baseUrl:baseUrl||'(empty)',model,hasUrl:!!baseUrl},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  if (!baseUrl) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AVAILABILITY_TIMEOUT_MS);

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/cd660e56-307d-4b97-a0b1-1e6647da9f0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'local-ai.service.ts:isAvailable',message:'fetch /api/tags result',data:{ok:response.ok,status:response.status},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    if (!response.ok) return false;

    const data = (await response.json()) as { models?: { name: string }[] };
    const names = (data.models ?? []).map((m) => m.name);
    const hasModel = (data.models ?? []).some(
      (m) => m.name === model || m.name.includes(model.split(':')[0])
    );
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/cd660e56-307d-4b97-a0b1-1e6647da9f0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'local-ai.service.ts:isAvailable',message:'model check',data:{model,names,hasModel},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    return hasModel;
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/cd660e56-307d-4b97-a0b1-1e6647da9f0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'local-ai.service.ts:isAvailable',message:'isAvailable catch',data:{errName:err instanceof Error?err.name:'',errMsg:err instanceof Error?err.message:String(err)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    return false;
  }
}

/**
 * Get list of available models from Ollama.
 */
export async function getAvailableModels(): Promise<string[]> {
  const baseUrl = getLocalAiUrl();
  if (!baseUrl) return [];
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/tags`);
    if (!response.ok) return [];
    const data = (await response.json()) as { models?: { name: string }[] };
    return (data.models ?? []).map((m) => m.name);
  } catch {
    return [];
  }
}

/**
 * Warm up the model (run once on app start to reduce first-reply latency).
 */
export async function warmup(): Promise<boolean> {
  const baseUrl = getLocalAiUrl();
  if (!baseUrl) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: getLocalAiModel(),
        messages: [{ role: 'user', content: 'Hi' }],
        stream: false,
        options: { num_predict: 10 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Diagnostics for debugging (URL, model, platform, available models).
 */
export async function getDiagnostics(): Promise<{
  isRunning: boolean;
  url: string;
  model: string;
  availableModels: string[];
  platform: string;
}> {
  const url = getLocalAiUrl();
  const model = getLocalAiModel();
  const isRunning = await isAvailable();
  const availableModels = await getAvailableModels();
  return {
    isRunning,
    url: url || '(not set)',
    model,
    availableModels,
    platform: Platform.OS,
  };
}

/**
 * Send chat message to Ollama. Checks availability first; uses timeout and options for reliability.
 */
export async function chat(
  systemPrompt: string,
  userMessage: string,
  context: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<{ response: string; tokensUsed: number }> {
  const baseUrl = getLocalAiUrl();
  if (!baseUrl) {
    throw new Error(
      'Local AI URL not set. Set EXPO_PUBLIC_LOCAL_AI_URL (e.g. http://localhost:11434) and restart the dev server.'
    );
  }

  const available = await isAvailable();
  if (!available) {
    const model = getLocalAiModel();
    throw new Error(
      `Ollama is not running or model "${model}" not found. Start with: ollama serve && ollama pull ${model}`
    );
  }

  const model = getLocalAiModel();
  const systemContent = context
    ? `${systemPrompt}\n\nContext:\n${context}`
    : systemPrompt;

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemContent },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const ollamaUrl = `${baseUrl.replace(/\/$/, '')}/api/chat`;
    const body = {
      model,
      messages,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 300,
        top_p: 0.9,
      },
    };

    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Local AI error (${response.status}): ${text || response.statusText}`
      );
    }

    const data = (await response.json()) as {
      message?: { content?: string };
      eval_count?: number;
      choices?: Array<{ message?: { content?: string } }>;
    };

    let responseText = '';
    let tokensUsed = 0;

    if (data.message?.content != null) {
      responseText = String(data.message.content);
      tokensUsed = data.eval_count ?? 0;
    } else if (data.choices?.[0]?.message?.content != null) {
      responseText = String(data.choices[0].message.content);
      tokensUsed = data.eval_count ?? 0;
    }

    return { response: responseText, tokensUsed };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error(
          `Ollama took too long to respond (>${timeoutMs / 1000}s). The model might be loading. Try again.`
        );
      }
      const msg = err.message.toLowerCase();
      const isNetworkError =
        msg.includes('network request failed') ||
        msg.includes('fetch') ||
        msg.includes('failed to connect') ||
        msg.includes('network error');
      if (isNetworkError) {
        const hint =
          baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')
            ? ' On emulator use http://10.0.2.2:11434; on a physical device use your computer\'s LAN IP. Restart the dev server after changing .env.'
            : ' Ensure Ollama is running (ollama serve) and the device can reach it.';
        throw new Error(
          'Cannot reach local AI (network error). Check EXPO_PUBLIC_LOCAL_AI_URL in apps/mobile/.env.' +
            hint
        );
      }
      throw err;
    }
    throw err;
  }
}
