import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { UserAchievement } from '../types/xp';

export const USER_ACHIEVEMENTS_KEY = ['userAchievements'];

interface UserAchievementRow {
  id: string;
  unlocked_at: string;
  achievements: {
    id: string;
    code: string;
    title: string;
    description: string | null;
    icon: string | null;
    tier: string | null;
  } | null;
}

export function useUserAchievements() {
  return useQuery({
    queryKey: USER_ACHIEVEMENTS_KEY,
    queryFn: async (): Promise<UserAchievement[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_achievements')
        .select('id, unlocked_at, achievements(code, title, description, icon, tier)')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      if (!data?.length) return [];

      return (data as UserAchievementRow[]).map((r) => {
        const a = r.achievements;
        return {
          id: r.id,
          code: a?.code ?? '',
          title: a?.title ?? '',
          description: a?.description ?? null,
          icon: a?.icon ?? null,
          tier: a?.tier ?? null,
          unlocked_at: r.unlocked_at,
        };
      });
    },
  });
}
