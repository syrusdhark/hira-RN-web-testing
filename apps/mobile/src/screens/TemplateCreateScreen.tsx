import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    ScrollView,
    Platform,
    StatusBar,
    KeyboardAvoidingView,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { useCreateWorkoutTemplate, useUpdateWorkoutTemplate, useDeleteWorkoutTemplate, useWorkoutTemplate } from '../hooks/useWorkoutTemplates';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';

type TemplateCreateScreenProps = {
    navigation?: { goBack: () => void };
    onStartSession?: () => void;
    onAddExercise?: (callback: (exercise: any) => void) => void;
    templateId?: string | null; // For editing mode
};

interface Set {
    id: string;
    kg: string;
    reps: string;
}

interface Exercise {
    id: string;
    originalId: string; // Real DB ID
    name: string;
    muscle: string;
    sets: Set[];
}

export function TemplateCreateScreen({ navigation, onStartSession, onAddExercise, templateId }: TemplateCreateScreenProps) {
    const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [activeMenuExerciseId, setActiveMenuExerciseId] = useState<string | null>(null);

    const isEditMode = !!templateId;
    const { data: templateData, isLoading: isTemplateLoading } = useWorkoutTemplate(templateId || null);
    const createTemplate = useCreateWorkoutTemplate();
    const updateTemplate = useUpdateWorkoutTemplate();
    const deleteTemplate = useDeleteWorkoutTemplate();

    // Load template data when editing
    React.useEffect(() => {
        if (templateData && !isLoaded) {
            setTitle(templateData.title || '');
            setDescription(templateData.description || '');

            // Transform template exercises to local format
            const loadedExercises: Exercise[] = (templateData.workout_template_exercises || []).map((ex: any) => ({
                id: ex.id,
                originalId: ex.exercise_id || ex.id,
                name: ex.exercise_name,
                muscle: 'GENERAL', // We don't store this, could fetch from exercises table
                sets: (ex.workout_template_sets || []).map((set: any) => ({
                    id: set.id,
                    kg: '', // We don't store weight in template
                    reps: set.reps?.toString() || '',
                }))
            }));

            setExercises(loadedExercises);
            setIsLoaded(true);
        }
    }, [templateData, isLoaded]);

    if (isEditMode && isTemplateLoading && !isLoaded) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.bodyOrange} />
                <Text style={{ ...typography.base, color: colors.textSecondary, marginTop: space.md }}>
                    Loading workout...
                </Text>
            </View>
        );
    }

    if (isEditMode && !isTemplateLoading && !templateData) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: space.xl }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color={'#EF4444'} />
                <Text style={{ ...typography['2xl'], color: colors.textPrimary, marginVertical: space.md, textAlign: 'center' }}>
                    Workout not found
                </Text>
                <Text style={{ ...typography.base, color: colors.textSecondary, textAlign: 'center', marginBottom: space.xl }}>
                    This workout may have been deleted or doesn't exist.
                </Text>
                <Pressable style={styles.doneButton} onPress={() => navigation?.goBack()}>
                    <Text style={styles.doneButtonText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }



    const handleRemoveExercise = (exerciseId: string) => {
        setExercises(exercises.filter(ex => ex.id !== exerciseId));
        setActiveMenuExerciseId(null);
    };

    const handleAddExercise = () => {
        if (onAddExercise) {
            onAddExercise((exercise) => {
                const newExercise: Exercise = {
                    id: Math.random().toString(),
                    originalId: exercise.id,
                    name: exercise.name,
                    muscle: exercise.muscles?.[0] || exercise.category?.toUpperCase() || 'UNKNOWN',
                    sets: [
                        { id: Math.random().toString(), kg: '', reps: '' }
                    ]
                };
                setExercises(prev => [...prev, newExercise]);
            });
        } else {
            // Mock adding an exercise
            const newExercise: Exercise = {
                id: Date.now().toString(),
                originalId: 'mock-id',
                name: 'Barbell Squat',
                muscle: 'QUADRICEPS',
                sets: [
                    { id: '1', kg: '', reps: '' },
                    { id: '2', kg: '', reps: '' }
                ]
            };
            setExercises([...exercises, newExercise]);
        }
    };

    const handleAddSet = (exerciseId: string) => {
        setExercises(exercises.map(ex => {
            if (ex.id === exerciseId) {
                return {
                    ...ex,
                    sets: [...ex.sets, { id: Date.now().toString(), kg: '', reps: '' }]
                };
            }
            return ex;
        }));
    };

    const handleRemoveSet = (exerciseId: string, setId: string) => {
        setExercises(exercises.map(ex => {
            if (ex.id === exerciseId) {
                return {
                    ...ex,
                    sets: ex.sets.filter(s => s.id !== setId)
                };
            }
            return ex;
        }));
    };

    const handleUpdateSet = (exerciseId: string, setId: string, field: keyof Set, value: string) => {
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

    const renderHeader = () => (
        <View style={styles.headerInputs}>
            <View style={styles.titleRow}>
                <TextInput
                    style={styles.titleInput}
                    placeholder="Workout name"
                    placeholderTextColor={colors.textTertiary}
                    value={title}
                    onChangeText={setTitle}
                />
                <MaterialCommunityIcons name="pencil" size={16} color={colors.textTertiary} />
            </View>

            <TextInput
                style={styles.descriptionInput}
                placeholder="Add notes about this workout..."
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
            />

            {/* Exercises Header Content */}
            <View style={[styles.sectionHeader, { marginTop: space.xl }]}>
                <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>Exercises</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{exercises.length} ITEMS</Text>
                    </View>
                </View>
                <Text style={styles.reorderText}>REORDER</Text>
            </View>
        </View>
    );

    const renderFooter = () => (
        <View style={{ paddingBottom: 120 }}>
            {/* Add Exercise Button */}
            <Pressable
                style={styles.addExerciseButton}
                onPress={handleAddExercise}
            >
                <View style={styles.addIconCircle}>
                    <MaterialCommunityIcons name="plus" size={24} color={colors.textPrimary} />
                </View>
                <Text style={styles.addExerciseText}>Add Exercise</Text>
            </Pressable>
        </View>
    );

    const renderExerciseItem = ({ item: exercise, drag, isActive }: RenderItemParams<Exercise>) => {
        return (
            <ScaleDecorator>
                <TouchableOpacity
                    onLongPress={drag}
                    disabled={isActive}
                    activeOpacity={1}
                    style={{ marginBottom: space.md }}
                >
                    <View style={[
                        styles.exerciseCard,
                        isActive && { borderColor: colors.actionAmber, borderWidth: 1 }
                    ]}>
                        <View style={styles.exerciseHeader}>
                            <View style={styles.exerciseIcon}>
                                <MaterialCommunityIcons name="dumbbell" size={20} color={colors.bodyOrange} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.exerciseName}>{exercise.name}</Text>
                                <Text style={styles.exerciseMuscle}>{exercise.muscle}</Text>
                            </View>
                            <View style={{ position: 'relative', zIndex: 10 }}>
                                <Pressable
                                    hitSlop={10}
                                    onPress={() => setActiveMenuExerciseId(activeMenuExerciseId === exercise.id ? null : exercise.id)}
                                >
                                    <MaterialCommunityIcons name="dots-horizontal" size={24} color={colors.textTertiary} />
                                </Pressable>
                                {activeMenuExerciseId === exercise.id && (
                                    <View style={styles.menuOverlay}>
                                        <Pressable
                                            style={styles.menuItem}
                                            onPress={() => handleRemoveExercise(exercise.id)}
                                        >
                                            <Text style={styles.menuDeleteText}>Delete</Text>
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.setsHeader}>
                            <Text style={[styles.colHeader, { width: 40 }]}>SET</Text>
                            <Text style={[styles.colHeader, { flex: 1 }]}>KG</Text>
                            <Text style={[styles.colHeader, { flex: 1 }]}>REPS</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        {exercise.sets.map((set, setIndex) => (
                            <View key={set.id} style={styles.setRow}>
                                <View style={styles.setNumberBadge}>
                                    <Text style={styles.setNumberText}>{setIndex + 1}</Text>
                                </View>

                                <TextInput
                                    style={styles.setInput}
                                    value={set.kg}
                                    onChangeText={(v) => handleUpdateSet(exercise.id, set.id, 'kg', v)}
                                    keyboardType="numeric"
                                    placeholder="-"
                                    placeholderTextColor={colors.textTertiary}
                                />

                                <TextInput
                                    style={styles.setInput}
                                    value={set.reps}
                                    onChangeText={(v) => handleUpdateSet(exercise.id, set.id, 'reps', v)}
                                    keyboardType="numeric"
                                    placeholder="-"
                                    placeholderTextColor={colors.textTertiary}
                                />

                                <Pressable
                                    style={styles.deleteSetBtn}
                                    onPress={() => handleRemoveSet(exercise.id, set.id)}
                                >
                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.textTertiary} />
                                </Pressable>
                            </View>
                        ))}

                        <Pressable
                            style={styles.addSetButton}
                            onPress={() => handleAddSet(exercise.id)}
                        >
                            <MaterialCommunityIcons name="plus" size={16} color={colors.bodyOrange} />
                            <Text style={styles.addSetText}>ADD SET</Text>
                        </Pressable>
                    </View>
                </TouchableOpacity>
            </ScaleDecorator>
        );
    };

    // Close menu when clicking outside
    const handleOutsidePress = () => {
        if (activeMenuExerciseId) {
            setActiveMenuExerciseId(null);
        }
    };

    return (
        <View style={styles.container}>
            {/* Transparent Overlay for closing menu */}
            {activeMenuExerciseId && (
                <Pressable
                    style={[StyleSheet.absoluteFill, { zIndex: 50 }]}
                    onPress={() => setActiveMenuExerciseId(null)}
                />
            )}

            <FloatingBackButton onPress={() => navigation?.goBack()} />

            <View style={[styles.header, { paddingTop }]}>
                <View style={{ flex: 1 }} />
                <Pressable
                    style={[styles.doneButton]}
                    onPress={() => {
                        if (!title.trim()) {
                            Alert.alert('Error', 'Please enter a workout name');
                            return;
                        }

                        const mutation = isEditMode ? updateTemplate : createTemplate;
                        const payload: any = {
                            title,
                            description,
                            exercises
                        };

                        if (isEditMode) {
                            payload.templateId = templateId;
                        }

                        mutation.mutate(payload, {
                            onSuccess: () => {
                                navigation?.goBack();
                            },
                            onError: (error) => {
                                Alert.alert('Save Failed', error.message || 'Could not save workout. Please try again.');
                            }
                        });
                    }}
                    disabled={createTemplate.isPending || updateTemplate.isPending}
                >
                    <Text style={styles.doneButtonText}>
                        {(createTemplate.isPending || updateTemplate.isPending) ? 'Saving...' : 'Save'}
                    </Text>
                </Pressable>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <DraggableFlatList
                    data={exercises}
                    onDragEnd={({ data }) => setExercises(data)}
                    keyExtractor={(item) => item.id}
                    renderItem={renderExerciseItem}
                    ListHeaderComponent={renderHeader}
                    ListFooterComponent={renderFooter}
                    contentContainerStyle={styles.content}
                />
            </KeyboardAvoidingView>

            <View style={styles.footer}>
                <View style={styles.footerRow}>
                    {isEditMode && (
                        <Pressable
                            style={styles.footerDeleteButton}
                            onPress={() => {
                                Alert.alert(
                                    'Delete workout',
                                    'Are you sure you want to delete this workout? This cannot be undone.',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Delete',
                                            style: 'destructive',
                                            onPress: () => {
                                                deleteTemplate.mutate(templateId!, {
                                                    onSuccess: () => {
                                                        navigation?.goBack();
                                                    },
                                                    onError: (error) => {
                                                        Alert.alert('Delete Failed', error.message);
                                                    }
                                                });
                                            }
                                        }
                                    ]
                                );
                            }}
                        >
                            <MaterialCommunityIcons name="delete-outline" size={24} color={colors.textSecondary} />
                        </Pressable>
                    )}
                    <Pressable
                        style={[styles.startSessionButton, { flex: 1 }]}
                        onPress={() => onStartSession?.()}
                    >
                        <MaterialCommunityIcons name="play" size={24} color={colors.textPrimary} />
                        <Text style={styles.startSessionText}>Start Session</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgMidnight,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.md,
        paddingBottom: space.md,
    },
    headerSpacer: { width: 40 },
    doneButton: {
        paddingHorizontal: space.sm,
        paddingVertical: space.sm,
    },
    doneButtonText: {
        ...typography.base,
        fontWeight: '600',
        color: colors.bodyOrange,
    },
    content: {
        padding: space.md,
        paddingBottom: 120,
    },
    headerInputs: {
        marginTop: space.lg,
        marginBottom: space['2xl'],
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: space.sm,
    },
    titleInput: {
        ...typography['2xl'],
        fontWeight: 'bold',
        color: colors.textPrimary,
        flex: 1,
        marginRight: space.sm,
    },
    descriptionInput: {
        ...typography.base,
        color: colors.textSecondary,
        minHeight: 60,
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
        gap: space.md,
    },
    exerciseCard: {
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.xl,
        padding: space.md,
        borderLeftWidth: 4,
        borderLeftColor: colors.bodyOrange,
    },
    exerciseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: space.lg,
    },
    exerciseIcon: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        backgroundColor: '#1E1E1E',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: space.sm,
    },
    exerciseName: {
        ...typography.base,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    exerciseMuscle: {
        ...typography.xs,
        color: colors.textTertiary,
        textTransform: 'uppercase',
    },
    setsHeader: {
        flexDirection: 'row',
        marginBottom: space.sm,
        paddingHorizontal: space.xs,
        justifyContent: 'space-between'
    },
    colHeader: {
        ...typography.xs,
        fontWeight: '700',
        color: colors.textTertiary,
        textAlign: 'center',
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: space.sm,
        gap: space.sm,
    },
    setNumberBadge: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    setNumberText: {
        ...typography.base,
        fontWeight: '700',
        color: colors.textTertiary,
    },
    setInput: {
        flex: 1,
        height: 40,
        backgroundColor: colors.bgElevated,
        borderRadius: radius.lg,
        textAlign: 'center',
        color: colors.textPrimary,
        ...typography.base,
        fontWeight: '600',
    },
    deleteSetBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addSetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: space.sm,
        backgroundColor: '#1E1E1E',
        borderRadius: radius.lg,
        marginTop: space.xs,
        gap: space.xs,
    },
    addSetText: {
        ...typography.xs,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: 0.5,
    },
    addExerciseButton: {
        marginTop: space.lg,
        height: 80, // Taller button
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addIconCircle: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: space.xs,
    },
    addExerciseText: {
        ...typography.base,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: space.lg,
        backgroundColor: colors.bgMidnight,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
    },
    footerDeleteButton: {
        width: 56,
        height: 56,
        borderRadius: radius.xl,
        backgroundColor: colors.bgCharcoal,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    startSessionButton: {
        backgroundColor: colors.bodyOrange,
        height: 56,
        borderRadius: radius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.sm,
        shadowColor: colors.bodyOrange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    startSessionText: {
        ...typography.lg,
        fontWeight: 'bold',
        color: colors.textPrimary,
        textTransform: 'uppercase',

    },
    menuOverlay: {
        position: 'absolute',
        top: 30,
        right: 0,
        backgroundColor: colors.bgElevated,
        borderRadius: radius.md,
        padding: space.xs,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        minWidth: 100,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        zIndex: 100,
    },
    menuItem: {
        paddingVertical: space.xs,
        paddingHorizontal: space.sm,
    },
    menuDeleteText: {
        ...typography.sm,
        fontWeight: '600',
        color: '#FF453A',
    },
});
