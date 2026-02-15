import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Habit, HabitCompletion } from '../types/habits';
import { USER_XP_KEY } from './useUserXp';
import { USER_STREAKS_KEY } from './useUserStreaks';
import { USER_ACHIEVEMENTS_KEY } from './useUserAchievements';

export const HABITS_KEY = ['habits'];
export const HABIT_COMPLETIONS_KEY = ['habitCompletions'];

function toHabit(row: Record<string, unknown>): Habit {
  const schedule = row.schedule_days;
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    name: row.name as string,
    category: (row.category as Habit['category']) ?? null,
    frequency: (row.frequency as Habit['frequency']) ?? 'daily',
    schedule_days: Array.isArray(schedule) ? (schedule as number[]) : null,
    color_hex: (row.color_hex as string) ?? null,
    icon: (row.icon as string) ?? null,
    daily_goal_minutes: row.daily_goal_minutes != null ? Number(row.daily_goal_minutes) : null,
    reminder_time: (row.reminder_time as string) ?? null,
    why_text: (row.why_text as string) ?? null,
    order_index: Number(row.order_index) ?? 0,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function toCompletion(row: Record<string, unknown>): HabitCompletion {
  return {
    id: row.id as string,
    habit_id: row.habit_id as string,
    user_id: row.user_id as string,
    completion_date: row.completion_date as string,
    completed: Boolean(row.completed),
    progress_pct: row.progress_pct != null ? Number(row.progress_pct) : null,
    logged_at: row.logged_at as string,
    created_at: row.created_at as string,
  };
}

export function useHabits() {
  return useQuery({
    queryKey: HABITS_KEY,
    queryFn: async (): Promise<Habit[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_habits')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => toHabit(r as Record<string, unknown>));
    },
  });
}

export function useHabit(habitId: string | null) {
  return useQuery({
    queryKey: [...HABITS_KEY, habitId],
    queryFn: async (): Promise<Habit | null> => {
      if (!habitId) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_habits')
        .select('*')
        .eq('id', habitId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data ? toHabit(data as Record<string, unknown>) : null;
    },
    enabled: Boolean(habitId),
  });
}

export function useHabitCompletions(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...HABIT_COMPLETIONS_KEY, startDate, endDate],
    queryFn: async (): Promise<HabitCompletion[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completion_date', startDate)
        .lte('completion_date', endDate);
      if (error) throw error;
      return (data ?? []).map((r) => toCompletion(r as Record<string, unknown>));
    },
    enabled: Boolean(startDate && endDate),
  });
}

export function useUpsertHabitCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      habitId,
      completionDate,
      completed,
      progressPct,
    }: {
      habitId: string;
      completionDate: string;
      completed: boolean;
      progressPct?: number | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('habit_completions').upsert(
        {
          habit_id: habitId,
          user_id: user.id,
          completion_date: completionDate,
          completed,
          progress_pct: progressPct ?? null,
          logged_at: new Date().toISOString(),
        },
        { onConflict: 'habit_id,user_id,completion_date' }
      );
      if (error) throw error;
      return { habitId, completionDate };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: HABIT_COMPLETIONS_KEY });
      queryClient.invalidateQueries({ queryKey: HABITS_KEY });
      queryClient.invalidateQueries({ queryKey: USER_XP_KEY });
      queryClient.invalidateQueries({ queryKey: USER_ACHIEVEMENTS_KEY });
      queryClient.invalidateQueries({ queryKey: USER_STREAKS_KEY });
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('user_habits')
        .insert({
          user_id: user.id,
          name: payload.name,
          category: payload.category,
          frequency: payload.frequency,
          schedule_days: payload.schedule_days,
          color_hex: payload.color_hex,
          icon: payload.icon,
          daily_goal_minutes: payload.daily_goal_minutes,
          reminder_time: payload.reminder_time,
          why_text: payload.why_text,
          order_index: payload.order_index ?? 0,
        })
        .select('id')
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: HABITS_KEY });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<Habit> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_habits')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (habitId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', user.id);
      if (error) throw error;
      return { habitId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY });
      queryClient.invalidateQueries({ queryKey: HABIT_COMPLETIONS_KEY });
    },
  });
}
