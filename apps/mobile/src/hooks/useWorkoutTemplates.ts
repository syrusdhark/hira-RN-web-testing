import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const WORKOUT_TEMPLATES_KEY = ['workoutTemplates'];

const ACTIVITY_TYPE_VALUES = ['bodybuilding', 'strength', 'yoga', 'stretch', 'rest', 'calisthenics', 'hybrid', 'running'] as const;

/** Pick activity_type by most common exercise type; use hybrid only when there's a tie for max count. */
function pickActivityTypeFromCounts(counts: Record<string, number>): { activity_type: string | null; activity_type_tags: string[] | null } {
    const entries = Object.entries(counts);
    if (entries.length === 0) return { activity_type: null, activity_type_tags: null };
    const maxCount = Math.max(...entries.map(([, c]) => c));
    const topTypes = entries.filter(([, c]) => c === maxCount).map(([t]) => t);
    if (topTypes.length === 1) {
        return { activity_type: topTypes[0], activity_type_tags: null };
    }
    return { activity_type: 'hybrid', activity_type_tags: topTypes };
}

async function deriveActivityTypeAndTags(templateId: string): Promise<{ activity_type: string | null; activity_type_tags: string[] | null }> {
    const { data: rows, error } = await supabase
        .from('workout_template_exercises')
        .select('exercises(exercise_type)')
        .eq('workout_template_id', templateId);

    if (error || !rows?.length) {
        return { activity_type: null, activity_type_tags: null };
    }

    const types: string[] = [];
    for (const row of rows as any[]) {
        const t = row?.exercises?.exercise_type;
        if (t && typeof t === 'string' && ACTIVITY_TYPE_VALUES.includes(t as any)) {
            types.push(t);
        }
    }

    if (types.length === 0) return { activity_type: null, activity_type_tags: null };

    const counts: Record<string, number> = {};
    for (const t of types) {
        counts[t] = (counts[t] || 0) + 1;
    }
    return pickActivityTypeFromCounts(counts);
}

/** Compute activity_type from a template row that has workout_template_exercises with exercises(exercise_type). */
export function computeActivityTypeFromRow(t: {
    workout_template_exercises?: Array<{ exercises?: { exercise_type?: string | null } | null }>;
}): { activity_type: string | null; activity_type_tags: string[] | null } {
    const rows = t?.workout_template_exercises ?? [];
    const types: string[] = [];
    for (const row of rows) {
        const exType = row?.exercises?.exercise_type;
        if (exType && typeof exType === 'string' && ACTIVITY_TYPE_VALUES.includes(exType as any)) {
            types.push(exType);
        }
    }
    if (types.length === 0) return { activity_type: null, activity_type_tags: null };
    const counts: Record<string, number> = {};
    for (const type of types) {
        counts[type] = (counts[type] || 0) + 1;
    }
    return pickActivityTypeFromCounts(counts);
}

/** Format activity_type + activity_type_tags for display (e.g. "Strength" or "Hybrid (Strength, Yoga)"). */
export function formatActivityTypeLabel(item: {
    activity_type?: string | null;
    activity_type_tags?: string[] | null;
}): string {
    const type = item.activity_type;
    if (!type || !type.trim()) return '';
    const single = type.trim().toLowerCase();
    const display = single.charAt(0).toUpperCase() + single.slice(1);
    if (type === 'hybrid' && item.activity_type_tags?.length) {
        const tags = item.activity_type_tags
            .map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1))
            .join(', ');
        return `Hybrid (${tags})`;
    }
    return display;
}

export function useWorkoutTemplates() {
    return useQuery({
        queryKey: WORKOUT_TEMPLATES_KEY,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('workout_templates')
                .select('*, workout_template_exercises(exercises(exercise_type))')
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('Error fetching templates:', error);
                throw error;
            }

            return (data || []).map((t: any) => ({
                ...t,
                exercise_count: Array.isArray(t.workout_template_exercises)
                    ? t.workout_template_exercises.length
                    : (t.workout_template_exercises?.[0]?.count ?? 0),
            }));
        },
    });
}

