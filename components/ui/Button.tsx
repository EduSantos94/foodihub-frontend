import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, font, radius, space } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, small, style }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={inactive ? undefined : onPress}
      style={({ pressed, hovered }: any) => [
        styles.base,
        small && styles.small,
        variantStyles[variant].base,
        (pressed || hovered) && !inactive && variantStyles[variant].hover,
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles[variant].text.color} />
      ) : (
        <Text style={[styles.text, small && styles.textSmall, variantStyles[variant].text]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 40,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
  },
  small: { minHeight: 32, paddingHorizontal: space.md },
  inactive: { opacity: 0.55 },
  text: { fontSize: font.md, fontWeight: '600' },
  textSmall: { fontSize: font.sm },
});

const variantStyles: Record<Variant, { base: ViewStyle; hover: ViewStyle; text: { color: string } }> = {
  primary: {
    base: { backgroundColor: colors.primary, borderColor: colors.primary },
    hover: { backgroundColor: colors.primaryHover, borderColor: colors.primaryHover },
    text: { color: '#fff' },
  },
  secondary: {
    base: { backgroundColor: colors.surface, borderColor: colors.border },
    hover: { backgroundColor: colors.bg },
    text: { color: colors.ink },
  },
  danger: {
    base: { backgroundColor: colors.danger, borderColor: colors.danger },
    hover: { opacity: 0.9 },
    text: { color: '#fff' },
  },
  ghost: {
    base: { backgroundColor: 'transparent', borderColor: 'transparent' },
    hover: { backgroundColor: colors.bg },
    text: { color: colors.primary },
  },
};
