import { normalizeHealthData, type RawHealthData, type HealthPlatform } from '../HealthNormalizer';

describe('HealthNormalizer', () => {
  const platform: HealthPlatform = 'healthconnect';

  it('returns no_data for missing values', () => {
    const out = normalizeHealthData({}, platform);
    expect(out.steps).toEqual({ error: 'no_data' });
    expect(out.sleepMinutes).toEqual({ error: 'no_data' });
    expect(out.distanceMeters).toEqual({ error: 'no_data' });
    expect(out.paceMinPerKm).toBeNull();
    expect(out.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(out.metadata.platform).toBe(platform);
  });

  it('returns permission_denied when error is permission_denied', () => {
    const out = normalizeHealthData({ error: 'permission_denied' }, platform);
    expect(out.steps).toEqual({ error: 'permission_denied' });
    expect(out.sleepMinutes).toEqual({ error: 'permission_denied' });
  });

  it('returns permission_denied for health_connect_not_available', () => {
    const out = normalizeHealthData({ error: 'health_connect_not_available' }, platform);
    expect(out.steps).toEqual({ error: 'permission_denied' });
  });

  it('never uses 0 for missing data', () => {
    const out = normalizeHealthData({ steps: null, sleepMinutes: null, distanceMeters: null }, platform);
    expect(out.steps).toEqual({ error: 'no_data' });
    expect(out.sleepMinutes).toEqual({ error: 'no_data' });
    expect(out.distanceMeters).toEqual({ error: 'no_data' });
  });

  it('preserves valid numeric values', () => {
    const out = normalizeHealthData(
      { steps: 5000, sleepMinutes: 420, distanceMeters: 3200 },
      'healthkit'
    );
    expect(out.steps).toEqual({ value: 5000 });
    expect(out.sleepMinutes).toEqual({ value: 420, source: 'platform' });
    expect(out.distanceMeters).toEqual({ value: 3200 });
    expect(out.metadata.platform).toBe('healthkit');
  });

  it('returns invalid_data for invalid value types', () => {
    const out = normalizeHealthData({ steps: 'not a number' as unknown as number }, platform);
    expect(out.steps).toEqual({ error: 'invalid_data' });
  });

  it('includes syncedAt and timezone in metadata', () => {
    const out = normalizeHealthData({}, platform);
    expect(out.metadata.syncedAt).toBeDefined();
    expect(new Date(out.metadata.syncedAt).toISOString()).toBe(out.metadata.syncedAt);
    expect(out.metadata.timezone).toBeDefined();
  });
});
