import { analyzeQueryType, buildContextForQuery } from '../context-builder.service';
import { formatForAI, formatMinimal } from '../context-formatter.service';
import type { WellnessContext } from '../../../types/ai-context';

const limitResult = Promise.resolve({ data: [], error: null });
const orderChain = { order: jest.fn(() => ({ limit: jest.fn(() => limitResult) })) };
const gteChain = { gte: jest.fn(() => orderChain), order: orderChain.order };

const chain: Record<string, jest.Mock | (() => Promise<unknown>)> = {
  single: jest.fn().mockResolvedValue({ data: { full_name: 'Test User' } }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null }),
  limit: jest.fn(() => ({ maybeSingle: jest.fn().mockResolvedValue({ data: null }) })),
  order: jest.fn(() => ({ limit: jest.fn(() => limitResult) })),
  gte: jest.fn(() => gteChain),
  eq: jest.fn(() => chain as unknown as typeof chain),
};
(chain.eq as jest.Mock).mockImplementation(() => chain);

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => chain),
    })),
    rpc: jest.fn().mockResolvedValue({ data: null, error: new Error('RPC not found') }),
  },
}));

describe('analyzeQueryType', () => {
  it('returns "general" for unrelated message', () => {
    const r = analyzeQueryType('What time is it?');
    expect(r.type).toBe('general');
    expect(r.keywords).toEqual([]);
    expect(r.needsRecovery).toBe(false);
    expect(r.needsHistory).toBe(false);
  });

  it('returns "workout" for exercise-related message', () => {
    const r = analyzeQueryType('Should I do squats today?');
    expect(r.type).toBe('workout');
    expect(r.keywords).toContain('squat');
    expect(r.needsRecovery).toBe(true);
    expect(r.needsHistory).toBe(true);
  });

  it('returns "recovery" when recovery keywords present', () => {
    const r = analyzeQueryType('My legs are really sore');
    expect(r.type).toBe('recovery');
    expect(r.needsRecovery).toBe(true);
  });

  it('returns "emotional" for mood message', () => {
    const r = analyzeQueryType('I feel stressed and unmotivated');
    expect(r.type).toBe('emotional');
    expect(r.keywords.some((k) => ['feel', 'stressed', 'unmotivated'].includes(k))).toBe(true);
  });

  it('returns "nutrition" for food-related message', () => {
    const r = analyzeQueryType('What should I eat for breakfast?');
    expect(r.type).toBe('nutrition');
  });

  it('returns "sleep" for sleep-related message', () => {
    const r = analyzeQueryType('I have trouble sleeping');
    expect(r.type).toBe('sleep');
  });
});

describe('buildContextForQuery', () => {
  it('returns context with core for general query', async () => {
    const ctx = await buildContextForQuery('user-123', 'Hello', 7);
    expect(ctx.core).toBeDefined();
    expect(ctx.core.user_name).toBe('Test User');
    expect(ctx.core.current_date).toBeDefined();
    expect(ctx.core.user_timezone).toBeDefined();
    expect(ctx.recent_activity).toBeUndefined();
    expect(ctx.recovery).toBeUndefined();
  });

  it('workout query includes recent_activity and patterns', async () => {
    const ctx = await buildContextForQuery('user-123', 'Suggest a workout', 7);
    expect(ctx.core).toBeDefined();
    expect(ctx.recent_activity).toBeDefined();
    expect(ctx.recent_activity?.workouts_this_week).toBe(0);
    expect(ctx.patterns).toBeDefined();
  });
});

describe('formatForAI', () => {
  const fixture: WellnessContext = {
    core: {
      user_name: 'Jane',
      current_date: '2025-02-19',
      user_timezone: 'America/New_York',
    },
    current_state: {
      today_feeling: 7,
      today_energy: 6,
      current_mood: 'focused',
      sleep_quality: 8,
    },
    recent_activity: {
      workouts_this_week: 3,
      last_workout: {
        date: '2025-02-18',
        exercises: ['Squat', 'Bench'],
        duration_minutes: 45,
        feeling_score: 8,
        rpe: 7,
      },
      avg_feeling_this_week: 7.5,
    },
    recovery: {
      muscles_ready: ['back'],
      muscles_recovering: ['legs'],
      muscles_need_rest: ['chest'],
      overall_recovery_score: 6,
    },
    patterns: {
      favorite_exercises: ['Squat', 'Deadlift'],
      best_workout_time: 'morning',
      optimal_workout_frequency: 4,
    },
    goals: {
      primary_intention: 'feel_stronger',
      fitness_level: 'intermediate',
      specific_goals: ['Build strength', 'Consistency'],
    },
  };

  it('produces text containing user name, feeling, workouts', () => {
    const out = formatForAI(fixture);
    expect(out).toContain('Jane');
    expect(out).toContain('USER PROFILE');
    expect(out).toContain('Feeling today: 7/10');
    expect(out).toContain('RECENT ACTIVITY');
    expect(out).toContain('Workouts this week: 3');
    expect(out).toContain('Last workout');
    expect(out).toContain('Squat');
    expect(out).toContain('RECOVERY STATUS');
    expect(out).toContain('PATTERNS');
    expect(out).toContain('GOALS');
    expect(out).toContain('feel stronger');
  });

  it('handles minimal context (core only)', () => {
    const minimal: WellnessContext = {
      core: { user_name: 'Bob', current_date: '2025-02-19', user_timezone: 'UTC' },
    };
    const out = formatForAI(minimal);
    expect(out).toContain('Bob');
    expect(out).toContain('USER PROFILE');
    expect(out).not.toContain('RECENT ACTIVITY');
  });
});

describe('formatMinimal', () => {
  it('returns short one-line summary', () => {
    const ctx: WellnessContext = {
      core: { user_name: 'Alex', current_date: '2025-02-19', user_timezone: 'UTC' },
      current_state: { today_feeling: 5 },
      recent_activity: { workouts_this_week: 2 },
      recovery: { muscles_need_rest: ['legs'] },
    };
    const out = formatMinimal(ctx);
    expect(out).toContain('Alex');
    expect(out).toContain('Feeling: 5/10');
    expect(out).toContain('Workouts this week: 2');
    expect(out).toContain('Recovering: legs');
    expect(out.split('|').length).toBeGreaterThanOrEqual(2);
  });

  it('handles core-only context', () => {
    const ctx: WellnessContext = {
      core: { user_name: 'CoreOnly', current_date: '2025-02-19', user_timezone: 'UTC' },
    };
    const out = formatMinimal(ctx);
    expect(out).toBe('User: CoreOnly');
  });
});
