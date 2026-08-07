import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../components/AppIcon';
import { CustomAlertModal } from '../components/CustomAlertModal';
import { loadRegisteredUsers, saveRegisteredUsers } from '../utils/storage';
import { green, styles } from '../styles/styles';

export function LoginScreen({ darkMode = false, onLoginSuccess, onGuestContinue }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  // Field Red Outline Validation States
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [fullNameError, setFullNameError] = useState(false);

  // Custom Alert Popup State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    icon: '⚠️',
  });

  const showAlert = (title, message, icon = '⚠️') => {
    setAlertConfig({ visible: true, title, message, icon });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const handleModeSwitch = (signUpMode) => {
    setIsSignUpMode(signUpMode);
    setEmailError(false);
    setPasswordError(false);
    setFullNameError(false);
  };

  const handleSubmit = async () => {
    let hasError = false;

    setEmailError(false);
    setPasswordError(false);
    setFullNameError(false);

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();
    const trimmedPassword = password.trim();

    if (isSignUpMode && !trimmedName) {
      setFullNameError(true);
      hasError = true;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setEmailError(true);
      hasError = true;
    }

    if (!trimmedPassword || trimmedPassword.length < 3) {
      setPasswordError(true);
      hasError = true;
    }

    if (hasError) {
      return showAlert('Validation Error', 'Please fill in all required fields highlighted in red correctly.');
    }

    const registeredUsers = await loadRegisteredUsers();

    if (isSignUpMode) {
      // 1. Sign Up Validation: Check if email already exists
      const existingUser = registeredUsers.find((u) => u.email.toLowerCase() === trimmedEmail.toLowerCase());
      if (existingUser) {
        setEmailError(true);
        return showAlert('Account Exists', 'An account with this email already exists. Please switch to Log In.');
      }

      // Register new user
      const newUser = { name: trimmedName, email: trimmedEmail, password: trimmedPassword };
      const updatedUsers = [...registeredUsers, newUser];
      await saveRegisteredUsers(updatedUsers);

      onLoginSuccess({ name: trimmedName, email: trimmedEmail });
    } else {
      // 2. Log In Validation: Check if user exists & password matches
      const foundUser = registeredUsers.find((u) => u.email.toLowerCase() === trimmedEmail.toLowerCase());
      if (!foundUser) {
        setEmailError(true);
        return showAlert('Account Not Found', 'No account found with this email. Please sign up to create a new account.');
      }

      if (foundUser.password !== trimmedPassword) {
        setPasswordError(true);
        return showAlert('Incorrect Password', 'The password you entered is incorrect. Please try again.');
      }

      onLoginSuccess({ name: foundUser.name || 'Siddharajsinh', email: foundUser.email });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Light Mode Layout */}
      {!darkMode ? (
        <View style={styles.lightAuthContainer}>
          <ScrollView contentContainerStyle={styles.exactAuthScrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.lightAuthCard}>
              {/* Logo Header */}
              <View style={styles.exactAuthLogoHeaderRow}>
                <View style={[styles.exactAuthLogoCircle, { backgroundColor: green }]}>
                  <Text style={styles.exactAuthLogoRupee}>₹</Text>
                </View>
                <Text style={[styles.exactAuthLogoTextMain, { color: '#0F172A' }]}>
                  Check<Text style={{ color: green }}>Paisa</Text>
                </Text>
              </View>

              {/* Heading */}
              <Text style={[styles.exactAuthTitleLine1, { color: '#0F172A' }]}>{isSignUpMode ? 'Create Account,' : 'Welcome Back,'}</Text>
              <Text style={[styles.exactAuthTitleLine2, { color: green }]}>to CheckPaisa</Text>
              <Text style={[styles.exactAuthSubhead, { color: '#64748B' }]}>
                {isSignUpMode ? 'Register to start tracking your finances' : 'Welcome to CheckPaisa & help you finance application'}
              </Text>

              {/* Full Name Input (Sign Up Only) */}
              {isSignUpMode && (
                <View style={styles.exactAuthInputGroup}>
                  <Text style={[styles.exactAuthFieldLabel, { color: '#334155' }]}>Full Name</Text>
                  <View style={[styles.lightAuthInputBox, fullNameError && { borderColor: '#EF4444', borderWidth: 2 }]}>
                    <TextInput
                      value={fullName}
                      onChangeText={(text) => {
                        setFullName(text);
                        if (fullNameError) setFullNameError(false);
                      }}
                      placeholder="Full Name"
                      placeholderTextColor="#94A3B8"
                      autoCorrect={false}
                      style={styles.lightAuthTextInput}
                    />
                    <AppIcon name="user" color={fullNameError ? '#EF4444' : '#64748B'} size={19} />
                  </View>
                </View>
              )}

              {/* Email Group */}
              <View style={styles.exactAuthInputGroup}>
                <Text style={[styles.exactAuthFieldLabel, { color: '#334155' }]}>Email</Text>
                <View style={[styles.lightAuthInputBox, emailError && { borderColor: '#EF4444', borderWidth: 2 }]}>
                  <TextInput
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) setEmailError(false);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Email"
                    placeholderTextColor="#94A3B8"
                    style={styles.lightAuthTextInput}
                  />
                  <AppIcon name="user" color={emailError ? '#EF4444' : '#64748B'} size={19} />
                </View>
              </View>

              {/* Password Group */}
              <View style={styles.exactAuthInputGroup}>
                <Text style={[styles.exactAuthFieldLabel, { color: '#334155' }]}>Password</Text>
                <View style={[styles.lightAuthInputBox, passwordError && { borderColor: '#EF4444', borderWidth: 2 }]}>
                  <TextInput
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) setPasswordError(false);
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    style={styles.lightAuthTextInput}
                  />
                  <View style={styles.exactAuthPasswordIconsRight}>
                    <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                      <AppIcon name={showPassword ? 'eye' : 'eyeOff'} color={passwordError ? '#EF4444' : '#64748B'} size={19} />
                    </Pressable>
                    <AppIcon name="lock" color={passwordError ? '#EF4444' : '#64748B'} size={19} />
                  </View>
                </View>
              </View>

              {/* Log In / Sign Up Button */}
              <Pressable style={styles.exactAuthSubmitTouchable} onPress={handleSubmit}>
                <View style={[styles.exactAuthSubmitPill, { backgroundColor: green }]}>
                  <Text style={styles.exactAuthSubmitPillText}>{isSignUpMode ? 'Sign Up' : 'Log In'}</Text>
                </View>
              </Pressable>

              {/* Forgot Password? Link */}
              {!isSignUpMode && (
                <Pressable style={styles.exactAuthForgotLinkBtn} onPress={() => showAlert('Reset Password', 'A password reset link has been sent to your email.', '🔑')}>
                  <Text style={[styles.exactAuthForgotLinkText, { color: green }]}>Forgot Password?</Text>
                </Pressable>
              )}
            </View>

            {/* Bottom Sign Up / Log In Toggle Row */}
            <View style={styles.exactAuthBottomLinkRow}>
              <Text style={[styles.exactAuthBottomLinkText, { color: '#64748B' }]}>
                {isSignUpMode ? 'Already have an account? ' : "Don't have an account? "}
              </Text>
              <Pressable onPress={() => handleModeSwitch(!isSignUpMode)}>
                <Text style={[styles.exactAuthBottomLinkAction, { color: green }]}>{isSignUpMode ? 'Log In' : 'Sign Up'}</Text>
              </Pressable>
            </View>

            {/* Guest Shortcut */}
            <Pressable style={{ marginTop: 14 }} onPress={onGuestContinue}>
              <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Continue as Guest ➔</Text>
            </Pressable>
          </ScrollView>
        </View>
      ) : (
        /* Dark Mode Layout */
        <LinearGradient colors={['#0B2E21', '#041710', '#010805']} style={styles.exactAuthContainer}>
          <View style={styles.exactAuthGlowTopRight} pointerEvents="none" />

          <ScrollView contentContainerStyle={styles.exactAuthScrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.exactAuthCard}>
              {/* Logo Header */}
              <View style={styles.exactAuthLogoHeaderRow}>
                <View style={styles.exactAuthLogoCircle}>
                  <Text style={styles.exactAuthLogoRupee}>₹</Text>
                </View>
                <Text style={styles.exactAuthLogoTextMain}>
                  Check<Text style={styles.exactAuthLogoTextGreen}>Paisa</Text>
                </Text>
              </View>

              {/* Heading */}
              <Text style={styles.exactAuthTitleLine1}>{isSignUpMode ? 'Create Account,' : 'Welcome Back,'}</Text>
              <Text style={styles.exactAuthTitleLine2}>to CheckPaisa</Text>
              <Text style={styles.exactAuthSubhead}>
                {isSignUpMode ? 'Register to start tracking your finances' : 'Welcome to CheckPaisa & help you finance application'}
              </Text>

              {/* Full Name Input (Sign Up Only) */}
              {isSignUpMode && (
                <View style={styles.exactAuthInputGroup}>
                  <Text style={styles.exactAuthFieldLabel}>Full Name</Text>
                  <View style={[styles.exactAuthInputBox, fullNameError && { borderColor: '#EF4444', borderWidth: 2 }]}>
                    <TextInput
                      value={fullName}
                      onChangeText={(text) => {
                        setFullName(text);
                        if (fullNameError) setFullNameError(false);
                      }}
                      placeholder="Full Name"
                      placeholderTextColor="#475569"
                      autoCorrect={false}
                      style={styles.exactAuthTextInput}
                    />
                    <AppIcon name="user" color={fullNameError ? '#EF4444' : '#64748B'} size={19} />
                  </View>
                </View>
              )}

              {/* Email Group */}
              <View style={styles.exactAuthInputGroup}>
                <Text style={styles.exactAuthFieldLabel}>Email</Text>
                <View style={[styles.exactAuthInputBox, emailError && { borderColor: '#EF4444', borderWidth: 2 }]}>
                  <TextInput
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) setEmailError(false);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Email"
                    placeholderTextColor="#475569"
                    style={styles.exactAuthTextInput}
                  />
                  <AppIcon name="user" color={emailError ? '#EF4444' : '#64748B'} size={19} />
                </View>
              </View>

              {/* Password Group */}
              <View style={styles.exactAuthInputGroup}>
                <Text style={styles.exactAuthFieldLabel}>Password</Text>
                <View style={[styles.exactAuthInputBox, passwordError && { borderColor: '#EF4444', borderWidth: 2 }]}>
                  <TextInput
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) setPasswordError(false);
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="••••••••"
                    placeholderTextColor="#475569"
                    style={styles.exactAuthTextInput}
                  />
                  <View style={styles.exactAuthPasswordIconsRight}>
                    <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                      <AppIcon name={showPassword ? 'eye' : 'eyeOff'} color={passwordError ? '#EF4444' : '#64748B'} size={19} />
                    </Pressable>
                    <AppIcon name="lock" color={passwordError ? '#EF4444' : '#64748B'} size={19} />
                  </View>
                </View>
              </View>

              {/* Submit Pill Button */}
              <Pressable style={styles.exactAuthSubmitTouchable} onPress={handleSubmit}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.exactAuthSubmitPill}>
                  <Text style={styles.exactAuthSubmitPillText}>{isSignUpMode ? 'Sign Up' : 'Log In'}</Text>
                </LinearGradient>
              </Pressable>

              {/* Forgot Password? Link */}
              {!isSignUpMode && (
                <Pressable style={styles.exactAuthForgotLinkBtn} onPress={() => showAlert('Reset Password', 'A password reset link has been sent to your email.', '🔑')}>
                  <Text style={styles.exactAuthForgotLinkText}>Forgot Password?</Text>
                </Pressable>
              )}
            </View>

            {/* Bottom Sign Up / Log In Toggle Row */}
            <View style={styles.exactAuthBottomLinkRow}>
              <Text style={styles.exactAuthBottomLinkText}>
                {isSignUpMode ? 'Already have an account? ' : "Don't have an account? "}
              </Text>
              <Pressable onPress={() => handleModeSwitch(!isSignUpMode)}>
                <Text style={styles.exactAuthBottomLinkAction}>{isSignUpMode ? 'Log In' : 'Sign Up'}</Text>
              </Pressable>
            </View>

            {/* Guest Shortcut */}
            <Pressable style={{ marginTop: 14 }} onPress={onGuestContinue}>
              <Text style={{ fontSize: 13, color: '#94A3B8', fontWeight: '600', textAlign: 'center' }}>Continue as Guest ➔</Text>
            </Pressable>
          </ScrollView>
        </LinearGradient>
      )}

      {/* Reusable Custom Alert Popup */}
      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        darkMode={darkMode}
        onConfirm={hideAlert}
      />
    </View>
  );
}
