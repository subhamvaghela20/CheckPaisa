import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { AppIcon } from '../components/AppIcon';
import { categories } from '../data/appData';
import { formatTransactionDateTime } from '../utils/date';
import { green, styles } from '../styles/styles';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
}

export function ReportsScreen({ transactions = [], darkMode = false, onAdd, onOpenTransaction, onOpenAdvanced, onNavigate }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Reports');
  const [reportTab, setReportTab] = useState('breakdown');
  const [currentDate, setCurrentDate] = useState(new Date());

  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth();

  const changeMonth = (offset) => {
    setCurrentDate(new Date(selectedYear, selectedMonth + offset, 1));
  };

  const monthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.createdAt);
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && t.type === 'Expense';
  });

  const monthlyExpenses = monthlyTransactions;
  const totalSpent = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);

  const categoryBreakdown = categories
    .filter((c) => c.type === 'Expense')
    .map((cat) => {
      const catSpent = monthlyExpenses
        .filter((t) => t.category === cat.name)
        .reduce((sum, t) => sum + t.amount, 0);
      const percentage = totalSpent > 0 ? Math.round((catSpent / totalSpent) * 100) : 0;
      return { ...cat, total: catSpent, percentage };
    })
    .filter((cat) => cat.total > 0)
    .sort((a, b) => b.total - a.total);

  const radius = 65;
  let currentAngle = 0;

  const navigate = (tab) => {
    setActiveTab(tab);
    onNavigate?.(tab);
  };

  const innerContent = (
    <>
      <ScrollView style={styles.homeMainScroll} contentContainerStyle={[styles.homeMainScrollContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.reportsHeaderContainer}>
          <Text style={[styles.reportsTitle, darkMode && { color: '#FFF' }]}>Reports</Text>
          <View style={[styles.monthSelector, darkMode && { backgroundColor: 'rgba(15,27,21,0.85)', borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Pressable style={styles.monthNavButton} onPress={() => changeMonth(-1)}>
              <Text style={[styles.monthNavArrow, darkMode && { color: '#10B981' }]}>‹</Text>
            </Pressable>
            <Text style={[styles.monthLabel, darkMode && { color: '#FFF' }]}>{`${MONTH_NAMES[selectedMonth]} ${selectedYear}`}</Text>
            <Pressable style={styles.monthNavButton} onPress={() => changeMonth(1)}>
              <Text style={[styles.monthNavArrow, darkMode && { color: '#10B981' }]}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* Breakdown / Trends Toggle Pill */}
        <View style={[styles.reportsTabToggle, darkMode && { backgroundColor: '#040C08', borderColor: 'rgba(16,185,129,0.2)' }]}>
          <Pressable
            style={[styles.reportsTabOption, reportTab === 'breakdown' && (darkMode ? { backgroundColor: '#10B981' } : styles.reportsTabActive)]}
            onPress={() => setReportTab('breakdown')}
          >
            <AppIcon name="report" size={16} color={reportTab === 'breakdown' ? (darkMode ? '#000' : '#1E293B') : '#94A3B8'} />
            <Text style={[styles.reportsTabText, reportTab === 'breakdown' && (darkMode ? { color: '#000', fontWeight: '800' } : styles.reportsTabActiveText)]}>
              Breakdown
            </Text>
          </Pressable>

          <Pressable
            style={[styles.reportsTabOption, reportTab === 'trends' && (darkMode ? { backgroundColor: '#10B981' } : styles.reportsTabActive)]}
            onPress={() => setReportTab('trends')}
          >
            <AppIcon name="budget" size={16} color={reportTab === 'trends' ? (darkMode ? '#000' : '#1E293B') : '#94A3B8'} />
            <Text style={[styles.reportsTabText, reportTab === 'trends' && (darkMode ? { color: '#000', fontWeight: '800' } : styles.reportsTabActiveText)]}>
              Trends
            </Text>
          </Pressable>
        </View>

        {/* Main Chart Card */}
        {reportTab === 'breakdown' ? (
          <View style={[styles.reportsChartCard, darkMode && { backgroundColor: 'rgba(15,27,21,0.85)', borderColor: 'rgba(16,185,129,0.3)' }]}>
            <View style={styles.donutWrapper}>
              <Svg width={180} height={180} viewBox="0 0 180 180">
                {/* Background Ring Track Path */}
                <Path d={describeArc(90, 90, radius, 0, 359.9)} stroke={darkMode ? '#040C08' : '#F1F5F9'} strokeWidth={18} fill="none" />

                {/* Category Arc Segments */}
                {categoryBreakdown.length > 0 &&
                  categoryBreakdown.map((item) => {
                    const angleSpan = (item.percentage / 100) * 360;
                    const startA = currentAngle;
                    const endA = currentAngle + Math.max(angleSpan - 1, 0.1);
                    currentAngle += angleSpan;

                    if (angleSpan <= 0) return null;

                    return (
                      <Path
                        key={item.name}
                        d={describeArc(90, 90, radius, startA, Math.min(endA, 359.99))}
                        stroke={item.color}
                        strokeWidth={18}
                        strokeLinecap="round"
                        fill="none"
                      />
                    );
                  })}
              </Svg>

              <View style={styles.donutCenterLabel}>
                <Text style={[styles.donutCenterTitle, darkMode && { color: '#94A3B8' }]}>Total Spent</Text>
                <Text style={[styles.donutCenterAmount, darkMode && { color: '#FFF' }]}>₹{totalSpent.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Legend Grid */}
            <View style={styles.legendGrid}>
              {categoryBreakdown.length === 0 ? (
                <Text style={styles.emptyLegendText}>No category expenses for this month</Text>
              ) : (
                categoryBreakdown.map((cat) => (
                  <View key={cat.name} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                    <Text style={[styles.legendName, darkMode && { color: '#FFF' }]} numberOfLines={1}>
                      {cat.name}
                    </Text>
                    <Text style={[styles.legendPercent, darkMode && { color: '#10B981' }]}>{cat.percentage}%</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.reportsChartCard, darkMode && { backgroundColor: 'rgba(15,27,21,0.85)', borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={[styles.trendsTitle, darkMode && { color: '#FFF' }]}>Category Expense Trends</Text>
            {categoryBreakdown.length === 0 ? (
              <Text style={styles.emptyLegendText}>No expense data to display for trends</Text>
            ) : (
              categoryBreakdown.map((cat) => (
                <View key={cat.name} style={styles.trendRow}>
                  <View style={styles.trendRowHeader}>
                    <Text style={[styles.trendCatName, darkMode && { color: '#FFF' }]}>{cat.name}</Text>
                    <Text style={[styles.trendCatValue, darkMode && { color: '#10B981' }]}>
                      ₹{cat.total.toLocaleString('en-IN')} ({cat.percentage}%)
                    </Text>
                  </View>
                  <View style={[styles.trendBarTrack, darkMode && { backgroundColor: '#040C08' }]}>
                    <View style={[styles.trendBarFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Advanced Reports Banner */}
        <Pressable
          style={[styles.advancedBannerCard, darkMode && { backgroundColor: 'rgba(15,27,21,0.85)', borderColor: 'rgba(16,185,129,0.35)' }]}
          onPress={onOpenAdvanced}
        >
          <View style={styles.advancedBannerContent}>
            <View style={[styles.advancedBannerIconTile, darkMode && { backgroundColor: 'rgba(16,185,129,0.18)' }]}>
              <AppIcon name="report" color="#10B981" size={20} />
            </View>
            <View style={styles.advancedBannerTextGroup}>
              <Text style={[styles.advancedBannerTitle, darkMode && { color: '#FFF' }]}>Advanced Reports</Text>
              <Text style={[styles.advancedBannerSubtitle, darkMode && { color: '#94A3B8' }]}>Weekly trends, month comparisons & top categories</Text>
            </View>
          </View>
          <Text style={[styles.advancedBannerArrow, darkMode && { color: '#10B981' }]}>→</Text>
        </Pressable>

        {/* Monthly Transactions Header */}
        <View style={styles.monthlyHeaderRow}>
          <Text style={[styles.monthlyHeaderTitle, darkMode && { color: '#FFF' }]}>Monthly Transactions</Text>
          <Text style={[styles.monthlyCountBadge, darkMode && { backgroundColor: '#10B981', color: '#000' }]}>{monthlyTransactions.length}</Text>
        </View>

        {/* Monthly Transactions List */}
        <View style={styles.transactionList}>
          {monthlyTransactions.length === 0 ? (
            <View style={[styles.emptyTransactions, darkMode && { backgroundColor: 'rgba(15,27,21,0.7)', borderColor: 'rgba(16,185,129,0.2)' }]}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>₹</Text>
              </View>
              <Text style={[styles.emptyTitle, darkMode && { color: '#FFF' }]}>No monthly transactions</Text>
              <Text style={styles.emptyMessage}>There are no transactions recorded for {MONTH_NAMES[selectedMonth]} {selectedYear}.</Text>
            </View>
          ) : (
            monthlyTransactions.map((transaction) => {
              const matchedCat = categories.find((c) => c.name === transaction.category);
              const catColor = matchedCat?.color || (transaction.type === 'Income' ? green : '#EF5A5A');
              const catIcon = matchedCat?.icon || 'other';

              return (
                <Pressable
                  key={transaction.id}
                  style={[styles.transactionRow, darkMode && { backgroundColor: 'rgba(15,27,21,0.7)', borderColor: 'rgba(16,185,129,0.2)' }]}
                  onPress={() => onOpenTransaction(transaction)}
                >
                  <View style={[styles.transactionCategoryIcon, { backgroundColor: `${catColor}18` }]}>
                    <AppIcon name={catIcon} color={catColor} size={21} />
                  </View>
                  <View style={styles.transactionRowText}>
                    <Text style={[styles.transactionRowTitle, darkMode && { color: '#FFF' }]}>{transaction.category}</Text>
                    <Text style={styles.transactionRowSub}>{formatTransactionDateTime(transaction.createdAt)}</Text>
                    {transaction.note ? <Text style={styles.transactionRowNote}>{transaction.note}</Text> : null}
                  </View>
                  <Text style={[styles.transactionAmount, transaction.type === 'Income' && styles.incomeAmount]}>
                    {transaction.type === 'Expense' ? '-' : '+'}₹{transaction.amount.toLocaleString('en-IN')}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      {darkMode ? (
        <View style={[styles.darkHomeNavContainer, { height: 68 + insets.bottom, paddingBottom: insets.bottom }]}>
          {[
            ['Home', 'home'],
            ['Reports', 'report'],
            ['Budget', 'budget'],
            ['Profile', 'user'],
          ].map(([label, icon]) => (
            <Pressable key={label} style={styles.navItem} onPress={() => navigate(label)}>
              <AppIcon name={icon} color={activeTab === label ? '#10B981' : '#64748B'} size={23} />
              <Text style={[styles.navLabel, activeTab === label && { color: '#10B981', fontWeight: '800' }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={[styles.navigation, { height: 68 + insets.bottom, paddingBottom: insets.bottom }]}>
          {[
            ['Home', 'home'],
            ['Reports', 'report'],
            ['Budget', 'budget'],
            ['Profile', 'user'],
          ].map(([label, icon]) => (
            <Pressable key={label} style={styles.navItem} onPress={() => navigate(label)}>
              <AppIcon name={icon} color={activeTab === label ? green : '#99A3B3'} size={23} />
              <Text style={[styles.navLabel, activeTab === label && styles.activeNavLabel]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Floating Add Button */}
      <Pressable style={({ pressed }) => [styles.floatingButton, { bottom: 80 + insets.bottom }, pressed && styles.pressedButton]} onPress={onAdd}>
        <AppIcon name="plus" size={31} />
      </Pressable>
    </>
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
