/**
 * Normalizes raw health data from HealthKit (iOS) or Health Connect (Android)
 * into a single format. Per data contract: no formatting of values; missing → error object.
 */

export type HealthPlatform = 'healthkit' | 'healthconnect';

export type DataOrError<T> =
  | { value: T; confidence?: 'high' | 'medium' | 'low'; source?: string }
  | { error: string };

export interface NormalizedHealthData {
  date: string;
  steps: DataOrError<number>;
  sleepMinutes: DataOrError<number>;
  distanceMeters: DataOrError<number>;
  paceMinPerKm: number | null;
  metadata: {
    platform: HealthPlatform;
    syncedAt: string;
    timezone: string;
  };
}

export interface RawHealthData {
  steps?: number | null;
  sleepMinutes?: number | null;
  distanceMeters?: number | null;
  error?: string | null;
}

const ERROR_NO_DATA = 'no_data';
const ERROR_PERMISSION_DENIED = 'permission_denied';
const ERROR_INVALID_DATA = 'invalid_data';

function toDataOrError(
  value: number | null | undefined,
  errorHint: string | null | undefined
): DataOrError<number> {
  if (errorHint === 'permission_denied' || errorHint === 'health_connect_not_available' || errorHint === 'health_connect_update_required') {
    return { error: ERROR_PERMISSION_DENIED };
  }
  if (value === null || value === undefined || (typeof value === 'number' && (Number.isNaN(value) || value < 0))) {
    return { error: ERROR_NO_DATA };
  }
  if (typeof value !== 'number') {
    return { error: ERROR_INVALID_DATA };
  }
  return { value };
}

function toSleepDataOrError(
  value: number | null | undefined,
  errorHint: string | null | undefined
): DataOrError<number> {
  if (errorHint === 'permission_denied' || errorHint === 'health_connect_not_available' || errorHint === 'health_connect_update_required') {
    return { error: ERROR_PERMISSION_DENIED };
  }
  if (value === null || value === undefined || (typeof value === 'number' && (Number.isNaN(value) || value < 0))) {
    return { error: ERROR_NO_DATA };
  }
  if (typeof value !== 'number') {
    return { error: ERROR_INVALID_DATA };
  }
  return { value, source: 'platform' };
}

/**
 * Normalizes raw native health data into a standard shape.
 * Missing data → { error: 'no_data' }. Never use 0 for missing.
 */
export function normalizeHealthData(
  rawData: RawHealthData,
  platform: HealthPlatform
): NormalizedHealthData {
  const error = rawData.error ?? null;
  const now = new Date();
  const dateOnly = now.toISOString().slice(0, 10);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';

  const steps = toDataOrError(rawData.steps, error);
  const sleepMinutes = toSleepDataOrError(rawData.sleepMinutes, error);
  const distanceMeters = toDataOrError(rawData.distanceMeters, error);

  return {
    date: dateOnly,
    steps,
    sleepMinutes,
    distanceMeters,
    paceMinPerKm: null,
    metadata: {
      platform,
      syncedAt: now.toISOString(),
      timezone,
    },
  };
}
