export type ExerciseType =
  | 'strength'
  | 'bodybuilding'
  | 'cardio'
  | 'mobility'
  | 'calisthenics';

export type TrackingSchema = {
  columns: string[];
  required: string[];
};

export const trackingSchemas: Record<ExerciseType, TrackingSchema> = {
  strength: {
    columns: ['load', 'reps', 'rpe'],
    required: ['load', 'reps'],
  },
  bodybuilding: {
    columns: ['load', 'reps', 'tempo', 'rpe'],
    required: ['load', 'reps'],
  },
  cardio: {
    columns: ['duration_seconds', 'distance_meters', 'rpe'],
    required: ['duration_seconds'],
  },
  mobility: {
    columns: ['hold_time_seconds', 'side', 'feeling_score'],
    required: ['hold_time_seconds'],
  },
  calisthenics: {
    columns: ['reps', 'duration_seconds', 'load', 'difficulty_level'],
    required: ['reps OR duration_seconds'],
  },
};

const DEFAULT_SCHEMA: ExerciseType = 'strength';

export function getTrackingSchema(exerciseType: ExerciseType | null): TrackingSchema {
  if (!exerciseType || !(exerciseType in trackingSchemas)) {
    return trackingSchemas[DEFAULT_SCHEMA];
  }
  return trackingSchemas[exerciseType as ExerciseType];
}

export function formatColumnLabel(column: string): string {
  switch (column) {
    case 'load':
      return 'KG';
    case 'reps':
      return 'REPS';
    case 'rpe':
      return 'RPE';
    case 'tempo':
      return 'TEMPO';
    case 'duration_seconds':
      return 'TIME';
    case 'distance_meters':
      return 'DIST';
    case 'hold_time_seconds':
      return 'HOLD';
    case 'side':
      return 'SIDE';
    case 'difficulty_level':
      return 'LEVEL';
    case 'feeling_score':
      return 'FEEL';
    default:
      return column.toUpperCase();
  }
}
