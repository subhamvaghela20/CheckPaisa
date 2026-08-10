import React, { useState, useRef, useCallback } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  Text,
  View,
  Alert,
} from 'react-native';
import { AppIcon } from './AppIcon';
import { parseVoiceInput } from '../utils/voiceParser';

let SpeechModule = null;
let useSpeechEvent = null;

try {
  const speechPkg = require('expo-speech-recognition');
  SpeechModule = speechPkg.ExpoSpeechRecognitionModule;
  useSpeechEvent = speechPkg.useSpeechRecognitionEvent;
} catch (err) {
  console.log('Speech recognition module not available:', err);
}

function SpeechEventListener({ onResult, onError }) {
  if (useSpeechEvent) {
    try {
      useSpeechEvent('result', (event) => {
        const text = event.results[0]?.transcript || '';
        onResult(text);
      });
      useSpeechEvent('error', (event) => {
        onError(event);
      });
    } catch (e) {
      console.log('Event listener error:', e);
    }
  }
  return null;
}

export function VoiceMicButton({
  darkMode,
  categories,
  onTransactionParsed,
}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [toast, setToast] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef(null);
  const toastTimer = useRef(null);

  const startPulse = useCallback(() => {
    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseRef.current.start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    if (pulseRef.current) {
      pulseRef.current.stop();
      pulseRef.current = null;
    }
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const showToast = useCallback((message, type) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const handlePressIn = useCallback(async () => {
    if (!SpeechModule) {
      Alert.alert(
        'APK Build Required',
        'Voice recognition requires the compiled CheckPaisa APK build to access device microphone.',
      );
      return;
    }

    try {
      const result = await SpeechModule.requestPermissionsAsync();
      if (!result?.granted) {
        Alert.alert(
          'Permission Required',
          'Microphone permission is needed for voice input.',
        );
        return;
      }
      setTranscript('');
      setListening(true);
      startPulse();
      SpeechModule.start({
        lang: 'en-IN',
        interimResults: true,
      });
    } catch (err) {
      Alert.alert('Voice Error', 'Could not start speech recognition.');
    }
  }, [startPulse]);

  const handlePressOut = useCallback(() => {
    if (!listening) return;
    if (SpeechModule) {
      try {
        SpeechModule.stop();
      } catch (e) {}
    }
    stopPulse();
    setListening(false);

    const finalTranscript = transcript.trim();
    if (!finalTranscript) {
      showToast("⚠️ Couldn't hear anything", 'error');
      return;
    }

    const parsed = parseVoiceInput(finalTranscript, categories);
    if (!parsed || !parsed.success) {
      showToast(`⚠️ ${parsed?.error || 'Could not parse speech'}`, 'error');
      return;
    }

    if (parsed.transaction) {
      onTransactionParsed?.(parsed.transaction);
      showToast(`✅ Added: ₹${parsed.transaction.amount} → ${parsed.transaction.category}`, 'success');
    }
  }, [listening, transcript, categories, onTransactionParsed, stopPulse, showToast]);

  const buttonBg = darkMode ? '#10B981' : '#11BD88';
  const buttonBorder = darkMode
    ? { borderWidth: 1.5, borderColor: 'rgba(16, 185, 129, 0.4)' }
    : {};

  return (
    <>
      {listening && (
        <SpeechEventListener
          onResult={(text) => setTranscript(text)}
          onError={() => {
            setListening(false);
            stopPulse();
          }}
        />
      )}

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          position: 'absolute',
          left: 24,
          bottom: 80,
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: buttonBg,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 8,
          zIndex: 100,
          ...buttonBorder,
        }}
      >
        <AppIcon name="mic" color="#fff" size={26} />
      </Pressable>

      <Modal visible={listening} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Animated.View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: '#11BD88',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pulseAnim }],
            }}
          >
            <AppIcon name="mic" color="#fff" size={48} />
          </Animated.View>

          <Text
            style={{
              color: '#fff',
              fontSize: 22,
              fontWeight: '600',
              marginTop: 28,
            }}
          >
            Listening...
          </Text>

          {transcript ? (
            <Text
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: 16,
                marginTop: 16,
                paddingHorizontal: 32,
                textAlign: 'center',
              }}
            >
              {transcript}
            </Text>
          ) : null}

          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 14,
              position: 'absolute',
              bottom: 60,
            }}
          >
            Release to add transaction
          </Text>
        </View>
      </Modal>

      {toast && (
        <View
          style={{
            position: 'absolute',
            bottom: 140,
            alignSelf: 'center',
            backgroundColor: toast.type === 'success' ? '#059669' : '#DC2626',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 24,
            zIndex: 200,
            elevation: 10,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>
            {toast.message}
          </Text>
        </View>
      )}
    </>
  );
}

export default VoiceMicButton;
