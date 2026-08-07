import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../components/AppIcon';
import { VoiceMicModal } from '../components/VoiceMicModal';
import { categories } from '../data/appData';
import { formatTime, groupTransactionsByDate } from '../utils/date';
import { green, styles } from '../styles/styles';

export function HomeScreen({ transactions, budgets, user, darkMode = false, onAdd, onSaveVoiceTransaction, onOpenTransaction, onNavigate }) {
  const [activeTab, setActiveTab] = useState('Home');

  const income = transactions.filter((item) => item.type === 'Income').reduce((total, item) => total + item.amount, 0);
  const expense = transactions.filter((item) => item.type === 'Expense').reduce((total, item) => total + item.amount, 0);
  const balance = income - expense;

  const userName = user?.name || 'Siddharajsinh';
  const initial = userName.charAt(0).toUpperCase();

  const totalBudget = budgets ? Object.values(budgets).reduce((sum, b) => sum + Number(b), 0) : 0;
  const budgetProgress = totalBudget > 0 ? Math.min((expense / totalBudget) * 100, 100) : 0;

  const navigate = (tab) => {
    setActiveTab(tab);
    onNavigate?.(tab);
  };

  const groupedTransactions = groupTransactionsByDate(transactions);

  // 1. Dark Mode Theme Layout
  if (darkMode) {
    return (
      <LinearGradient colors={['#0B2E21', '#041710', '#010805']} style={{ flex: 1 }}>
        <View style={styles.exactAuthGlowTopRight} pointerEvents="none" />

        <ScrollView style={styles.homeMainScroll} contentContainerStyle={[styles.darkHomeScrollContent, { paddingBottom: 110 }]} showsVerticalScrollIndicator={false}>
          {/* Top Hero Header Block */}
          <View style={styles.darkHomeHero}>
            <View style={styles.homeTopRow}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.darkHomeAvatar}>
                <Text style={styles.darkHomeAvatarText}>{initial}</Text>
              </LinearGradient>
              <View style={styles.greeting}>
                <Text style={styles.darkHomeGreetingSmall}>Good Morning</Text>
                <Text style={styles.darkHomeGreetingName}>{userName}</Text>
              </View>
              <View style={styles.headerButtons}>
                <Pressable style={styles.darkHomeHeaderButton}>
                  <AppIcon name="search" color="#10B981" size={19} />
                </Pressable>
                <Pressable style={styles.darkHomeHeaderButton}>
                  <AppIcon name="bell" color="#10B981" size={19} />
                </Pressable>
              </View>
            </View>

            <Text style={styles.darkHomeBalanceLabel}>Total Balance</Text>
            <Text style={styles.darkHomeBalance}>₹{balance.toLocaleString('en-IN')}</Text>

            {/* Income / Expense Summary Cards */}
            <View style={styles.summaryRow}>
              <View style={styles.darkHomeSummaryCard}>
                <Text style={styles.darkHomeIncomeLabel}>↘  Income</Text>
                <Text style={styles.darkHomeIncomeValue}>₹{income.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.darkHomeSummaryCard}>
                <Text style={styles.darkHomeExpenseLabel}>↗  Expense</Text>
                <Text style={styles.darkHomeExpenseValue}>₹{expense.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          {/* Monthly Budget Card */}
          <View style={styles.homeSummarySection}>
            <Pressable style={styles.darkHomeBudgetCard} onPress={() => navigate('Budget')}>
              <View style={styles.budgetHeading}>
                <Text style={styles.darkHomeBudgetTitle}>Monthly Budget</Text>
                <Text style={styles.darkHomeBudgetAmount}>
                  {totalBudget > 0 ? `₹${expense.toLocaleString('en-IN')} / ₹${totalBudget.toLocaleString('en-IN')}` : 'Not set'}
                </Text>
              </View>
              <View style={styles.darkHomeProgressTrack}>
                <LinearGradient
                  colors={expense > totalBudget && totalBudget > 0 ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
                  style={[styles.darkHomeProgressFill, { width: `${budgetProgress}%` }]}
                />
              </View>
              <Text style={styles.darkHomeBudgetHint}>
                {totalBudget > 0
                  ? expense > totalBudget
                    ? '⚠️ Budget limit exceeded!'
                    : `${Math.round(budgetProgress)}% of monthly budget used`
                  : 'Tap to set category budgets'}
              </Text>
            </Pressable>
          </View>

          {/* Recent Transactions Header */}
          <View style={styles.darkHomeTransactionHeader}>
            <Text style={styles.darkHomeTransactionTitle}>Recent Transactions</Text>
          </View>

          {/* Date-Wise Grouped Transactions List */}
          {transactions.length === 0 ? (
            <View style={styles.darkHomeEmptyCard}>
              <View style={styles.darkHomeEmptyIconTile}>
                <Text style={{ fontSize: 22, color: '#10B981', fontWeight: '900' }}>₹</Text>
              </View>
              <Text style={styles.darkHomeEmptyTitle}>No transactions yet</Text>
              <Text style={styles.darkHomeEmptyMessage}>Tap the + button or Hold the 🎙️ Mic button to add by voice.</Text>
            </View>
          ) : (
            groupedTransactions.map((group) => (
              <View key={group.label}>
                {/* Date Group Header */}
                <View style={styles.dateGroupHeaderRow}>
                  <Text style={styles.darkDateGroupHeaderLabel}>{group.label}</Text>
                </View>

                {group.data.map((transaction) => {
                  const catObj = categories.find((item) => item.name === transaction.category);
                  const iconColor = transaction.type === 'Income' ? '#10B981' : '#EF4444';
                  const txTime = formatTime(new Date(transaction.createdAt));

                  return (
                    <Pressable key={transaction.id} style={styles.darkHomeTransactionRow} onPress={() => onOpenTransaction(transaction)}>
                      <View style={[styles.darkHomeCatIconTile, { backgroundColor: transaction.type === 'Income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                        <AppIcon name={catObj?.icon || 'other'} color={iconColor} size={20} />
                      </View>

                      <View style={styles.transactionRowText}>
                        <Text style={styles.darkHomeRowTitle}>{transaction.category}</Text>
                        <Text style={styles.darkHomeRowSub}>{txTime}</Text>
                        {transaction.note ? <Text style={styles.darkHomeRowNote}>{transaction.note}</Text> : null}
                      </View>

                      <Text style={[styles.darkHomeRowAmount, transaction.type === 'Income' && styles.darkHomeIncomeAmountText]}>
                        {transaction.type === 'Expense' ? '-' : '+'}₹{transaction.amount.toLocaleString('en-IN')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>

        {/* Bottom Navigation */}
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

        {/* Voice Entry Mic Button (Positioned directly above Plus Button) */}
        <VoiceMicModal categories={categories} darkMode={darkMode} onSaveVoiceTransaction={onSaveVoiceTransaction} />

        {/* Floating Add Button */}
        <Pressable style={({ pressed }) => [styles.floatingButton, pressed && styles.pressedButton]} onPress={onAdd}>
          <AppIcon name="plus" size={31} />
        </Pressable>
      </LinearGradient>
    );
  }

  // 2. Light Mode Theme Layout (Original White & Emerald Theme)
  return (
    <View style={styles.home}>
      <ScrollView style={styles.homeMainScroll} contentContainerStyle={[styles.homeMainScrollContent, { paddingBottom: 110 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.homeHero}>
          <View style={styles.homeTopRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.greeting}>
              <Text style={styles.greetingSmall}>Good Morning</Text>
              <Text style={styles.greetingName}>{userName}</Text>
            </View>
            <View style={styles.headerButtons}>
              <Pressable style={styles.headerButton}>
                <AppIcon name="search" />
              </Pressable>
              <Pressable style={styles.headerButton}>
                <AppIcon name="bell" />
              </Pressable>
            </View>
          </View>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balance}>₹{balance.toLocaleString('en-IN')}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>↘  Income</Text>
              <Text style={styles.summaryValue}>₹{income.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>↗  Expense</Text>
              <Text style={styles.summaryValue}>₹{expense.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.homeSummarySection}>
          <Pressable style={styles.budgetCard} onPress={() => navigate('Budget')}>
            <View style={styles.budgetHeading}>
              <Text style={styles.budgetTitle}>Monthly Budget</Text>
              <Text style={styles.budgetAmount}>
                {totalBudget > 0 ? `₹${expense.toLocaleString('en-IN')} / ₹${totalBudget.toLocaleString('en-IN')}` : 'Not set'}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressZero, { width: `${budgetProgress}%`, backgroundColor: expense > totalBudget && totalBudget > 0 ? '#EF4444' : green }]} />
            </View>
            <Text style={styles.budgetHint}>
              {totalBudget > 0
                ? expense > totalBudget
                  ? '⚠️ Budget limit exceeded!'
                  : `${Math.round(budgetProgress)}% of monthly budget used`
                : 'Tap to set category budgets'}
            </Text>
          </Pressable>
        </View>

        {/* Recent Transactions Header */}
        <View style={styles.stickyTransactionHeader}>
          <Text style={styles.transactionTitle}>Recent Transactions</Text>
        </View>

        {/* Date-Wise Grouped Transactions List */}
        {transactions.length === 0 ? (
          <View style={styles.emptyTransactions}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>₹</Text>
            </View>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyMessage}>Tap the + button or Hold the 🎙️ Mic button to add by voice.</Text>
          </View>
        ) : (
          groupedTransactions.map((group) => (
            <View key={group.label}>
              {/* Date Group Header */}
              <View style={styles.dateGroupHeaderRow}>
                <Text style={styles.dateGroupHeaderLabel}>{group.label}</Text>
              </View>

              {group.data.map((transaction) => {
                const catObj = categories.find((item) => item.name === transaction.category);
                const txTime = formatTime(new Date(transaction.createdAt));

                return (
                  <Pressable key={transaction.id} style={styles.transactionRow} onPress={() => onOpenTransaction(transaction)}>
                    <View style={[styles.transactionCategoryIcon, transaction.type === 'Income' && { backgroundColor: '#E6F9F2' }]}>
                      <AppIcon
                        name={catObj?.icon || 'other'}
                        color={transaction.type === 'Income' ? green : '#EF5A5A'}
                        size={21}
                      />
                    </View>
                    <View style={styles.transactionRowText}>
                      <Text style={styles.transactionRowTitle}>{transaction.category}</Text>
                      <Text style={styles.transactionRowSub}>{txTime}</Text>
                      {transaction.note ? <Text style={styles.transactionRowNote}>{transaction.note}</Text> : null}
                    </View>
                    <Text style={[styles.transactionAmount, transaction.type === 'Income' && styles.incomeAmount]}>
                      {transaction.type === 'Expense' ? '-' : '+'}₹{transaction.amount.toLocaleString('en-IN')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
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

      {/* Voice Entry Mic Button (Positioned directly above Plus Button) */}
      <VoiceMicModal categories={categories} darkMode={darkMode} onSaveVoiceTransaction={onSaveVoiceTransaction} />

      {/* Floating Add Button */}
      <Pressable style={({ pressed }) => [styles.floatingButton, pressed && styles.pressedButton]} onPress={onAdd}>
        <AppIcon name="plus" size={31} />
      </Pressable>
    </View>
  );
}
