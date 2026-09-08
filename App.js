import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, BackHandler } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { categories as defaultCategories } from './src/data/appData';
import { AdvancedReportsScreen } from './src/screens/AdvancedReportsScreen';
import { BudgetScreen } from './src/screens/BudgetScreen';
import { EditBudgetScreen } from './src/screens/EditBudgetScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InitialSetupScreen } from './src/screens/InitialSetupScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ManageCategoriesScreen } from './src/screens/ManageCategoriesScreen';
import { ManageRecurringScreen } from './src/screens/ManageRecurringScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { TransactionDetailsScreen } from './src/screens/TransactionDetailsScreen';
import { TransactionFormScreen } from './src/screens/TransactionFormScreen';
import {
  DEFAULT_WALLETS,
  deleteUserData,
  loadBudgets,
  loadCategories,
  loadCurrency,
  loadDarkMode,
  loadNotifications,
  loadRecurringRules,
  loadSetupCompleted,
  loadTransactions,
  loadUser,
  loadWallets,
  saveLedger,
  saveBudgets,
  saveCategories,
  saveCurrency,
  saveDarkMode,
  saveNotifications,
  saveRecurringRules,
  saveSetupCompleted,
  saveTransactions,
  saveUser,
  saveWallets,
  updateUserProfile,
} from './src/utils/storage';
import { processRecurringRules } from './src/utils/recurringProcessor';
import { applyTransactionSave, migrateCategory } from './src/utils/ledger';
import { styles } from './src/styles/styles';

const SCREENS = {
  SPLASH: 'splash',
  ONBOARDING: 'onboarding',
  LOGIN: 'login',
  INITIAL_SETUP: 'initial_setup',
  HOME: 'home',
  REPORTS: 'reports',
  ADVANCED_REPORTS: 'advanced_reports',
  BUDGET: 'budget',
  EDIT_BUDGET: 'edit_budget',
  PROFILE: 'profile',
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_RECURRING: 'manage_recurring',
  ADD: 'add',
  DETAILS: 'details',
  EDIT: 'edit',
};

