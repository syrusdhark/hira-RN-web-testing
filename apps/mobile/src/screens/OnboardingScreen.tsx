import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius, space, typography } from '../theme';
import { EnvironmentContainer } from '../components/EnvironmentContainer';
import { supabase } from '../lib/supabase';

interface OnboardingScreenProps {
    onComplete: () => void;
}

const HEIGHT_CM_MIN = 100;
const HEIGHT_CM_MAX = 250;
const WEIGHT_KG_MIN = 30;
const WEIGHT_KG_MAX = 200;
const DEFAULT_HEIGHT_CM = 170;
const DEFAULT_WEIGHT_KG = 70;

function cmToIn(cm: number): number {
    return Math.round(cm / 2.54);
}
function inToCm(inVal: number): number {
    return inVal * 2.54;
}
function kgToLbs(kg: number): number {
    return Math.round(kg * 2.20462 * 10) / 10;
}
function lbsToKg(lbs: number): number {
    return lbs / 2.20462;
}

const GENDER_OPTIONS: { value: 'Female' | 'Male' | 'Other'; label: string; icon: string }[] = [
    { value: 'Female', label: 'Female', icon: 'gender-female' },
    { value: 'Male', label: 'Male', icon: 'gender-male' },
    { value: 'Other', label: 'Other', icon: 'gender-non-binary' },
];

