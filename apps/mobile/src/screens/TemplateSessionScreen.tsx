import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ScrollView, Platform, StatusBar, ActivityIndicator, Alert, Modal, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { supabase } from '../lib/supabase';
import { WORKOUT_SESSIONS_KEY } from '../hooks/useWorkoutSessions';
import { PROGRAM_SCHEDULE_KEY } from '../hooks/useProgramSchedule';
import { USER_XP_KEY } from '../hooks/useUserXp';
import { USER_STREAKS_KEY } from '../hooks/useUserStreaks';
import { USER_ACHIEVEMENTS_KEY } from '../hooks/useUserAchievements';

interface Set {
    id: string;
    kg: string;
    reps: string;
    completed: boolean;
    tag?: 'W' | 'F' | 'D' | null;
}

interface Exercise {
    id: string;
    name: string;
    muscle: string;
    sets: Set[];
    exerciseId?: string | null; // from template, for saving to workout_session_exercises
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
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timerPaused, setTimerPaused] = useState(false);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [sessionTitle, setSessionTitle] = useState<string>('Workout');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exerciseMenuExerciseId, setExerciseMenuExerciseId] = useState<string | null>(null);
    const [setTagMenuAnchor, setSetTagMenuAnchor] = useState<{ exerciseId: string; setId: string } | null>(null);
    const [exerciseMenuPosition, setExerciseMenuPosition] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [setTagMenuPosition, setSetTagMenuPosition] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const exerciseMenuButtonRefs = useRef<Record<string, View | null>>({});
    const setTagButtonRefs = useRef<Record<string, View | null>>({});
    const hasConsumedInitialExercises = useRef(false);

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

    // When no templateId: stop loading; when initialExercises provided, apply once
    useEffect(() => {
        if (!templateId) {
            setLoading(false);
            if (initialExercises?.length && !hasConsumedInitialExercises.current) {
                hasConsumedInitialExercises.current = true;
                const mapped: Exercise[] = initialExercises.map((ex) => ({
                    id: generateId(),
                    name: ex.name,
                    muscle: ex.muscle,
                    sets: [{ id: generateId(), kg: '', reps: '', completed: false }],
                    exerciseId: ex.exerciseId ?? null,
                }));
                setExercises(mapped);
                setSessionTitle('Workout');
                onInitialExercisesConsumed?.();
            }
        }
    }, [templateId, initialExercises, onInitialExercisesConsumed]);

    useEffect(() => {
        let isActive = true;

        async function fetchTemplate() {
            if (!templateId) {
                return;
            }

            console.log('TemplateSessionScreen: Loading template with ID:', templateId);
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

                console.log('Fetched exercises:', templateExercises?.length);

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

                const mappedExercises: Exercise[] = templateExercises.map((exercise) => {
                    const exerciseSets = setsByExerciseId[exercise.id] ?? [];

                    const sets: Set[] = exerciseSets.length > 0
                        ? exerciseSets
                            .sort((a, b) => a.set_number - b.set_number)
                            .map((s) => ({
                                id: generateId(),
                                kg: '',
                                reps: s.reps != null ? String(s.reps) : '',
                                completed: false,
                            }))
                        : [{ id: generateId(), kg: '', reps: '', completed: false }];

                    const exType = (exercise as any).exercises?.exercise_type;
                    const muscleLabel = exType
                        ? exType.charAt(0).toUpperCase() + exType.slice(1)
                        : '--';
                    return {
                        id: generateId(),
                        name: exercise.exercise_name ?? '--',
                        muscle: muscleLabel,
                        sets,
                        exerciseId: (exercise as any).exercise_id ?? null,
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

    // Timer logic (pauses when timerPaused)
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(prev => (!timerPaused ? prev + 1 : prev));
        }, 1000);
        return () => clearInterval(timer);
    }, [timerPaused]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleAddExercise = () => {
        if (onAddExercise) {
            onAddExercise((exercise) => {
                const newExercise: Exercise = {
                    id: generateId(),
                    name: exercise.name,
                    muscle: exercise.muscles?.[0] || exercise.exercise_type?.toUpperCase() || exercise.category?.toUpperCase() || '--',
                    sets: [
                        { id: generateId(), kg: '', reps: '', completed: false }
                    ],
                    exerciseId: exercise.id ?? null,
                };
                setExercises(prev => [...prev, newExercise]);
            });
        }
    };

    const handleAddSet = (exerciseId: string) => {
        setExercises(exercises.map(ex => {
            if (ex.id === exerciseId) {
                return {
                    ...ex,
                    sets: [...ex.sets, { id: Date.now().toString(), kg: '', reps: '', completed: false }]
                };
            }
            return ex;
        }));
    };

    const toggleSetComplete = (exerciseId: string, setId: string) => {
        setExercises(exercises.map(ex => {
            if (ex.id === exerciseId) {
                return {
                    ...ex,
                    sets: ex.sets.map(s => s.id === setId ? { ...s, completed: !s.completed } : s)
                };
            }
            return ex;
        }));
    };

    const updateSet = (exerciseId: string, setId: string, field: keyof Set, value: string) => {
        setExercises(exercises.map(ex => {
            if (ex.id === exerciseId) {
                return {
                    ...ex,
                    sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
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
            const duration_minutes = Math.floor(elapsedTime / 60) || null;
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

            for (let i = 0; i < exercises.length; i++) {
                const ex = exercises[i];
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
                    const weight = set.kg ? parseFloat(set.kg) : null;
                    const reps = set.reps ? parseInt(set.reps, 10) : null;
                    if (weight === null && reps === null) continue;
                    const { error: setError } = await supabase
                        .from('workout_session_sets')
                        .insert({
                            workout_session_exercise_id: exRow.id,
                            set_number: s + 1,
                            weight: weight ?? null,
                            reps: Number.isNaN(reps as number) ? null : reps,
                        });
                    if (setError) console.error('Error saving set:', setError);
                }
            }

            queryClient.invalidateQueries({ queryKey: WORKOUT_SESSIONS_KEY });
            queryClient.invalidateQueries({ queryKey: PROGRAM_SCHEDULE_KEY });
            queryClient.invalidateQueries({ queryKey: USER_XP_KEY });
            queryClient.invalidateQueries({ queryKey: USER_STREAKS_KEY });
            queryClient.invalidateQueries({ queryKey: USER_ACHIEVEMENTS_KEY });
            navigation?.goBack();
        } catch (e) {
            console.error('Finish workout error:', e);
            Alert.alert('Error', 'Could not save workout.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <FloatingBackButton onPress={() => navigation?.goBack()} />

            <ScrollView style={styles.content} contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}>

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

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <Pressable
                                style={styles.statItem}
                                onPress={() => setTimerPaused(p => !p)}
                            >
                                {timerPaused ? (
                                    <>
                                        <MaterialCommunityIcons name="play-circle" size={28} color={colors.bodyOrange} />
                                        <Text style={styles.stopResumeLabel}>Resume</Text>
                                    </>
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="pause-circle" size={28} color={colors.bodyOrange} />
                                        <Text style={styles.stopResumeLabel}>Stop</Text>
                                    </>
                                )}
                            </Pressable>
                        </View>

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
                                                    <Text style={styles.exerciseMuscle}>{exercise.muscle}</Text>
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

                                        <View style={styles.setsHeader}>
                                            <Text style={[styles.colHeader, { width: 40 }]}>SET</Text>
                                            <Text style={[styles.colHeader, { flex: 1 }]}>KG</Text>
                                            <Text style={[styles.colHeader, { flex: 1 }]}>REPS</Text>
                                            <View style={{ width: 40 }} />
                                        </View>

                                        <View style={styles.setsList}>
                                            {exercise.sets.map((set, setIndex) => (
                                                <View key={set.id} style={styles.setRow}>
                                                    <Pressable
                                                        ref={(r: any) => { setTagButtonRefs.current[`${exercise.id}-${set.id}`] = r; }}
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

                                                    <View style={[
                                                        styles.inputContainer,
                                                        set.completed && { backgroundColor: 'rgba(45, 255, 143, 0.1)', borderColor: colors.healthGreen, borderWidth: 1 }
                                                    ]}>
                                                        <TextInput
                                                            style={[styles.inputValue, set.completed && { color: colors.healthGreen }]}
                                                            value={set.kg}
                                                            onChangeText={(v) => updateSet(exercise.id, set.id, 'kg', v)}
                                                            keyboardType="numeric"
                                                            placeholder="-"
                                                            placeholderTextColor={colors.textTertiary}
                                                            editable={!set.completed}
                                                        />
                                                    </View>

                                                    <View style={[
                                                        styles.inputContainer,
                                                        set.completed && { backgroundColor: 'rgba(45, 255, 143, 0.1)', borderColor: colors.healthGreen, borderWidth: 1 }
                                                    ]}>
                                                        <TextInput
                                                            style={[styles.inputValue, set.completed && { color: colors.healthGreen }]}
                                                            value={set.reps}
                                                            onChangeText={(v) => updateSet(exercise.id, set.id, 'reps', v)}
                                                            keyboardType="numeric"
                                                            placeholder="-"
                                                            placeholderTextColor={colors.textTertiary}
                                                            editable={!set.completed}
                                                        />
                                                    </View>

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
                                            ))}
                                        </View>

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
                                { text: 'Discard', style: 'destructive', onPress: () => navigation?.goBack() },
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
                            onPress={() => exerciseMenuExerciseId && handleRemoveExercise(exerciseMenuExerciseId)}
                        >
                            <MaterialCommunityIcons name="delete-outline" size={20} color="#DC2626" />
                            <Text style={styles.overlayDeleteText}>Delete</Text>
                        </Pressable>
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
    screenHeading: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 80,
        marginBottom: 24,
        paddingVertical: 0,
        paddingHorizontal: 0,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.xl,
        padding: space.lg,
        alignItems: 'center',
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
    },
    stopResumeLabel: {
        ...typography.sm,
        fontWeight: '700',
        color: colors.bodyOrange,
    },
    statLabel: {
        ...typography.xs,
        color: colors.textTertiary,
        fontWeight: '700',
        letterSpacing: 1,
    },
    statValue: {
        ...typography['2xl'],
        fontWeight: '700',
        color: colors.textPrimary,
        fontVariant: ['tabular-nums'],
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.borderSubtle,
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
    setsHeader: {
        flexDirection: 'row',
        marginBottom: 16,
        paddingHorizontal: 4,
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
