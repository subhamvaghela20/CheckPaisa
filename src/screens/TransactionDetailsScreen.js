import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { AppIcon } from '../components/AppIcon';
import { categories } from '../data/appData';
import { formatDate, formatTime } from '../utils/date';
import { styles } from '../styles/styles';

export function TransactionDetailsScreen({ transaction, darkMode = false, onBack, onEdit, onDelete }) {
  const date = new Date(transaction.createdAt);

  const confirmDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(transaction.id) },
    ]);
  };

  return (
    <View style={[styles.detailsScreen, darkMode && { backgroundColor: '#040C08' }]}>
      <View style={styles.detailsHeader}>
        <Pressable style={[styles.detailBack, darkMode && { backgroundColor: 'rgba(15,27,21,0.85)' }]} onPress={onBack}>
          <AppIcon name="back" color={darkMode ? '#10B981' : '#334155'} size={24} />
        </Pressable>
        <Text style={[styles.detailsTitle, darkMode && { color: '#FFF' }]}>Transaction Details</Text>
        <Pressable onPress={onEdit}>
          <Text style={[styles.editAction, darkMode && { color: '#10B981' }]}>Edit</Text>
        </Pressable>
      </View>
      <View style={[styles.detailCard, darkMode && { backgroundColor: 'rgba(15,27,21,0.85)', borderColor: 'rgba(16,185,129,0.3)', borderWidth: 1 }]}>
        <View style={[styles.detailPill, transaction.type === 'Income' && styles.detailIncomePill]}>
          <Text style={[styles.detailPillText, transaction.type === 'Income' && styles.detailIncomeText]}>{transaction.type}</Text>
        </View>
        <View style={[styles.detailCategoryCircle, darkMode && { backgroundColor: '#040C08' }]}>
          <AppIcon name={categories.find((item) => item.name === transaction.category)?.icon || 'other'} color="#10B981" size={29} />
        </View>
        <Text style={[styles.detailCategory, darkMode && { color: '#FFF' }]}>{transaction.category}</Text>
        <Text style={[styles.detailAmount, transaction.type === 'Income' && styles.incomeAmount]}>
          {transaction.type === 'Expense' ? '-' : '+'}₹{transaction.amount.toLocaleString('en-IN')}
        </Text>
        <View style={[styles.detailDivider, darkMode && { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
        {[['Date', formatDate(date)], ['Time', formatTime(date)], ['Category', transaction.category], ['Notes', transaction.note || 'No note added'], ['Type', transaction.type]].map(([label, value]) => (
          <View key={label} style={styles.detailItem}>
            <Text style={[styles.detailItemLabel, darkMode && { color: '#94A3B8' }]}>{label}</Text>
            <Text style={[styles.detailItemValue, darkMode && { color: '#FFF' }]}>{value}</Text>
          </View>
        ))}
        <Pressable style={styles.deleteButton} onPress={confirmDelete}>
          <Text style={styles.deleteButtonText}>Delete Transaction</Text>
        </Pressable>
      </View>
    </View>
  );
}
