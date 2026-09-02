import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../components/AppIcon';
import { categories } from '../data/appData';
import { green, styles } from '../styles/styles';

export function EditBudgetScreen({ budgets = {}, darkMode = false, onBack, onSaveBudgets }) {
  const insets = useSafeAreaInsets();
  const expenseCategories = categories.filter((c) => c.type === 'Expense');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => {
      keyboardHideListener.remove();
    };
  }, []);

  const [inputBudgets, setInputBudgets] = useState(() => {
    const initial = {};
    expenseCategories.forEach((cat) => {
      initial[cat.name] = budgets && budgets[cat.name] ? String(budgets[cat.name]) : '';
    });
    return initial;
  });

  const handleInputChange = (catName, text) => {
    const sanitized = text.replace(/[^0-9]/g, '');
    setInputBudgets((prev) => ({ ...prev, [catName]: sanitized }));
  };

  const handleFocus = (index) => {
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, index * 62 - 20),
      animated: true,
    });
  };

  const handleSave = () => {
    const parsedBudgets = {};
    expenseCategories.forEach((cat) => {
      const num = Number(inputBudgets[cat.name]);
      if (num > 0) {
        parsedBudgets[cat.name] = num;
      }
    });
    onSaveBudgets(parsedBudgets);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.formScreen, darkMode && { backgroundColor: '#040C08' }]}>
        <View style={[styles.formHero, darkMode && { backgroundColor: '#0B2E21' }]}>
          <View style={styles.formHeader}>
            <Pressable style={styles.formClose} onPress={onBack}>
              <AppIcon name="back" size={20} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.formTitle}>Category Budgets</Text>
            <View style={styles.headerBlank} />
          </View>
          <Text style={styles.howMuch}>Set Monthly Limits</Text>
          <Text style={styles.editBudgetSubtitle}>Enter budget limits for each expense category</Text>
        </View>

        <View style={[styles.formPanel, { flex: 1 }, darkMode && { backgroundColor: '#091510' }]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.formPanelContent}
            contentContainerStyle={[styles.formPanelContentInner, { paddingBottom: 20 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {expenseCategories.map((cat, index) => (
              <View key={cat.name} style={[styles.editBudgetRow, darkMode && { borderBottomColor: 'rgba(255,255,255,0.08)' }]}>
                <View style={[styles.transactionCategoryIcon, { backgroundColor: `${cat.color}18` }]}>
                  <AppIcon name={cat.icon} color={cat.color} size={21} />
                </View>
                <Text style={[styles.editBudgetCatName, darkMode && { color: '#FFFFFF' }]}>{cat.name}</Text>
                <View style={[styles.editBudgetInputBox, darkMode && { backgroundColor: '#040C08', borderColor: 'rgba(16,185,129,0.3)' }]}>
                  <Text style={[styles.editBudgetCurrency, darkMode && { color: '#10B981' }]}>₹</Text>
                  <TextInput
                    value={inputBudgets[cat.name] || ''}
                    onChangeText={(text) => handleInputChange(cat.name, text)}
                    onFocus={() => handleFocus(index)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    style={[styles.editBudgetInput, darkMode && { color: '#FFFFFF' }]}
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Floating Action Button Footer */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: darkMode ? '#091510' : '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: darkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
            }}
          >
            <Pressable style={({ pressed }) => [styles.saveButton, { marginTop: 0 }, darkMode && { backgroundColor: '#10B981' }, pressed && styles.pressedButton]} onPress={handleSave}>
              <Text style={[styles.saveButtonText, darkMode && { color: '#000000' }]}>Save Category Budgets</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
