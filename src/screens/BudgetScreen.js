import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../components/AppIcon';
import { categories } from '../data/appData';
import { green, styles } from '../styles/styles';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function BudgetScreen({ transactions = [], budgets = null, darkMode = false, onOpenEditBudget, onAdd, onOpenTransaction, onNavigate }) {
  const [activeTab, setActiveTab] = useState('Budget');
  const [currentDate] = useState(new Date());

  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth();

  const currentMonthExpenses = transactions.filter((t) => {
    const d = new Date(t.createdAt);
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && t.type === 'Expense';
  });

  const expenseCategories = categories.filter((c) => c.type === 'Expense');
  const hasBudgetSet = Boolean(budgets && Object.keys(budgets).length > 0);

  const categoryBudgets = expenseCategories
    .map((cat) => {
      const budgetLimit = budgets && budgets[cat.name] ? Number(budgets[cat.name]) : 0;
      const spent = currentMonthExpenses
        .filter((t) => t.category === cat.name)
        .reduce((sum, t) => sum + t.amount, 0);
      const isExceeded = budgetLimit > 0 && spent > budgetLimit;
      const percentage = budgetLimit > 0 ? Math.round((spent / budgetLimit) * 100) : 0;
      return { ...cat, budget: budgetLimit, spent, isExceeded, percentage };
    })
    .filter((cat) => cat.budget > 0 || cat.spent > 0);

  const totalBudget = categoryBudgets.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = categoryBudgets.reduce((sum, c) => sum + c.spent, 0);
  const exceededList = categoryBudgets.filter((c) => c.isExceeded);
  const topExceeded = exceededList[0];

  const navigate = (tab) => {
    setActiveTab(tab);
    onNavigate?.(tab);
  };

  const innerContent = (
    <>
      <ScrollView style={styles.homeMainScroll} contentContainerStyle={[styles.homeMainScrollContent, { paddingBottom: 110 }]} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.reportsHeaderContainer}>
          <Text style={[styles.reportsTitle, darkMode && { color: '#FFF' }]}>Budget Alert</Text>
          {hasBudgetSet && (
            <Pressable style={[styles.advancedMonthPill, darkMode && { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: '#10B981' }]} onPress={onOpenEditBudget}>
              <Text style={[styles.advancedMonthPillText, darkMode && { color: '#10B981' }]}>Edit Budget ✎</Text>
            </Pressable>
          )}
        </View>

        {/* 1. Budget Exceeded Warning Alert Banner */}
        {topExceeded ? (
          <View style={[styles.budgetAlertCard, darkMode && { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)' }]}>
            <View style={styles.budgetAlertIconBox}>
              <Text style={styles.budgetAlertIcon}>⚠️</Text>
            </View>
            <View style={styles.budgetAlertTextGroup}>
              <Text style={[styles.budgetAlertTitle, darkMode && { color: '#FCA5A5' }]}>Budget Exceeded!</Text>
              <Text style={[styles.budgetAlertMessage, darkMode && { color: '#F87171' }]}>
                {`${topExceeded.name} budget exceeded by ₹${(topExceeded.spent - topExceeded.budget).toLocaleString('en-IN')}. You've spent ₹${topExceeded.spent.toLocaleString('en-IN')} of your ₹${topExceeded.budget.toLocaleString('en-IN')} limit.`}
              </Text>
            </View>
          </View>
        ) : null}

        {/* 2. Category Budgets Card or Empty State */}
        {!hasBudgetSet ? (
          <View style={[styles.budgetEmptyCard, darkMode && { backgroundColor: 'rgba(15,27,21,0.85)', borderColor: 'rgba(16,185,129,0.3)' }]}>
            <View style={[styles.budgetEmptyIconCircle, darkMode && { backgroundColor: 'rgba(16,185,129,0.18)' }]}>
              <AppIcon name="budget" color="#10B981" size={32} />
            </View>
            <Text style={[styles.budgetEmptyTitle, darkMode && { color: '#FFF' }]}>Set Up Monthly Budget</Text>
            <Text style={[styles.budgetEmptyText, darkMode && { color: '#94A3B8' }]}>
              Create category-wise budget limits to track expenses and receive real-time alerts before you overspend.
            </Text>
            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedButton, { marginTop: 18 }]} onPress={onOpenEditBudget}>
              <Text style={styles.primaryButtonText}>Set Category Budgets</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.reportsChartCard, darkMode && { backgroundColor: 'rgba(15,27,21,0.85)', borderColor: 'rgba(16,185,129,0.3)' }]}>
            <View style={styles.budgetCardHeaderRow}>
              <Text style={[styles.advCardTitle, darkMode && { color: '#FFF' }]}>
                Category Budgets — {MONTH_NAMES[selectedMonth]} {selectedYear}
              </Text>
            </View>

            {/* Total Budget Summary Row */}
            <View style={styles.budgetTotalSummaryRow}>
              <Text style={[styles.budgetTotalLabel, darkMode && { color: '#94A3B8' }]}>Total Budget Progress</Text>
              <Text style={[styles.budgetTotalValues, darkMode && { color: '#10B981' }]}>
                ₹{totalSpent.toLocaleString('en-IN')} / ₹{totalBudget.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.budgetTotalTrack, darkMode && { backgroundColor: '#040C08' }]}>
              <View
                style={[
                  styles.budgetTotalFill,
                  {
                    width: `${Math.min((totalSpent / (totalBudget || 1)) * 100, 100)}%`,
                    backgroundColor: totalSpent > totalBudget ? '#EF4444' : green,
                  },
                ]}
              />
            </View>

            <View style={{ height: 16 }} />

            {/* Category Budget Items */}
            {categoryBudgets.map((item) => {
              const fillWidth = item.budget > 0 ? Math.min((item.spent / item.budget) * 100, 100) : 0;
              return (
                <View key={item.name} style={styles.categoryBudgetRow}>
                  <View style={styles.categoryBudgetTopLine}>
                    <View style={styles.categoryBudgetLeft}>
                      <View style={[styles.transactionCategoryIcon, { backgroundColor: `${item.color}18`, width: 34, height: 34 }]}>
                        <AppIcon name={item.icon} color={item.color} size={18} />
                      </View>
                      <Text style={[styles.categoryBudgetName, darkMode && { color: '#FFF' }]}>{item.name}</Text>
                    </View>

                    <View style={styles.categoryBudgetRight}>
                      {item.isExceeded ? (
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.categoryBudgetExceededValue}>
                            ₹{item.spent.toLocaleString('en-IN')} / ₹{item.budget.toLocaleString('en-IN')}
                          </Text>
                          <Text style={styles.categoryBudgetExceededBadge}>{item.percentage}%</Text>
                        </View>
                      ) : (
                        <Text style={[styles.categoryBudgetValue, darkMode && { color: '#94A3B8' }]}>
                          ₹{item.spent.toLocaleString('en-IN')} / ₹{item.budget.toLocaleString('en-IN')}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={[styles.categoryBudgetTrack, darkMode && { backgroundColor: '#040C08' }]}>
                    <View
                      style={[
                        styles.categoryBudgetFill,
                        {
                          width: `${fillWidth}%`,
                          backgroundColor: item.isExceeded ? '#EF4444' : green,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 3. Reduce Spending Tips Banner */}
        <View style={[styles.tipsCard, darkMode && { backgroundColor: 'rgba(15,27,21,0.85)', borderColor: 'rgba(16,185,129,0.3)' }]}>
          <View style={styles.tipsHeaderRow}>
            <Text style={styles.tipsLightbulb}>💡</Text>
            <Text style={[styles.tipsTitle, darkMode && { color: '#FFF' }]}>Reduce Spending Tips</Text>
          </View>

          <View style={styles.tipItemRow}>
            <View style={styles.tipNumBadge}><Text style={styles.tipNumText}>1</Text></View>
            <Text style={[styles.tipItemText, darkMode && { color: '#94A3B8' }]}>Try cooking at home more often this month to reduce food expenses.</Text>
          </View>

          <View style={styles.tipItemRow}>
            <View style={styles.tipNumBadge}><Text style={styles.tipNumText}>2</Text></View>
            <Text style={[styles.tipItemText, darkMode && { color: '#94A3B8' }]}>Review category budgets approaching 80% usage before making non-essential purchases.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      {darkMode ? (
        <View style={styles.darkHomeNavContainer}>
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
        <View style={styles.navigation}>
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
      <Pressable style={({ pressed }) => [styles.floatingButton, pressed && styles.pressedButton]} onPress={onAdd}>
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
