import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../components/AppIcon';
import { categories as defaultCategories } from '../data/appData';
import { green, styles } from '../styles/styles';

export function EditBudgetScreen({ budgets: budgetsProp, categories = defaultCategories, darkMode = false, onBack, onSaveBudgets }) {
  const budgets = budgetsProp || {};
  const insets = useSafeAreaInsets();
  const expenseCategories = (categories?.length > 0 ? categories : defaultCategories).filter((c) => c.type === 'Expense');
  const scrollViewRef = useRef(null);
  const rowOffsets = useRef({});
  const headerHeight = useRef(0);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Keep the user's position after dismissing the keyboard.
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
      initial[cat.name] = cat.isActive !== false && getIsActive(budgets[cat.name]);
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
      y: Math.max(0, (rowOffsets.current[index] || 0) + headerHeight.current - 20),
      animated: true,
    });
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (Object.values(inputBudgets).some((value) => value && !Number.isFinite(Number(value)))) {
      Alert.alert('Invalid budget', 'Enter a finite budget amount.');
      return;
    }
    const parsedBudgets = {};
    expenseCategories.forEach((cat) => {
      const num = Number(inputBudgets[cat.name]);
      const isAct = activeBudgets[cat.name] !== false;
      if (Number.isFinite(num) && (num > 0 || isAct === false)) {
        parsedBudgets[cat.name] = {
          amount: num > 0 ? num : 0,
          isActive: isAct,
        };
      }
    });
    savingRef.current = true;
    setSaving(true);
    try { await onSaveBudgets(parsedBudgets); }
    catch { Alert.alert('Could not save budgets', 'Please free device storage and try again.'); }
    finally { savingRef.current = false; setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.formScreen, darkMode && { backgroundColor: '#040C08' }]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.formPanelContent}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

        <View onLayout={(event) => { headerHeight.current = event.nativeEvent.layout.height; }} style={[styles.formHero, darkMode && { backgroundColor: '#0B2E21' }]}>
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

        <View style={[styles.formPanel, { flex: 0, padding: 20 }, darkMode && { backgroundColor: '#091510' }]}>
            {expenseCategories.map((cat, index) => {
              const isBudgetActive = activeBudgets[cat.name] !== false;
              return (
                <View key={cat.name} onLayout={(event) => { rowOffsets.current[index] = event.nativeEvent.layout.y; }} style={[styles.editBudgetRow, { flexWrap: 'wrap', gap: 8 }, darkMode && { borderBottomColor: 'rgba(255,255,255,0.08)' }, !isBudgetActive && { opacity: 0.5 }]}>
                  <View style={[styles.transactionCategoryIcon, { backgroundColor: `${cat.color || '#10B981'}18` }]}>
                    <AppIcon name={cat.icon || 'other'} color={cat.color || green} size={21} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.editBudgetCatName, { flex: 0, marginLeft: 0 }, darkMode && { color: '#FFFFFF' }, !isBudgetActive && { textDecorationLine: 'line-through', color: '#94A3B8' }]}>
                      {cat.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: isBudgetActive ? green : '#EF4444', fontWeight: '700', marginTop: 2 }}>
                      {cat.isActive === false ? 'Category inactive — enable in Profile' : isBudgetActive ? 'Budget active' : 'Budget paused'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
                    {/* Active/Inactive Switch */}
                    <Switch
                      value={isBudgetActive}
                      disabled={cat.isActive === false}
                      accessibilityLabel={`Activate ${cat.name} budget`}
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
        </View>
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
            <Pressable disabled={saving} style={({ pressed }) => [styles.saveButton, { marginTop: 0 }, darkMode && { backgroundColor: '#10B981' }, pressed && styles.pressedButton]} onPress={handleSave} accessibilityRole="button" accessibilityLabel="Save category budgets">
              <Text style={[styles.saveButtonText, darkMode && { color: '#000000' }]}>{saving ? 'Saving…' : 'Save Category Budgets'}</Text>
            </Pressable>
          </View>
      </View>
    </KeyboardAvoidingView>
  );
}
