import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// #region agent log
const _profileLog = (msg: string, data: Record<string, unknown>) => { const p = { location: 'ProfileContext.tsx', message: msg, data, timestamp: Date.now(), hypothesisId: 'H5' }; console.log('[DEBUG]', p); };
// #endregion

/** Merged profile + health for cache. Single source of truth for profile-related screens. */
export interface CachedProfile {
  // From profiles
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  // From user_health_profile
  height_cm: number | null;
  activity_level: string | null;
  goals: string[] | null;
  // From body_weight_logs (latest)
  latest_weight_kg: number | null;
}

export type CachedProfileUpdate = Partial<Pick<
  CachedProfile,
  'full_name' | 'email' | 'avatar_url' | 'date_of_birth' | 'gender' | 'height_cm' | 'activity_level' | 'goals' | 'latest_weight_kg'
>>;

interface ProfileContextType {
  profile: CachedProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfileCache: (partial: CachedProfileUpdate) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

function buildCachedProfile(
  profileRow: Record<string, unknown> | null,
  healthRow: Record<string, unknown> | null,
  latestWeight: number | null,
  userId: string,
  email: string | null
): CachedProfile {
  const goals = healthRow?.goals as string[] | undefined;
  return {
    id: userId,
    full_name: (profileRow?.full_name as string | null) ?? null,
    email: email ?? (profileRow?.email as string | null) ?? null,
    avatar_url: (profileRow?.avatar_url as string | null) ?? null,
    date_of_birth: (profileRow?.date_of_birth as string | null) ?? null,
    gender: (profileRow?.gender as string | null) ?? null,
    height_cm: healthRow?.height_cm != null ? Number(healthRow.height_cm) : null,
    activity_level: (healthRow?.activity_level as string | null) ?? null,
    goals: Array.isArray(goals) ? goals : null,
    latest_weight_kg: latestWeight,
  };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  // #region agent log
  _profileLog('ProfileProvider mounted', {});
  // #endregion
  const [profile, setProfile] = useState<CachedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const [profilesRes, healthRes, weightRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_health_profile').select('*').eq('user_id', user.id).single(),
        supabase
          .from('body_weight_logs')
          .select('weight_kg')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: false })
          .limit(1),
      ]);

      const profileRow = profilesRes.data as Record<string, unknown> | null;
      const healthRow = healthRes.data as Record<string, unknown> | null;
      const weightRows = weightRes.data as { weight_kg: number }[] | null;
      const latestWeight = weightRows?.[0]?.weight_kg ?? null;

      const merged = buildCachedProfile(
        profileRow,
        healthRow,
        latestWeight,
        user.id,
        user.email ?? null
      );
      setProfile(merged);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      // #region agent log
      _profileLog('ProfileProvider loading false', {});
      // #endregion
      setLoading(false);
    }
  }, []);

  const updateProfileCache = useCallback((partial: CachedProfileUpdate) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return { ...prev, ...partial };
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user || error) {
          setLoading(false);
          return;
        }
        await refreshProfile();
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        console.warn('Profile init network error:', msg);
        // Don't hang on loading if network is down
        if (!cancelled) {
          setError('Network error — please check your connection and try again.');
          setLoading(false);
        }
      }
    }
    init();
    return () => { cancelled = true; };
  }, [refreshProfile]);

  const value: ProfileContextType = {
    profile,
    loading,
    error,
    refreshProfile,
    updateProfileCache,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextType {
  const ctx = useContext(ProfileContext);
  if (ctx === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return ctx;
}
