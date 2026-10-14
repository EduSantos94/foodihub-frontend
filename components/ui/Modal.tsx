import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Banner } from './Feedback';
import { colors, font, radius, space } from '@/lib/theme';

interface DialogProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

export function Dialog({ visible, title, onClose, children, footer, width = 560 }: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar" />
        <View style={[styles.dialog, { maxWidth: width }]}>
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Pressable onPress={onClose} accessibilityLabel="Fechar" hitSlop={8}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface ConfirmProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ visible, title, message, confirmLabel = 'Excluir', loading, error, onConfirm, onCancel }: ConfirmProps) {
  return (
    <Dialog
      visible={visible}
      title={title}
      onClose={onCancel}
      width={440}
      footer={
        <>
          <Button label="Cancelar" variant="secondary" onPress={onCancel} disabled={loading} />
          <Button label={confirmLabel} variant="danger" onPress={onConfirm} loading={loading} />
        </>
      }
    >
      {error ? (
        <View style={{ marginBottom: space.md }}>
          <Banner message={error} />
        </View>
      ) : null}
      <Text style={styles.message}>{message}</Text>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  dialog: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: font.xl, fontWeight: '700', color: colors.ink },
  close: { fontSize: font.lg, color: colors.muted },
  body: { padding: space.lg },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.sm,
    padding: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  message: { fontSize: font.md, color: colors.ink, lineHeight: 22 },
});