export function useWorkoutTemplate(templateId: string | null) {
    return useQuery({
        queryKey: [...WORKOUT_TEMPLATES_KEY, templateId],
        refetchOnMount: 'always',
        queryFn: async () => {
            if (!templateId) return null;

            const { data, error } = await supabase
                .from('workout_templates')
                .select(`
                    *,
                    workout_template_exercises (
                        id,
                        exercise_id,
                        exercise_name,
                        order_index,
                        exercises(exercise_type),
                        workout_template_sets (
                            id,
                            set_number,
                            reps,
                            rest_seconds
                        )
                    )
                `)
                .eq('id', templateId)
                .maybeSingle();

            if (error) {
                console.error('Error fetching template:', error);
                throw error;
            }

            if (!data) {
                console.warn('Template not found for ID:', templateId);
                return null;
            }

            // Fallback: if join didn't return exercise_type (e.g. RLS), fetch by exercise_id
            const rows = (data as any).workout_template_exercises || [];
            const missingIds = rows
                .filter((r: any) => r.exercise_id && !r.exercises?.exercise_type)
                .map((r: any) => r.exercise_id);
            if (missingIds.length > 0) {
                const { data: exRows } = await supabase
                    .from('exercises')
                    .select('id, exercise_type')
                    .in('id', missingIds);
                const typeById = new Map((exRows || []).map((r: any) => [r.id, r.exercise_type]));
                for (const r of rows) {
                    if (r.exercise_id && !r.exercises?.exercise_type) {
                        const t = typeById.get(r.exercise_id);
                        if (t) r.exercises = { ...(r.exercises || {}), exercise_type: t };
                    }
                }
            }

            return data;
        },
        enabled: !!templateId,
    });
}

export function useInvalidateWorkoutTemplates() {
    const queryClient = useQueryClient();

    return () => {
        return queryClient.invalidateQueries({ queryKey: WORKOUT_TEMPLATES_KEY });
    };
}

export function useCreateWorkoutTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ title, description, exercises }: { title: string; description: string; exercises: any[] }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user authenticated');

            // Transform exercises to match RPC expected format
            const exercisesPayload = exercises.map((ex, index) => {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ex.originalId);

                return {
                    exercise_id: isUuid ? ex.originalId : '',
                    exercise_name: ex.name,
                    order_index: index,
                    sets: (ex.sets || []).map((set: any, setIndex: number) => ({
                        set_number: setIndex + 1,
                        reps: parseInt(set.reps) || 0,
                        rest_seconds: 60
                    }))
                };
            });

            // Call atomic RPC function
            const { data: templateId, error } = await supabase.rpc('create_workout_template_atomic', {
                p_user_id: user.id,
                p_title: title,
                p_description: description || '',
                p_exercises: exercisesPayload
            });

            if (error) {
                console.error('RPC Error:', error);
                if (error.message?.includes('function') && error.message?.includes('does not exist')) {
                    throw new Error('Database migration missing. Please run the SQL files in Supabase!');
                }
                throw new Error(`Template creation failed: ${error.message}`);
            }

            const id = templateId as string;
            const { activity_type, activity_type_tags } = await deriveActivityTypeAndTags(id);
            await supabase
                .from('workout_templates')
                .update({ activity_type, activity_type_tags })
                .eq('id', id);

            return { id, title, description, exercises, user_id: user.id };
        },

        // OPTIMISTIC UPDATE - runs before mutation
        onMutate: async (variables) => {
            const { title, description, exercises } = variables;

            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: WORKOUT_TEMPLATES_KEY });

            // Snapshot previous values for rollback
            const previousTemplates = queryClient.getQueryData(WORKOUT_TEMPLATES_KEY);

            // Generate temporary ID for optimistic template
            const tempId = `temp-${Date.now()}`;

            // Optimistically add to list view
            queryClient.setQueryData(WORKOUT_TEMPLATES_KEY, (old: any) => {
                const newTemplate = {
                    id: tempId,
                    title,
                    description,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    workout_template_exercises: [{ count: exercises.length }]
                };
                return old ? [newTemplate, ...old] : [newTemplate];
            });

            return { previousTemplates, tempId };
        },

        // On error, rollback to previous state
        onError: (err, variables, context) => {
            console.error('Create failed, rolling back:', err);

            if (context?.previousTemplates) {
                queryClient.setQueryData(WORKOUT_TEMPLATES_KEY, context.previousTemplates);
            }
        },

        // On success, replace temp ID with real ID and refetch
        onSuccess: (data, variables, context) => {
            // Replace the temporary template with the real one
            queryClient.setQueryData(WORKOUT_TEMPLATES_KEY, (old: any) => {
                if (!old) return old;
                return old.map((t: any) =>
                    t.id === context?.tempId
                        ? { ...t, id: data.id }
                        : t
                );
            });

            // Invalidate to refetch fresh data from server
            queryClient.invalidateQueries({ queryKey: WORKOUT_TEMPLATES_KEY });
        },
    });
}

