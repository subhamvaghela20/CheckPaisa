import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../components/AppIcon';
import { categories as defaultCategories } from '../data/appData';
import { green, styles } from '../styles/styles';

export function InitialSetupScreen({
  userName = 'User',
  darkMode = false,
  onCompleteSetup,
}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);

  // Step 1: Wallet state
  const [walletName, setWalletName] = useState('Main Wallet');
  const [initialBalance, setInitialBalance] = useState('0');
  const [walletError, setWalletError] = useState('');

  // Step 2: Budget state
  const expenseCategories = defaultCategories.filter((c) => c.type === 'Expense');
  const [categoryBudgets, setCategoryBudgets] = useState({
    Food: '5000',
    Bills: '3000',
    Shopping: '2000',
  });

  const handleBudgetChange = (catName, val) => {
    setCategoryBudgets((prev) => ({ ...prev, [catName]: val }));
  };

  const calculateTotalBudget = () => {
    return Object.values(categoryBudgets).reduce((sum, val) => {
      const num = Number(val);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  };

  const handleNextStep = () => {
    if (!walletName.trim()) {
      setWalletError('Please enter a wallet name');
      return;
    }
    setWalletError('');
    setStep(2);
  };

  const handleFinishSetup = () => {
    const createdWallet = {
      id: `wallet_${Date.now()}`,
      name: walletName.trim() || 'Main Wallet',
      initialBalance: Number(initialBalance) || 0,
      isDefault: true,
      createdAt: new Date().toISOString(),
    };

    // Filter out zero/empty budgets
    const finalBudgets = {};
    Object.entries(categoryBudgets).forEach(([cat, val]) => {
      const num = Number(val);
      if (num > 0) finalBudgets[cat] = num;
    });

    onCompleteSetup?.({
      wallet: createdWallet,
      budgets: finalBudgets,
    });
  };

  const renderContent = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.exactAuthScrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step Progress Bar Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[styles.exactAuthTitleLine1, { color: darkMode ? '#FFF' : '#0F172A' }]}>
            Welcome, {userName}! 👋
          </Text>
          <Text style={[styles.exactAuthTitleLine2, { color: green }]}>
            {step === 1 ? 'Step 1 of 2: Create Wallet' : 'Step 2 of 2: Set Budget'}
          </Text>
          
          {/* Progress Indicator */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <View
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                backgroundColor: green,
              }}
            />
            <View
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                backgroundColor: step === 2 ? green : darkMode ? '#1E293B' : '#E2E8F0',
              }}
            />
          </View>
        </View>

        {/* STEP 1: CREATE WALLET */}
        {step === 1 && (
          <View
            style={[
              styles.lightAuthCard,
              darkMode && {
                backgroundColor: 'rgba(15, 27, 21, 0.85)',
                borderColor: 'rgba(16, 185, 129, 0.25)',
              },
            ]}
          >
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#E6F9F2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <AppIcon name="wallet" color={green} size={32} />
              </View>
              <Text style={[styles.currencyModalTitle, darkMode && { color: '#FFF' }]}>
                Create Primary Wallet
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: darkMode ? '#94A3B8' : '#64748B',
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                Set up your default wallet to store your opening balance and track daily transactions.
              </Text>
            </View>

            {/* Wallet Name */}
            <View style={styles.exactAuthInputGroup}>
              <Text style={[styles.exactAuthFieldLabel, { color: darkMode ? '#E2E8F0' : '#1E293B', fontWeight: '700' }]}>
                Wallet Name
              </Text>
              <View
                style={[
                  styles.lightAuthInputBox,
                  walletError ? { borderColor: '#EF4444' } : null,
                  darkMode && styles.darkEditInput,
                ]}
              >
                <TextInput
                  value={walletName}
                  onChangeText={(text) => {
                    setWalletName(text);
                    if (walletError) setWalletError('');
                  }}
                  placeholder="e.g. Main Wallet, Bank Account"
                  placeholderTextColor="#94A3B8"
                  style={[styles.lightAuthTextInput, darkMode && { color: '#FFF' }]}
                />
              </View>
              {walletError ? (
                <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                  {walletError}
                </Text>
              ) : null}
            </View>

            {/* Initial Balance */}
            <View style={styles.exactAuthInputGroup}>
              <Text style={[styles.exactAuthFieldLabel, { color: darkMode ? '#E2E8F0' : '#1E293B', fontWeight: '700' }]}>
                Opening Balance (₹)
              </Text>
              <View style={[styles.lightAuthInputBox, darkMode && styles.darkEditInput]}>
                <TextInput
                  value={initialBalance}
                  onChangeText={setInitialBalance}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  style={[styles.lightAuthTextInput, darkMode && { color: '#FFF' }]}
                />
              </View>
            </View>

            {/* Step 1 Action Button */}
            <Pressable
              style={[styles.exactAuthSubmitTouchable, { marginTop: 10 }]}
              onPress={handleNextStep}
            >
              <View style={[styles.exactAuthSubmitPill, { backgroundColor: green }]}>
                <Text style={styles.exactAuthSubmitPillText}>Next: Set Monthly Budget →</Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* STEP 2: SET MONTHLY BUDGET */}
        {step === 2 && (
          <View
            style={[
              styles.lightAuthCard,
              darkMode && {
                backgroundColor: 'rgba(15, 27, 21, 0.85)',
                borderColor: 'rgba(16, 185, 129, 0.25)',
              },
            ]}
          >
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#E6F9F2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <AppIcon name="budget" color={green} size={32} />
              </View>
              <Text style={[styles.currencyModalTitle, darkMode && { color: '#FFF' }]}>
                Set Monthly Budget Caps
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: darkMode ? '#94A3B8' : '#64748B',
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                Specify monthly budget limits for your main expense categories.
              </Text>
            </View>

            {/* Total Budget Card */}
            <View
              style={{
                backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.15)' : '#E6F9F2',
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                marginBottom: 20,
                borderWidth: 1,
                borderColor: green,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: green }}>
                TOTAL MONTHLY BUDGET
              </Text>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: '800',
                  color: darkMode ? '#FFF' : '#0F172A',
                  marginTop: 4,
                }}
              >
                ₹{calculateTotalBudget().toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Category Budget Inputs */}
            {expenseCategories.map((cat) => (
              <View key={cat.name} style={{ marginBottom: 12 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <Text style={[styles.exactAuthFieldLabel, { color: darkMode ? '#E2E8F0' : '#1E293B', fontWeight: '700' }]}>
                    {cat.name} (₹)
                  </Text>
                </View>
                <View style={[styles.lightAuthInputBox, darkMode && styles.darkEditInput]}>
                  <TextInput
                    value={categoryBudgets[cat.name] || ''}
                    onChangeText={(val) => handleBudgetChange(cat.name, val)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    style={[styles.lightAuthTextInput, darkMode && { color: '#FFF' }]}
                  />
                </View>
              </View>
            ))}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <Pressable
                style={{
                  flex: 1,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: darkMode ? '#334155' : '#E2E8F0',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => setStep(1)}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: darkMode ? '#FFF' : '#334155' }}>
                  Back
                </Text>
              </Pressable>
              <Pressable
                style={{
                  flex: 1,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: green,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={handleFinishSetup}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );

  if (darkMode) {
    return (
      <LinearGradient colors={['#0B2E21', '#041710', '#010805']} style={{ flex: 1 }}>
        {renderContent()}
      </LinearGradient>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {renderContent()}
    </View>
  );
}
