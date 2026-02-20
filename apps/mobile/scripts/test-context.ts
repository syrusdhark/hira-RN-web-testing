/**
 * Test context analysis and formatting. Optional: call local Ollama if
 * EXPO_PUBLIC_LOCAL_AI_URL is set (e.g. run with LOCAL_AI_URL=http://localhost:11434).
 *
 * Run from apps/mobile: npx ts-node scripts/test-context.ts
 * (Requires ts-node and tsconfig that allows node resolution.)
 */

// Inline minimal types to avoid pulling in app deps if script runs in isolation
type QueryType = 'workout' | 'nutrition' | 'sleep' | 'general' | 'recovery' | 'emotional';

function analyzeQueryType(message: string): { type: QueryType } {
  const lower = message.toLowerCase();
  const hasRecovery = ['sore', 'pain', 'recover', 'rest', 'tired', 'fatigue'].some((k) => lower.includes(k));
  const hasWorkout = ['workout', 'exercise', 'train', 'lift', 'squat', 'gym'].some((k) => lower.includes(k));
  const hasEmotional = ['feel', 'feeling', 'mood', 'stressed', 'anxious'].some((k) => lower.includes(k));
  const hasNutrition = ['eat', 'food', 'meal', 'diet', 'calories'].some((k) => lower.includes(k));
  const hasSleep = ['sleep', 'insomnia', 'tired', 'energy'].some((k) => lower.includes(k));
  if (hasRecovery) return { type: 'recovery' };
  if (hasWorkout) return { type: 'workout' };
  if (hasEmotional) return { type: 'emotional' };
  if (hasNutrition) return { type: 'nutrition' };
  if (hasSleep) return { type: 'sleep' };
  return { type: 'general' };
}

const mockFormattedContext = `USER PROFILE:
Name: Test User
Date: ${new Date().toISOString().split('T')[0]}

RECENT ACTIVITY:
Workouts this week: 3
Last workout: 2025-02-18
  - Duration: 45 minutes
  - Exercises: Squat, Bench, Row
  - Felt: 7/10
`;

const testQueries = [
  'Should I workout today?',
  "I'm feeling tired, what should I do?",
  'What exercises should I focus on?',
  "I'm sore from yesterday, can I train?",
  "How's my progress this week?",
];

function main() {
  console.log('=== Context query type analysis ===\n');
  for (const q of testQueries) {
    const { type } = analyzeQueryType(q);
    console.log(`Query: "${q}" -> type: ${type}`);
  }
  console.log('\n=== Sample formatted context (mock) ===\n');
  console.log(mockFormattedContext);

  const url = process.env.EXPO_PUBLIC_LOCAL_AI_URL || process.env.LOCAL_AI_URL;
  if (url) {
    console.log('\n=== Optional: testing local Ollama at', url, '===');
    testLocalOllama(url).catch((e) => console.error('Local Ollama test failed:', e));
  } else {
    console.log('\nSet EXPO_PUBLIC_LOCAL_AI_URL (e.g. http://localhost:11434) to test local Ollama.');
  }
}

async function testLocalOllama(baseUrl: string) {
  const u = baseUrl.replace(/\/$/, '');
  const res = await fetch(`${u}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.EXPO_PUBLIC_LOCAL_AI_MODEL || 'llama3.1:8b',
      messages: [
        { role: 'system', content: 'You are a brief fitness coach. Reply in one short sentence.' },
        { role: 'user', content: 'Should I workout today?' },
      ],
      stream: false,
    }),
  });
  if (!res.ok) {
    console.log('Ollama response not OK:', res.status, await res.text());
    return;
  }
  const data = (await res.json()) as { message?: { content?: string } };
  console.log('Ollama reply:', data.message?.content ?? '(no content)');
}

main();
