import React, { useState, useRef } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

const NUMBER_COLUMNS = [
  'load',
  'reps',
  'rpe',
  'distance_meters',
  'hold_time_seconds',
  'feeling_score',
  'duration_seconds',
];

const SIDE_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'both', label: 'Both' },
] as const;

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Mod' },
  { value: 'hard', label: 'Hard' },
  { value: 'max', label: 'Max' },
] as const;

function SideDropdown({
  value,
  onChange,
  editable,
  baseContainerStyle,
  baseInputStyle,
}: {
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  baseContainerStyle: object[];
  baseInputStyle: object[];
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [menuLayout, setMenuLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const triggerRef = useRef<View>(null);
  const label = SIDE_OPTIONS.find((o) => o.value === value)?.label ?? '';

  const openDropdown = () => {
    if (!editable) return;
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuLayout({ x, y, width, height });
      setModalVisible(true);
    });
  };

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          style={[styles.dropdownTrigger, ...baseContainerStyle]}
          onPress={openDropdown}
          disabled={!editable}
        >
          <Text style={[styles.dropdownTriggerText, ...baseInputStyle]} numberOfLines={1}>
            {label || '-'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textTertiary} />
        </Pressable>
      </View>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.dropdownBackdropTransparent}
          onPress={() => setModalVisible(false)}
        >
          {menuLayout && (
            <View
              style={[
                styles.dropdownMenuPositioned,
                {
                  left: menuLayout.x,
                  top: menuLayout.y + menuLayout.height + 4,
                  minWidth: menuLayout.width,
                },
              ]}
            >
              {SIDE_OPTIONS.map((opt, index) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.dropdownOption,
                    value === opt.value && styles.dropdownOptionActive,
                    index === SIDE_OPTIONS.length - 1 && styles.dropdownOptionLast,
                  ]}
                  onPress={() => {
                    onChange(opt.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, value === opt.value && styles.dropdownOptionTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </Pressable>
      </Modal>
    </>
  );
}

function DifficultyDropdown({
  value,
  onChange,
  editable,
  baseContainerStyle,
  baseInputStyle,
}: {
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  baseContainerStyle: object[];
  baseInputStyle: object[];
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [menuLayout, setMenuLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const triggerRef = useRef<View>(null);
  const label = DIFFICULTY_OPTIONS.find((o) => o.value === value)?.label ?? '';

  const openDropdown = () => {
    if (!editable) return;
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuLayout({ x, y, width, height });
      setModalVisible(true);
    });
  };

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          style={[styles.dropdownTrigger, ...baseContainerStyle]}
          onPress={openDropdown}
          disabled={!editable}
        >
          <Text style={[styles.dropdownTriggerText, ...baseInputStyle]} numberOfLines={1}>
            {label || '-'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textTertiary} />
        </Pressable>
      </View>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.dropdownBackdropTransparent}
          onPress={() => setModalVisible(false)}
        >
          {menuLayout && (
            <View
              style={[
                styles.dropdownMenuPositioned,
                {
                  left: menuLayout.x,
                  top: menuLayout.y + menuLayout.height + 4,
                  minWidth: menuLayout.width,
                },
              ]}
            >
              {DIFFICULTY_OPTIONS.map((opt, index) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.dropdownOption,
                    value === opt.value && styles.dropdownOptionActive,
                    index === DIFFICULTY_OPTIONS.length - 1 && styles.dropdownOptionLast,
                  ]}
                  onPress={() => {
                    onChange(opt.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, value === opt.value && styles.dropdownOptionTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </Pressable>
      </Modal>
    </>
  );
}

export type DynamicInputProps = {
  column: string;
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  completed: boolean;
  containerStyle?: object;
  inputStyle?: object;
};

export function DynamicInput({
  column,
  value,
  onChange,
  editable,
  completed,
  containerStyle,
  inputStyle,
}: DynamicInputProps) {
  const baseContainerStyle = [
    styles.container,
    completed && styles.containerCompleted,
    containerStyle,
  ];
  const baseInputStyle = [styles.input, completed && styles.inputCompleted, inputStyle];

  if (column === 'side') {
    return (
      <SideDropdown
        value={value}
        onChange={onChange}
        editable={editable}
        baseContainerStyle={baseContainerStyle}
        baseInputStyle={baseInputStyle}
      />
    );
  }

  if (column === 'difficulty_level') {
    return (
      <DifficultyDropdown
        value={value}
        onChange={onChange}
        editable={editable}
        baseContainerStyle={baseContainerStyle}
        baseInputStyle={baseInputStyle}
      />
    );
  }

  const isNumeric = NUMBER_COLUMNS.includes(column);
  return (
    <View style={baseContainerStyle}>
      <TextInput
        style={baseInputStyle}
        value={value}
        onChangeText={onChange}
        keyboardType={isNumeric ? 'numeric' : 'default'}
        placeholder="-"
        placeholderTextColor={colors.textTertiary}
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 44,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  containerCompleted: {
    backgroundColor: 'rgba(45, 255, 143, 0.1)',
    borderColor: colors.healthGreen,
    borderWidth: 1,
  },
  input: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingHorizontal: 8,
  },
  inputCompleted: {
    color: colors.healthGreen,
  },
  selectorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  selectorChip: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.bgMidnight,
  },
  selectorChipActive: {
    backgroundColor: colors.bodyOrange,
  },
  selectorChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectorChipTextActive: {
    color: colors.textPrimary,
  },
  dropdownTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  dropdownTriggerText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  dropdownBackdropTransparent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownMenuPositioned: {
    position: 'absolute',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  dropdownOptionLast: {
    borderBottomWidth: 0,
  },
  dropdownOptionActive: {
    backgroundColor: 'rgba(255, 92, 0, 0.15)',
  },
  dropdownOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dropdownOptionTextActive: {
    color: colors.bodyOrange,
  },
});