export function useUpdateWorkoutTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            templateId,
            title,
            description,
            exercises
        }: {
            templateId: string;
            title: string;
            description: string;
            exercises: any[]
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user authenticated');

            // Transform exercises to match RPC expected format
            const exercisesPayload = exercises.map((ex, index) => {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ex.originalId);

                return {
                    exercise_id: isUuid ? ex.originalId : '',
                    exercise_name: ex.name,
                    order_index: index,
                    sets: (ex.sets || []).map((set: any, setIndex: number) => ({
                        set_number: setIndex + 1,
                        reps: parseInt(set.reps) || 0,
                        rest_seconds: 60
                    }))
                };
            });

            // Call atomic RPC function
            const { error } = await supabase.rpc('update_workout_template_atomic', {
                p_template_id: templateId,
                p_title: title,
                p_description: description || '',
                p_exercises: exercisesPayload
            });

            if (error) {
                console.error('RPC Error:', error);
                if (error.message?.includes('function') && error.message?.includes('does not exist')) {
                    throw new Error('Database migration missing. Please run the SQL files in Supabase!');
                }
                throw new Error(`Template update failed: ${error.message}`);
            }

            const { activity_type, activity_type_tags } = await deriveActivityTypeAndTags(templateId);
            await supabase
                .from('workout_templates')
                .update({ activity_type, activity_type_tags })
                .eq('id', templateId);

            return { templateId, title, description, exercises };
        },

        // OPTIMISTIC UPDATE - runs before mutation
        onMutate: async (variables) => {
            const { templateId, title, description, exercises } = variables;

            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: [...WORKOUT_TEMPLATES_KEY, templateId] });
            await queryClient.cancelQueries({ queryKey: WORKOUT_TEMPLATES_KEY });

            // Snapshot previous values for rollback
            const previousTemplate = queryClient.getQueryData([...WORKOUT_TEMPLATES_KEY, templateId]);
            const previousTemplates = queryClient.getQueryData(WORKOUT_TEMPLATES_KEY);

            // Optimistically update detail view
            queryClient.setQueryData([...WORKOUT_TEMPLATES_KEY, templateId], {
                id: templateId,
                title,
                description,
                updated_at: new Date().toISOString(),
                workout_template_exercises: exercises.map((ex, idx) => ({
                    id: ex.id,
                    exercise_id: ex.originalId,
                    exercise_name: ex.name,
                    order_index: idx,
                    workout_template_sets: (ex.sets || []).map((set: any, setIdx: number) => ({
                        id: set.id,
                        set_number: setIdx + 1,
                        reps: parseInt(set.reps) || 0,
                        rest_seconds: 60
                    }))
                }))
            });

            // Optimistically update list view
            queryClient.setQueryData(WORKOUT_TEMPLATES_KEY, (old: any) => {
                if (!old) return old;
                return old.map((t: any) =>
                    t.id === templateId
                        ? {
                            ...t,
                            title,
                            description,
                            updated_at: new Date().toISOString(),
                            workout_template_exercises: [{ count: exercises.length }]
                        }
                        : t
                );
            });

            return { previousTemplate, previousTemplates };
        },

        // On error, rollback to previous state
        onError: (err, variables, context) => {
            console.error('Update failed, rolling back:', err);

            if (context?.previousTemplate) {
                queryClient.setQueryData([...WORKOUT_TEMPLATES_KEY, variables.templateId], context.previousTemplate);
            }
            if (context?.previousTemplates) {
                queryClient.setQueryData(WORKOUT_TEMPLATES_KEY, context.previousTemplates);
            }
        },

        // On success, refetch to ensure consistency with server
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [...WORKOUT_TEMPLATES_KEY, data.templateId] });
            queryClient.invalidateQueries({ queryKey: WORKOUT_TEMPLATES_KEY });
        },
    });
}

export function useDeleteWorkoutTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (templateId: string) => {
            const { data, error } = await supabase
                .from('workout_templates')
                .delete()
                .eq('id', templateId)
                .select('id');

            if (error) {
                console.error('Template deletion failed:', error);
                throw new Error(`Template deletion failed: ${error.message}`);
            }
            if (!data || data.length === 0) {
                console.error('Template deletion affected 0 rows for id', templateId);
                throw new Error('Template deletion failed: no rows deleted. Check ownership and RLS policies.');
            }
            return templateId;
        },
        onMutate: async (templateId) => {
            // Cancel any outgoing refetches to avoid overwriting our optimistic update
            await queryClient.cancelQueries({ queryKey: WORKOUT_TEMPLATES_KEY });

            // Snapshot previous value for rollback
            const previousTemplates = queryClient.getQueryData(WORKOUT_TEMPLATES_KEY);

            // Optimistically remove the template from the list
            queryClient.setQueryData(WORKOUT_TEMPLATES_KEY, (old: any) => {
                if (!Array.isArray(old)) return old;
                return old.filter((t: any) => t.id !== templateId);
            });

            return { previousTemplates };
        },
        onError: (_err, _templateId, context) => {
            // Rollback to previous templates if something goes wrong
            if (context?.previousTemplates) {
                queryClient.setQueryData(WORKOUT_TEMPLATES_KEY, context.previousTemplates);
            }
        },
        onSettled: () => {
            // Always refetch to ensure server and cache are in sync
            queryClient.invalidateQueries({ queryKey: WORKOUT_TEMPLATES_KEY });
        },
    });
}
