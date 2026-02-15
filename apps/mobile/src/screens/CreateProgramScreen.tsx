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
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { useCreateProgram, type CreateProgramInput } from '../hooks/useProgramSchedule';

const DIFFICULTY_OPTIONS: { value: CreateProgramInput['difficulty']; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const INTENTION_OPTIONS: { value: CreateProgramInput['intention']; label: string }[] = [
  { value: 'feel_stronger', label: 'Feel stronger' },
  { value: 'build_energy', label: 'Build energy' },
  { value: 'consistency', label: 'Consistency' },
  { value: 'stress_reduction', label: 'Stress reduction' },
  { value: 'recovery', label: 'Recovery' },
];

type CreateProgramScreenProps = {
  navigation?: { goBack: () => void };
  onSuccess?: () => void;
};

export function CreateProgramScreen({ navigation, onSuccess }: CreateProgramScreenProps) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('4');
  const [difficulty, setDifficulty] = useState<CreateProgramInput['difficulty']>(null);
  const [intention, setIntention] = useState<CreateProgramInput['intention']>(null);
  const [fitnessLevel, setFitnessLevel] = useState<CreateProgramInput['fitness_level']>(null);
  const [restOnSunday, setRestOnSunday] = useState(true);

  const createProgram = useCreateProgram();

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Missing field', 'Please enter a program title.');
      return;
    }
    const weeks = parseInt(durationWeeks, 10);
    if (isNaN(weeks) || weeks < 1 || weeks > 12) {
      Alert.alert('Invalid duration', 'Please enter a duration between 1 and 12 weeks.');
      return;
    }

    createProgram.mutate(
      {
        title: trimmedTitle,
        description: description.trim() || null,
        duration_weeks: weeks,
        difficulty,
        intention,
        fitness_level: fitnessLevel,
        restOnSunday,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          navigation?.goBack();
        },
        onError: (err) => {
          Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create program.');
        },
      }
    );
  };

  const showPicker = (
    title: string,
    options: { value: string | null; label: string }[],
    currentValue: string | null,
    onSelect: (value: any) => void
  ) => {
    Alert.alert(
      title,
      undefined,
      [
        ...options.map((opt) => ({
          text: opt.label,
          onPress: () => onSelect(opt.value),
        })),
        { text: 'Clear', onPress: () => onSelect(null), style: 'cancel' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const formatOption = (value: string | null, options: { value: string | null; label: string }[]) => {
    if (!value) return 'Select';
    return options.find((o) => o.value === value)?.label ?? value;
  };

  return (
    <View style={styles.container}>
      <FloatingBackButton onPress={() => navigation?.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={[styles.header, { paddingTop }]}>
          <Text style={styles.screenTitle}>Create program</Text>
          <Text style={styles.subtitle}>Set up your program details and schedule.</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>TITLE</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="format-title" size={20} color={colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. My 4-Week Program"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <Text style={styles.label}>DESCRIPTION (OPTIONAL)</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What's this program about?"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <Text style={styles.label}>DURATION (WEEKS)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { textAlign: 'center' }]}
              placeholder="4"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              value={durationWeeks}
              onChangeText={setDurationWeeks}
            />
            <Text style={styles.unitText}>weeks</Text>
          </View>

          <Text style={styles.label}>DIFFICULTY</Text>
          <Pressable
            style={styles.inputContainer}
            onPress={() => showPicker('Difficulty', DIFFICULTY_OPTIONS, difficulty, setDifficulty)}
          >
            <Text style={[styles.input, { color: difficulty ? colors.textPrimary : colors.textTertiary }]}>
              {formatOption(difficulty, DIFFICULTY_OPTIONS)}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textTertiary} />
          </Pressable>

          <Text style={styles.label}>INTENTION</Text>
          <Pressable
            style={styles.inputContainer}
            onPress={() => showPicker('Intention', INTENTION_OPTIONS, intention, setIntention)}
          >
            <Text style={[styles.input, { color: intention ? colors.textPrimary : colors.textTertiary }]}>
              {formatOption(intention, INTENTION_OPTIONS)}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textTertiary} />
          </Pressable>

          <Text style={styles.label}>FITNESS LEVEL</Text>
          <Pressable
            style={styles.inputContainer}
            onPress={() => showPicker('Fitness level', DIFFICULTY_OPTIONS, fitnessLevel, setFitnessLevel)}
          >
            <Text style={[styles.input, { color: fitnessLevel ? colors.textPrimary : colors.textTertiary }]}>
              {formatOption(fitnessLevel, DIFFICULTY_OPTIONS)}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textTertiary} />
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Rest on Sunday</Text>
            <Switch
              value={restOnSunday}
              onValueChange={setRestOnSunday}
              trackColor={{ false: colors.borderDefault, true: colors.primaryViolet }}
              thumbColor={colors.textPrimary}
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={createProgram.isPending}
            style={styles.submitBtnContainer}
          >
            <LinearGradient
              colors={[colors.primaryViolet, colors.bodyOrange]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {createProgram.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Create program</Text>
                  <MaterialCommunityIcons name="check" size={24} color="white" />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgMidnight,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: space.md,
    paddingBottom: space.lg,
  },
  screenTitle: {
    ...typography['2xl'],
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: space.xs,
  },
  subtitle: {
    ...typography.base,
    color: colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space.md,
    paddingBottom: 100,
  },
  label: {
    ...typography.sm,
    color: colors.textSecondary,
    marginBottom: space.xs,
    marginTop: space.lg,
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
  inputIcon: {
    marginRight: space.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
  },
  textAreaContainer: {
    height: undefined,
    minHeight: 88,
    alignItems: 'flex-start',
    paddingVertical: space.sm,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  unitText: {
    ...typography.sm,
    color: colors.textTertiary,
    marginLeft: space.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xl,
    paddingVertical: space.sm,
  },
  switchLabel: {
    ...typography.base,
    color: colors.textPrimary,
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
