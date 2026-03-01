import {
  buildPrompt,
  HIRA_MASTER_PROMPT,
  HIRA_MASTER_PROMPT_COMPACT,
  wellnessToRuntimeContext,
} from '../system-prompts';
import type { WellnessContext } from '../../../types/ai-context';

describe('buildPrompt', () => {
  it('returns a string containing the compact master prompt and CURRENT USER STATE for minimal context', () => {
    const out = buildPrompt({ user: { name: 'User' } }, { useCompact: true });
    expect(out).toContain('Hira');
    expect(out).toContain('CURRENT USER STATE');
    expect(out).toContain('Name: User');
    expect(out).toContain('Feeling: unknown');
    expect(out).toContain('Energy: unknown');
    expect(out).toContain('Recovery: unknown');
  });

  it('includes full user state when provided', () => {
    const out = buildPrompt({
      user: { name: 'Alex', feeling: 7, energy: 5, recovery: 'legs need rest' },
    });
    expect(out).toContain('Name: Alex');
    expect(out).toContain('7/10');
    expect(out).toContain('5/10');
    expect(out).toContain('legs need rest');
  });

  it('appends RESPONSE MODE when behaviorMode is brief', () => {
    const out = buildPrompt(
      { user: { name: 'User' }, behaviorMode: 'brief' },
      { useCompact: true }
    );
    expect(out).toContain('RESPONSE MODE');
    expect(out).toContain('100 words');
  });

  it('appends RESPONSE MODE when behaviorMode is deep_reflection', () => {
    const out = buildPrompt(
      { user: { name: 'User' }, behaviorMode: 'deep_reflection' },
      { useCompact: true }
    );
    expect(out).toContain('RESPONSE MODE');
    expect(out).toContain('underlying patterns');
  });

  it('includes INTERACTION CONTEXT when surface or intent present', () => {
    const out = buildPrompt({
      user: { name: 'User' },
      surface: 'chat',
      intent: 'workout_planning',
    });
    expect(out).toContain('INTERACTION CONTEXT');
    expect(out).toContain('Surface: chat');
    expect(out).toContain('Intent hint: workout_planning');
  });

  it('uses full master prompt when useCompact is false', () => {
    const out = buildPrompt({ user: { name: 'User' } }, { useCompact: false });
    expect(out).toContain(HIRA_MASTER_PROMPT);
    expect(out).not.toContain(HIRA_MASTER_PROMPT_COMPACT);
  });
});

describe('wellnessToRuntimeContext', () => {
  it('maps WellnessContext to HiraRuntimeContext', () => {
    const w: WellnessContext = {
      core: { user_name: 'Jordan', current_date: '2025-02-26', user_timezone: 'UTC' },
      current_state: { today_feeling: 6, today_energy: 4 },
      recovery: {
        muscles_need_rest: ['quads', 'hamstrings'],
        overall_recovery_score: 5,
      },
    };
    const ctx = wellnessToRuntimeContext(w);
    expect(ctx.user.name).toBe('Jordan');
    expect(ctx.user.feeling).toBe(6);
    expect(ctx.user.energy).toBe(4);
    expect(ctx.user.recovery).toContain('quads');
    expect(ctx.user.recovery).toContain('5/10');
  });

  it('applies overrides', () => {
    const w: WellnessContext = {
      core: { user_name: 'Sam', current_date: '', user_timezone: '' },
    };
    const ctx = wellnessToRuntimeContext(w, { surface: 'home_card' });
    expect(ctx.user.name).toBe('Sam');
    expect(ctx.surface).toBe('home_card');
  });
});
