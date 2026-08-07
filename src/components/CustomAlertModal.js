import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function CustomAlertModal({
  visible,
  title = 'Notice',
  message = '',
  icon = '⚠️',
  confirmText = 'OK',
  cancelText,
  isDestructive = false,
  darkMode = false,
  onConfirm,
  onCancel,
}) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel || onConfirm}>
      <Pressable style={styles.backdrop} onPress={onCancel || onConfirm}>
        <Pressable
          style={[
            styles.card,
            darkMode ? styles.darkCard : styles.lightCard,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Icon Circle */}
          <View style={[styles.iconCircle, isDestructive && styles.destructiveIconCircle]}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>

          {/* Alert Name (Title) */}
          <Text style={[styles.title, darkMode && styles.darkText]}>{title}</Text>

          {/* Description */}
          {message ? <Text style={[styles.message, darkMode && styles.darkSubtext]}>{message}</Text> : null}

          {/* Buttons Group */}
          <View style={styles.buttonGroup}>
            {cancelText ? (
              <Pressable style={[styles.button, styles.cancelButton, darkMode && styles.darkCancelButton]} onPress={onCancel}>
                <Text style={[styles.cancelButtonText, darkMode && styles.darkCancelButtonText]}>{cancelText}</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={[
                styles.button,
                styles.confirmButton,
                isDestructive && styles.destructiveButton,
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  lightCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  darkCard: {
    backgroundColor: '#091510',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E6F9F2',
    alignItems: 'center',
    justify: 'center',
    marginBottom: 14,
  },
  destructiveIconCircle: {
    backgroundColor: '#FEF2F2',
  },
  iconText: {
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  darkText: {
    color: '#FFFFFF',
  },
  message: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  darkSubtext: {
    color: '#94A3B8',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  darkCancelButton: {
    backgroundColor: '#040C08',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  darkCancelButtonText: {
    color: '#94A3B8',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  destructiveButton: {
    backgroundColor: '#EF4444',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
