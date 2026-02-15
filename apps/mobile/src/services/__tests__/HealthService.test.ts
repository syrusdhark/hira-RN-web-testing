import { NativeModules, Platform } from 'react-native';
import { getTodayHealthData } from '../HealthService';

jest.mock('react-native', () => ({
  NativeModules: {},
  Platform: { OS: 'android' },
}));

describe('HealthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (NativeModules as { HealthModule?: { getTodayHealthData: (cb: (json: string) => void) => void } }).HealthModule = undefined;
    (Platform as { OS: string }).OS = 'android';
  });

  it('returns platform_not_supported when not ios or android', async () => {
    (Platform as { OS: string }).OS = 'web';
    const result = await getTodayHealthData();
    expect(result.error).toBe('platform_not_supported');
    expect(result.steps).toBeNull();
    expect(result.source).toBeNull();
  });

  it('returns native_module_unavailable when HealthModule is missing', async () => {
    const result = await getTodayHealthData();
    expect(result.error).toBe('native_module_unavailable');
    expect(result.steps).toBeNull();
  });

  it('returns permission_denied when native returns permission_denied', async () => {
    (NativeModules as { HealthModule: { getTodayHealthData: (cb: (json: string) => void) => void } }).HealthModule = {
      getTodayHealthData(cb: (json: string) => void) {
        cb(JSON.stringify({ steps: null, sleepMinutes: null, distanceMeters: null, error: 'permission_denied' }));
      },
    };
    const result = await getTodayHealthData();
    expect(result.error).toBe('permission_denied');
    expect(result.steps).toBeNull();
  });

  it('returns health_connect_not_available when native returns it', async () => {
    (NativeModules as { HealthModule: { getTodayHealthData: (cb: (json: string) => void) => void } }).HealthModule = {
      getTodayHealthData(cb: (json: string) => void) {
        cb(JSON.stringify({ steps: null, sleepMinutes: null, distanceMeters: null, error: 'health_connect_not_available' }));
      },
    };
    const result = await getTodayHealthData();
    expect(result.error).toBe('health_connect_not_available');
  });

  it('parses success response and returns normalized data', async () => {
    (NativeModules as { HealthModule: { getTodayHealthData: (cb: (json: string) => void) => void } }).HealthModule = {
      getTodayHealthData(cb: (json: string) => void) {
        cb(JSON.stringify({
          steps: 3000,
          sleepMinutes: 360,
          distanceMeters: 2100,
          error: null,
        }));
      },
    };
    const result = await getTodayHealthData();
    expect(result.error).toBeNull();
    expect(result.steps).toBe(3000);
    expect(result.sleepMinutes).toBe(360);
    expect(result.distanceMeters).toBe(2100);
    expect(result.source).toBe('healthconnect');
    expect(result.syncedAt).toBeDefined();
    expect(result.normalized).toBeDefined();
  });

  it('handles malformed JSON from native', async () => {
    (NativeModules as { HealthModule: { getTodayHealthData: (cb: (json: string) => void) => void } }).HealthModule = {
      getTodayHealthData(cb: (json: string) => void) {
        cb('not json');
      },
    };
    const result = await getTodayHealthData();
    expect(result.error).toBe('invalid_data');
    expect(result.steps).toBeNull();
  });

  it('sets source to healthkit on iOS', async () => {
    (Platform as { OS: string }).OS = 'ios';
    (NativeModules as { HealthModule: { getTodayHealthData: (cb: (json: string) => void) => void } }).HealthModule = {
      getTodayHealthData(cb: (json: string) => void) {
        cb(JSON.stringify({ steps: 100, sleepMinutes: null, distanceMeters: null, error: null }));
      },
    };
    const result = await getTodayHealthData();
    expect(result.source).toBe('healthkit');
  });

  it('does not throw on native errors', async () => {
    (NativeModules as { HealthModule: { getTodayHealthData: (_cb: (json: string) => void) => void } }).HealthModule = {
      getTodayHealthData(_cb: (json: string) => void) {
        throw new Error('native crash');
      },
    };
    await expect(getTodayHealthData()).resolves.toMatchObject({ error: 'native crash' });
  });
});
