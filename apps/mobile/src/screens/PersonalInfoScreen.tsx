import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    Modal,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { USER_XP_KEY } from '../hooks/useUserXp';
import { USER_STREAKS_KEY } from '../hooks/useUserStreaks';
import { USER_ACHIEVEMENTS_KEY } from '../hooks/useUserAchievements';
import { colors, radius, space, typography } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

// Assuming ScreenHeader doesn't have "Save" button prop, I might need to make a custom header or wrap ScreenHeader.
// For now, I'll build a custom header for this screen as per screenshot.

const GOALS_OPTIONS = [
    'Lose Weight',
    'Build Muscle',
    'Stay Fit',
    'Improve Endurance',
    'Better Sleep',
];

const ACTIVITY_LEVELS = [
    'Sedentary (Office job)',
    'Light (1-2 days/week)',
    'Moderate (3-5 days/week)',
    'Active (Daily exercise)',
    'Athlete (2x per day)',
];

export function PersonalInfoScreen({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient();
    const { profile, loading: profileLoading, updateProfileCache } = useProfile();
    const [saving, setSaving] = useState(false);

    // Form State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState<Date | null>(null);
    const [showDobPicker, setShowDobPicker] = useState(false);
    const [pendingDob, setPendingDob] = useState<Date>(new Date(2000, 0, 1));
    const [gender, setGender] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [activityLevel, setActivityLevel] = useState('');
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

    const userId = profile?.id ?? null;

    // Pre-fill form from cached profile (no Supabase fetch)
    useEffect(() => {
        if (!profile) return;
        setFullName(profile.full_name || '');
        setEmail(profile.email || '');
        setDob(profile.date_of_birth ? new Date(profile.date_of_birth) : null);
        setGender(profile.gender || '');
        setHeight(profile.height_cm != null ? String(profile.height_cm) : '');
        setWeight(profile.latest_weight_kg != null ? String(profile.latest_weight_kg) : '');
        setActivityLevel(profile.activity_level || '');
        setSelectedGoals(profile.goals ?? []);
    }, [profile]);

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);
        try {
            // 1. Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    date_of_birth: dob ? dob.toISOString().split('T')[0] : null,
                    gender: gender,
                })
                .eq('id', userId);

            if (profileError) throw profileError;

            // 2. Update Health Profile (Upsert)
            const { error: healthError } = await supabase
                .from('user_health_profile')
                .upsert({
                    user_id: userId,
                    height_cm: height ? parseFloat(height) : null,
                    activity_level: activityLevel,
                    goals: selectedGoals,
                    updated_at: new Date().toISOString(),
                }); // Need to make sure conflicting key is handled, usually PK user_id.

            if (healthError) throw healthError;

            // 3. Update Weight (Insert new log if changed? Or update latest? For "Profile" screen, maybe just update latest if it was today, else insert new. Or just always insert new log for tracking history.)
            // Let's check if we have a weight value.
            if (weight) {
                const weightNum = parseFloat(weight);
                // Simple logic: Insert new log.
                const { error: weightError } = await supabase
                    .from('body_weight_logs')
                    .insert({
                        user_id: userId,
                        weight_kg: weightNum,
                        recorded_at: new Date().toISOString(),
                    });
                if (weightError) throw weightError;
            }

            const weightNum = weight ? parseFloat(weight) : null;
            updateProfileCache({
                full_name: fullName,
                date_of_birth: dob ? dob.toISOString().split('T')[0] : null,
                gender: gender || null,
                height_cm: height ? parseFloat(height) : null,
                activity_level: activityLevel || null,
                goals: selectedGoals,
                latest_weight_kg: weightNum,
            });

            queryClient.invalidateQueries({ queryKey: USER_XP_KEY });
            queryClient.invalidateQueries({ queryKey: USER_STREAKS_KEY });
            queryClient.invalidateQueries({ queryKey: USER_ACHIEVEMENTS_KEY });

            Alert.alert('Success', 'Profile updated successfully');
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleGoal = (goal: string) => {
        if (selectedGoals.includes(goal)) {
            setSelectedGoals(selectedGoals.filter(g => g !== goal));
        } else {
            setSelectedGoals([...selectedGoals, goal]);
        }
    };

    const onDateChange = (_event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDobPicker(false);
            if (selectedDate) setDob(selectedDate);
            return;
        }
        if (selectedDate) setPendingDob(selectedDate);
    };

    const openDobPicker = () => {
        setPendingDob(dob || new Date(2000, 0, 1));
        setShowDobPicker(true);
    };

    const closeDobPickerIOS = () => {
        setDob(pendingDob);
        setShowDobPicker(false);
    };

    if (profileLoading || !profile) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primaryViolet} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.bgMidnight, '#1A1725', '#2D2640']}
                style={StyleSheet.absoluteFillObject}
            />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Personal Information</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
                    <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarPlaceholder}>
                        {/* Add Image if available, else initials */}
                        <Text style={styles.avatarInitials}>
                            {fullName ? fullName.split(' ').slice(0, 2).map(n => n[0]).join('') : 'U'}
                        </Text>
                        <View style={styles.editIconParams}>
                            <MaterialCommunityIcons name="pencil" size={14} color={colors.textPrimary} />
                        </View>
                    </View>
                </View>

                {/* Form Fields */}
                <View style={styles.section}>
                    <Text style={styles.label}>FULL NAME</Text>
                    <TextInput
                        style={styles.input}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Enter full name"
                        placeholderTextColor={colors.textTertiary}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>EMAIL ADDRESS</Text>
                    <TextInput
                        style={[styles.input, styles.disabledInput]}
                        value={email}
                        editable={false} // Email typically managed via auth
                        placeholderTextColor={colors.textTertiary}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.section, { flex: 1, marginRight: space.sm }]}>
                        <Text style={styles.label}>DATE OF BIRTH</Text>
                        <TouchableOpacity onPress={openDobPicker} style={styles.input}>
                            <Text style={{ color: dob ? colors.textPrimary : colors.textTertiary }}>
                                {dob ? dob.toLocaleDateString() : 'YYYY-MM-DD'}
                            </Text>
                        </TouchableOpacity>
                        {Platform.OS === 'ios' ? (
                            <Modal visible={showDobPicker} transparent animationType="slide">
                                <Pressable style={styles.dobPickerOverlay} onPress={closeDobPickerIOS} />
                                <View style={styles.dobPickerContainer}>
                                    <View style={styles.dobPickerHeader}>
                                        <Pressable onPress={closeDobPickerIOS} hitSlop={16}>
                                            <Text style={styles.dobPickerDone}>Done</Text>
                                        </Pressable>
                                    </View>
                                    <DateTimePicker
                                        value={pendingDob}
                                        mode="date"
                                        display="spinner"
                                        onChange={onDateChange}
                                        maximumDate={new Date()}
                                    />
                                </View>
                            </Modal>
                        ) : showDobPicker ? (
                            <DateTimePicker
                                value={dob || new Date(2000, 0, 1)}
                                mode="date"
                                display="default"
                                onChange={onDateChange}
                                maximumDate={new Date()}
                            />
                        ) : null}
                    </View>
                    <View style={[styles.section, { flex: 1 }]}>
                        <Text style={styles.label}>GENDER</Text>
                        <TextInput
                            style={styles.input}
                            value={gender}
                            onChangeText={setGender}
                            placeholder="Male/Female"
                            placeholderTextColor={colors.textTertiary}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.section, { flex: 1, marginRight: space.sm }]}>
                        <Text style={styles.label}>HEIGHT</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.flexInput}
                                value={height}
                                onChangeText={setHeight}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={colors.textTertiary}
                            />
                            <Text style={styles.unitText}>cm</Text>
                        </View>
                    </View>
                    <View style={[styles.section, { flex: 1 }]}>
                        <Text style={styles.label}>WEIGHT</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.flexInput}
                                value={weight}
                                onChangeText={setWeight}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={colors.textTertiary}
                            />
                            <Text style={styles.unitText}>kg</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>ACTIVITY LEVEL</Text>
                    {/* Simplified dropdown/picker for now */}
                    <TextInput
                        style={styles.input}
                        value={activityLevel}
                        onChangeText={setActivityLevel}
                        placeholder="Select Activity Level"
                        placeholderTextColor={colors.textTertiary}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>YOUR GOALS</Text>
                    <View style={styles.goalsContainer}>
                        {GOALS_OPTIONS.map((goal) => {
                            const isSelected = selectedGoals.includes(goal);
                            return (
                                <TouchableOpacity
                                    key={goal}
                                    style={[styles.goalChip, isSelected && styles.goalChipSelected]}
                                    onPress={() => toggleGoal(goal)}
                                >
                                    <Text style={[styles.goalText, isSelected && styles.goalTextSelected]}>
                                        {goal}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

            </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: space.md,
        paddingTop: Platform.OS === 'android' ? 40 : 60,
        paddingBottom: space.md,
        backgroundColor: colors.bgMidnight,
    },
    backButton: {
        padding: space.xs,
    },
    headerTitle: {
        ...typography.lg,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    saveButton: {
        padding: space.xs,
    },
    saveButtonText: {
        ...typography.base,
        color: colors.primaryViolet,
        fontWeight: '600',
    },
    scrollContent: {
        padding: space.lg,
        paddingBottom: 100, // extra space
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: space.xl,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFE0B2', // Light orange/skin tone placeholder as per screenshot
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#3E3E3E',
    },
    avatarInitials: {
        ...typography['3xl'],
        color: '#5D4037',
        fontWeight: '600',
    },
    editIconParams: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primaryViolet,
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.bgMidnight,
    },
    section: {
        marginBottom: space.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: space.md,
    },
    label: {
        ...typography.xs,
        color: colors.textTertiary,
        fontWeight: '700',
        marginBottom: space.xs,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.xl,
        paddingHorizontal: space.md,
        paddingVertical: space.md,
        color: colors.textPrimary,
        fontSize: 14,
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    disabledInput: {
        opacity: 0.7,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.xl,
        paddingHorizontal: space.md,
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    flexInput: {
        flex: 1,
        paddingVertical: space.md,
        color: colors.textPrimary,
        fontSize: 14,
    },
    unitText: {
        color: colors.textTertiary,
        marginLeft: space.xs,
        fontSize: 14,
    },
    goalsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: space.xs,
    },
    goalChip: {
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        borderRadius: radius.full,
        backgroundColor: colors.bgCharcoal,
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    goalChipSelected: {
        backgroundColor: colors.primaryViolet,
        borderColor: colors.primaryViolet,
    },
    goalText: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    goalTextSelected: {
        color: colors.textPrimary,
    },
    dobPickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    dobPickerContainer: {
        backgroundColor: colors.bgMidnight,
        borderTopLeftRadius: radius['2xl'],
        borderTopRightRadius: radius['2xl'],
        paddingBottom: space['2xl'],
    },
    dobPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderDefault,
    },
    dobPickerDone: {
        ...typography.base,
        fontWeight: '600',
        color: colors.primaryViolet,
    },
});
