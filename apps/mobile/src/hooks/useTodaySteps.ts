import { useQuery } from '@tanstack/react-query';
import { getTodayHealthData } from '../services/HealthService';

export const TODAY_STEPS_KEY = ['todaySteps'];

const STALE_MS = 3 * 60 * 1000; // 3 minutes

export function useTodaySteps() {
  return useQuery({
    queryKey: TODAY_STEPS_KEY,
    queryFn: async (): Promise<number | null> => {
      const result = await getTodayHealthData();
      return result.steps ?? null;
    },
    staleTime: STALE_MS,
  });
}
