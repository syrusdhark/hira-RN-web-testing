import React from 'react';
import { StyleSheet, Pressable, Platform, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

export function FloatingBackButton({ onPress }: { onPress: () => void }) {
    const top = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 60;

    return (
        <Pressable onPress={onPress} style={[styles.button, { top }]}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        position: 'absolute',
        left: 20,
        zIndex: 100,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(20, 21, 23, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
});
