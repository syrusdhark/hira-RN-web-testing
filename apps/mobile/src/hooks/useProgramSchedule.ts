import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const PROGRAM_SCHEDULE_KEY = ['programSchedule'];

export type ProgramDaySchedule = {
  id: string;
  week_number: number;
  day_number: number;
  title: string | null;
  is_rest_day: boolean;
  templateId: string | null;
};

export type ProgramScheduleResult = {
  program: { id: string; title: string; duration_weeks: number | null } | null;
  weeks: number[];
  scheduleByWeek: Record<number, ProgramDaySchedule[]>;
  completedDayIds: string[];
  todayWeekNumber: number | null;
  todayWeekday: number | null; // 1 = Monday ... 7 = Sunday
};

function getMondayStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const jsDay = d.getDay(); // 0 (Sun) - 6 (Sat)
  const offset = jsDay === 0 ? -6 : 1 - jsDay; // move to Monday
  d.setDate(d.getDate() + offset);
  return d;
}

function getTodayWeekdayIndex(): number {
  const now = new Date();
  const jsDay = now.getDay();
  return jsDay === 0 ? 7 : jsDay; // 1-7, Monday=1
}

export function useProgramSchedule() {
  return useQuery({
    queryKey: PROGRAM_SCHEDULE_KEY,
    queryFn: async (): Promise<ProgramScheduleResult> => {
      const empty: ProgramScheduleResult = {
        program: null,
        weeks: [],
        scheduleByWeek: {},
        completedDayIds: [],
        todayWeekNumber: null,
        todayWeekday: null,
      };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return empty;

      const { data: program, error: programError } = await supabase
        .from('workout_programs')
        .select('id, title, duration_weeks, created_at, deleted_at, is_active, started_at, current_week')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('is_active', { ascending: false })
        .order('started_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (programError || !program?.id) {
        return empty;
      }

      const { data: days, error: daysError } = await supabase
        .from('workout_program_days')
        .select('id, week_number, day_number, title, is_rest_day')
        .eq('workout_program_id', program.id)
        .order('week_number', { ascending: true })
        .order('day_number', { ascending: true });

      if (daysError || !days?.length) {
        return {
          ...empty,
          program: {
            id: program.id,
            title: program.title,
            duration_weeks: program.duration_weeks ?? null,
          },
        };
      }

      const dayIds = days.map((d) => d.id as string);

      const { data: templates, error: templatesError } = await supabase
        .from('workout_program_day_templates')
        .select('workout_program_day_id, workout_template_id, order_index')
        .in('workout_program_day_id', dayIds)
        .order('order_index', { ascending: true });

      const templateByDayId: Record<string, string | null> = {};
      if (!templatesError && templates?.length) {
        for (const row of templates) {
          const dayId = row.workout_program_day_id as string;
          if (!templateByDayId[dayId]) {
            templateByDayId[dayId] = row.workout_template_id as string;
          }
        }
      }

      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('id, workout_program_day_id')
        .eq('user_id', user.id)
        .eq('workout_program_id', program.id);

      const completedSet = new Set<string>();
      if (!sessionsError && sessions?.length) {
        for (const s of sessions) {
          const dayId = s.workout_program_day_id as string | null;
          if (dayId) completedSet.add(dayId);
        }
      }

      const startSource = (program.started_at as string | null) || (program.created_at as string);
      const programStart = getMondayStart(new Date(startSource));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let todayWeekNumber: number | null = null;
      let todayWeekday: number | null = null;
      const diffMs = today.getTime() - programStart.getTime();
      if (diffMs >= 0) {
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const computedWeek = Math.floor(diffDays / 7) + 1;
        todayWeekNumber = (program.current_week as number | null) ?? computedWeek;
        todayWeekday = getTodayWeekdayIndex();
      }

      const scheduleByWeek: Record<number, ProgramDaySchedule[]> = {};
      const weeksSet = new Set<number>();

      for (const d of days as any[]) {
        const week = d.week_number as number;
        const dayNum = d.day_number as number;
        const id = d.id as string;
        weeksSet.add(week);
        if (!scheduleByWeek[week]) scheduleByWeek[week] = [];
        scheduleByWeek[week].push({
          id,
          week_number: week,
          day_number: dayNum,
          title: d.title ?? null,
          is_rest_day: d.is_rest_day ?? false,
          templateId: templateByDayId[id] ?? null,
        });
      }

      const weeks = Array.from(weeksSet).sort((a, b) => a - b);

      return {
        program: {
          id: program.id,
          title: program.title,
          duration_weeks: program.duration_weeks ?? null,
        },
        weeks,
        scheduleByWeek,
        completedDayIds: Array.from(completedSet),
        todayWeekNumber,
        todayWeekday,
      };
    },
  });
}

export type CreateProgramInput = {
  title: string;
  description?: string | null;
  duration_weeks: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
  intention?: 'feel_stronger' | 'build_energy' | 'consistency' | 'stress_reduction' | 'recovery' | null;
  fitness_level?: 'beginner' | 'intermediate' | 'advanced' | null;
  restOnSunday?: boolean;
};

export function useCreateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProgramInput): Promise<{ programId: string }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user authenticated');

      const now = new Date().toISOString();
      const durationWeeks = Math.max(1, Math.min(12, input.duration_weeks || 4));

      const { data: program, error: programError } = await supabase
        .from('workout_programs')
        .insert({
          user_id: user.id,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          duration_weeks: durationWeeks,
          difficulty: input.difficulty ?? null,
          intention: input.intention ?? null,
          fitness_level: input.fitness_level ?? null,
          is_active: true,
          started_at: now,
          current_week: 1,
          updated_at: now,
        })
        .select('id')
        .single();

      if (programError || !program?.id) {
        console.error('Create program error:', programError);
        throw new Error(programError?.message ?? 'Failed to create program');
      }

      const programId = program.id as string;
      const restOnSunday = input.restOnSunday ?? true;

      const dayRows: Array<{
        workout_program_id: string;
        week_number: number;
        day_number: number;
        title: string;
        is_rest_day: boolean;
      }> = [];

      for (let week = 1; week <= durationWeeks; week++) {
        for (let day = 1; day <= 7; day++) {
          const isRest = restOnSunday && day === 7;
          dayRows.push({
            workout_program_id: programId,
            week_number: week,
            day_number: day,
            title: isRest ? 'Rest' : 'Workout',
            is_rest_day: isRest,
          });
        }
      }

      const { error: daysError } = await supabase
        .from('workout_program_days')
        .insert(dayRows);

      if (daysError) {
        console.error('Create program days error:', daysError);
        throw new Error(daysError.message ?? 'Failed to create program days');
      }

      return { programId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRAM_SCHEDULE_KEY });
    },
  });
}

export function useAssignTemplateToProgramDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      programDayId,
      templateId,
    }: {
      programDayId: string;
      templateId: string;
    }): Promise<void> => {
      const { error: deleteError } = await supabase
        .from('workout_program_day_templates')
        .delete()
        .eq('workout_program_day_id', programDayId);

      if (deleteError) throw new Error(deleteError.message ?? 'Failed to clear existing template');

      const { error: insertError } = await supabase
        .from('workout_program_day_templates')
        .insert({
          workout_program_day_id: programDayId,
          workout_template_id: templateId,
          order_index: 0,
        });

      if (insertError) throw new Error(insertError.message ?? 'Failed to assign template');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRAM_SCHEDULE_KEY });
    },
  });
}