// apps/mobile/src/components/SaveMealTemplateModal.tsx

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    Modal,
    Alert,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { useSaveMealAsTemplate } from '../hooks/useFoodLibrarySearch';
import { colors, radius, space, typography } from '../theme';

interface SaveMealTemplateModalProps {
    visible: boolean;
    mealId: string;
    mealName: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export function SaveMealTemplateModal({
    visible,
    mealId,
    mealName,
    onClose,
    onSuccess,
}: SaveMealTemplateModalProps) {
    const [aliases, setAliases] = useState<string>('');
    const saveMutation = useSaveMealAsTemplate();

    const handleSave = async () => {
        try {
            const aliasArray = aliases
                .split(',')
                .map((a) => a.trim())
                .filter((a) => a.length > 0);

            await saveMutation.mutateAsync({
                mealId,
                aliases: aliasArray,
            });

            Alert.alert('Success', 'Meal saved to your food library!', [
                {
                    text: 'OK',
                    onPress: () => {
                        onSuccess?.();
                        onClose();
                    },
                },
            ]);
        } catch (error) {
            console.error('Error saving meal template:', error);
            Alert.alert('Error', 'Failed to save meal. Please try again.');
        }
    };

    const handleClose = () => {
        setAliases('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.handle} />

                    <Text style={styles.title}>Save to Food Library</Text>

                    <Text style={styles.subtitle}>
                        Make "{mealName}" searchable when logging meals
                    </Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Add Search Aliases (Optional)</Text>
                            <Text style={styles.inputHint}>
                                Add alternative names separated by commas. Example: "BLT, bacon
                                sandwich"
                            </Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g., protein shake, post-workout drink"
                                placeholderTextColor={colors.textTertiary}
                                value={aliases}
                                onChangeText={setAliases}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.tipBox}>
                            <Text style={styles.tipText}>
                                💡 This meal will appear in search results when you're logging
                                food, making it quick to log your favorite meals again.
                            </Text>
                        </View>

                        <View style={styles.buttonRow}>
                            <Pressable
                                onPress={handleClose}
                                style={[styles.button, styles.cancelButton]}
                                disabled={saveMutation.isPending}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>

                            <Pressable
                                onPress={handleSave}
                                style={[
                                    styles.button,
                                    styles.saveButton,
                                    saveMutation.isPending && styles.buttonDisabled,
                                ]}
                                disabled={saveMutation.isPending}
                            >
                                <Text style={styles.saveButtonText}>
                                    {saveMutation.isPending ? 'Saving...' : 'Save to Library'}
                                </Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
        backgroundColor: colors.bgMidnight,
        borderTopLeftRadius: radius['2xl'],
        borderTopRightRadius: radius['2xl'],
        paddingHorizontal: space.lg,
        paddingTop: space.md,
        paddingBottom: space.xl,
    },
    handle: {
        width: 48,
        height: 4,
        backgroundColor: colors.borderDefault,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: space.lg,
    },
    title: {
        ...typography.xl,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: space.xs,
    },
    subtitle: {
        ...typography.base,
        color: colors.textSecondary,
        marginBottom: space.lg,
    },
    inputSection: {
        marginBottom: space.lg,
    },
    inputLabel: {
        ...typography.sm,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: space.xs,
    },
    inputHint: {
        ...typography.xs,
        color: colors.textTertiary,
        marginBottom: space.sm,
    },
    textInput: {
        backgroundColor: colors.bgElevated,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        borderRadius: radius.xl,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        fontSize: 16,
        color: colors.textPrimary,
        minHeight: 80,
    },
    tipBox: {
        backgroundColor: `${colors.brandBlue}20`,
        padding: space.md,
        borderRadius: radius.xl,
        marginBottom: space.lg,
    },
    tipText: {
        ...typography.sm,
        color: colors.brandBlue,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: space.md,
    },
    button: {
        flex: 1,
        paddingVertical: space.md,
        borderRadius: radius.xl,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: colors.bgElevated,
    },
    cancelButtonText: {
        ...typography.base,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    saveButton: {
        backgroundColor: colors.healthGreen,
    },
    saveButtonText: {
        ...typography.base,
        fontWeight: '600',
        color: colors.textInverse,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
