import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { UserXpSummary } from '../types/xp';

export const USER_XP_KEY = ['userXp'];

interface XpLevelRow {
  level: number;
  xp_required: number;
  title: string | null;
}

async function fetchUserXpSummary(): Promise<UserXpSummary | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: xpRow, error: xpError } = await supabase
    .from('user_xp')
    .select('user_id, total_xp, current_level, xp_in_current_level')
    .eq('user_id', user.id)
    .maybeSingle();

  if (xpError) throw xpError;

  const currentLevel = xpRow ? Number(xpRow.current_level) : 1;
  const totalXp = xpRow ? Number(xpRow.total_xp) : 0;
  const xpInCurrentLevel = xpRow ? Number(xpRow.xp_in_current_level) : 0;

  const { data: levels, error: levelsError } = await supabase
    .from('xp_levels')
    .select('level, xp_required, title')
    .gte('level', 1)
    .order('level', { ascending: true });

  if (levelsError) throw levelsError;
  const levelRows = (levels ?? []) as XpLevelRow[];

  const currentLevelRow = levelRows.find((r) => r.level === currentLevel);
  const levelTitle = currentLevelRow?.title ?? null;
  const currentLevelXpRequired = currentLevelRow?.xp_required ?? 0;

  const nextLevelRow = levelRows.find((r) => r.level > currentLevel);
  const nextLevelXpRequired = nextLevelRow != null ? nextLevelRow.xp_required : null;

  let xpToNextLevel: number;
  let progressPct: number;
  if (nextLevelXpRequired == null) {
    xpToNextLevel = 0;
    progressPct = 100;
  } else {
    const range = nextLevelXpRequired - currentLevelXpRequired;
    xpToNextLevel = Math.max(0, nextLevelXpRequired - totalXp);
    progressPct = range > 0
      ? Math.min(100, Math.round((xpInCurrentLevel / range) * 100))
      : 100;
  }

  return {
    total_xp: totalXp,
    current_level: currentLevel,
    level_title: levelTitle,
    xp_in_current_level: xpInCurrentLevel,
    next_level_xp_required: nextLevelXpRequired,
    xp_to_next_level: xpToNextLevel,
    progress_pct: progressPct,
  };
}

export function useUserXp() {
  return useQuery({
    queryKey: USER_XP_KEY,
    queryFn: fetchUserXpSummary,
  });
}
