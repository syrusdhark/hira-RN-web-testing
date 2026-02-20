/**
 * Structured context for wellness/AI chat.
 * Used by ContextBuilder and ContextFormatter; can coexist with UserContext in ai-context.service.
 */

export interface WorkoutSummary {
  date: string;
  template_name?: string;
  duration_minutes?: number;
  feeling_score?: number;
  rpe_actual?: number;
  exercises?: string[];
}

export interface WellnessContext {
  /** Tier 1: Always include (core identity) */
  core: {
    user_name: string;
    current_date: string;
    user_timezone: string;
  };

  /** Tier 2: Current state (always fresh when available) */
  current_state?: {
    today_feeling?: number;
    today_energy?: number;
    last_meal_feeling?: number;
    sleep_quality?: number;
    current_mood?: string;
  };

  /** Tier 3: Recent activity (past 7 days or configurable) */
  recent_activity?: {
    workouts_this_week?: number;
    last_workout?: {
      date: string;
      exercises: string[];
      duration_minutes: number;
      feeling_score?: number;
      rpe?: number;
    };
    meals_logged?: number;
    avg_feeling_this_week?: number;
  };

  /** Tier 4: Patterns (learned over time) */
  patterns?: {
    favorite_exercises?: string[];
    best_workout_time?: 'morning' | 'afternoon' | 'evening';
    optimal_workout_frequency?: number;
    avg_recovery_time?: Record<string, number>;
  };

  /** Tier 5: Recovery status (real-time calculation or stub) */
  recovery?: {
    muscles_ready?: string[];
    muscles_recovering?: string[];
    muscles_need_rest?: string[];
    overall_recovery_score?: number;
  };

  /** Tier 6: Goals and preferences */
  goals?: {
    primary_intention?: 'feel_stronger' | 'build_energy' | 'consistency' | 'stress_reduction' | 'recovery';
    fitness_level?: 'beginner' | 'intermediate' | 'advanced';
    specific_goals?: string[];
  };
}

export interface ContextBuildOptions {
  include_workouts?: boolean;
  include_nutrition?: boolean;
  include_sleep?: boolean;
  include_patterns?: boolean;
  include_recovery?: boolean;
  max_history_days?: number;
}
