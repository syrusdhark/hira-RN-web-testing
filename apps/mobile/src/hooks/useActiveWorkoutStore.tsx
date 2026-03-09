import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ActiveWorkoutState = {
  /** True when there is an in-progress workout on this device. */
  active: boolean;
  /** Supabase workout_sessions.id once the session has been persisted; null before insert. */
  sessionId: string | null;
  /** Local-only id used before persistence so we can track a single logical session. */
  localSessionId: string | null;
  /** Optional links back to template / program context. */
  templateId: string | null;
  workoutProgramId: string | null;
  workoutProgramDayId: string | null;
  /** Human-readable title for the overlay (e.g. template title). */
  title: string | null;
  /** ISO timestamp when the workout started on this device. */
  startedAt: string | null;
  /**
   * Extra elapsed seconds to add on top of (now - startedAt).
   * This allows future pause/resume without losing total duration.
   */
  elapsedOffsetSeconds: number;
};

type ActiveWorkoutContextValue = {
  state: ActiveWorkoutState;
  /**
   * Start or resume a local workout session.
   * If a session is already active, this will overwrite it.
   */
  startSession: (payload: {
    templateId?: string | null;
    workoutProgramId?: string | null;
    workoutProgramDayId?: string | null;
    title?: string | null;
    startedAt?: string | null;
  }) => void;
  /** Attach the persisted Supabase workout_sessions.id to the current active session. */
  markPersistedSessionId: (sessionId: string) => void;
  /** Update the offset used when deriving elapsed time (for future pause/resume). */
  updateElapsedOffset: (elapsedOffsetSeconds: number) => void;
  /** Clear any active workout session (used on end / discard). */
  clearSession: () => void;
};

const initialState: ActiveWorkoutState = {
  active: false,
  sessionId: null,
  localSessionId: null,
  templateId: null,
  workoutProgramId: null,
  workoutProgramDayId: null,
  title: null,
  startedAt: null,
  elapsedOffsetSeconds: 0,
};

const ActiveWorkoutContext = createContext<ActiveWorkoutContextValue | undefined>(undefined);

const STORAGE_KEY = '@hira_activeWorkout_v1';

export function ActiveWorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ActiveWorkoutState>(initialState);

  const startSession: ActiveWorkoutContextValue['startSession'] = useCallback((payload) => {
    const nowIso = new Date().toISOString();

    setState({
      active: true,
      sessionId: null,
      localSessionId: Math.random().toString(36).slice(2),
      templateId: payload.templateId ?? null,
      workoutProgramId: payload.workoutProgramId ?? null,
      workoutProgramDayId: payload.workoutProgramDayId ?? null,
      title: (payload.title ?? null) || null,
      startedAt: payload.startedAt ?? nowIso,
      elapsedOffsetSeconds: 0,
    });
  }, []);

  const markPersistedSessionId: ActiveWorkoutContextValue['markPersistedSessionId'] = useCallback((sessionId) => {
    if (!sessionId) return;
    setState((prev) => ({
      ...prev,
      sessionId,
    }));
  }, []);

  const updateElapsedOffset: ActiveWorkoutContextValue['updateElapsedOffset'] = useCallback((elapsedOffsetSeconds) => {
    setState((prev) => ({
      ...prev,
      elapsedOffsetSeconds: Number.isFinite(elapsedOffsetSeconds) && elapsedOffsetSeconds >= 0
        ? Math.floor(elapsedOffsetSeconds)
        : 0,
    }));
  }, []);

  const clearSession: ActiveWorkoutContextValue['clearSession'] = useCallback(() => {
    setState(initialState);
  }, []);

  // Hydrate from AsyncStorage once on mount.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<ActiveWorkoutState> | null;
        if (!parsed || typeof parsed !== 'object') return;
        if (cancelled) return;

        const startedAt = parsed.startedAt as string | undefined;
        const startedMs = startedAt ? Date.parse(startedAt) : NaN;
        const now = Date.now();
        const sixHoursMs = 6 * 60 * 60 * 1000;
        const isValidStart = !Number.isNaN(startedMs);
        const isStale = !isValidStart || now - startedMs > sixHoursMs;

        if (isStale) {
          // Drop very old or invalid sessions on hydration.
          setState(initialState);
          await AsyncStorage.removeItem(STORAGE_KEY);
          return;
        }

        setState((prev) => ({
          ...prev,
          ...parsed,
          active: !!parsed.active && isValidStart,
        }));
      } catch {
        // Ignore hydration errors; fall back to initial state.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist whenever the active workout state changes.
  useEffect(() => {
    (async () => {
      try {
        if (!state.active || !state.startedAt) {
          await AsyncStorage.removeItem(STORAGE_KEY);
          return;
        }
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Ignore persistence errors; they should not break the app flow.
      }
    })();
  }, [state]);

  const value = useMemo<ActiveWorkoutContextValue>(() => ({
    state,
    startSession,
    markPersistedSessionId,
    updateElapsedOffset,
    clearSession,
  }), [state, startSession, markPersistedSessionId, updateElapsedOffset, clearSession]);

  return (
    <ActiveWorkoutContext.Provider value={value}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

export function useActiveWorkout(): ActiveWorkoutContextValue {
  const ctx = useContext(ActiveWorkoutContext);
  if (!ctx) {
    throw new Error('useActiveWorkout must be used within an ActiveWorkoutProvider');
  }
  return ctx;
}

