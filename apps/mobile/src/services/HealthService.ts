/**
 * Bridge to native HealthModule. Exposes getTodayHealthData() with normalized output.
 * Handles missing module, permission denied, and platform differences.
 */

import { NativeModules, Platform } from 'react-native';
import { normalizeHealthData, type NormalizedHealthData, type HealthPlatform } from './HealthNormalizer';

type HealthModuleShape = { getTodayHealthData: (callback: (json: string) => void) => void } | undefined;

export interface GetTodayHealthDataResult {
  date: string;
  steps: number | null;
  sleepMinutes: number | null;
  distanceMeters: number | null;
  paceMinPerKm: number | null;
  source: HealthPlatform | null;
  error: string | null;
  syncedAt: string;
  normalized?: NormalizedHealthData;
}

function promisifyGetTodayHealthData(): Promise<string> {
  return new Promise((resolve, reject) => {
    const HealthModule = NativeModules.HealthModule as HealthModuleShape;
    if (!HealthModule || typeof HealthModule.getTodayHealthData !== 'function') {
      reject(new Error('HealthModule not available'));
      return;
    }
    try {
      HealthModule.getTodayHealthData((json: string) => {
        if (typeof json === 'string') {
          resolve(json);
        } else {
          reject(new Error('Invalid native response'));
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

function parseNativeResponse(json: string): {
  steps: number | null;
  sleepMinutes: number | null;
  distanceMeters: number | null;
  error: string | null;
} {
  try {
    const raw = JSON.parse(json);
    return {
      steps: raw.steps != null ? Number(raw.steps) : null,
      sleepMinutes: raw.sleepMinutes != null ? Number(raw.sleepMinutes) : null,
      distanceMeters: raw.distanceMeters != null ? Number(raw.distanceMeters) : null,
      error: raw.error != null ? String(raw.error) : null,
    };
  } catch {
    return {
      steps: null,
      sleepMinutes: null,
      distanceMeters: null,
      error: 'invalid_data',
    };
  }
}

/**
 * Opens Health Connect (Android) so the user can grant permissions to this app.
 * Resolves with null on success, or an error string. No-op on iOS.
 */
export async function openHealthConnectSettings(): Promise<string | null> {
  if (Platform.OS !== 'android') return null;
  const HealthModule = NativeModules.HealthModule as HealthModuleShape & { openHealthConnectSettings?: (callback: (err: string | null) => void) => void };
  const openSettings = HealthModule?.openHealthConnectSettings;
  if (!openSettings) return 'native_module_unavailable';
  return new Promise((resolve) => {
    try {
      openSettings((err: string | null) => resolve(err ?? null));
    } catch {
      resolve('unknown_error');
    }
  });
}

/**
 * Fetches today's health data from the native module and returns a normalized result.
 * Does not throw; returns an result object with error set on failure.
 */
export async function getTodayHealthData(): Promise<GetTodayHealthDataResult> {
  const now = new Date();
  const syncedAt = now.toISOString();
  const dateOnly = now.toISOString().slice(0, 10);

  const fallback = (
    error: string,
    source: HealthPlatform | null = null
  ): GetTodayHealthDataResult => ({
    date: dateOnly,
    steps: null,
    sleepMinutes: null,
    distanceMeters: null,
    paceMinPerKm: null,
    source: Platform.OS === 'ios' ? 'healthkit' : Platform.OS === 'android' ? 'healthconnect' : null,
    error,
    syncedAt,
  });

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return fallback('platform_not_supported');
  }

  const HealthModule = NativeModules.HealthModule as HealthModuleShape;
  if (!HealthModule || typeof HealthModule.getTodayHealthData !== 'function') {
    return fallback('native_module_unavailable');
  }

  try {
    const json = await promisifyGetTodayHealthData();
    const raw = parseNativeResponse(json);
    const platform: HealthPlatform = Platform.OS === 'ios' ? 'healthkit' : 'healthconnect';
    const normalized = normalizeHealthData(
      {
        steps: raw.steps,
        sleepMinutes: raw.sleepMinutes,
        distanceMeters: raw.distanceMeters,
        error: raw.error,
      },
      platform
    );

    return {
      date: normalized.date,
      steps: 'value' in normalized.steps ? normalized.steps.value : null,
      sleepMinutes: 'value' in normalized.sleepMinutes ? normalized.sleepMinutes.value : null,
      distanceMeters: 'value' in normalized.distanceMeters ? normalized.distanceMeters.value : null,
      paceMinPerKm: normalized.paceMinPerKm ?? null,
      source: platform,
      error: raw.error ?? null,
      syncedAt: normalized.metadata.syncedAt,
      normalized,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown_error';
    return fallback(message);
  }
}