export default function App() {
  const [history, setHistory] = useState([SCREENS.SPLASH]);
  const [transactions, updateTransactions] = useState([]);
  const txRef = useRef([]);
  const setTransactions = (value) => {
    const next = typeof value === 'function' ? value(txRef.current) : value;
    txRef.current = next;
    updateTransactions(next);
  };
  const [budgets, setBudgets] = useState(null);
  const [currency, setCurrency] = useState('INR (₹)');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [customCategories, setCustomCategories] = useState(defaultCategories);
  const [user, setUser] = useState({ name: 'Siddharajsinh', email: 'siddharajsinh@example.com' });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [wallets, setWallets] = useState(DEFAULT_WALLETS);
  const [activeWalletId, setActiveWalletId] = useState('default_wallet');
  const [recurringRules, updateRules] = useState([]);
  const rulesRef = useRef([]);
  const readyRef = useRef(false);
  const sessionRef = useRef(0);
  const setRecurringRules = (value) => {
    const next = typeof value === 'function' ? value(rulesRef.current) : value;
    rulesRef.current = next;
    updateRules(next);
  };
  const refreshRef = useRef(null);
  const mutationQueue = useRef(Promise.resolve());
  const pendingMutations = useRef(0);
  const retryAfter = useRef(0);
  const renderSession = sessionRef.current;
  const mutate = (task, propagate = false) => {
    const session = renderSession;
    pendingMutations.current += 1;
    const operation = mutationQueue.current.catch(() => {}).then(async () => {
      if (session !== sessionRef.current) throw new Error('Account changed. Please try again.');
      return task();
    });
    mutationQueue.current = operation;
    return operation.catch((error) => {
      if (propagate) throw error;
      Alert.alert('Could not save', error.message || 'Please free device storage and try again.');
      return { success: false };
    }).finally(() => { pendingMutations.current -= 1; });
  };

  const currentScreen = history[history.length - 1] || SCREENS.HOME;

  // Stack navigation helpers
  const pushScreen = (screenName) => {
    setHistory((prev) => [...prev, screenName]);
  };

  const popScreen = () => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, prev.length - 1) : [SCREENS.HOME]));
  };

  const switchTab = (tabName) => {
    let target = SCREENS.HOME;
    if (tabName === 'Reports') target = SCREENS.REPORTS;
    if (tabName === 'Budget') target = SCREENS.BUDGET;
    if (tabName === 'Profile') target = SCREENS.PROFILE;

    if (target === SCREENS.HOME) {
      setHistory([SCREENS.HOME]);
    } else {
      setHistory([SCREENS.HOME, target]);
    }
  };

  // Hardware Back Button Handler
  useEffect(() => {
    const onHardwareBack = () => {
      if (
        currentScreen === SCREENS.SPLASH ||
        currentScreen === SCREENS.ONBOARDING ||
        currentScreen === SCREENS.LOGIN ||
        currentScreen === SCREENS.INITIAL_SETUP
      ) {
        return false;
      }

      if (history.length > 1 && currentScreen !== SCREENS.HOME) {
        popScreen();
        return true;
      }
      return false; // Exit app at Home screen
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => backSubscription.remove();
  }, [history, currentScreen]);

  const loadAccount = async (activeUser) => {
    readyRef.current = false;
    const session = ++sessionRef.current;
    const [tx, rules, b, w, cats, c, n] = await Promise.all([
      loadTransactions(activeUser.email), loadRecurringRules(activeUser.email),
      loadBudgets(activeUser.email), loadWallets(activeUser.email), loadCategories(activeUser.email),
      loadCurrency(activeUser.email), loadNotifications(activeUser.email),
    ]);
    if (session !== sessionRef.current) return;
    setUser(activeUser);
    setTransactions(Array.isArray(tx) ? tx : []);
    setRecurringRules(Array.isArray(rules) ? rules : []);
    setBudgets(b);
    const accountWallets = Array.isArray(w) && w.length ? w : DEFAULT_WALLETS;
    setWallets(accountWallets);
    setActiveWalletId(accountWallets[0].id);
    setCustomCategories(Array.isArray(cats) && cats.length ? cats : defaultCategories);
    setCurrency(c);
    setNotifications(n);
    readyRef.current = true;
  };

  useEffect(() => {
    let canceled = false;
    (async () => {
      setDarkMode(await loadDarkMode());
      const storedUser = await loadUser();
      if (canceled) return;
      if (storedUser?.email) {
        await loadAccount(storedUser);
        const setup = await loadSetupCompleted(storedUser.email);
        if (!canceled) setHistory([setup || storedUser.isGuest ? SCREENS.HOME : SCREENS.INITIAL_SETUP]);
      } else setHistory([SCREENS.ONBOARDING]);
    })().catch(() => { if (!canceled) setHistory([SCREENS.LOGIN]); });
    return () => { canceled = true; readyRef.current = false; sessionRef.current += 1; };
  }, []);

  // Reconcile on foreground return and while open (including midnight).
  refreshRef.current = () => {
    if (!readyRef.current || pendingMutations.current || Date.now() < retryAfter.current || AppState.currentState === 'background') return;
    const result = processRecurringRules(rulesRef.current, txRef.current);
    if (JSON.stringify(result.updatedRules) === JSON.stringify(rulesRef.current) && !result.newTransactions.length) return;
    mutate(async () => {
      const nextTx = [...result.newTransactions, ...txRef.current];
      try {
        await saveLedger(nextTx, result.updatedRules, user.email);
        setTransactions(nextTx);
        setRecurringRules(result.updatedRules);
      } catch (error) {
        retryAfter.current = Date.now() + 60000;
        throw error;
      }
    });
  };
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refreshRef.current?.(); });
    const timer = setInterval(() => refreshRef.current?.(), 1000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, []);

  const handleLoginSuccess = async (userData) => {
    await saveUser(userData);
    await loadAccount(userData);
    const isSetupDone = await loadSetupCompleted(userData.email);
    setHistory([isSetupDone || userData.isGuest ? SCREENS.HOME : SCREENS.INITIAL_SETUP]);
  };

  const handleCompleteInitialSetup = async ({ wallet, budgets: newBudgets }) => {
    const updatedWallets = [wallet];
    setWallets(updatedWallets);
    setActiveWalletId(wallet.id);
    await saveWallets(updatedWallets, user.email);

    setBudgets(newBudgets);
    await saveBudgets(newBudgets, user.email);

    await saveSetupCompleted(user.email, true);
    setHistory([SCREENS.HOME]);
  };

  const handleGuestContinue = async () => {
    const guestUser = { name: 'Guest User', email: 'guest@checkpaisa.app', isGuest: true };
    await saveUser(guestUser);
    await loadAccount(guestUser);
    setHistory([SCREENS.HOME]);
  };

  const handleUpdateProfile = async (updatedUser) => {
    return mutate(async () => {
      const result = await updateUserProfile(user.email, updatedUser);
      if (!result.success) return result;
      setUser(updatedUser);
      await saveUser(updatedUser);
      return result;
    }, false);
  };

  const handleUpdateCategories = async (updatedCategories, migration) => {
    return mutate(async () => {
      if (migration) {
        const next = migrateCategory(txRef.current, budgets, rulesRef.current, migration.from, migration.to);
        await saveLedger(next.transactions, next.rules, user.email, { categories: updatedCategories, budgets: next.budgets });
        setTransactions(next.transactions);
        setRecurringRules(next.rules);
        setBudgets(next.budgets);

      }
      if (!migration) {
        const names = new Set(updatedCategories.map((category) => category.name));
        const nextBudgets = budgets ? Object.fromEntries(Object.entries(budgets).filter(([name]) => names.has(name))) : null;
        await saveLedger(txRef.current, rulesRef.current, user.email, { categories: updatedCategories, budgets: nextBudgets });
        setBudgets(nextBudgets);
      }
      setCustomCategories(updatedCategories);
    }, true);
  };

  const handleLogout = async () => {
    return mutate(async () => {
      readyRef.current = false;
      sessionRef.current += 1;
      await saveUser(null);
      const defaultUser = { name: 'Siddharajsinh', email: 'siddharajsinh@example.com' };
      setUser(defaultUser);
      setTransactions([]);
      setBudgets(null);
      setWallets(DEFAULT_WALLETS);
      setActiveWalletId('default_wallet');
      setCustomCategories(defaultCategories);
      setRecurringRules([]);
      setCurrency('INR (₹)');
      setNotifications(true);
      setHistory([SCREENS.LOGIN]);
    }, false);
  };

  const handleDeleteAccount = async () => {
    return mutate(async () => {
      readyRef.current = false;
      sessionRef.current += 1;
      await deleteUserData(user.email);
      await saveUser(null);

      const defaultUser = { name: 'Siddharajsinh', email: 'siddharajsinh@example.com' };
      setUser(defaultUser);
      setTransactions([]);
      setBudgets(null);
      setWallets(DEFAULT_WALLETS);
      setActiveWalletId('default_wallet');
      setCustomCategories(defaultCategories);
      setRecurringRules([]);
      setCurrency('INR (₹)');
      setNotifications(true);
      setHistory([SCREENS.LOGIN]);
    }, false);
  };

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      saveDarkMode(next);
      return next;
    });
  };

  const persistEntry = async (transaction, rule, options = {}) => {
    return mutate(async () => {
      const next = applyTransactionSave(txRef.current, rulesRef.current, transaction, rule, options);
      const processed = processRecurringRules(next.rules, next.transactions);
      const nextTx = [...processed.newTransactions, ...next.transactions];
      await saveLedger(nextTx, processed.updatedRules, user.email);
      setTransactions(nextTx);
      setRecurringRules(processed.updatedRules);
      if (transaction) setSelectedTransaction(transaction);
      popScreen();
    }, true);
  };
  const handleAddTransaction = persistEntry;

  const handleToggleRecurringRule = async (ruleId) => {
    return mutate(async () => {
      const updated = rulesRef.current.map((rule) => rule.id === ruleId
        ? { ...rule, isActive: rule.isActive === false,
            ...(rule.isActive === false ? { lastProcessedDate: new Date().toISOString() } : {}) }
        : rule);
      try {
        await saveLedger(txRef.current, updated, user.email);
        setRecurringRules(updated);
      } catch { Alert.alert('Could not save', 'Please try again.'); }
    }, false);
  };

  const handleDeleteRecurringRule = async (ruleId) => {
    return mutate(async () => {
      const updated = rulesRef.current.filter((rule) => rule.id !== ruleId);
      try {
        await saveLedger(txRef.current, updated, user.email);
        setRecurringRules(updated);
      } catch { Alert.alert('Could not delete rule', 'Please try again.'); }
    }, false);
  };

  const handleVoiceAdd = async (transaction) => {
    return mutate(async () => {
      const txWithWallet = {
        ...transaction,
        walletId: transaction.walletId || activeWalletId || 'default_wallet',
      };
      const updated = [txWithWallet, ...txRef.current];
      await saveLedger(updated, rulesRef.current, user.email);
      setTransactions(updated);
    }, false);
  };

  // Wallet Handlers
  const handleSelectWallet = (walletId) => {
    setActiveWalletId(walletId);
  };

  const handleAddWallet = ({ name, initialBalance }) => {
    if (!name || !name.trim()) return;
    const newWallet = {
      id: String(Date.now()),
      name: name.trim(),
      initialBalance: Number(initialBalance) || 0,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    setWallets((prev) => {
      const updated = [...prev, newWallet];
      saveWallets(updated, user.email);
      return updated;
    });
    setActiveWalletId(newWallet.id);
  };

  const handleRenameWallet = (walletId, updatedFields) => {
    const newName = typeof updatedFields === 'string' ? updatedFields : updatedFields?.name;
    const newBalance = typeof updatedFields === 'object' ? updatedFields?.initialBalance : undefined;
    if (!newName || !newName.trim()) return;

    setWallets((prev) => {
      const updated = prev.map((w) => {
        if (w.id === walletId) {
          return {
            ...w,
            name: newName.trim(),
            initialBalance: newBalance !== undefined && newBalance !== '' ? Number(newBalance) || 0 : w.initialBalance,
          };
        }
        return w;
      });
      saveWallets(updated, user.email);
      return updated;
    });
  };

  const handleDeleteWallet = async (walletId) => {
    return mutate(async () => {
      const target = wallets.find((w) => w.id === walletId);
      if (!target || target.isDefault || walletId === 'default_wallet') return;
      const updatedWallets = wallets.filter((w) => w.id !== walletId);
      if (!updatedWallets.length) throw new Error('Keep at least one wallet.');
      const fallbackId = updatedWallets.find((wallet) => wallet.isDefault)?.id || updatedWallets[0].id;
      const nextRules = rulesRef.current.map((rule) => rule.walletId === walletId ? { ...rule, walletId: fallbackId } : rule);
      const nextTx = txRef.current.map((tx) => tx.walletId === walletId ? { ...tx, walletId: fallbackId } : tx);
      await saveLedger(nextTx, nextRules, user.email, { wallets: updatedWallets });
      setWallets(updatedWallets);
      setTransactions(nextTx);
      setRecurringRules(nextRules);
      if (activeWalletId === walletId) setActiveWalletId(fallbackId);
    }, false);
  };

  const handleEditTransaction = persistEntry;

  const handleDeleteTransaction = async (transactionId) => {
    return mutate(async () => {
      const updated = txRef.current.filter((item) => item.id !== transactionId);
      await saveLedger(updated, rulesRef.current, user.email);
      setTransactions(updated);
      setSelectedTransaction(null);
      popScreen();
    }, false);
  };

  const handleSaveBudgets = async (updatedBudgets) => {
    return mutate(async () => {
      await saveLedger(txRef.current, rulesRef.current, user.email, { budgets: updatedBudgets });
      setBudgets(updatedBudgets);
      popScreen();
    }, true);
  };

  const handleImportTransactions = async (importedList) => {
    return mutate(async () => {
      const ids = new Set(txRef.current.map((item) => item.id));
      const unique = importedList.filter((item) => {
        if (ids.has(item.id)) return false;
        ids.add(item.id);
        return true;
      });
      const next = [...unique, ...txRef.current];
      const nextCategories = [...customCategories];
      unique.forEach((tx) => {
        if (!nextCategories.some((cat) => cat.name === tx.category && cat.type === tx.type)) {
          nextCategories.push({ name: tx.category, type: tx.type, icon: 'other', color: '#64748B', isCustom: true, isActive: true });
        }
      });
      await saveLedger(next, rulesRef.current, user.email, { categories: nextCategories });
      setTransactions(next);
      setCustomCategories(nextCategories);
      return { imported: unique.length, duplicates: importedList.length - unique.length };
    }, true);
  };

  const handleResetAllData = async () => {
    return mutate(async () => {
      await saveLedger([], [], user.email, { budgets: null, wallets: DEFAULT_WALLETS, categories: defaultCategories });
      setTransactions([]);
      setBudgets(null);
      setWallets(DEFAULT_WALLETS);
      setActiveWalletId('default_wallet');
      setCustomCategories(defaultCategories);
      setRecurringRules([]);
      setSelectedTransaction(null);
      setHistory([SCREENS.HOME]);
    }, false);
  };

  const openTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    pushScreen(SCREENS.DETAILS);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case SCREENS.SPLASH:
        return <SplashScreen />;
      case SCREENS.ONBOARDING:
        return <OnboardingScreen onDone={() => setHistory([SCREENS.LOGIN])} />;
      case SCREENS.LOGIN:
        return (
          <LoginScreen
            darkMode={darkMode}
            onLoginSuccess={handleLoginSuccess}
            onGuestContinue={handleGuestContinue}
          />
        );
      case SCREENS.INITIAL_SETUP:
        return (
          <InitialSetupScreen
            userName={user.name}
            darkMode={darkMode}
            onCompleteSetup={handleCompleteInitialSetup}
          />
        );
      case SCREENS.HOME:
        return (
          <HomeScreen
            transactions={transactions}
            budgets={budgets}
            user={user}
            darkMode={darkMode}
            customCategories={customCategories}
            wallets={wallets}
            activeWalletId={activeWalletId}
            onSelectWallet={handleSelectWallet}
            onAdd={() => pushScreen(SCREENS.ADD)}
            onVoiceAdd={handleVoiceAdd}
            onOpenTransaction={openTransaction}
            onNavigate={switchTab}
          />
        );
      case SCREENS.REPORTS:
        return (
          <ReportsScreen
            transactions={transactions}
            darkMode={darkMode}
            customCategories={customCategories}
            activeWalletId={activeWalletId}
            onAdd={() => pushScreen(SCREENS.ADD)}
            onOpenTransaction={openTransaction}
            onOpenAdvanced={() => pushScreen(SCREENS.ADVANCED_REPORTS)}
            onNavigate={switchTab}
          />
        );
      case SCREENS.ADVANCED_REPORTS:
        return (
          <AdvancedReportsScreen
            transactions={transactions}
            darkMode={darkMode}
            customCategories={customCategories}
            activeWalletId={activeWalletId}
            onBack={popScreen}
            onOpenTransaction={openTransaction}
          />
        );
      case SCREENS.BUDGET:
        return (
          <BudgetScreen
            transactions={transactions}
            budgets={budgets}
            darkMode={darkMode}
            customCategories={customCategories}
            activeWalletId={activeWalletId}
            onOpenEditBudget={() => pushScreen(SCREENS.EDIT_BUDGET)}
            onAdd={() => pushScreen(SCREENS.ADD)}
            onOpenTransaction={openTransaction}
            onNavigate={switchTab}
          />
        );
      case SCREENS.EDIT_BUDGET:
        return <EditBudgetScreen budgets={budgets} categories={customCategories} darkMode={darkMode} onBack={popScreen} onSaveBudgets={handleSaveBudgets} />;
      case SCREENS.PROFILE:
        return (
          <ProfileScreen
            user={user}
            categories={customCategories}
            transactions={transactions}
            budgets={budgets}
            currency={currency}
            onSelectCurrency={(nextCurrency) => {
              setCurrency(nextCurrency);
              saveCurrency(nextCurrency, user.email);
            }}
            darkMode={darkMode}
            onToggleDarkMode={handleToggleDarkMode}
            notifications={notifications}
            onToggleNotifications={() => setNotifications((prev) => {
              const next = !prev;
              saveNotifications(next, user.email);
              return next;
            })}
            wallets={wallets}
            activeWalletId={activeWalletId}
            onSelectWallet={handleSelectWallet}
            onAddWallet={handleAddWallet}
            onRenameWallet={handleRenameWallet}
            onDeleteWallet={handleDeleteWallet}
            onOpenEditBudget={() => pushScreen(SCREENS.EDIT_BUDGET)}
            onOpenManageCategories={() => pushScreen(SCREENS.MANAGE_CATEGORIES)}
            onOpenManageRecurring={() => pushScreen(SCREENS.MANAGE_RECURRING)}
            recurringRules={recurringRules}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
            onImportTransactions={handleImportTransactions}
            onResetAllData={handleResetAllData}
            onAdd={() => pushScreen(SCREENS.ADD)}
            onNavigate={switchTab}
          />
        );
      case SCREENS.MANAGE_CATEGORIES:
        return (
          <ManageCategoriesScreen
            customCategories={customCategories}
            transactions={transactions}
            recurringRules={recurringRules}
            darkMode={darkMode}
            onBack={popScreen}
            onUpdateCategories={handleUpdateCategories}
          />
        );
      case SCREENS.MANAGE_RECURRING:
        return (
          <ManageRecurringScreen
            recurringRules={recurringRules}
            categories={customCategories}
            darkMode={darkMode}
            onClose={popScreen}
            onToggleRule={handleToggleRecurringRule}
            onDeleteRule={handleDeleteRecurringRule}
            onEditRule={(rule) => {
              setSelectedTransaction(rule);
              pushScreen(SCREENS.EDIT);
            }}
          />
        );
      case SCREENS.ADD:
        return (
          <TransactionFormScreen
            recurringRules={recurringRules}
            categories={customCategories}
            wallets={wallets}
            activeWalletId={activeWalletId}
            darkMode={darkMode}
            onClose={popScreen}
            onSave={handleAddTransaction}
          />
        );
      case SCREENS.DETAILS:
        if (selectedTransaction) {
          return (
            <TransactionDetailsScreen
              transaction={selectedTransaction}
              categories={customCategories}
              darkMode={darkMode}
              onBack={popScreen}
              onEdit={() => pushScreen(SCREENS.EDIT)}
              onDelete={handleDeleteTransaction}
            />
          );
        }
        return null;
      case SCREENS.EDIT:
        if (selectedTransaction) {
          return (
            <TransactionFormScreen
              transaction={selectedTransaction}
              recurringRules={recurringRules}
              categories={customCategories}
              wallets={wallets}
              activeWalletId={activeWalletId}
              darkMode={darkMode}
              onClose={popScreen}
              onSave={handleEditTransaction}
            />
          );
        }
        return null;
      default:
        return (
          <HomeScreen
            transactions={transactions}
            budgets={budgets}
            user={user}
            darkMode={darkMode}
            customCategories={customCategories}
              wallets={wallets}
            activeWalletId={activeWalletId}
            onSelectWallet={handleSelectWallet}
            onAdd={() => pushScreen(SCREENS.ADD)}
            onVoiceAdd={handleVoiceAdd}
            onOpenTransaction={openTransaction}
            onNavigate={switchTab}
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, (currentScreen === SCREENS.SPLASH || currentScreen === SCREENS.LOGIN || darkMode) && styles.splashScreen]}>
        <StatusBar style={currentScreen === SCREENS.SPLASH || (currentScreen === SCREENS.LOGIN && darkMode) || darkMode ? 'light' : 'dark'} />
        {renderScreen()}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
