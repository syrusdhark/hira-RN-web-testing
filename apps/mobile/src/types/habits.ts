export type HabitCategory = 'Health' | 'Productivity' | 'Mindfulness' | 'Social' | 'Custom';
export type HabitFrequency = 'daily' | 'custom';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category: HabitCategory | null;
  frequency: HabitFrequency;
  schedule_days: number[] | null;
  color_hex: string | null;
  icon: string | null;
  daily_goal_minutes: number | null;
  reminder_time: string | null;
  why_text: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completion_date: string;
  completed: boolean;
  progress_pct: number | null;
  logged_at: string;
  created_at: string;
}

export interface HabitWithCompletion extends Habit {
  completion?: HabitCompletion | null;
}
