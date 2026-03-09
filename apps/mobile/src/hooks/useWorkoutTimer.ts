import { useEffect, useState } from 'react';

type UseWorkoutTimerOptions = {
  startedAt: string | null;
  elapsedOffsetSeconds?: number;
  isRunning?: boolean;
};

export function useWorkoutTimer({
  startedAt,
  elapsedOffsetSeconds = 0,
  isRunning = true,
}: UseWorkoutTimerOptions): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!startedAt || !isRunning) return;

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [startedAt, isRunning]);

  if (!startedAt) return 0;

  const startMs = new Date(startedAt).getTime();
  if (Number.isNaN(startMs)) {
    return 0;
  }

  const elapsedMs = Math.max(0, now - startMs);
  const baseSeconds = Math.floor(elapsedMs / 1000);
  return baseSeconds + Math.floor(elapsedOffsetSeconds);
}

export function formatWorkoutTime(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const hh = hours < 10 ? `0${hours}` : String(hours);
  const mm = minutes < 10 ? `0${minutes}` : String(minutes);
  const ss = seconds < 10 ? `0${seconds}` : String(seconds);

  return `${hh}:${mm}:${ss}`;
}

