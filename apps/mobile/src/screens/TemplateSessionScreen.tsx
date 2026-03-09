import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ScrollView, Platform, StatusBar, ActivityIndicator, Alert, Modal, Dimensions } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { colors, radius, space, typography } from '../theme';
import { getTrackingSchema, formatColumnLabel, type ExerciseType, type TrackingSchema } from '../constants/trackingSchemas';
import { fetchColumnPreferences, upsertColumnPreference } from '../services/columnPreferences.service';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { DynamicInput } from '../components/DynamicInput';
import { supabase } from '../lib/supabase';
import { WORKOUT_SESSIONS_KEY } from '../hooks/useWorkoutSessions';
import { PROGRAM_SCHEDULE_KEY } from '../hooks/useProgramSchedule';
import { USER_XP_KEY } from '../hooks/useUserXp';
import { USER_STREAKS_KEY } from '../hooks/useUserStreaks';
import { USER_ACHIEVEMENTS_KEY } from '../hooks/useUserAchievements';
import { useActiveWorkout } from '../hooks/useActiveWorkoutStore';
import { useWorkoutTimer, formatWorkoutTime } from '../hooks/useWorkoutTimer';
import { useCreateWorkoutTemplate } from '../hooks/useWorkoutTemplates';

interface Set {
    id: string;
    completed: boolean;
    tag?: 'W' | 'F' | 'D' | null;
    values: Record<string, string>;
}

interface Exercise {
    id: string;
    name: string;
    muscle: string;
    sets: Set[];
    exerciseId?: string | null;
    exerciseType: ExerciseType | null;
    visibleColumns: string[] | null;
}

function generateId() {
    return Math.random().toString(36).slice(2);
}

/** Working set number resets to 1 after any set tagged 'W' (warm-up). */
function getWorkingSetNumber(sets: Set[], index: number): number {
    let lastWarmUpIndex = -1;
    for (let i = 0; i < index; i++) {
        if (sets[i].tag === 'W') lastWarmUpIndex = i;
    }
    return index - lastWarmUpIndex;
}

/** True when set is a normal working set (not tagged W, F, or D). */
function isNormalSet(set: Set): boolean {
    return set.tag !== 'W' && set.tag !== 'F' && set.tag !== 'D';
}

/** Index of the next normal set at or after fromIndex, or null if none. */
function getNextNormalSetIndex(sets: Set[], fromIndex: number): number | null {
    for (let i = fromIndex; i < sets.length; i++) {
        if (isNormalSet(sets[i])) return i;
    }
    return null;
}

function emptyValuesForSchema(schema: TrackingSchema): Record<string, string> {
    const values: Record<string, string> = {};
    for (const col of schema.columns) {
        values[col] = '';
    }
    return values;
}

function validateSet(set: Set, schema: TrackingSchema): boolean {
    for (const field of schema.required) {
        if (field === 'reps OR duration_seconds') {
            const reps = (set.values?.reps ?? '').trim();
            const duration = (set.values?.duration_seconds ?? '').trim();
            if (!reps && !duration) return false;
        } else {
            const v = (set.values?.[field] ?? '').trim();
            if (!v) return false;
        }
    }
    return true;
}

function setHasAnyValue(set: Set, schema: TrackingSchema): boolean {
    for (const col of schema.columns) {
        const v = (set.values?.[col] ?? '').trim();
        if (v) return true;
    }
    return false;
}

function getVisibleColumns(exercise: Exercise): string[] {
    const schema = getTrackingSchema(exercise.exerciseType);
    const allowed = new Set(schema.columns);
    if (exercise.visibleColumns?.length) {
        const filtered = exercise.visibleColumns.filter((k) => allowed.has(k)).slice(0, 4);
        if (filtered.length > 0) return filtered;
    }
    return schema.columns.slice(0, 4);
}

/** Display label for exercise type (e.g. "Strength", "Bodybuilding"). Uses exerciseType when set. */
function getExerciseTypeLabel(exercise: Exercise): string {
    if (exercise.exerciseType) {
        const t = exercise.exerciseType;
        return t.charAt(0).toUpperCase() + t.slice(1);
    }
    return exercise.muscle || '--';
}

const MAX_VISIBLE_COLUMNS = 4;

