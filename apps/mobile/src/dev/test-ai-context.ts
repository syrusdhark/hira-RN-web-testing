import { supabase } from '../lib/supabase';
import { buildUserContext, formatContextForPrompt } from '../services/ai-context.service';

/**
 * Dev helper to verify that user memories are being pulled and
 * formatted correctly for the AI prompt.
 *
 * Usage (example):
 *   import { testContext } from '@/dev/test-ai-context';
 *   await testContext();
 */
export async function testContext() {
  const userId = 'your-test-user-id'; // TODO: replace with a real user id

  // 1. Seed some memory snapshots
  await supabase.from('ai_memory_snapshots').insert([
    {
      user_id: userId,
      memory_type: 'injuries',
      value: { list: ['Left knee tendonitis', 'Lower back sensitivity'] },
      source: 'user',
      is_active: true,
      confidence: 1.0,
    },
    {
      user_id: userId,
      memory_type: 'goals',
      value: { list: ['Build muscle', 'Improve mobility'] },
      source: 'user',
      is_active: true,
      confidence: 1.0,
    },
    {
      user_id: userId,
      memory_type: 'experience_level',
      value: 'intermediate',
      source: 'user',
      is_active: true,
      confidence: 1.0,
    },
  ]);

  // 2. Build context
  const context = await buildUserContext(userId);
  console.log('Context:', JSON.stringify(context, null, 2));

  // 3. Format for prompt
  const formatted = formatContextForPrompt(context);
  console.log('Formatted context for prompt:\n', formatted);
}

