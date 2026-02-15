import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { UserStreak, StreakType } from '../types/xp';

export const USER_STREAKS_KEY = ['userStreaks'];

const STREAK_TYPES: StreakType[] = ['workout', 'nutrition', 'weight_tracking', 'overall'];

function isStreakType(s: string): s is StreakType {
  return STREAK_TYPES.includes(s as StreakType);
}

export function useUserStreaks() {
  return useQuery({
    queryKey: USER_STREAKS_KEY,
    queryFn: async (): Promise<UserStreak[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_streaks')
        .select('streak_type, current_streak, longest_streak')
        .eq('user_id', user.id);

      if (error) throw error;
      if (!data?.length) return [];

      return data
        .filter((r) => isStreakType(r.streak_type))
        .map((r) => ({
          streak_type: r.streak_type as StreakType,
          current_streak: Number(r.current_streak) || 0,
          longest_streak: Number(r.longest_streak) || 0,
        }));
    },
  });
}
