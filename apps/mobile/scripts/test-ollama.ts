/**
 * Test Ollama connection and a simple chat. Uses env only (no Expo).
 * Run from repo root or apps/mobile:
 *   npx tsx apps/mobile/scripts/test-ollama.ts
 * Or from apps/mobile:
 *   npx tsx scripts/test-ollama.ts
 *
 * Set LOCAL_AI_URL or EXPO_PUBLIC_LOCAL_AI_URL (e.g. http://localhost:11434).
 */

const BASE_URL =
  process.env.EXPO_PUBLIC_LOCAL_AI_URL ||
  process.env.LOCAL_AI_URL ||
  'http://localhost:11434';
const MODEL = process.env.EXPO_PUBLIC_LOCAL_AI_MODEL || 'phi4-mini:latest';

async function isAvailable(): Promise<boolean> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 3000);
    const r = await fetch(`${BASE_URL.replace(/\/$/, '')}/api/tags`, {
      method: 'GET',
      signal: c.signal,
    });
    clearTimeout(t);
    if (!r.ok) return false;
    const data = (await r.json()) as { models?: { name: string }[] };
    const has =
      (data.models ?? []).some(
        (m) => m.name === MODEL || m.name.includes(MODEL.split(':')[0])
      );
    return has;
  } catch {
    return false;
  }
}

async function chat(
  systemPrompt: string,
  userMessage: string,
  context: string
): Promise<{ response: string; tokensUsed: number }> {
  const url = `${BASE_URL.replace(/\/$/, '')}/api/chat`;
  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt + (context ? `\n\nContext:\n${context}` : '') },
      { role: 'user', content: userMessage },
    ],
    stream: false,
    options: { num_predict: 100 },
  };
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 60000);
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: c.signal,
  });
  clearTimeout(t);
  if (!r.ok) throw new Error(`Ollama ${r.status}: ${await r.text()}`);
  const data = (await r.json()) as { message?: { content?: string }; eval_count?: number };
  return {
    response: data.message?.content ?? '',
    tokensUsed: data.eval_count ?? 0,
  };
}

async function main() {
  console.log('Testing Ollama connection...\n');
  console.log('URL:', BASE_URL);
  console.log('Model:', MODEL);

  console.log('\n1. Checking if Ollama is available...');
  const available = await isAvailable();
  console.log('   Result:', available ? 'YES' : 'NO');

  if (!available) {
    console.log('\nOllama is not running or model not found.');
    console.log('Start with: ollama serve');
    console.log('Then: ollama pull', MODEL);
    process.exit(1);
  }

  console.log('\n2. Sending simple message...');
  try {
    const r = await chat(
      'You are a helpful assistant. Keep responses under 50 words.',
      'Say hello',
      ''
    );
    console.log('   Response:', r.response.trim());
    console.log('   Tokens:', r.tokensUsed);
  } catch (e) {
    console.log('   Error:', e instanceof Error ? e.message : e);
    process.exit(1);
  }

  console.log('\n3. Sending message with context...');
  try {
    const ctx = 'User: Maya\nFeeling: 7/10\nWorkouts this week: 3';
    const r = await chat('You are Hira, a wellness coach. Be brief.', 'Should I workout today?', ctx);
    console.log('   Response:', r.response.trim());
  } catch (e) {
    console.log('   Error:', e instanceof Error ? e.message : e);
    process.exit(1);
  }

  console.log('\nAll tests passed.');
}

main();
