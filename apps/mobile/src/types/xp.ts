/** XP summary for current user (from user_xp + xp_levels). Pre-processed for UI; no formatting in components. */
export interface UserXpSummary {
  total_xp: number;
  current_level: number;
  level_title: string | null;
  xp_in_current_level: number;
  /** null when at max level */
  next_level_xp_required: number | null;
  xp_to_next_level: number;
  /** 0–100; 100 at max level */
  progress_pct: number;
}

export type StreakType = 'workout' | 'nutrition' | 'weight_tracking' | 'overall';

export interface UserStreak {
  streak_type: StreakType;
  current_streak: number;
  longest_streak: number;
}

export interface UserAchievement {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  tier: string | null;
  unlocked_at: string;
}