function genderToDb(gender: string): string {
    if (gender === 'Female') return 'female';
    if (gender === 'Male') return 'male';
    if (gender === 'Other') return 'non_binary';
    return gender.toLowerCase();
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [name, setName] = useState('');
    const [dob, setDob] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState<'Female' | 'Male' | 'Other' | ''>('');
    const [heightCm, setHeightCm] = useState(DEFAULT_HEIGHT_CM);
    const [weightKg, setWeightKg] = useState(DEFAULT_WEIGHT_KG);
    const [heightUnitCm, setHeightUnitCm] = useState(true);
    const [weightUnitKg, setWeightUnitKg] = useState(true);
    const [heightInputValue, setHeightInputValue] = useState(String(DEFAULT_HEIGHT_CM));
    const [weightInputValue, setWeightInputValue] = useState(String(DEFAULT_WEIGHT_KG));
    const [loading, setLoading] = useState(false);

    const onDateChange = (_event: unknown, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) setDob(selectedDate);
    };

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const parseHeightInput = (): { cm: number; display: string } => {
        const trimmed = heightInputValue.trim();
        if (trimmed === '') {
            return { cm: DEFAULT_HEIGHT_CM, display: String(DEFAULT_HEIGHT_CM) };
        }
        const parsed = parseFloat(trimmed.replace(/[^0-9.]/g, ''));
        if (Number.isNaN(parsed)) {
            return {
                cm: DEFAULT_HEIGHT_CM,
                display: heightUnitCm ? String(DEFAULT_HEIGHT_CM) : String(cmToIn(DEFAULT_HEIGHT_CM)),
            };
        }
        const cm = heightUnitCm ? parsed : inToCm(parsed);
        const clamped = Math.round(Math.max(HEIGHT_CM_MIN, Math.min(HEIGHT_CM_MAX, cm)));
        return { cm: clamped, display: heightUnitCm ? String(clamped) : String(cmToIn(clamped)) };
    };

    const parseWeightInput = (): { kg: number; display: string } => {
        const trimmed = weightInputValue.trim();
        if (trimmed === '') {
            return { kg: DEFAULT_WEIGHT_KG, display: String(DEFAULT_WEIGHT_KG) };
        }
        const parsed = parseFloat(trimmed.replace(/[^0-9.]/g, ''));
        if (Number.isNaN(parsed)) {
            return {
                kg: DEFAULT_WEIGHT_KG,
                display: weightUnitKg ? String(DEFAULT_WEIGHT_KG) : String(kgToLbs(DEFAULT_WEIGHT_KG)),
            };
        }
        const kg = weightUnitKg ? parsed : lbsToKg(parsed);
        const clamped = Math.round(Math.max(WEIGHT_KG_MIN, Math.min(WEIGHT_KG_MAX, kg)) * 10) / 10;
        const display = weightUnitKg ? String(clamped) : (clamped % 1 === 0 ? String(Math.round(kgToLbs(clamped))) : kgToLbs(clamped).toFixed(1));
        return { kg: clamped, display };
    };

    const commitHeightFromInput = () => {
        const { cm, display } = parseHeightInput();
        setHeightCm(cm);
        setHeightInputValue(display);
    };

    const commitWeightFromInput = () => {
        const { kg, display } = parseWeightInput();
        setWeightKg(kg);
        setWeightInputValue(display);
    };

    const handleSubmit = async () => {
        const { cm: committedHeight, display: heightDisplay } = parseHeightInput();
        const { kg: committedWeight, display: weightDisplay } = parseWeightInput();
        setHeightCm(committedHeight);
        setHeightInputValue(heightDisplay);
        setWeightKg(committedWeight);
        setWeightInputValue(weightDisplay);

        if (!name.trim()) {
            Alert.alert('Missing Information', 'Please enter your name.');
            return;
        }
        if (!dob) {
            Alert.alert('Missing Information', 'Please select your date of birth.');
            return;
        }
        if (!gender) {
            Alert.alert('Missing Information', 'Please select your gender.');
            return;
        }
        if (committedHeight < HEIGHT_CM_MIN || committedHeight > HEIGHT_CM_MAX) {
            Alert.alert('Invalid Height', `Please set height between ${HEIGHT_CM_MIN} and ${HEIGHT_CM_MAX} cm.`);
            return;
        }
        if (committedWeight < WEIGHT_KG_MIN || committedWeight > WEIGHT_KG_MAX) {
            Alert.alert('Invalid Weight', `Please set weight between ${WEIGHT_KG_MIN} and ${WEIGHT_KG_MAX} kg.`);
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');
            const userId = user.id;

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: name.trim(),
                    gender: genderToDb(gender),
                    date_of_birth: dob.toISOString().split('T')[0],
                    updated_at: new Date().toISOString(),
                });
            if (profileError) {
                console.error('Profile Error:', profileError);
                throw new Error('Failed to save profile data.');
            }

            const { error: weightError } = await supabase
                .from('body_weight_logs')
                .insert({
                    user_id: userId,
                    weight_kg: committedWeight,
                    source: 'manual',
                });
            if (weightError) {
                console.error('Weight Error:', weightError);
                throw new Error('Failed to save weight log.');
            }

            const { error: healthError } = await supabase
                .from('user_health_profile')
                .upsert({
                    user_id: userId,
                    height_cm: committedHeight,
                    updated_at: new Date().toISOString(),
                });
            if (healthError) {
                console.error('Health Profile Error:', healthError);
                throw new Error('Failed to save health profile.');
            }

            onComplete();
        } catch (error: unknown) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <>
            <Text style={styles.title}>What's your name?</Text>
            <Text style={styles.subtitle}>Let's get to know you better.</Text>
            <View style={styles.formSection}>
                <Text style={styles.label}>NAME</Text>
                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="account" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Your Name"
                        placeholderTextColor={colors.textTertiary}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                </View>
            </View>
        </>
    );

    const renderStep2 = () => (
        <>
            <Text style={styles.title}>Tell us about you</Text>
            <Text style={styles.subtitle}>This helps us personalize your journey.</Text>
            <View style={styles.formSection}>
                <Text style={styles.label}>DATE OF BIRTH</Text>
                <Pressable style={styles.inputContainer} onPress={() => setShowDatePicker(true)}>
                    <Text style={[styles.input, { color: dob ? colors.textPrimary : colors.textTertiary, flex: 1 }]}>
                        {dob
                            ? `${dob.getDate().toString().padStart(2, '0')} / ${(dob.getMonth() + 1).toString().padStart(2, '0')} / ${dob.getFullYear()}`
                            : 'DD / MM / YYYY'}
                    </Text>
                    <MaterialCommunityIcons name="calendar" size={20} color={colors.textTertiary} />
                </Pressable>
                {showDatePicker && (
                    <DateTimePicker
                        value={dob || new Date()}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        maximumDate={new Date()}
                    />
                )}

                <Text style={styles.label}>GENDER</Text>
                <View style={styles.genderList}>
                    {GENDER_OPTIONS.map((opt) => {
                        const isSelected = gender === opt.value;
                        return (
                            <Pressable
                                key={opt.value}
                                style={[styles.genderCard, isSelected && styles.genderCardSelected]}
                                onPress={() => setGender(opt.value)}
                            >
                                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]} />
                                <Text style={[styles.genderLabel, isSelected && styles.genderLabelSelected]}>
                                    {opt.label}
                                </Text>
                                <MaterialCommunityIcons
                                    name={opt.icon as 'gender-female' | 'gender-male' | 'gender-non-binary'}
                                    size={24}
                                    color={isSelected ? colors.bodyOrange : colors.textTertiary}
                                />
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </>
    );

    const onHeightUnitToggle = (v: boolean) => {
        const newUnit = !v;
        setHeightUnitCm(newUnit);
        setHeightInputValue(newUnit ? String(heightCm) : String(cmToIn(heightCm)));
    };

    const onWeightUnitToggle = (v: boolean) => {
        const newUnit = !v;
        setWeightUnitKg(newUnit);
        const lbs = kgToLbs(weightKg);
        setWeightInputValue(newUnit ? String(weightKg) : (lbs % 1 === 0 ? String(Math.round(lbs)) : lbs.toFixed(1)));
    };

    const renderStep3 = () => (
        <>
            <Text style={styles.title}>
                Your <Text style={{ color: colors.textPrimary }}>metrics</Text>
            </Text>
            <Text style={styles.subtitle}>These are key for calculating your needs.</Text>
            <View style={styles.formSection}>
                <View style={styles.metricRow}>
                    <Text style={styles.label}>HEIGHT</Text>
                    <View style={styles.unitToggleRow}>
                        <Text style={styles.unitToggleLabel}>cm</Text>
                        <Switch
                            value={!heightUnitCm}
                            onValueChange={onHeightUnitToggle}
                            trackColor={{ false: colors.borderDefault, true: colors.primaryViolet }}
                            thumbColor={colors.textPrimary}
                        />
                        <Text style={styles.unitToggleLabel}>in</Text>
                    </View>
                </View>
                <View style={styles.metricInputRow}>
                    <TextInput
                        style={styles.metricInput}
                        value={heightInputValue}
                        onChangeText={setHeightInputValue}
                        onBlur={commitHeightFromInput}
                        placeholder={heightUnitCm ? '170' : '67'}
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="decimal-pad"
                    />
                    <Text style={styles.metricUnitLabel}> {heightUnitCm ? 'cm' : 'in'}</Text>
                </View>

                <View style={styles.metricRow}>
                    <Text style={styles.label}>WEIGHT</Text>
                    <View style={styles.unitToggleRow}>
                        <Text style={styles.unitToggleLabel}>kg</Text>
                        <Switch
                            value={!weightUnitKg}
                            onValueChange={onWeightUnitToggle}
                            trackColor={{ false: colors.borderDefault, true: colors.primaryViolet }}
                            thumbColor={colors.textPrimary}
                        />
                        <Text style={styles.unitToggleLabel}>lbs</Text>
                    </View>
                </View>
                <View style={styles.metricInputRow}>
                    <TextInput
                        style={styles.metricInput}
                        value={weightInputValue}
                        onChangeText={setWeightInputValue}
                        onBlur={commitWeightFromInput}
                        placeholder={weightUnitKg ? '70' : '154'}
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="decimal-pad"
                    />
                    <Text style={styles.metricUnitLabel}> {weightUnitKg ? 'kg' : 'lbs'}</Text>
                </View>

                <Text style={styles.settingsHint}>You can always change these in settings.</Text>
            </View>
        </>
    );

    const renderStep4 = () => (
        <>
            <Text style={styles.title}>You're all set</Text>
            <Text style={styles.subtitle}>Tap below to start your personalized experience.</Text>
        </>
    );

    const renderContent = () => {
        switch (currentStep) {
            case 1:
                return renderStep1();
            case 2:
                return renderStep2();
            case 3:
                return renderStep3();
            case 4:
                return renderStep4();
            default:
                return null;
        }
    };

    const isStep4 = currentStep === 4;
    const onPrimaryPress = isStep4 ? handleSubmit : handleNext;

    return (
        <EnvironmentContainer>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={handleBack} disabled={currentStep === 1}>
                        <MaterialCommunityIcons
                            name="arrow-left"
                            size={24}
                            color={currentStep === 1 ? colors.textTertiary : colors.textSecondary}
                        />
                    </Pressable>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {renderContent()}

                    <Pressable
                        onPress={onPrimaryPress}
                        disabled={loading}
                        style={styles.submitBtnContainer}
                    >
                        <LinearGradient
                            colors={[colors.primaryViolet, colors.bodyOrange]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text style={styles.submitButtonText}>
                                        {isStep4 ? 'Get started' : 'Continue'}
                                    </Text>
                                    <MaterialCommunityIcons name="arrow-right" size={24} color="white" />
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </EnvironmentContainer>
    );
}

const styles = StyleSheet.create({
    keyboardView: { flex: 1 },
    scrollContent: {
        paddingHorizontal: space.md,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: space.lg,
        marginTop: space.md,
    },
    backButton: {
        padding: 8,
        backgroundColor: colors.bgElevated,
        borderRadius: radius.full,
    },
    title: {
        ...typography['2xl'],
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: space.xs,
        lineHeight: 40,
    },
    subtitle: {
        ...typography.base,
        color: colors.textSecondary,
        marginBottom: space.xl,
    },
    formSection: {
        gap: space.lg,
    },
    label: {
        ...typography.sm,
        color: colors.textSecondary,
        marginBottom: space.xs,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgElevated,
        borderRadius: radius.lg,
        paddingHorizontal: space.md,
        height: 56,
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    input: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 16,
        marginLeft: 0,
    },
    inputIcon: {
        marginRight: space.sm,
    },
    genderList: {
        gap: space.sm,
    },
    genderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgElevated,
        borderRadius: radius.lg,
        paddingHorizontal: space.md,
        height: 56,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        gap: space.sm,
    },
    genderCardSelected: {
        borderColor: colors.bodyOrange,
        borderWidth: 1,
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.textTertiary,
    },
    radioCircleSelected: {
        borderColor: colors.primaryViolet,
        backgroundColor: colors.primaryViolet,
    },
    genderLabel: {
        flex: 1,
        ...typography.base,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    genderLabelSelected: {
        color: colors.textPrimary,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    unitToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
    },
    unitToggleLabel: {
        ...typography.xs,
        color: colors.textTertiary,
        fontWeight: '600',
    },
    metricCard: {
        backgroundColor: colors.bgElevated,
        borderRadius: radius.lg,
        padding: space.md,
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    metricValue: {
        ...typography['3xl'],
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: space.sm,
    },
    metricUnit: {
        ...typography.lg,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    metricInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgElevated,
        borderRadius: radius.lg,
        paddingHorizontal: space.md,
        height: 56,
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    metricInput: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 16,
        paddingVertical: 0,
    },
    metricUnitLabel: {
        ...typography.base,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    settingsHint: {
        ...typography.sm,
        color: colors.textTertiary,
        marginTop: space.xs,
    },
    submitBtnContainer: {
        marginTop: space.xl,
    },
    submitButton: {
        height: 56,
        borderRadius: radius['2xl'],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    submitButtonText: {
        ...typography.lg,
        fontWeight: '700',
        color: 'white',
    },
});
