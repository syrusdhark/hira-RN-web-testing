/**
 * Workout feature: screens and hooks for programs, templates, sessions, exercises.
 */

export { WorkoutTrackerScreen } from '../../screens/WorkoutTrackerScreen';
export { ProgramScreen } from '../../screens/ProgramScreen';
export { CreateProgramScreen } from '../../screens/CreateProgramScreen';
export { TemplateCreateScreen } from '../../screens/TemplateCreateScreen';
export { TemplateSessionScreen, type TemplateSessionScreenProps } from '../../screens/TemplateSessionScreen';
export { MyWorkoutsScreen } from '../../screens/MyWorkoutsScreen';
export { WorkoutHistoryScreen } from '../../screens/WorkoutHistoryScreen';
export { WorkoutInsightsScreen } from '../../screens/WorkoutInsightsScreen';
export { ActivityTypeWorkoutsScreen } from '../../screens/ActivityTypeWorkoutsScreen';
export { AddExercisesForSessionScreen } from '../../screens/AddExercisesForSessionScreen';
export { ExerciseSearchScreen } from '../../screens/ExerciseSearchScreen';
export { ExercisesScreen } from '../../screens/ExercisesScreen';
export { ExerciseDetailScreen } from '../../screens/ExerciseDetailScreen';
export { WorkoutSessionDetailScreen } from '../../screens/WorkoutSessionDetailScreen';
export { ActivityAnalyticsScreen } from '../../screens/ActivityAnalyticsScreen';

export { useWorkoutTemplates } from '../../hooks/useWorkoutTemplates';
export { useProgramSchedule } from '../../hooks/useProgramSchedule';
export { useWorkoutSessions } from '../../hooks/useWorkoutSessions';
export { useWorkoutSessionDetail } from '../../hooks/useWorkoutSessionDetail';
export { useExerciseSearch } from '../../hooks/useExerciseSearch';
export { useExerciseDetail } from '../../hooks/useExerciseDetail';
export { useTodayWorkoutForIntensity } from '../../hooks/useTodayWorkoutForIntensity';
export { useExerciseMuscleMappings } from '../../hooks/useExerciseMuscleMappings';
export { useTodayProgramRestDay } from '../../hooks/useTodayProgramRestDay';
export { useTodayWorkoutStats } from '../../hooks/useTodayWorkoutStats';
