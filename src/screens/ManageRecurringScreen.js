import React from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../components/AppIcon';
import { categories as defaultCategories } from '../data/appData';
import { formatDate } from '../utils/date';
import { green, styles } from '../styles/styles';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const getFrequencyLabel = (rule) => {
  if (rule.frequency === 'Weekly' && rule.repeatDayOfWeek !== undefined && rule.repeatDayOfWeek !== null) {
    return `Weekly (${DAYS[rule.repeatDayOfWeek] || 'Sun'})`;
  }
  if (rule.frequency === 'Monthly' && rule.repeatDayOfMonth !== undefined && rule.repeatDayOfMonth !== null) {
    const day = rule.repeatDayOfMonth;
    const suffix = (day % 10 === 1 && day !== 11) ? 'st' : (day % 10 === 2 && day !== 12) ? 'nd' : (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
    return `Monthly (${day}${suffix})`;
  }
  return rule.frequency;
};

export function ManageRecurringScreen({
  recurringRules = [],
  categories = defaultCategories,
  darkMode = false,
  onClose,
  onToggleRule,
  onDeleteRule,
  onEditRule,
}) {
  const insets = useSafeAreaInsets();

  const confirmDelete = (ruleId) => {
    Alert.alert(
      'Delete Recurring Rule',
      'Are you sure you want to delete this recurring rule? Future recurring entries will no longer be generated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteRule?.(ruleId),
        },
      ]
    );
  };

  return (
    <View style={[styles.detailsScreen, { paddingTop: insets.top }, darkMode && { backgroundColor: '#040C08' }]}>
      {/* Top Header */}
      <View style={styles.detailsHeader}>
        <Pressable
          style={[styles.detailBack, darkMode && { backgroundColor: 'rgba(15,27,21,0.85)' }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <AppIcon name="back" color={darkMode ? '#10B981' : '#334155'} size={24} />
        </Pressable>
        <Text style={[styles.detailsTitle, darkMode && { color: '#FFF' }]}>Recurring Rules</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {recurringRules.length === 0 ? (
          <View style={[styles.emptyTransactions, darkMode && { backgroundColor: 'rgba(15,27,21,0.7)', borderColor: 'rgba(16,185,129,0.2)' }]}>
            <View style={styles.emptyIcon}>
              <Text style={{ fontSize: 24 }}>🔄</Text>
            </View>
            <Text style={[styles.emptyTitle, darkMode && { color: '#FFF' }]}>No Recurring Rules</Text>
            <Text style={styles.emptyMessage}>
              You haven't set up any recurring transactions yet. When creating a transaction, enable "Make Recurring" to automatically repeat it.
            </Text>
          </View>
        ) : (
          recurringRules.map((rule) => {
            const catObj = categories.find((c) => c.name === rule.category);
            const iconColor = rule.type === 'Income' ? '#10B981' : '#EF4444';
            const isActive = rule.isActive !== false;

            return (
              <View
                key={rule.id}
                style={[
                  {
                    backgroundColor: darkMode ? 'rgba(15,27,21,0.85)' : '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: darkMode ? 'rgba(16,185,129,0.2)' : '#E2E8F0',
                  },
                  !isActive && { opacity: 0.6 },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View
                      style={[
                        styles.transactionCategoryIcon,
                        { backgroundColor: rule.type === 'Income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                      ]}
                    >
                      <AppIcon name={catObj?.icon || 'other'} color={iconColor} size={20} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[{ fontSize: 16, fontWeight: '700', color: '#1E293B' }, darkMode && { color: '#FFF' }]}>
                          {rule.category}
                        </Text>
                        <View style={{ backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                          <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '800' }}>{getFrequencyLabel(rule)}</Text>
                        </View>
                      </View>
                      {rule.note ? (
                        <Text style={[{ fontSize: 12, color: '#64748B', marginTop: 2 }, darkMode && { color: '#94A3B8' }]}>
                          {rule.note}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <Text style={[{ fontSize: 16, fontWeight: '800', color: rule.type === 'Income' ? '#10B981' : '#EF4444' }]}>
                    {rule.type === 'Expense' ? '-' : '+'}₹{Number(rule.amount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Date range details */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justify: 'space-between',
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: darkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 11, color: '#94A3B8' }]}>
                      📅 {formatDate(new Date(rule.fromDate))} → {formatDate(new Date(rule.toDate))}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Switch
                      value={isActive}
                      onValueChange={() => onToggleRule?.(rule.id)}
                      trackColor={{ false: '#CBD5E1', true: green }}
                      thumbColor="#FFFFFF"
                    />

                    <Pressable
                      onPress={() => onEditRule?.(rule)}
                      style={{ padding: 4 }}
                      accessibilityRole="button"
                      accessibilityLabel="Edit rule"
                    >
                      <Text style={{ fontSize: 16 }}>✏️</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => confirmDelete(rule.id)}
                      style={{ padding: 4 }}
                      accessibilityRole="button"
                      accessibilityLabel="Delete rule"
                    >
                      <Text style={{ fontSize: 16 }}>🗑️</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
