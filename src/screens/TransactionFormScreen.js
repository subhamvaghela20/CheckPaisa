import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppIcon } from '../components/AppIcon';
import { categories as defaultCategories } from '../data/appData';
import { formatDate, formatTime } from '../utils/date';
import { styles } from '../styles/styles';

export function TransactionFormScreen({
  transaction,
  categories = defaultCategories,
  wallets = [],
  activeWalletId = 'default_wallet',
  darkMode = false,
  onClose,
  onSave,
}) {
  const insets = useSafeAreaInsets();
  const editing = Boolean(transaction);
  const [type, setType] = useState(transaction?.type || 'Expense');
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [category, setCategory] = useState(transaction?.category || 'Food');
  const [walletId, setWalletId] = useState(
    transaction?.walletId || activeWalletId || (wallets.length > 0 ? wallets[0].id : 'default_wallet')
  );
  const [note, setNote] = useState(transaction?.note || '');
  const [transactionDate, setTransactionDate] = useState(transaction?.createdAt ? new Date(transaction.createdAt) : new Date());
  const [pickerMode, setPickerMode] = useState(null);
  const scrollViewRef = useRef(null);

  const availableCategories = categories && categories.length > 0 ? categories : defaultCategories;
  const filteredCategories = availableCategories.filter((item) => item.type === type);

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

  const save = () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return Alert.alert('Enter an amount', 'Please enter an amount greater than zero.');

    const targetWalletId = walletId || activeWalletId || (wallets.length > 0 ? wallets[0].id : 'default_wallet');
    const typeLabel = type === 'Income' ? 'Income' : 'Expense';

    Alert.alert(
      'Success',
      `${typeLabel} entry added successfully!`,
      [
        {
          text: 'OK',
          onPress: () => {
            onSave({
              id: transaction?.id || String(Date.now()),
              type,
              amount: numericAmount,
              category,
              note: note.trim(),
              createdAt: transactionDate.toISOString(),
              walletId: targetWalletId,
            });
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.formScreen, darkMode && { backgroundColor: '#040C08' }]}>
        <View style={[styles.formHero, darkMode && { backgroundColor: '#0B2E21' }]}>
          <View style={styles.formHeader}>
            <Pressable style={styles.formClose} onPress={onClose}>
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
            />
          </View>
        </View>
        <View style={[styles.formPanel, { flex: 1 }, darkMode && { backgroundColor: '#091510' }]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.formPanelContent}
            contentContainerStyle={[styles.formPanelContentInner, { paddingBottom: 20 }]}
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
            <View style={styles.dateTimeRow}>
              <Pressable style={[styles.dateTimeButton, darkMode && { backgroundColor: '#040C08', borderColor: 'rgba(16,185,129,0.2)' }]} onPress={() => setPickerMode('date')}>
                <Text style={[styles.dateTimeLabel, darkMode && { color: '#94A3B8' }]}>Date</Text>
                <Text style={[styles.dateTimeValue, darkMode && { color: '#FFF' }]}>{formatDate(transactionDate)}</Text>
              </Pressable>
              <Pressable style={[styles.dateTimeButton, darkMode && { backgroundColor: '#040C08', borderColor: 'rgba(16,185,129,0.2)' }]} onPress={() => setPickerMode('time')}>
                <Text style={[styles.dateTimeLabel, darkMode && { color: '#94A3B8' }]}>Time</Text>
                <Text style={[styles.dateTimeValue, darkMode && { color: '#FFF' }]}>{formatTime(transactionDate)}</Text>
              </Pressable>
            </View>
            {pickerMode && <DateTimePicker value={transactionDate} mode={pickerMode} display="default" onChange={updateDate} />}

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

            <Text style={[styles.categoryHeading, darkMode && { color: '#FFF' }]}>{type} Category</Text>
            <View style={styles.categoryGrid}>
              {filteredCategories.map((item) => {
                const isSelected = category === item.name;
                const catColor = item.color || '#64748B';

                return (
                  <Pressable key={item.name} style={styles.categoryChoice} onPress={() => setCategory(item.name)}>
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
            <Pressable style={({ pressed }) => [styles.saveButton, { marginTop: 0 }, darkMode && { backgroundColor: '#10B981' }, pressed && styles.pressedButton]} onPress={save}>
              <Text style={[styles.saveButtonText, darkMode && { color: '#000' }]}>{editing ? 'Save Changes' : 'Add Transaction'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
