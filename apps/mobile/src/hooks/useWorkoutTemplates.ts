import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const WORKOUT_TEMPLATES_KEY = ['workoutTemplates'];

export function useWorkoutTemplates() {
    return useQuery({
        queryKey: WORKOUT_TEMPLATES_KEY,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('workout_templates')
                .select('*, workout_template_exercises(count)')
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('Error fetching templates:', error);
                throw error;
            }

            console.log('Fetched templates:', data?.length, 'records');
            if (data && data.length > 0) {
                console.log('Template structure:', JSON.stringify(data[0], null, 2));
            }

            return data || [];
        },
    });
}

export function useWorkoutTemplate(templateId: string | null) {
    return useQuery({
        queryKey: [...WORKOUT_TEMPLATES_KEY, templateId],
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

            console.log('Fetched template details:', data);
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

            return { id: templateId, title, description, exercises, user_id: user.id };
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
            const { error } = await supabase
                .from('workout_templates')
                .delete()
                .eq('id', templateId);

            if (error) throw new Error(`Template deletion failed: ${error.message}`);

            return templateId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: WORKOUT_TEMPLATES_KEY });
        },
    });
}
