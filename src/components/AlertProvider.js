import React, { useState, useCallback, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { registerAlertHandler } from '../utils/alert';

export default function AlertProvider({ children }) {
  const [alertState, setAlertState] = useState(null);

  const presentAlert = useCallback((title, message, buttons) => {
    setAlertState({
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
    });
  }, []);

  useEffect(() => {
    registerAlertHandler(presentAlert);
  }, [presentAlert]);

  const handlePress = (button) => {
    setAlertState(null);
    button.onPress?.();
  };

  return (
    <>
      {children}
      <Modal
        visible={!!alertState}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertState(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            {alertState?.title ? <Text style={styles.title}>{alertState.title}</Text> : null}
            {alertState?.message ? <Text style={styles.message}>{alertState.message}</Text> : null}
            <View style={styles.buttonRow}>
              {alertState?.buttons.map((button, index) => (
                <TouchableOpacity
                  key={button.text ?? index}
                  style={[
                    styles.button,
                    button.style === 'cancel' && styles.cancelButton,
                    button.style === 'destructive' && styles.destructiveButton,
                  ]}
                  onPress={() => handlePress(button)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'cancel' && styles.cancelButtonText,
                    ]}
                  >
                    {button.text ?? 'OK'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38003c',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#444',
    lineHeight: 21,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#38003c',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
  },
  destructiveButton: {
    backgroundColor: '#e74c3c',
  },
});
