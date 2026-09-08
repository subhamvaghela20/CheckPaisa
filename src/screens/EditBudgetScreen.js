import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../components/AppIcon';
import { categories as defaultCategories } from '../data/appData';
import { green, styles } from '../styles/styles';

export function EditBudgetScreen({ budgets: budgetsProp, categories = defaultCategories, darkMode = false, onBack, onSaveBudgets }) {
  const budgets = budgetsProp || {};
  const insets = useSafeAreaInsets();
  const expenseCategories = (categories.length > 0 ? categories : defaultCategories).filter((c) => c.type === 'Expense');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => {
      keyboardHideListener.remove();
    };
  }, []);

  // Helper to extract numeric amount from budget entry
  const getAmount = (bEntry) => {
    if (!bEntry) return '';
    if (typeof bEntry === 'object' && bEntry !== null) {
      return bEntry.amount ? String(bEntry.amount) : '';
    }
    return String(bEntry);
  };

  // Helper to extract active status from budget entry
  const getIsActive = (bEntry) => {
    if (!bEntry) return true;
    if (typeof bEntry === 'object' && bEntry !== null) {
      return bEntry.isActive !== false;
    }
    return true;
  };

  const [inputBudgets, setInputBudgets] = useState(() => {
    const initial = {};
    expenseCategories.forEach((cat) => {
      initial[cat.name] = getAmount(budgets[cat.name]);
    });
    return initial;
  });

  const [activeBudgets, setActiveBudgets] = useState(() => {
    const initial = {};
    expenseCategories.forEach((cat) => {
      initial[cat.name] = getIsActive(budgets[cat.name]);
    });
    return initial;
  });

  const handleInputChange = (catName, text) => {
    const sanitized = text.replace(/[^0-9]/g, '');
    setInputBudgets((prev) => ({ ...prev, [catName]: sanitized }));
  };

  const handleToggleActive = (catName, val) => {
    setActiveBudgets((prev) => ({ ...prev, [catName]: val }));
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
      const isAct = activeBudgets[cat.name] !== false;
      if (num > 0 || isAct === false) {
        parsedBudgets[cat.name] = {
          amount: num > 0 ? num : 0,
          isActive: isAct,
        };
      }
    });
    onSaveBudgets(parsedBudgets);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
          <Text style={styles.editBudgetSubtitle}>Edit budget limits and toggle active status for each category</Text>
        </View>

        <View style={[styles.formPanel, { flex: 1 }, darkMode && { backgroundColor: '#091510' }]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.formPanelContent}
            contentContainerStyle={[styles.formPanelContentInner, { paddingBottom: 110 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {expenseCategories.map((cat, index) => {
              const isBudgetActive = activeBudgets[cat.name] !== false;
              return (
                <View key={cat.name} style={[styles.editBudgetRow, darkMode && { borderBottomColor: 'rgba(255,255,255,0.08)' }, !isBudgetActive && { opacity: 0.5 }]}>
                  <View style={[styles.transactionCategoryIcon, { backgroundColor: `${cat.color || '#10B981'}18` }]}>
                    <AppIcon name={cat.icon || 'other'} color={cat.color || green} size={21} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.editBudgetCatName, darkMode && { color: '#FFFFFF' }, !isBudgetActive && { textDecorationLine: 'line-through', color: '#94A3B8' }]}>
                      {cat.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: isBudgetActive ? green : '#EF4444', fontWeight: '700', marginTop: 2 }}>
                      {isBudgetActive ? 'Tracking Active' : 'Inactive'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {/* Active/Inactive Switch */}
                    <Switch
                      value={isBudgetActive}
                      onValueChange={(val) => handleToggleActive(cat.name, val)}
                      trackColor={{ false: '#CBD5E1', true: green }}
                      thumbColor="#FFFFFF"
                    />

                    {/* Limit Input Box */}
                    <View style={[styles.editBudgetInputBox, darkMode && { backgroundColor: '#040C08', borderColor: 'rgba(16,185,129,0.3)' }, !isBudgetActive && { opacity: 0.4 }]}>
                      <Text style={[styles.editBudgetCurrency, darkMode && { color: '#10B981' }]}>₹</Text>
                      <TextInput
                        value={inputBudgets[cat.name] || ''}
                        onChangeText={(text) => handleInputChange(cat.name, text)}
                        onFocus={() => handleFocus(index)}
                        accessibilityLabel={`${cat.name} monthly budget`}
                        keyboardType="numeric"
                        placeholder="0"
                        editable={isBudgetActive}
                        placeholderTextColor="#94A3B8"
                        style={[styles.editBudgetInput, darkMode && { color: '#FFFFFF' }]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
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
            <Pressable style={({ pressed }) => [styles.saveButton, { marginTop: 0 }, darkMode && { backgroundColor: '#10B981' }, pressed && styles.pressedButton]} onPress={handleSave} accessibilityRole="button" accessibilityLabel="Save category budgets">
              <Text style={[styles.saveButtonText, darkMode && { color: '#000000' }]}>Save Category Budgets</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
