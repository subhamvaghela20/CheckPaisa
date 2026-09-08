import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../components/AppIcon';
import { categories as defaultCategories } from '../data/appData';
import { formatDate, formatTime } from '../utils/date';
import { styles } from '../styles/styles';

export function TransactionDetailsScreen({ transaction, categories = defaultCategories, darkMode = false, onBack, onEdit, onDelete }) {
  const insets = useSafeAreaInsets();
  const date = new Date(transaction?.createdAt || Date.now());
  const isIncome = transaction?.type === 'Income';
  const iconColor = isIncome ? '#10B981' : '#EF4444';
  const catObj = categories.find((item) => item.name === transaction?.category);

  const confirmDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(transaction.id) },
    ]);
  };

  return (
    <View style={[{ flex: 1, backgroundColor: darkMode ? '#040C08' : '#F8FAFC', paddingTop: 12 }]}>
      {/* Header */}
      <View style={styles.detailsHeader}>
        <Pressable
          style={[styles.detailBack, darkMode && { backgroundColor: 'rgba(15,27,21,0.85)' }]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <AppIcon name="back" color={darkMode ? '#10B981' : '#334155'} size={24} />
        </Pressable>
        <Text style={[styles.detailsTitle, darkMode && { color: '#FFF' }]}>Transaction Details</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.detailCard,
            { padding: 20 },
            darkMode && { backgroundColor: 'rgba(15,27,21,0.85)', borderColor: 'rgba(16,185,129,0.3)', borderWidth: 1 },
          ]}
        >
          {/* Top Hero Row: Category Icon + Category Name + Amount (all in one line, centered) */}
          <View style={{ marginBottom: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: isIncome ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name={catObj?.icon || 'other'} color={iconColor} size={22} />
              </View>
              <Text
                style={[{ fontSize: 18, fontWeight: '700', color: '#1E293B', flexShrink: 1 }, darkMode && { color: '#FFF' }]}
                numberOfLines={1}
              >
                {transaction.category}
              </Text>
            </View>

            <Text style={[{ fontSize: 20, fontWeight: '800', color: iconColor }]}>
              {isIncome ? '+' : '-'}₹{Number(transaction.amount || 0).toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.detailDivider, darkMode && { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

          {/* Combined Date & Time Row */}
          <View style={styles.detailItem}>
            <Text style={[styles.detailItemLabel, darkMode && { color: '#94A3B8' }]}>Date & Time</Text>
            <Text style={[styles.detailItemValue, darkMode && { color: '#FFF' }]}>
              {formatDate(date)} • {formatTime(date)}
            </Text>
          </View>

          {/* Recurring Row */}
          <View style={styles.detailItem}>
            <Text style={[styles.detailItemLabel, darkMode && { color: '#94A3B8' }]}>Recurring</Text>
            <Text style={[styles.detailItemValue, darkMode && { color: '#FFF' }]}>
              {transaction.isRecurring ? 'Yes 🔄' : 'No'}
            </Text>
          </View>

          {/* Scrollable Notes Section */}
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.detailItemLabel, darkMode && { color: '#94A3B8' }]}>Notes</Text>
            <View
              style={[
                {
                  marginTop: 6,
                  backgroundColor: darkMode ? 'rgba(4, 12, 8, 0.6)' : '#F8FAFC',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: darkMode ? 'rgba(16, 185, 129, 0.2)' : '#E2E8F0',
                  maxHeight: 120,
                },
              ]}
            >
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                <Text style={[{ fontSize: 14, color: '#334155', lineHeight: 20 }, darkMode && { color: '#E2E8F0' }]}>
                  {transaction.note || 'No note added'}
                </Text>
              </ScrollView>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Buttons (Edit & Delete side by side with Safe Area padding) */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom + 12, 16),
          backgroundColor: darkMode ? '#040C08' : '#F8FAFC',
          borderTopWidth: 1,
          borderTopColor: darkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
          flexDirection: 'row',
          gap: 12,
        }}
      >
        <Pressable
          style={{
            flex: 1,
            height: 48,
            borderRadius: 14,
            backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.2)' : '#E6F4EA',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            borderWidth: 1,
            borderColor: darkMode ? 'rgba(16, 185, 129, 0.4)' : '#10B981',
          }}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel="Edit"
        >
          <AppIcon name="edit" color={darkMode ? '#10B981' : '#0D9488'} size={18} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: darkMode ? '#10B981' : '#0D9488' }}>Edit</Text>
        </Pressable>

        <Pressable
          style={{
            flex: 1,
            height: 48,
            borderRadius: 14,
            backgroundColor: '#EF4444',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
          onPress={confirmDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete"
        >
          <AppIcon name="delete" color="#FFFFFF" size={18} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}
