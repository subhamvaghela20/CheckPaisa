import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { parseVoiceInput } from '../utils/voiceParser';
import { CustomAlertModal } from './CustomAlertModal';
import { green, styles } from '../styles/styles';

export function VoiceMicModal({
  categories = [],
  darkMode = false,
  onSaveVoiceTransaction,
}) {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [pulseAnim] = useState(new Animated.Value(1));
  const recognitionRef = useRef(null);

  // Custom Alert Modal State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    icon: '🎙️',
  });

  const showAlert = (title, message, icon = '⚠️') => {
    setAlertConfig({ visible: true, title, message, icon });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  // Pulsating Mic Animation Loop
  useEffect(() => {
    let animation;
    if (isListening) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => animation && animation.stop();
  }, [isListening]);

  // Web Speech API / Dictation Setup (Fallback for browser / Expo Web)
  const startSpeechRecognition = () => {
    setSpokenText('');
    setIsListening(true);

    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join('');
          setSpokenText(transcript);
        };

        recognition.onerror = () => {
          // Keep listening state active for manual release
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.log('Speech API init error:', e);
      }
    }
  };

  const stopSpeechRecognitionAndProcess = (finalSampleText = null) => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const textToProcess = finalSampleText || spokenText;

    if (!textToProcess.trim()) {
      return showAlert('No Speech Detected', 'Hold the mic button and speak clearly (e.g. "150 rupees for lunch").');
    }

    const result = parseVoiceInput(textToProcess, categories);

    if (!result.isValid) {
      if (!result.amount) {
        return showAlert(
          'Amount Not Detected',
          `Recognized: "${textToProcess}"\n\nPlease specify an amount (e.g. "150 for lunch" or "5000 salary").`,
          '⚠️'
        );
      }
      if (!result.category) {
        return showAlert(
          'Category Not Recognized',
          `Recognized: "${textToProcess}"\n\nCould not match category. Try saying "food", "petrol", "groceries", "bills", "rent", etc.`,
          '⚠️'
        );
      }
    }

    // Amount & Category matched successfully!
    const newTransaction = {
      id: String(Date.now()),
      type: result.type,
      amount: result.amount,
      category: result.category,
      note: result.note,
      createdAt: new Date().toISOString(),
    };

    onSaveVoiceTransaction?.(newTransaction);
    setSpokenText('');

    showAlert(
      'Transaction Added',
      `Successfully created ${result.type} transaction!\n\n• Amount: ₹${result.amount.toLocaleString('en-IN')}\n• Category: ${result.category}`,
      '✅'
    );
  };

  const handlePressIn = () => {
    startSpeechRecognition();
  };

  const handlePressOut = () => {
    setTimeout(() => {
      stopSpeechRecognitionAndProcess();
    }, 400);
  };

  const handleQuickSampleSelect = (sample) => {
    setSpokenText(sample);
    stopSpeechRecognitionAndProcess(sample);
  };

  return (
    <>
      {/* Mic Floating Button positioned directly above the Plus icon */}
      <Pressable
        style={({ pressed }) => [
          styles.micFloatingButton,
          darkMode && styles.darkMicFloatingButton,
          pressed && styles.pressedButton,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handlePressIn}
        delayLongPress={100}
      >
        <Text style={{ fontSize: 20, color: darkMode ? '#10B981' : '#FFFFFF' }}>🎙️</Text>
      </Pressable>

      {/* Voice Recording Overlay Modal */}
      <Modal visible={isListening} transparent animationType="fade" onRequestClose={() => setIsListening(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsListening(false)}>
          <View
            style={[
              styles.voiceModalCard,
              darkMode && { backgroundColor: '#091510', borderColor: 'rgba(16,185,129,0.35)', borderWidth: 1.5 },
            ]}
          >
            <Text style={[styles.voiceModalTitle, darkMode && { color: '#FFF' }]}>Voice-to-Expense ("Speak & Add")</Text>
            <Text style={[styles.voiceModalSubtitle, darkMode && { color: '#94A3B8' }]}>
              Hold & speak naturally (e.g. "150 for lunch" or "5000 salary"). Release to add!
            </Text>

            {/* Pulsating Animated Mic Circle */}
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <Animated.View
                style={[
                  styles.voicePulseCircle,
                  { transform: [{ scale: pulseAnim }] },
                  darkMode && { backgroundColor: 'rgba(16,185,129,0.2)' },
                ]}
              >
                <View style={[styles.voiceMicCircleInner, darkMode && { backgroundColor: '#10B981' }]}>
                  <Text style={{ fontSize: 32, color: '#FFF' }}>🎙️</Text>
                </View>
              </Animated.View>
            </View>

            {/* Live Spoken Transcript Feedback Box */}
            <View style={[styles.voiceTranscriptBox, darkMode && { backgroundColor: '#040C08', borderColor: 'rgba(16,185,129,0.2)' }]}>
              <Text style={[styles.voiceTranscriptText, darkMode && { color: '#10B981' }]}>
                {spokenText || 'Listening... Speak your expense/income now'}
              </Text>
            </View>

            {/* Quick Voice Demo Samples (1-Tap Test Shortcuts) */}
            <Text style={[styles.voiceSampleHeading, darkMode && { color: '#94A3B8' }]}>Quick Voice Samples:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {['150 for lunch', '350 petrol', '5000 salary', '1200 groceries'].map((sample) => (
                <Pressable
                  key={sample}
                  style={[styles.voiceSamplePill, darkMode && { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' }]}
                  onPress={() => handleQuickSampleSelect(sample)}
                >
                  <Text style={[styles.voiceSamplePillText, darkMode && { color: '#10B981' }]}>"{sample}"</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.voiceCloseButton} onPress={() => setIsListening(false)}>
              <Text style={styles.voiceCloseButtonText}>Release / Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Custom Reusable Alert Modal for Validation & Success */}
      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        darkMode={darkMode}
        onConfirm={hideAlert}
      />
    </>
  );
}
