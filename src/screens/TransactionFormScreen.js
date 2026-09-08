import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppIcon } from '../components/AppIcon';
import { categories as defaultCategories } from '../data/appData';
import { formatDate, formatTime } from '../utils/date';
import { green, styles } from '../styles/styles';

export function TransactionFormScreen({
  transaction,
  recurringRules = [],
  categories = defaultCategories,
  wallets = [],
  activeWalletId = 'default_wallet',
  darkMode = false,
  onClose,
  onSave,
}) {
  const insets = useSafeAreaInsets();
  const editing = Boolean(transaction);

  // Find matching recurring rule if editing a transaction linked to a rule or if editing a rule directly
  const matchingRule = React.useMemo(() => {
    if (!transaction) return null;
    if (transaction.frequency && (transaction.fromDate || transaction.toDate)) {
      return transaction; // transaction IS the recurring rule itself
    }
    if (transaction.recurringRuleId && recurringRules && recurringRules.length > 0) {
      const found = recurringRules.find((r) => r.id === transaction.recurringRuleId);
      if (found) return found;
    }
    if (transaction.recurringRule) {
      return transaction.recurringRule;
    }
    return null;
  }, [transaction, recurringRules]);

  const [type, setType] = useState(transaction?.type || matchingRule?.type || 'Expense');
  const [amount, setAmount] = useState(
    transaction?.amount !== undefined && transaction?.amount !== null
      ? String(transaction.amount)
      : matchingRule?.amount !== undefined && matchingRule?.amount !== null
      ? String(matchingRule.amount)
      : ''
  );
  const [category, setCategory] = useState(transaction?.category || matchingRule?.category || 'Food');
  const [walletId, setWalletId] = useState(
    transaction?.walletId || matchingRule?.walletId || activeWalletId || (wallets.length > 0 ? wallets[0].id : 'default_wallet')
  );
  const [note, setNote] = useState(transaction?.note || matchingRule?.note || '');

  const [transactionDate, setTransactionDate] = useState(() => {
    if (transaction?.createdAt) return new Date(transaction.createdAt);
    if (matchingRule?.fromDate) return new Date(matchingRule.fromDate);
    return new Date();
  });
  const [pickerMode, setPickerMode] = useState(null);

  // Recurring Transaction States
  const [isRecurring, setIsRecurring] = useState(
    Boolean(transaction?.isRecurring || matchingRule || transaction?.frequency)
  );

  const initialFromDate = React.useMemo(() => {
    if (matchingRule?.fromDate) return new Date(matchingRule.fromDate);
    if (transaction?.fromDate) return new Date(transaction.fromDate);
    if (transaction?.createdAt) return new Date(transaction.createdAt);
    return new Date();
  }, [matchingRule, transaction]);

  const initialToDate = React.useMemo(() => {
    if (matchingRule?.toDate) return new Date(matchingRule.toDate);
    if (transaction?.toDate) return new Date(transaction.toDate);
    const nextM = new Date(initialFromDate);
    nextM.setMonth(nextM.getMonth() + 1);
    return nextM;
  }, [matchingRule, transaction, initialFromDate]);

  const [recurringFrequency, setRecurringFrequency] = useState(
    matchingRule?.frequency || transaction?.frequency || 'Monthly'
  );
  const [recurringFromDate, setRecurringFromDate] = useState(initialFromDate);
  const [recurringToDate, setRecurringToDate] = useState(initialToDate);
  const [recurringPickerMode, setRecurringPickerMode] = useState(null);

  const [repeatDayOfWeek, setRepeatDayOfWeek] = useState(() => {
    if (matchingRule?.repeatDayOfWeek !== undefined && matchingRule?.repeatDayOfWeek !== null) return matchingRule.repeatDayOfWeek;
    if (transaction?.repeatDayOfWeek !== undefined && transaction?.repeatDayOfWeek !== null) return transaction.repeatDayOfWeek;
    return initialFromDate.getDay();
  });

  const [repeatDayOfMonth, setRepeatDayOfMonth] = useState(() => {
    if (matchingRule?.repeatDayOfMonth !== undefined && matchingRule?.repeatDayOfMonth !== null) return matchingRule.repeatDayOfMonth;
    if (transaction?.repeatDayOfMonth !== undefined && transaction?.repeatDayOfMonth !== null) return transaction.repeatDayOfMonth;
    return initialFromDate.getDate();
  });

  const scrollViewRef = useRef(null);

  const availableCategories = categories && categories.length > 0 ? categories : defaultCategories;
  const filteredCategories = availableCategories.filter((item) => item.type === type && item.isActive !== false);

  useEffect(() => {
    if (!walletId && wallets.length > 0) {
      const defaultW = wallets.find((w) => w.id === activeWalletId) || wallets[0];
      if (defaultW) setWalletId(defaultW.id);
    }
  }, [wallets, activeWalletId]);

  useEffect(() => {
    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => {
      keyboardHideListener.remove();
    };
  }, []);

  const handleTypeChange = (newType) => {
    setType(newType);
    const available = availableCategories.filter((item) => item.type === newType);
    if (available.length > 0 && !available.some((item) => item.name === category)) {
      setCategory(available[0].name);
    }
  };

  const updateDate = (_, selectedDate) => {
    setPickerMode(null);
    if (selectedDate) setTransactionDate(selectedDate);
  };

  const updateRecurringDate = (_, selectedDate) => {
    if (recurringPickerMode === 'fromDate' && selectedDate) {
      setRecurringFromDate(selectedDate);
      setRepeatDayOfWeek(selectedDate.getDay());
      setRepeatDayOfMonth(selectedDate.getDate());
      if (selectedDate > recurringToDate) {
        const nextM = new Date(selectedDate);
        nextM.setMonth(nextM.getMonth() + 1);
        setRecurringToDate(nextM);
      }
    } else if (recurringPickerMode === 'toDate' && selectedDate) {
      setRecurringToDate(selectedDate);
    }
    setRecurringPickerMode(null);
  };

  const save = () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return Alert.alert('Enter an amount', 'Please enter an amount greater than zero.');

    if (isRecurring && recurringFromDate > recurringToDate) {
      return Alert.alert('Invalid Date Range', 'Start Date cannot be after End Date.');
    }

    const targetWalletId = walletId || activeWalletId || (wallets.length > 0 ? wallets[0].id : 'default_wallet');
    const typeLabel = type === 'Income' ? 'Income' : 'Expense';

    const ruleId = matchingRule?.id || transaction?.recurringRuleId || `rule_${Date.now()}`;

    const recurringRule = isRecurring ? {
      id: ruleId,
      type,
      amount: numericAmount,
      category,
      walletId: targetWalletId,
      note: note.trim(),
      frequency: recurringFrequency,
      fromDate: recurringFromDate.toISOString(),
      toDate: recurringToDate.toISOString(),
      repeatDayOfWeek: recurringFrequency === 'Weekly' ? repeatDayOfWeek : undefined,
      repeatDayOfMonth: recurringFrequency === 'Monthly' ? repeatDayOfMonth : undefined,
      isActive: matchingRule ? matchingRule.isActive !== false : true,
      createdAt: (matchingRule?.createdAt ? new Date(matchingRule.createdAt) : transactionDate).toISOString(),
    } : null;

    const savedTransaction = {
      id: (transaction?.id && transaction?.id !== ruleId) ? transaction.id : String(Date.now()),
      type,
      amount: numericAmount,
      category,
      note: note.trim(),
      createdAt: isRecurring ? recurringFromDate.toISOString() : transactionDate.toISOString(),
      walletId: targetWalletId,
      isRecurring,
      recurringRuleId: isRecurring ? ruleId : undefined,
    };

    Alert.alert(
      editing ? 'Transaction updated' : 'Transaction added',
      editing ? 'Your changes have been saved.' : `${typeLabel} entry ${isRecurring ? 'and recurring schedule ' : ''}added successfully!`,
      [
        {
          text: 'OK',
          onPress: () => {
            onSave(savedTransaction, recurringRule);
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.formScreen, darkMode && { backgroundColor: '#040C08' }]}>
        <View style={[styles.formHero, darkMode && { backgroundColor: '#0B2E21' }]}>
          <View style={styles.formHeader}>
            <Pressable style={styles.formClose} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close transaction form" hitSlop={6}>
              <AppIcon name="back" size={20} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.formTitle}>{editing ? 'Edit Transaction' : 'Add Transaction'}</Text>
            <View style={styles.headerBlank} />
          </View>
          <Text style={styles.howMuch}>Enter Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.amountInput}
              autoFocus
              selectionColor="#FFFFFF"
              accessibilityLabel="Transaction amount"
            />
          </View>
        </View>
        <View style={[styles.formPanel, { flex: 1 }, darkMode && { backgroundColor: '#091510' }]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.formPanelContent}
            contentContainerStyle={[styles.formPanelContentInner, { paddingBottom: 110 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.typeToggle, darkMode && { backgroundColor: '#040C08', borderColor: 'rgba(16,185,129,0.2)', borderWidth: 1 }]}>
              <Pressable style={[styles.typeOption, type === 'Expense' && (darkMode ? { backgroundColor: '#EF4444' } : styles.selectedType)]} onPress={() => handleTypeChange('Expense')}>
                <Text style={[styles.typeText, type === 'Expense' && (darkMode ? { color: '#FFF', fontWeight: '800' } : styles.expenseTypeText)]}>Expense</Text>
              </Pressable>
              <Pressable style={[styles.typeOption, type === 'Income' && (darkMode ? { backgroundColor: '#10B981' } : styles.selectedType)]} onPress={() => handleTypeChange('Income')}>
                <Text style={[styles.typeText, type === 'Income' && (darkMode ? { color: '#000', fontWeight: '800' } : styles.incomeTypeText)]}>Income</Text>
              </Pressable>
            </View>
            {!isRecurring && (
              <>
                <View style={styles.dateTimeRow}>
                  <Pressable style={[styles.dateTimeButton, darkMode && { backgroundColor: '#040C08', borderColor: 'rgba(16,185,129,0.2)' }]} onPress={() => setPickerMode('date')} accessibilityRole="button" accessibilityLabel="Select transaction date">
                    <Text style={[styles.dateTimeLabel, darkMode && { color: '#94A3B8' }]}>Date</Text>
                    <Text style={[styles.dateTimeValue, darkMode && { color: '#FFF' }]}>{formatDate(transactionDate)}</Text>
                  </Pressable>
                  <Pressable style={[styles.dateTimeButton, darkMode && { backgroundColor: '#040C08', borderColor: 'rgba(16,185,129,0.2)' }]} onPress={() => setPickerMode('time')} accessibilityRole="button" accessibilityLabel="Select transaction time">
                    <Text style={[styles.dateTimeLabel, darkMode && { color: '#94A3B8' }]}>Time</Text>
                    <Text style={[styles.dateTimeValue, darkMode && { color: '#FFF' }]}>{formatTime(transactionDate)}</Text>
                  </Pressable>
                </View>
                {pickerMode && <DateTimePicker value={transactionDate} mode={pickerMode} display="default" onChange={updateDate} />}
              </>
            )}

            {/* Wallet Selection Pill List */}
            {wallets.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.dateTimeLabel, { marginBottom: 6 }, darkMode && { color: '#94A3B8' }]}>Wallet / Account</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {wallets.map((w) => {
                    const isSel = w.id === walletId;
                    return (
                      <Pressable
                        key={w.id}
                        onPress={() => setWalletId(w.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSel }}
                        accessibilityLabel={`Select wallet ${w.name}`}
                        style={[
                          styles.walletPill,
                          { backgroundColor: darkMode ? 'rgba(4,12,8,0.8)' : '#F1F5F9', borderColor: '#CBD5E1' },
                          isSel && { backgroundColor: '#10B981', borderColor: '#10B981' },
                        ]}
                      >
                        <Text style={[styles.walletPillText, { color: darkMode ? '#94A3B8' : '#334155' }, isSel && { color: '#FFF', fontWeight: '800' }]}>
                          {w.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Recurring Transaction Section */}
            <View
              style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 16,
                backgroundColor: isRecurring
                  ? (darkMode ? 'rgba(16,185,129,0.12)' : '#F0FDF4')
                  : (darkMode ? '#040C08' : '#F8FAFC'),
                borderWidth: 1.5,
                borderColor: isRecurring
                  ? green
                  : (darkMode ? 'rgba(16,185,129,0.2)' : '#E2E8F0'),
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: isRecurring ? green : (darkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0'),
                      alignItems: 'center',
                      justify: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>🔄</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: darkMode ? '#FFF' : '#1E293B' }}>
                      Make Recurring Entry
                    </Text>
                    <Text style={{ fontSize: 11, color: darkMode ? '#94A3B8' : '#64748B', marginTop: 1 }}>
                      Auto-generate entries automatically
                    </Text>
                  </View>
                </View>

                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ false: darkMode ? '#334155' : '#CBD5E1', true: green }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel="Make transaction recurring"
                />
              </View>

                {isRecurring && (
                  <View style={{ marginTop: 14 }}>
                    {/* Frequency Selector */}
                    <Text style={{ fontSize: 12, fontWeight: '700', color: darkMode ? '#A7F3D0' : '#475569', marginBottom: 6 }}>
                      Repeat Frequency
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      {['Daily', 'Weekly', 'Monthly'].map((freq) => {
                        const isSel = recurringFrequency === freq;
                        return (
                          <Pressable
                            key={freq}
                            onPress={() => setRecurringFrequency(freq)}
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              borderRadius: 10,
                              alignItems: 'center',
                              backgroundColor: isSel ? green : darkMode ? '#091510' : '#E2E8F0',
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '800', color: isSel ? '#FFF' : darkMode ? '#94A3B8' : '#334155' }}>
                              {freq}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Day of Week Selector for Weekly */}
                    {recurringFrequency === 'Weekly' && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: darkMode ? '#A7F3D0' : '#475569', marginBottom: 6 }}>
                          Repeat Day of Week
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'space-between' }}>
                          {[
                            { label: 'Sun', value: 0 },
                            { label: 'Mon', value: 1 },
                            { label: 'Tue', value: 2 },
                            { label: 'Wed', value: 3 },
                            { label: 'Thu', value: 4 },
                            { label: 'Fri', value: 5 },
                            { label: 'Sat', value: 6 },
                          ].map((day) => {
                            const isSelected = repeatDayOfWeek === day.value;
                            return (
                              <Pressable
                                key={day.label}
                                onPress={() => setRepeatDayOfWeek(day.value)}
                                style={{
                                  flex: 1,
                                  paddingVertical: 7,
                                  borderRadius: 8,
                                  alignItems: 'center',
                                  backgroundColor: isSelected ? green : darkMode ? '#091510' : '#FFF',
                                  borderWidth: isSelected ? 0 : 1,
                                  borderColor: darkMode ? 'rgba(16,185,129,0.3)' : '#CBD5E1',
                                }}
                              >
                                <Text style={{ fontSize: 11, fontWeight: '800', color: isSelected ? '#FFF' : darkMode ? '#94A3B8' : '#334155' }}>
                                  {day.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* Day of Month Selector for Monthly */}
                    {recurringFrequency === 'Monthly' && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: darkMode ? '#A7F3D0' : '#475569', marginBottom: 6 }}>
                          Repeat Date of Month ({repeatDayOfMonth}th)
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                            const isSelected = repeatDayOfMonth === dayNum;
                            return (
                              <Pressable
                                key={dayNum}
                                onPress={() => setRepeatDayOfMonth(dayNum)}
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 18,
                                  alignItems: 'center',
                                  justify: 'center',
                                  backgroundColor: isSelected ? green : darkMode ? '#091510' : '#FFF',
                                  borderWidth: isSelected ? 0 : 1,
                                  borderColor: darkMode ? 'rgba(16,185,129,0.3)' : '#CBD5E1',
                                }}
                              >
                                <Text style={{ fontSize: 12, fontWeight: '800', color: isSelected ? '#FFF' : darkMode ? '#94A3B8' : '#334155' }}>
                                  {dayNum}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}

                    {/* From Date & To Date Pickers */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Pressable
                        style={{
                          flex: 1,
                          padding: 10,
                          borderRadius: 10,
                          backgroundColor: darkMode ? '#091510' : '#FFF',
                          borderWidth: 1,
                          borderColor: darkMode ? 'rgba(16,185,129,0.3)' : '#CBD5E1',
                        }}
                        onPress={() => setRecurringPickerMode('fromDate')}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: darkMode ? '#94A3B8' : '#64748B' }}>
                          Start Date
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: darkMode ? '#FFF' : '#0F172A', marginTop: 2 }}>
                          {formatDate(recurringFromDate)}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={{
                          flex: 1,
                          padding: 10,
                          borderRadius: 10,
                          backgroundColor: darkMode ? '#091510' : '#FFF',
                          borderWidth: 1,
                          borderColor: darkMode ? 'rgba(16,185,129,0.3)' : '#CBD5E1',
                        }}
                        onPress={() => setRecurringPickerMode('toDate')}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: darkMode ? '#94A3B8' : '#64748B' }}>
                          End Date
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: darkMode ? '#FFF' : '#0F172A', marginTop: 2 }}>
                          {formatDate(recurringToDate)}
                        </Text>
                      </Pressable>
                    </View>

                    {recurringPickerMode && (
                      <DateTimePicker
                        value={recurringPickerMode === 'fromDate' ? recurringFromDate : recurringToDate}
                        mode="date"
                        display="default"
                        onChange={updateRecurringDate}
                      />
                    )}
                  </View>
                )}
              </View>

            <Text style={[styles.categoryHeading, darkMode && { color: '#FFF' }]}>{type} Category</Text>
            <View style={styles.categoryGrid}>
              {filteredCategories.map((item) => {
                const isSelected = category === item.name;
                const catColor = item.color || '#64748B';

                return (
                  <Pressable key={item.name} style={styles.categoryChoice} onPress={() => setCategory(item.name)} accessibilityRole="radio" accessibilityState={{ selected: isSelected }} accessibilityLabel={`${item.name} category`}>
                    <View
                      style={[
                        styles.categoryCircle,
                        darkMode && { backgroundColor: '#040C08', borderColor: 'rgba(16,185,129,0.2)' },
                        isSelected && { borderColor: catColor, borderWidth: 2, backgroundColor: darkMode ? 'rgba(16,185,129,0.15)' : '#FFF7ED' },
                      ]}
                    >
                      <AppIcon name={item.icon || 'other'} color={catColor} size={24} />
                    </View>
                    <Text style={[styles.categoryName, darkMode && { color: '#94A3B8' }, isSelected && { color: catColor, fontWeight: '800' }]}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add note (optional)"
              placeholderTextColor="#94A3B8"
              style={[styles.noteInput, darkMode && { backgroundColor: '#040C08', borderColor: 'rgba(16,185,129,0.2)', color: '#FFF' }]}
              multiline
              onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120)}
              accessibilityLabel="Transaction note"
            />
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
            <Pressable style={({ pressed }) => [styles.saveButton, { marginTop: 0 }, darkMode && { backgroundColor: '#10B981' }, pressed && styles.pressedButton]} onPress={save} accessibilityRole="button" accessibilityLabel="Save transaction">
              <Text style={[styles.saveButtonText, darkMode && { color: '#000' }]}>{editing ? 'Save Changes' : 'Add Transaction'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
