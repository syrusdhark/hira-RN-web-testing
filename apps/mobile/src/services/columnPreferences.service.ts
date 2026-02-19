import { supabase } from '../lib/supabase';

const TABLE = 'user_exercise_column_preferences';

/**
 * Fetch column preferences for the current user for the given exercise IDs.
 * Returns a map of exercise_id -> visible_columns (array of column keys).
 */
export async function fetchColumnPreferences(
  exerciseIds: string[]
): Promise<Record<string, string[]>> {
  if (exerciseIds.length === 0) return {};
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.data?.session?.user?.id;
  if (!userId) return {};

  const { data, error } = await supabase
    .from(TABLE)
    .select('exercise_id, visible_columns')
    .eq('user_id', userId)
    .in('exercise_id', exerciseIds);

  if (error) {
    console.warn('columnPreferences.fetchColumnPreferences:', error);
    return {};
  }

  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    const cols = row.visible_columns;
    if (Array.isArray(cols) && cols.length > 0) {
      map[row.exercise_id] = cols.filter((c): c is string => typeof c === 'string');
    }
  }
  return map;
}

/**
 * Upsert column preference for the current user and exercise.
 * visibleColumns must be 1–4 column keys. No-op if not logged in.
 */
export async function upsertColumnPreference(
  exerciseId: string,
  visibleColumns: string[]
): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.data?.session?.user?.id;
  if (!userId) return;

  const limited = visibleColumns.slice(0, 4);
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      {
        user_id: userId,
        exercise_id: exerciseId,
        visible_columns: limited,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,exercise_id' }
    );

  if (error) {
    console.warn('columnPreferences.upsertColumnPreference:', error);
  }
}