function ColumnEditorContent({
    exerciseName,
    availableColumns,
    initialSelected,
    onDone,
    onCancel,
}: {
    exerciseName: string;
    availableColumns: string[];
    initialSelected: string[];
    onDone: (selected: string[]) => void;
    onCancel: () => void;
}) {
    const [selected, setSelected] = useState<string[]>(() => [...initialSelected]);

    const toggle = (col: string) => {
        setSelected((prev) => {
            const has = prev.includes(col);
            if (has) return prev.filter((c) => c !== col);
            if (prev.length >= MAX_VISIBLE_COLUMNS) return prev;
            return [...prev, col];
        });
    };

    return (
        <>
            <Text style={styles.columnEditorTitle}>Columns for {exerciseName}</Text>
            {availableColumns.map((col) => {
                const isSelected = selected.includes(col);
                return (
                    <Pressable
                        key={col}
                        style={styles.columnEditorRow}
                        onPress={() => toggle(col)}
                    >
                        <Text style={styles.columnEditorLabel}>{formatColumnLabel(col)}</Text>
                        <View style={[styles.columnEditorCheck, isSelected && styles.columnEditorCheckSelected]}>
                            {isSelected ? (
                                <MaterialCommunityIcons name="check" size={16} color={colors.bgMidnight} />
                            ) : null}
                        </View>
                    </Pressable>
                );
            })}
            {selected.length >= MAX_VISIBLE_COLUMNS && (
                <Text style={styles.columnEditorHint}>Max {MAX_VISIBLE_COLUMNS} columns</Text>
            )}
            <View style={styles.columnEditorActions}>
                <Pressable style={styles.columnEditorCancelButton} onPress={onCancel}>
                    <Text style={styles.columnEditorCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                    style={styles.columnEditorDoneButton}
                    onPress={() => onDone(selected)}
                >
                    <Text style={styles.columnEditorDoneText}>Done</Text>
                </Pressable>
            </View>
        </>
    );
}

export type InitialExercise = {
    name: string;
    muscle: string;
    exerciseId?: string | null;
};

export type TemplateSessionScreenProps = {
    templateId?: string | null;
    workoutProgramId?: string;
    workoutProgramDayId?: string;
    navigation: any;
    onAddExercise?: (cb: (exercise: any) => void) => void;
    onPressExercise?: (exerciseId: string | null, exerciseName: string) => void;
    initialExercises?: InitialExercise[] | null;
    onInitialExercisesConsumed?: () => void;
};

export function TemplateSessionScreen({
    templateId,
    workoutProgramId,
    workoutProgramDayId,
    navigation,
    onAddExercise,
    onPressExercise,
    initialExercises,
    onInitialExercisesConsumed,
}: TemplateSessionScreenProps) {
    const queryClient = useQueryClient();
    const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 60;
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [sessionTitle, setSessionTitle] = useState<string>('Workout');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveTemplateVisible, setSaveTemplateVisible] = useState(false);
    const [templateName, setTemplateName] = useState<string>('');
    const [exerciseMenuExerciseId, setExerciseMenuExerciseId] = useState<string | null>(null);
    const [columnEditorExerciseId, setColumnEditorExerciseId] = useState<string | null>(null);
    const [setTagMenuAnchor, setSetTagMenuAnchor] = useState<{ exerciseId: string; setId: string } | null>(null);
    const [exerciseMenuPosition, setExerciseMenuPosition] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [setTagMenuPosition, setSetTagMenuPosition] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const exerciseMenuButtonRefs = useRef<Record<string, View | null>>({});
    const setTagButtonRefs = useRef<Record<string, View | null>>({});
    const hasConsumedInitialExercises = useRef(false);
    const { state: activeWorkout, startSession, markPersistedSessionId, clearSession } = useActiveWorkout();
    const createTemplate = useCreateWorkoutTemplate();

    const elapsedSeconds = useWorkoutTimer({
        startedAt: activeWorkout.startedAt,
        elapsedOffsetSeconds: activeWorkout.elapsedOffsetSeconds,
        isRunning: activeWorkout.active,
    });

    useEffect(() => {
        if (!exerciseMenuExerciseId) {
            setExerciseMenuPosition(null);
            return;
        }
        const node = exerciseMenuButtonRefs.current[exerciseMenuExerciseId];
        if (node && typeof (node as any).measureInWindow === 'function') {
            (node as any).measureInWindow((x: number, y: number, w: number, h: number) => {
                setExerciseMenuPosition({ x, y, w, h });
            });
        }
    }, [exerciseMenuExerciseId]);

    useEffect(() => {
        if (!setTagMenuAnchor) {
            setSetTagMenuPosition(null);
            return;
        }
        const key = `${setTagMenuAnchor.exerciseId}-${setTagMenuAnchor.setId}`;
        const node = setTagButtonRefs.current[key];
        if (node && typeof (node as any).measureInWindow === 'function') {
            (node as any).measureInWindow((x: number, y: number, w: number, h: number) => {
                setSetTagMenuPosition({ x, y, w, h });
            });
        }
    }, [setTagMenuAnchor]);

    // Ensure there is an active workout session while this screen is mounted.
    useEffect(() => {
        if (!activeWorkout.active) {
            startSession({
                templateId: templateId ?? null,
                workoutProgramId: workoutProgramId ?? null,
                workoutProgramDayId: workoutProgramDayId ?? null,
                title: 'Workout',
            });
        }
    }, [activeWorkout.active, startSession, templateId, workoutProgramId, workoutProgramDayId]);

    // When no templateId: stop loading; when initialExercises provided, apply once
    useEffect(() => {
        if (!templateId) {
            setLoading(false);
            if (initialExercises?.length && !hasConsumedInitialExercises.current) {
                hasConsumedInitialExercises.current = true;
                (async () => {
                    const ids = (initialExercises as any[]).map((ex) => ex.exerciseId).filter(Boolean) as string[];
                    const prefMap = ids.length > 0 ? await fetchColumnPreferences(ids) : {};
                    const mapped: Exercise[] = initialExercises.map((ex) => {
                        const exerciseType = (ex as any).exerciseType ?? null;
                        const schema = getTrackingSchema(exerciseType);
                        const exerciseId = (ex as any).exerciseId ?? null;
                        return {
                            id: generateId(),
                            name: ex.name,
                            muscle: ex.muscle,
                            sets: [{ id: generateId(), completed: false, values: emptyValuesForSchema(schema) }],
                            exerciseId,
                            exerciseType,
                            visibleColumns: exerciseId && prefMap[exerciseId]?.length ? prefMap[exerciseId] : null,
                        };
                    });
                    setExercises(mapped);
                    setSessionTitle('Workout');
                    onInitialExercisesConsumed?.();
                })();
            }
        }
    }, [templateId, initialExercises, onInitialExercisesConsumed]);

    useEffect(() => {
        let isActive = true;

        async function fetchTemplate() {
            if (!templateId) {
                return;
            }

            setLoading(true);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.id) {
                    console.error('No user session found');
                    if (isActive) setLoading(false);
                    return;
                }

                // Fetch template details (by id only; RLS determines visibility)
                const { data: template, error: templateError } = await supabase
                    .from('workout_templates')
                    .select('id, title')
                    .eq('id', templateId)
                    .maybeSingle();

                if (templateError) {
                    console.error('Error fetching template:', templateError);
                    if (isActive) setLoading(false);
                    return;
                }

                if (!template) {
                    console.error('Template not found');
                    if (isActive) setLoading(false);
                    return;
                }

                if (isActive) setSessionTitle(template.title ?? 'Workout');

                // Fetch exercises (exercise_id for saving session log)
                const { data: templateExercises, error: exercisesError } = await supabase
                    .from('workout_template_exercises')
                    .select('id, exercise_id, exercise_name, order_index, exercises(exercise_type)')
                    .eq('workout_template_id', templateId)
                    .order('order_index', { ascending: true });

                if (exercisesError) {
                    console.error('Error fetching exercises:', exercisesError);
                    if (isActive) setLoading(false);
                    return;
                }

                if (!templateExercises || templateExercises.length === 0) {
                    if (isActive) {
                        setExercises([]);
                        setLoading(false);
                    }
                    return;
                }

                // Fallback: if join didn't return exercise_type, fetch by exercise_id
                const missingIds = (templateExercises as any[])
                    .filter((e: any) => e.exercise_id && !e.exercises?.exercise_type)
                    .map((e: any) => e.exercise_id);
                if (missingIds.length > 0) {
                    const { data: exRows } = await supabase
                        .from('exercises')
                        .select('id, exercise_type')
                        .in('id', missingIds);
                    const typeById = new Map((exRows || []).map((r: any) => [r.id, r.exercise_type]));
                    for (const e of templateExercises as any[]) {
                        if (e.exercise_id && !e.exercises?.exercise_type) {
                            const t = typeById.get(e.exercise_id);
                            if (t) e.exercises = { ...(e.exercises || {}), exercise_type: t };
                        }
                    }
                }

                // Fetch sets
                const exerciseIds = templateExercises.map((e) => e.id);
                const { data: templateSets, error: setsError } = await supabase
                    .from('workout_template_sets')
                    .select('workout_template_exercise_id, set_number, reps')
                    .in('workout_template_exercise_id', exerciseIds)
                    .order('set_number', { ascending: true });

                if (setsError) {
                    console.error('Error fetching sets:', setsError);
                }

                const setsByExerciseId: Record<string, any[]> = {};
                (templateSets ?? []).forEach((set) => {
                    if (!setsByExerciseId[set.workout_template_exercise_id]) {
                        setsByExerciseId[set.workout_template_exercise_id] = [];
                    }
                    setsByExerciseId[set.workout_template_exercise_id].push(set);
                });

                const catalogExerciseIds = (templateExercises as any[])
                    .map((e) => e.exercise_id)
                    .filter(Boolean) as string[];
                const prefMap = catalogExerciseIds.length > 0 ? await fetchColumnPreferences(catalogExerciseIds) : {};

                const mappedExercises: Exercise[] = templateExercises.map((exercise) => {
                    const exerciseSets = setsByExerciseId[exercise.id] ?? [];

                    const exType = (exercise as any).exercises?.exercise_type as ExerciseType | null;
                    const schema = getTrackingSchema(exType);
                    const sets: Set[] = exerciseSets.length > 0
                        ? exerciseSets
                            .sort((a, b) => a.set_number - b.set_number)
                            .map((s) => {
                                const values = emptyValuesForSchema(schema);
                                if (s.reps != null) values.reps = String(s.reps);
                                return {
                                    id: generateId(),
                                    completed: false,
                                    values,
                                };
                            })
                        : [{ id: generateId(), completed: false, values: emptyValuesForSchema(schema) }];

                    const muscleLabel = exType
                        ? exType.charAt(0).toUpperCase() + exType.slice(1)
                        : '--';
                    const exerciseId = (exercise as any).exercise_id ?? null;
                    return {
                        id: generateId(),
                        name: exercise.exercise_name ?? '--',
                        muscle: muscleLabel,
                        sets,
                        exerciseId,
                        exerciseType: exType ?? null,
                        visibleColumns: exerciseId && prefMap[exerciseId]?.length ? prefMap[exerciseId] : null,
                    };
                });

                if (isActive) {
                    setExercises(mappedExercises);
                    setLoading(false);
                }

            } catch (error) {
                console.error('Error in fetchTemplate:', error);
                if (isActive) setLoading(false);
            }
        }

        fetchTemplate();

        return () => {
            isActive = false;
        };
    }, [templateId]);

    const handleAddExercise = () => {
        if (onAddExercise) {
            onAddExercise((exercise) => {
                const exerciseType = (exercise.exercise_type as ExerciseType) ?? null;
                const schema = getTrackingSchema(exerciseType);
                const newExercise: Exercise = {
                    id: generateId(),
                    name: exercise.name,
                    muscle: exercise.muscles?.[0] || exercise.exercise_type?.toUpperCase() || exercise.category?.toUpperCase() || '--',
                    sets: [
                        { id: generateId(), completed: false, values: emptyValuesForSchema(schema) },
                    ],
                    exerciseId: exercise.id ?? null,
                    exerciseType,
                    visibleColumns: null,
                };
                setExercises(prev => [...prev, newExercise]);
            });
        }
    };

    const handleAddSet = (exerciseId: string) => {
        setExercises(exercises.map(ex => {
            if (ex.id === exerciseId) {
                const schema = getTrackingSchema(ex.exerciseType);
                return {
                    ...ex,
                    sets: [...ex.sets, { id: Date.now().toString(), completed: false, values: emptyValuesForSchema(schema) }],
                };
            }
            return ex;
        }));
    };

    const setRowSwipeableRefs = useRef<Record<string, Swipeable | null>>({});

    const removeSet = (exerciseId: string, setId: string) => {
        const key = `${exerciseId}-${setId}`;
        setRowSwipeableRefs.current[key]?.close();
        setExercises(prev => prev.map(ex => {
            if (ex.id === exerciseId) {
                return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
            }
            return ex;
        }));
    };

    const toggleSetComplete = (exerciseId: string, setId: string) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exerciseId) return ex;
            const setIndex = ex.sets.findIndex(s => s.id === setId);
            if (setIndex === -1) return ex;
            const set = ex.sets[setIndex];
            const willBeCompleted = !set.completed;

            let newSets = ex.sets.map((s, i) =>
                s.id === setId ? { ...s, completed: !s.completed } : s
            );

            if (willBeCompleted && isNormalSet(set)) {
                const nextIdx = getNextNormalSetIndex(ex.sets, setIndex + 1);
                if (nextIdx !== null) {
                    const schema = getTrackingSchema(ex.exerciseType);
                    const nextSet = newSets[nextIdx];
                    const newValues = { ...nextSet.values };
                    let changed = false;
                    for (const col of schema.columns) {
                        const nextVal = (newValues[col] ?? '').trim();
                        const srcVal = (set.values?.[col] ?? '').trim();
                        if (!nextVal && srcVal) {
                            newValues[col] = srcVal;
                            changed = true;
                        }
                    }
                    if (changed) {
                        newSets = newSets.map((s, i) =>
                            i === nextIdx ? { ...s, values: newValues } : s
                        );
                    }
                }
            }

            return { ...ex, sets: newSets };
        }));
    };

    const updateSet = (exerciseId: string, setId: string, field: string, value: string) => {
        setExercises(exercises.map(ex => {
            if (ex.id === exerciseId) {
                return {
                    ...ex,
                    sets: ex.sets.map(s => s.id === setId
                        ? { ...s, values: { ...s.values, [field]: value } }
                        : s),
                };
            }
            return ex;
        }));
    };

    const handleRemoveExercise = (exerciseId: string) => {
        setExercises(prev => prev.filter(e => e.id !== exerciseId));
        setExerciseMenuExerciseId(null);
    };

    const handleSetSetTag = (exerciseId: string, setId: string, tag: 'W' | 'F' | 'D') => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exerciseId) return ex;
            return {
                ...ex,
                sets: ex.sets.map(s => s.id === setId ? { ...s, tag } : s),
            };
        }));
        setSetTagMenuAnchor(null);
    };

    const handleFinishWorkout = async () => {
        if (saving) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            Alert.alert('Error', 'Not signed in.');
            return;
        }
        setSaving(true);
        try {
            const duration_minutes = Math.floor(elapsedSeconds / 60) || null;
            const isFromProgram = !!(workoutProgramId && workoutProgramDayId);
            const { data: sessionRow, error: sessionError } = await supabase
                .from('workout_sessions')
                .insert({
                    user_id: user.id,
                    workout_template_id: templateId ?? null,
                    workout_program_id: workoutProgramId ?? null,
                    workout_program_day_id: workoutProgramDayId ?? null,
                    performed_at: new Date().toISOString(),
                    duration_minutes,
                    source: isFromProgram ? 'program' : 'manual',
                    session_type: 'strength',
                    calories_burned: null,
                })
                .select('id')
                .single();

            if (sessionError || !sessionRow) {
                console.error('Error saving workout session:', sessionError);
                Alert.alert('Error', 'Could not save workout.');
                setSaving(false);
                return;
            }

            const sessionId = sessionRow.id;
            markPersistedSessionId(sessionId);

            // Validate required fields for all sets that have any value
            for (const ex of exercises) {
                const schema = getTrackingSchema(ex.exerciseType);
                for (const set of ex.sets) {
                    if (!setHasAnyValue(set, schema)) continue;
                    if (!validateSet(set, schema)) {
                        Alert.alert('Missing required fields', `Please fill required fields for "${ex.name}".`);
                        setSaving(false);
                        return;
                    }
                }
            }

            for (let i = 0; i < exercises.length; i++) {
                const ex = exercises[i];
                const schema = getTrackingSchema(ex.exerciseType);
                const { data: exRow, error: exError } = await supabase
                    .from('workout_session_exercises')
                    .insert({
                        workout_session_id: sessionId,
                        exercise_id: ex.exerciseId ?? null,
                        exercise_name: ex.name,
                        order_index: i,
                    })
                    .select('id')
                    .single();

                if (exError || !exRow) {
                    console.error('Error saving session exercise:', exError);
                    setSaving(false);
                    return;
                }

                for (let s = 0; s < ex.sets.length; s++) {
                    const set = ex.sets[s];
                    if (!setHasAnyValue(set, schema)) continue;

                    const v = set.values ?? {};
                    const payload: Record<string, unknown> = {
                        workout_session_exercise_id: exRow.id,
                        set_number: s + 1,
                    };
                    if (v.load?.trim()) {
                        const n = parseFloat(v.load.trim());
                        if (!Number.isNaN(n)) payload.weight = n;
                    }
                    if (v.reps?.trim()) {
                        const n = parseInt(v.reps.trim(), 10);
                        if (!Number.isNaN(n)) payload.reps = n;
                    }
                    if (v.duration_seconds?.trim()) {
                        const n = parseInt(v.duration_seconds.trim(), 10);
                        if (!Number.isNaN(n)) payload.duration_seconds = n;
                    }
                    if (v.distance_meters?.trim()) {
                        const n = parseFloat(v.distance_meters.trim());
                        if (!Number.isNaN(n)) payload.distance_meters = n;
                    }
                    if (v.rpe?.trim()) {
                        const n = parseFloat(v.rpe.trim());
                        if (!Number.isNaN(n)) payload.rpe = n;
                    }
                    if (v.tempo?.trim()) payload.tempo = v.tempo.trim();
                    if (v.hold_time_seconds?.trim()) {
                        const n = parseInt(v.hold_time_seconds.trim(), 10);
                        if (!Number.isNaN(n)) payload.hold_time_seconds = n;
                    }
                    if (v.side?.trim() && ['left', 'right', 'both'].includes(v.side.trim())) payload.side = v.side.trim();
                    if (v.difficulty_level?.trim() && ['easy', 'moderate', 'hard', 'max'].includes(v.difficulty_level.trim())) payload.difficulty_level = v.difficulty_level.trim();
                    if (v.feeling_score?.trim()) {
                        const n = parseInt(v.feeling_score.trim(), 10);
                        if (!Number.isNaN(n)) payload.feeling_score = n;
                    }

                    const { error: setError } = await supabase
                        .from('workout_session_sets')
                        .insert(payload);
                    if (setError) console.error('Error saving set:', setError);
                }
            }

            queryClient.invalidateQueries({ queryKey: WORKOUT_SESSIONS_KEY });
            queryClient.invalidateQueries({ queryKey: PROGRAM_SCHEDULE_KEY });
            queryClient.invalidateQueries({ queryKey: USER_XP_KEY });
            queryClient.invalidateQueries({ queryKey: USER_STREAKS_KEY });
            queryClient.invalidateQueries({ queryKey: USER_ACHIEVEMENTS_KEY });
            await queryClient.refetchQueries({ queryKey: WORKOUT_SESSIONS_KEY });
            clearSession();
            navigation?.goBack();
        } catch (e) {
            console.error('Finish workout error:', e);
            Alert.alert('Error', 'Could not save workout.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTemplatePress = () => {
        if (exercises.length === 0) {
            Alert.alert('Save workout', 'Add at least one exercise before saving this workout as a template.');
            return;
        }
        const baseName = (sessionTitle || 'Workout').trim() || 'Workout';
        setTemplateName(baseName);
        setSaveTemplateVisible(true);
    };

    const handleConfirmSaveTemplate = () => {
        if (createTemplate.isPending) return;
        const name = (templateName || sessionTitle || 'Workout').trim() || 'Workout';
        if (!name) {
            Alert.alert('Save workout', 'Please enter a name for this workout.');
            return;
        }

        const templateExercises = exercises.map((ex) => ({
            originalId: ex.exerciseId ?? '',
            name: ex.name,
            sets: ex.sets.map((set) => ({
                reps: (set.values?.reps ?? '').trim(),
            })),
        }));

        createTemplate.mutate(
            { title: name, description: '', exercises: templateExercises },
            {
                onSuccess: () => {
                    setSaveTemplateVisible(false);
                    Alert.alert('Saved', 'Workout saved to your templates.');
                },
                onError: (err) => {
                    console.error('Save template error:', err);
                    const message =
                        err instanceof Error
                            ? err.message
                            : 'Could not save workout template. Please try again.';
                    Alert.alert('Error', message);
                },
            }
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <FloatingBackButton onPress={() => navigation?.goBack()} />

            <View style={[styles.appBar, { paddingTop, height: paddingTop + 44 }]} pointerEvents="box-none">
                <View style={styles.appBarOverlay} />
                <View style={[styles.appBarTitleWrap, { top: paddingTop, height: 44 }]}>
                    <Text style={styles.appBarTimer}>{formatWorkoutTime(elapsedSeconds)}</Text>
                    <Pressable
                        style={styles.saveTemplateButton}
                        onPress={handleSaveTemplatePress}
                        disabled={createTemplate.isPending}
                        accessibilityLabel="Save workout as template"
                    >
                        <Text
                            style={[
                                styles.saveTemplateText,
                                createTemplate.isPending && { opacity: 0.6 },
                            ]}
                        >
                            {createTemplate.isPending ? 'Saving…' : 'Save'}
                        </Text>
                    </Pressable>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingTop: paddingTop + 44 + 16, paddingBottom: 120 }}>

                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="large" color={colors.bodyOrange} />
                        <Text style={styles.loadingText}>Loading workout…</Text>
                    </View>
                ) : (
                    <>
                        <TextInput
                            style={styles.screenHeading}
                            value={sessionTitle}
                            onChangeText={setSessionTitle}
                            placeholder="Workout"
                            placeholderTextColor={colors.textTertiary}
                            underlineColorAndroid="transparent"
                        />

                        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                            <View style={styles.sectionTitleRow}>
                                <Text style={styles.sectionTitle}>Exercises</Text>
                                <View style={styles.countBadge}>
                                    <Text style={styles.countText}>{exercises.length} ITEMS</Text>
                                </View>
                            </View>
                            <Text style={styles.reorderText}>REORDER</Text>
                        </View>

                        {exercises.length > 0 ? (
                            <View style={styles.exercisesList}>
                                {exercises.map((exercise, index) => (
                                    <View key={exercise.id} style={styles.activeExerciseCard}>
                                        <View style={styles.exerciseHeader}>
                                            <Pressable
                                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                                onPress={() => onPressExercise?.(exercise.exerciseId ?? null, exercise.name)}
                                            >
                                                <View style={styles.iconContainer}>
                                                    <MaterialCommunityIcons name="dumbbell" size={24} color={colors.bodyOrange} />
                                                </View>
                                                <View style={{ marginLeft: 12, flex: 1 }}>
                                                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                                                    <Text style={styles.exerciseTypeLabel}>{getExerciseTypeLabel(exercise)}</Text>
                                                </View>
                                            </Pressable>
                                            <Pressable
                                                ref={(r: any) => { exerciseMenuButtonRefs.current[exercise.id] = r; }}
                                                style={styles.exerciseMenuButton}
                                                onPress={() => setExerciseMenuExerciseId(exercise.id)}
                                            >
                                                <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.textSecondary} />
                                            </Pressable>
                                        </View>

                                        {(() => {
                                            const schema = getTrackingSchema(exercise.exerciseType);
                                            const visibleCols = getVisibleColumns(exercise);
                                            return (
                                                <>
                                                    <View style={styles.setsHeader}>
                                                        <Text style={[styles.colHeader, styles.setColHeader]}>{'SET'}</Text>
                                                        {visibleCols.map((col) => (
                                                            <Text key={col} style={[styles.colHeader, styles.dataColHeader]}>{formatColumnLabel(col)}</Text>
                                                        ))}
                                                        <View style={styles.setRowSpacer} />
                                                    </View>

                                                    <View style={styles.setsList}>
                                                        {exercise.sets.map((set, setIndex) => {
                                                            const rowKey = `${exercise.id}-${set.id}`;
                                                            return (
                                                                <Swipeable
                                                                    key={set.id}
                                                                    ref={(r) => { setRowSwipeableRefs.current[rowKey] = r; }}
                                                                    renderLeftActions={() => (
                                                                        <Pressable
                                                                            style={styles.setRowDeleteAction}
                                                                            onPress={() => removeSet(exercise.id, set.id)}
                                                                        >
                                                                            <MaterialCommunityIcons name="trash-can-outline" size={22} color="white" />
                                                                        </Pressable>
                                                                    )}
                                                                >
                                                                    <View style={styles.setRow}>
                                                                        <Pressable
                                                                            ref={(r: any) => { setTagButtonRefs.current[rowKey] = r; }}
                                                                            style={[
                                                                                styles.setNumberBadge,
                                                                                set.completed && styles.setNumberCompleted
                                                                            ]}
                                                                            onPress={() => setSetTagMenuAnchor({ exerciseId: exercise.id, setId: set.id })}
                                                                        >
                                                                            <Text style={[
                                                                                styles.setNumberText,
                                                                                set.completed && { color: colors.healthGreen }
                                                                            ]}>{set.tag ?? getWorkingSetNumber(exercise.sets, setIndex)}</Text>
                                                                        </Pressable>

                                                                        {visibleCols.map((column) => (
                                                                            <DynamicInput
                                                                                key={column}
                                                                                column={column}
                                                                                value={set.values?.[column] ?? ''}
                                                                                onChange={(v) => updateSet(exercise.id, set.id, column, v)}
                                                                                editable={!set.completed}
                                                                                completed={set.completed}
                                                                                containerStyle={set.completed ? { backgroundColor: 'rgba(45, 255, 143, 0.1)', borderColor: colors.healthGreen, borderWidth: 1 } : undefined}
                                                                                inputStyle={set.completed ? { color: colors.healthGreen } : undefined}
                                                                            />
                                                                        ))}

                                                                        <Pressable
                                                                            style={[
                                                                                styles.checkButton,
                                                                                set.completed && { backgroundColor: colors.healthGreen }
                                                                            ]}
                                                                            onPress={() => toggleSetComplete(exercise.id, set.id)}
                                                                        >
                                                                            {set.completed ? (
                                                                                <MaterialCommunityIcons name="check" size={20} color={colors.bgMidnight} />
                                                                            ) : (
                                                                                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.bgElevated }} />
                                                                            )}
                                                                        </Pressable>
                                                                    </View>
                                                                </Swipeable>
                                                            );
                                                        })}
                                                    </View>
                                                </>
                                            );
                                        })()}

                                        <Pressable style={styles.addSetButton} onPress={() => handleAddSet(exercise.id)}>
                                            <MaterialCommunityIcons name="plus" size={16} color={colors.bodyOrange} />
                                            <Text style={styles.addSetText}>ADD SET</Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        ) : null}

                        <Pressable style={styles.addExerciseButton} onPress={handleAddExercise}>
                            <View style={styles.addIconCircle}>
                                <MaterialCommunityIcons name="plus" size={20} color={colors.textPrimary} />
                            </View>
                            <Text style={styles.addExerciseText}>Add Exercise</Text>
                        </Pressable>
                    </>
                )}

            </ScrollView>

            <View style={styles.footer}>
                <Pressable
                    style={styles.discardButton}
                    onPress={() => {
                        Alert.alert(
                            'Discard workout?',
                            'Your progress will not be saved.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Discard',
                                    style: 'destructive',
                                    onPress: () => {
                                        clearSession();
                                        navigation?.goBack();
                                    },
                                },
                            ]
                        );
                    }}
                >
                    <MaterialCommunityIcons name="delete-outline" size={22} color={colors.textPrimary} />
                    <Text style={styles.discardButtonText}>Discard</Text>
                </Pressable>
                <Pressable style={styles.endSessionButton} onPress={handleFinishWorkout} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator size="small" color={colors.bgMidnight} />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="stop-circle-outline" size={24} color={colors.textPrimary} />
                            <Text style={styles.endSessionText}>End Session</Text>
                        </>
                    )}
                </Pressable>
            </View>

            <Modal
                visible={!!exerciseMenuExerciseId}
                transparent
                onRequestClose={() => setExerciseMenuExerciseId(null)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setExerciseMenuExerciseId(null)}>
                    <Pressable
                        style={[
                            styles.overlayCard,
                            {
                                position: 'absolute',
                                ...(exerciseMenuPosition
                                    ? {
                                        left: exerciseMenuPosition.x + exerciseMenuPosition.w - 160,
                                        top: exerciseMenuPosition.y + exerciseMenuPosition.h + 4,
                                    }
                                    : {
                                        left: Dimensions.get('window').width / 2 - 80,
                                        top: Dimensions.get('window').height / 2 - 30,
                                    }),
                            },
                        ]}
                            onPress={(e) => e.stopPropagation?.()}
                    >
                        <Pressable
                            style={styles.overlayDeleteButton}
                            onPress={() => {
                                if (exerciseMenuExerciseId) {
                                    setExerciseMenuExerciseId(null);
                                    setColumnEditorExerciseId(exerciseMenuExerciseId);
                                }
                            }}
                        >
                            <MaterialCommunityIcons name="format-columns" size={20} color={colors.textPrimary} />
                            <Text style={styles.overlayMenuText}>Edit columns</Text>
                        </Pressable>
                        <Pressable
                            style={styles.overlayDeleteButton}
                            onPress={() => exerciseMenuExerciseId && handleRemoveExercise(exerciseMenuExerciseId)}
                        >
                            <MaterialCommunityIcons name="delete-outline" size={20} color="#DC2626" />
                            <Text style={styles.overlayDeleteText}>Delete</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                visible={!!columnEditorExerciseId}
                transparent
                onRequestClose={() => setColumnEditorExerciseId(null)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setColumnEditorExerciseId(null)}>
                    <Pressable
                        style={[styles.overlayCard, styles.columnEditorCard]}
                        onPress={(e) => e.stopPropagation?.()}
                    >
                        {columnEditorExerciseId && (() => {
                            const ex = exercises.find((e) => e.id === columnEditorExerciseId);
                            if (!ex) return null;
                            const schema = getTrackingSchema(ex.exerciseType);
                            const available = schema.columns;
                            const initialSelected = getVisibleColumns(ex);
                            return (
                                <ColumnEditorContent
                                    exerciseName={ex.name}
                                    availableColumns={available}
                                    initialSelected={initialSelected}
                                    onDone={(selected) => {
                                        const limited = selected.slice(0, 4);
                                        setExercises((prev) =>
                                            prev.map((e) =>
                                                e.id === columnEditorExerciseId
                                                    ? { ...e, visibleColumns: limited }
                                                    : e
                                            )
                                        );
                                        if (ex.exerciseId) {
                                            upsertColumnPreference(ex.exerciseId, limited);
                                        }
                                        setColumnEditorExerciseId(null);
                                    }}
                                    onCancel={() => setColumnEditorExerciseId(null)}
                                />
                            );
                        })()}
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                visible={!!setTagMenuAnchor}
                transparent
                onRequestClose={() => setSetTagMenuAnchor(null)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setSetTagMenuAnchor(null)}>
                    <Pressable
                        style={[
                            styles.overlayCard,
                            {
                                position: 'absolute',
                                ...(setTagMenuPosition
                                    ? {
                                        left: setTagMenuPosition.x,
                                        top: setTagMenuPosition.y + setTagMenuPosition.h + 4,
                                    }
                                    : {
                                        left: Dimensions.get('window').width / 2 - 80,
                                        top: Dimensions.get('window').height / 2 - 30,
                                    }),
                            },
                        ]}
                        onPress={(e) => e.stopPropagation?.()}
                    >
                        {setTagMenuAnchor && (['W', 'F', 'D'] as const).map((tag) => (
                            <Pressable
                                key={tag}
                                style={styles.setTagOption}
                                onPress={() => handleSetSetTag(setTagMenuAnchor.exerciseId, setTagMenuAnchor.setId, tag)}
                            >
                                <Text style={styles.setTagOptionText}>{tag}</Text>
                            </Pressable>
                        ))}
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                visible={saveTemplateVisible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (!createTemplate.isPending) setSaveTemplateVisible(false);
                }}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => {
                        if (!createTemplate.isPending) setSaveTemplateVisible(false);
                    }}
                >
                    <Pressable
                        style={[styles.overlayCard, styles.saveTemplateCard]}
                        onPress={(e) => e.stopPropagation?.()}
                    >
                        <Text style={styles.saveTemplateTitle}>Save workout as template</Text>
                        <TextInput
                            style={styles.saveTemplateInput}
                            value={templateName}
                            onChangeText={setTemplateName}
                            placeholder="Template name"
                            placeholderTextColor={colors.textTertiary}
                        />
                        <View style={styles.saveTemplateActions}>
                            <Pressable
                                style={styles.saveTemplateCancel}
                                onPress={() => {
                                    if (!createTemplate.isPending) setSaveTemplateVisible(false);
                                }}
                            >
                                <Text style={styles.saveTemplateCancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={styles.saveTemplateConfirm}
                                onPress={handleConfirmSaveTemplate}
                                disabled={createTemplate.isPending}
                            >
                                <Text style={styles.saveTemplateConfirmText}>
                                    {createTemplate.isPending ? 'Saving…' : 'Save'}
                                </Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgMidnight,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    appBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99,
        overflow: 'hidden',
    },
    appBarOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    appBarTitleWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appBarTimer: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.textPrimary,
        fontVariant: ['tabular-nums'],
    },
    saveTemplateButton: {
        position: 'absolute',
        right: 20,
        top: 8,
        paddingHorizontal: space.sm,
        paddingVertical: 6,
        borderRadius: radius.md,
    },
    saveTemplateText: {
        ...typography.sm,
        fontWeight: '700',
        color: colors.bodyOrange,
    },
    screenHeading: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 8,
        paddingVertical: 0,
        paddingHorizontal: 0,
        textAlign: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: space.md,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
    },
    sectionTitle: {
        ...typography.lg,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    countBadge: {
        backgroundColor: '#3F2E00',
        paddingHorizontal: space.xs,
        paddingVertical: 4,
        borderRadius: radius.sm,
    },
    countText: {
        ...typography.xs,
        fontWeight: '700',
        color: colors.actionAmber,
    },
    reorderText: {
        ...typography.xs,
        fontWeight: '700',
        color: colors.textTertiary,
        letterSpacing: 1,
    },
    exercisesList: {
        gap: 16,
        marginBottom: 24,
    },
    activeExerciseCard: {
        backgroundColor: '#2C2C2C',
        borderRadius: radius.xl,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderLeftWidth: 4,
        borderLeftColor: colors.bodyOrange,
    },
    exerciseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    exerciseMenuButton: {
        padding: space.xs,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 176, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    exerciseMuscle: {
        fontSize: 12,
        color: colors.textTertiary,
        textTransform: 'uppercase',
    },
    exerciseTypeLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'capitalize',
    },
    setsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    setColHeader: {
        width: 32,
    },
    dataColHeader: {
        flex: 1,
    },
    setRowSpacer: {
        width: 40,
    },
    colHeader: {
        fontSize: 10,
        color: colors.textTertiary,
        fontWeight: '700',
        textAlign: 'center',
    },
    setsList: {
        gap: 12,
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    setRowDeleteAction: {
        width: 80,
        backgroundColor: '#B91C1C',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        marginRight: 12,
    },
    setNumberBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
    },
    setNumberCompleted: {
        backgroundColor: 'rgba(45, 255, 143, 0.1)',
        borderWidth: 1,
        borderColor: colors.healthGreen,
    },
    setNumberText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '700',
    },
    inputContainer: {
        flex: 1,
        height: 44,
        backgroundColor: colors.bgElevated,
        borderRadius: 12,
        justifyContent: 'center',
    },
    inputValue: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    checkButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: colors.bgElevated,
    },
    addSetButton: {
        height: 44,
        backgroundColor: colors.bgElevated,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderStyle: 'dashed',
    },
    addSetText: {
        color: colors.bodyOrange,
        fontWeight: '700',
        fontSize: 12,
        marginLeft: 8,
    },
    addExerciseButton: {
        height: 64,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        borderStyle: 'dashed',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    addIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addExerciseText: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
    loadingWrap: {
        paddingVertical: 48,
        alignItems: 'center',
        gap: space.md,
    },
    loadingText: {
        ...typography.sm,
        color: colors.textTertiary,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 20,
        paddingBottom: 40,
        backgroundColor: colors.bgMidnight,
    },
    discardButton: {
        height: 56,
        borderRadius: 16,
        backgroundColor: '#DC2626',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minWidth: 120,
    },
    discardButtonText: {
        ...typography.base,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    endSessionButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        backgroundColor: colors.bodyOrange,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    endSessionText: {
        color: colors.textPrimary,
        fontWeight: '800',
        fontSize: 16,
        textTransform: 'uppercase',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayCard: {
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.lg,
        padding: space.sm,
        minWidth: 160,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    saveTemplateCard: {
        padding: space.lg,
        minWidth: 260,
        maxWidth: 320,
    },
    saveTemplateTitle: {
        ...typography.lg,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: space.md,
        textAlign: 'center',
    },
    saveTemplateInput: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        paddingHorizontal: space.md,
        paddingVertical: 10,
        color: colors.textPrimary,
        marginBottom: space.md,
    },
    saveTemplateActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: space.sm,
        marginTop: space.sm,
    },
    saveTemplateCancel: {
        paddingHorizontal: space.md,
        paddingVertical: 8,
    },
    saveTemplateCancelText: {
        ...typography.base,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    saveTemplateConfirm: {
        paddingHorizontal: space.md,
        paddingVertical: 8,
        borderRadius: radius.md,
        backgroundColor: colors.bodyOrange,
    },
    saveTemplateConfirmText: {
        ...typography.base,
        color: colors.bgMidnight,
        fontWeight: '700',
    },
    overlayDeleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
    },
    overlayDeleteText: {
        ...typography.base,
        fontWeight: '600',
        color: '#DC2626',
    },
    overlayMenuText: {
        ...typography.base,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    columnEditorCard: {
        marginHorizontal: 24,
        padding: space.lg,
        maxWidth: 320,
    },
    columnEditorTitle: {
        ...typography.lg,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: space.md,
    },
    columnEditorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: space.sm,
        paddingHorizontal: 0,
    },
    columnEditorLabel: {
        ...typography.base,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    columnEditorCheck: {
        width: 24,
        height: 24,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.borderSubtle,
        justifyContent: 'center',
        alignItems: 'center',
    },
    columnEditorCheckSelected: {
        backgroundColor: colors.bodyOrange,
        borderColor: colors.bodyOrange,
    },
    columnEditorHint: {
        ...typography.xs,
        color: colors.textTertiary,
        marginTop: space.xs,
        marginBottom: space.sm,
    },
    columnEditorActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: space.md,
    },
    columnEditorCancelButton: {
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
    },
    columnEditorCancelText: {
        ...typography.base,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    columnEditorDoneButton: {
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
        backgroundColor: colors.bodyOrange,
        borderRadius: radius.md,
    },
    columnEditorDoneText: {
        ...typography.base,
        fontWeight: '700',
        color: colors.bgMidnight,
    },
    setTagOption: {
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
    },
    setTagOptionText: {
        ...typography.base,
        fontWeight: '600',
        color: colors.textPrimary,
    },
});
