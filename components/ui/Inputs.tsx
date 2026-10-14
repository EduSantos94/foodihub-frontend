import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { colors, font, radius, space } from '@/lib/theme';

interface FieldShellProps {
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: React.ReactNode;
}

export function FieldShell({ label, required, error, help, children }: FieldShellProps) {
  return (
    <View style={styles.shell}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : help ? <Text style={styles.help}>{help}</Text> : null}
    </View>
  );
}

interface TextFieldProps extends Omit<FieldShellProps, 'children'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad' | 'email-address' | 'phone-pad';
  maxLength?: number;
  secure?: boolean;
  autoComplete?: 'email' | 'new-password' | 'current-password' | 'name' | 'off';
  onSubmit?: () => void;
}

export function TextField({ value, onChangeText, placeholder, multiline, keyboardType, maxLength, secure, autoComplete, onSubmit, ...shell }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <FieldShell {...shell}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secure}
        autoComplete={autoComplete}
        onSubmitEditing={onSubmit}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={shell.label}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
          !!shell.error && styles.invalid,
          { outlineStyle: 'none' } as any,
        ]}
      />
    </FieldShell>
  );
}

export interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<FieldShellProps, 'children'> {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

export function SelectField({ value, onChange, options, placeholder = 'Selecione', ...shell }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <FieldShell {...shell}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={shell.label}
        onPress={() => setOpen(true)}
        style={[styles.input, styles.select, !!shell.error && styles.invalid]}
      >
        <Text style={selected ? styles.selectValue : styles.selectPlaceholder} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{shell.label}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {options.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={({ hovered }: any) => [
                    styles.option,
                    o.value === value && styles.optionSelected,
                    hovered && styles.optionHover,
                  ]}
                >
                  <Text style={[styles.optionText, o.value === value && styles.optionTextSelected]}>{o.label}</Text>
                </Pressable>
              ))}
              {options.length === 0 ? <Text style={styles.noOptions}>Nenhuma opção disponível</Text> : null}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </FieldShell>
  );
}

export function SwitchField({ label, value, onChange, help }: { label: string; value: boolean; onChange: (v: boolean) => void; help?: string }) {
  return (
    <View style={[styles.shell, styles.switchRow]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {help ? <Text style={styles.help}>{help}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { marginBottom: space.lg },
  label: { fontSize: font.sm, fontWeight: '600', color: colors.ink, marginBottom: space.xs },
  required: { color: colors.primary },
  help: { fontSize: 12, color: colors.muted, marginTop: space.xs },
  error: { fontSize: 12, color: colors.danger, marginTop: space.xs },
  input: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: font.md,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  focused: { borderColor: colors.primary },
  invalid: { borderColor: colors.danger },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectValue: { fontSize: font.md, color: colors.ink, flex: 1 },
  selectPlaceholder: { fontSize: font.md, color: colors.faint, flex: 1 },
  chevron: { color: colors.muted, marginLeft: space.sm },
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  sheet: { width: '100%', maxWidth: 420, backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg },
  sheetTitle: { fontSize: font.lg, fontWeight: '700', color: colors.ink, marginBottom: space.md },
  option: { paddingVertical: space.md, paddingHorizontal: space.md, borderRadius: radius.md },
  optionHover: { backgroundColor: colors.bg },
  optionSelected: { backgroundColor: colors.primarySoft },
  optionText: { fontSize: font.md, color: colors.ink },
  optionTextSelected: { color: colors.primary, fontWeight: '600' },
  noOptions: { color: colors.muted, padding: space.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
