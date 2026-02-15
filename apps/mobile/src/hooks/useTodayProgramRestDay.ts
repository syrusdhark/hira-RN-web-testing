import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const TODAY_PROGRAM_REST_DAY_KEY = ['todayProgramRestDay'];

export type TodayProgramRestDay = {
  isRestDay: boolean;
  dayTitle: string | null;
};

function getTodayWeekdayIndex(): number {
  // JS getDay(): 0 (Sunday) - 6 (Saturday)
  const jsDay = new Date().getDay();
  // Map to 1-7 where 1 = Monday, 7 = Sunday
  return jsDay === 0 ? 7 : jsDay;
}

export function useTodayProgramRestDay() {
  return useQuery({
    queryKey: TODAY_PROGRAM_REST_DAY_KEY,
    queryFn: async (): Promise<TodayProgramRestDay> => {
      const base: TodayProgramRestDay = { isRestDay: false, dayTitle: null };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return base;

      const { data: program, error: programError } = await supabase
        .from('workout_programs')
        .select('id, deleted_at, is_active, started_at, created_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('is_active', { ascending: false })
        .order('started_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (programError || !program?.id) {
        return base;
      }

      const weekdayIndex = getTodayWeekdayIndex();

      const { data: dayRow, error: dayError } = await supabase
        .from('workout_program_days')
        .select('is_rest_day, title')
        .eq('workout_program_id', program.id)
        .eq('day_number', weekdayIndex)
        .maybeSingle();

      if (dayError || !dayRow) {
        return base;
      }

      return {
        isRestDay: dayRow.is_rest_day === true,
        dayTitle: dayRow.title ?? null,
      };
    },
  });
}

