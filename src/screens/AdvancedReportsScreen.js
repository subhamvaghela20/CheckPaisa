import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../components/AppIcon';
import { categories } from '../data/appData';
import { green, styles } from '../styles/styles';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function AdvancedReportsScreen({ transactions = [], darkMode = false, onBack, onOpenTransaction }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth();

  const changeMonth = (offset) => {
    setCurrentDate(new Date(selectedYear, selectedMonth + offset, 1));
  };

  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.createdAt);
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
  });

  const currentMonthExpenses = currentMonthTransactions.filter((t) => t.type === 'Expense');
  const currentMonthIncome = currentMonthTransactions.filter((t) => t.type === 'Income');

  const currentExpenseTotal = currentMonthExpenses.reduce((s, t) => s + t.amount, 0);
  const currentIncomeTotal = currentMonthIncome.reduce((s, t) => s + t.amount, 0);

  const prevDate = new Date(selectedYear, selectedMonth - 1, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth();

  const prevMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.createdAt);
    return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
  });

  const prevExpenseTotal = prevMonthTransactions.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
  const prevIncomeTotal = prevMonthTransactions.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0);

  const weeklyData = DAY_LABELS.map((dayLabel, index) => {
    const targetDayIndex = index === 6 ? 0 : index + 1;
    const daySpent = currentMonthExpenses
      .filter((t) => new Date(t.createdAt).getDay() === targetDayIndex)
      .reduce((s, t) => s + t.amount, 0);
    return { day: dayLabel, amount: daySpent };
  });

  const maxWeeklyAmount = Math.max(...weeklyData.map((w) => w.amount), 1);
  const maxDayIndex = weeklyData.findIndex((w) => w.amount === maxWeeklyAmount && w.amount > 0);

  const topCategories = categories
    .filter((c) => c.type === 'Expense')
    .map((cat) => {
      const catSpent = currentMonthExpenses
        .filter((t) => t.category === cat.name)
        .reduce((s, t) => s + t.amount, 0);
      const percentage = currentExpenseTotal > 0 ? Math.round((catSpent / currentExpenseTotal) * 100) : 0;
      return { ...cat, total: catSpent, percentage };
    })
    .filter((cat) => cat.total > 0)
    .sort((a, b) => b.total - a.total);

  const formatShortValue = (val) => {
    if (val >= 1000) return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
    return `₹${val}`;
  };

  const maxIncomeCompare = Math.max(currentIncomeTotal, prevIncomeTotal, 1);
  const maxExpenseCompare = Math.max(currentExpenseTotal, prevExpenseTotal, 1);

  const innerContent = (
    <ScrollView style={styles.homeMainScroll} contentContainerStyle={styles.homeMainScrollContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.advancedHeaderRow}>
        <Pressable style={[styles.detailBack, darkMode && { backgroundColor: 'rgba(15,27,21,0.85)' }]} onPress={onBack}>
          <AppIcon name="back" color={darkMode ? '#10B981' : '#334155'} size={22} />
        </Pressable>

        <View style={styles.advancedTitleContainer}>
          <Text style={[styles.advancedHeaderTitle, darkMode && { color: '#FFF' }]}>Advanced</Text>
          <Text style={[styles.advancedHeaderSubtitle, darkMode && { color: '#10B981' }]}>Reports</Text>
        </View>

        <Pressable style={[styles.advancedMonthPill, darkMode && { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: '#10B981' }]} onPress={() => setShowMonthPicker(!showMonthPicker)}>
          <Text style={[styles.advancedMonthPillText, darkMode && { color: '#10B981' }]}>{`${SHORT_MONTHS[selectedMonth]} ${selectedYear}`}</Text>
          <Text style={[styles.advancedMonthChevron, darkMode && { color: '#10B981' }]}>˅</Text>
        </Pressable>
      </View>

      {/* Month Selector Controls Dropdown */}
      {showMonthPicker && (
        <View style={[styles.advancedMonthDropdown, darkMode && { backgroundColor: 'rgba(15,27,21,0.95)', borderColor: 'rgba(16,185,129,0.3)' }]}>
          <Pressable style={styles.monthNavButton} onPress={() => changeMonth(-1)}>
            <Text style={[styles.monthNavArrow, darkMode && { color: '#10B981' }]}>‹</Text>
          </Pressable>
          <Text style={[styles.monthLabel, darkMode && { color: '#FFF' }]}>{`${MONTH_NAMES[selectedMonth]} ${selectedYear}`}</Text>
          <Pressable style={styles.monthNavButton} onPress={() => changeMonth(1)}>
            <Text style={[styles.monthNavArrow, darkMode && { color: '#10B981' }]}>›</Text>
          </Pressable>
        </View>
      )}

      {/* 1. Weekly Spending Card */}
      <View style={[styles.advCard, darkMode && { backgroundColor: 'rgba(15,27,21,0.85)', borderColor: 'rgba(16,185,129,0.3)' }]}>
        <Text style={[styles.advCardTitle, darkMode && { color: '#FFF' }]}>Weekly Spending</Text>
        <View style={styles.weeklyChartContainer}>
          {weeklyData.map((item, idx) => {
            const heightPercent = maxWeeklyAmount > 0 ? (item.amount / maxWeeklyAmount) * 80 : 8;
            const isPeak = idx === maxDayIndex;
            return (
              <View key={item.day} style={styles.weeklyCol}>
                <Text style={[styles.weeklyValText, darkMode && { color: '#94A3B8' }]}>{item.amount > 0 ? formatShortValue(item.amount) : ''}</Text>
                <View style={[styles.weeklyBarTrack, darkMode && { backgroundColor: '#040C08' }]}>
                  <View
                    style={[
                      styles.weeklyBarFill,
                      {
                        height: Math.max(heightPercent, 8),
                        backgroundColor: isPeak ? green : item.amount > 0 ? '#10B981' : (darkMode ? '#1E293B' : '#F1F5F9'),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.weeklyDayText, darkMode && { color: '#94A3B8' }, isPeak && styles.weeklyDayTextActive]}>{item.day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 2. Month Comparison Card */}
      <View style={[styles.advCard, darkMode && { backgroundColor: 'rgba(15,27,21,0.85)', borderColor: 'rgba(16,185,129,0.3)' }]}>
        <Text style={[styles.advCardTitle, darkMode && { color: '#FFF' }]}>Month Comparison</Text>
        <View style={styles.compareLegendRow}>
          <View style={styles.legendBadge}>
            <View style={[styles.legendBox, { backgroundColor: darkMode ? '#475569' : '#CBD5E1' }]} />
            <Text style={[styles.legendBadgeText, darkMode && { color: '#94A3B8' }]}>{SHORT_MONTHS[prevMonth]}</Text>
          </View>
          <View style={styles.legendBadge}>
            <View style={[styles.legendBox, { backgroundColor: green }]} />
            <Text style={[styles.legendBadgeText, darkMode && { color: '#10B981' }]}>{SHORT_MONTHS[selectedMonth]}</Text>
          </View>
        </View>

        {/* Income Comparison */}
        <View style={styles.compareSection}>
          <View style={styles.compareHeader}>
            <Text style={[styles.compareLabel, darkMode && { color: '#FFF' }]}>Income</Text>
            <Text style={[styles.compareValues, darkMode && { color: '#94A3B8' }]}>
              {SHORT_MONTHS[prevMonth]} {formatShortValue(prevIncomeTotal)} · {SHORT_MONTHS[selectedMonth]} {formatShortValue(currentIncomeTotal)}
            </Text>
          </View>
          <View style={styles.compareBarStack}>
            <View style={[styles.compareTrack, darkMode && { backgroundColor: '#040C08' }]}>
              <View style={[styles.compareFill, { width: `${(prevIncomeTotal / maxIncomeCompare) * 100}%`, backgroundColor: darkMode ? '#475569' : '#CBD5E1' }]} />
            </View>
            <View style={[styles.compareTrack, darkMode && { backgroundColor: '#040C08' }]}>
              <View style={[styles.compareFill, { width: `${(currentIncomeTotal / maxIncomeCompare) * 100}%`, backgroundColor: green }]} />
            </View>
          </View>
        </View>

        {/* Expense Comparison */}
        <View style={styles.compareSection}>
          <View style={styles.compareHeader}>
            <Text style={[styles.compareLabel, darkMode && { color: '#FFF' }]}>Expense</Text>
            <Text style={[styles.compareValues, darkMode && { color: '#94A3B8' }]}>
              {SHORT_MONTHS[prevMonth]} {formatShortValue(prevExpenseTotal)} · {SHORT_MONTHS[selectedMonth]} {formatShortValue(currentExpenseTotal)}
            </Text>
          </View>
          <View style={styles.compareBarStack}>
            <View style={[styles.compareTrack, darkMode && { backgroundColor: '#040C08' }]}>
              <View style={[styles.compareFill, { width: `${(prevExpenseTotal / maxExpenseCompare) * 100}%`, backgroundColor: darkMode ? '#475569' : '#CBD5E1' }]} />
            </View>
            <View style={[styles.compareTrack, darkMode && { backgroundColor: '#040C08' }]}>
              <View style={[styles.compareFill, { width: `${(currentExpenseTotal / maxExpenseCompare) * 100}%`, backgroundColor: '#EF4444' }]} />
            </View>
          </View>
        </View>
      </View>

      {/* 3. Top Spending Categories Card */}
      <View style={[styles.advCard, darkMode && { backgroundColor: 'rgba(15,27,21,0.85)', borderColor: 'rgba(16,185,129,0.3)' }]}>
        <Text style={[styles.advCardTitle, darkMode && { color: '#FFF' }]}>Top Spending Categories</Text>
        {topCategories.length === 0 ? (
          <Text style={styles.emptyLegendText}>No category expenses recorded for this month</Text>
        ) : (
          topCategories.slice(0, 5).map((cat, index) => (
            <View key={cat.name} style={styles.topCatRow}>
              <Text style={[styles.topCatRank, darkMode && { color: '#10B981' }]}>#{index + 1}</Text>
              <View style={[styles.topCatIconCircle, { backgroundColor: `${cat.color}18` }]}>
                <AppIcon name={cat.icon} color={cat.color} size={19} />
              </View>
              <View style={styles.topCatInfo}>
                <View style={styles.topCatHeader}>
                  <Text style={[styles.topCatName, darkMode && { color: '#FFF' }]}>{cat.name}</Text>
                  <View style={styles.topCatValueRow}>
                    <Text style={[styles.topCatAmount, darkMode && { color: '#FFF' }]}>₹{cat.total.toLocaleString('en-IN')}</Text>
                    <Text style={[styles.topCatPercent, darkMode && { color: '#10B981' }]}>{cat.percentage}%</Text>
                  </View>
                </View>
                <View style={[styles.topCatTrack, darkMode && { backgroundColor: '#040C08' }]}>
                  <View style={[styles.topCatFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  if (darkMode) {
    return (
      <LinearGradient colors={['#0B2E21', '#041710', '#010805']} style={{ flex: 1 }}>
        {innerContent}
      </LinearGradient>
    );
  }

  return <View style={styles.home}>{innerContent}</View>;
}
