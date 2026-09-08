import React, { useEffect, useState } from 'react';
import { BackHandler, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState(null);
  const [currency, setCurrency] = useState('INR (₹)');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [customCategories, setCustomCategories] = useState(defaultCategories);
  const [user, setUser] = useState({ name: 'Siddharajsinh', email: 'siddharajsinh@example.com' });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [wallets, setWallets] = useState(DEFAULT_WALLETS);
  const [activeWalletId, setActiveWalletId] = useState('default_wallet');
  const [recurringRules, setRecurringRules] = useState([]);

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

  // Initial Splash Screen Timer & Auto-Login Check
  useEffect(() => {
    const splashTimer = setTimeout(async () => {
      const storedUser = await loadUser();
      if (storedUser && storedUser.email) {
        setHistory([SCREENS.HOME]);
      } else {
        setHistory([SCREENS.ONBOARDING]);
      }
    }, 1700);

    return () => clearTimeout(splashTimer);
  }, []);

  // Initial Data Loader
  useEffect(() => {
    loadUser().then((storedUser) => {
      const activeUser = storedUser || { name: 'Siddharajsinh', email: 'siddharajsinh@example.com' };
      setUser(activeUser);

      loadTransactions(activeUser.email).then((storedTx) => {
        if (Array.isArray(storedTx)) setTransactions(storedTx);
      });

      loadBudgets(activeUser.email).then((storedBudgets) => {
        if (storedBudgets) setBudgets(storedBudgets);
      });

      loadWallets(activeUser.email).then((storedWallets) => {
        if (Array.isArray(storedWallets) && storedWallets.length > 0) {
          setWallets(storedWallets);
          setActiveWalletId(storedWallets[0].id);
        }
      });
      loadCategories(activeUser.email).then((storedCats) => {
        if (Array.isArray(storedCats) && storedCats.length > 0) setCustomCategories(storedCats);
        else setCustomCategories(defaultCategories);
      });
      loadCurrency(activeUser.email).then(setCurrency);
      loadNotifications(activeUser.email).then(setNotifications);

      loadRecurringRules(activeUser.email).then(async (storedRules) => {
        if (Array.isArray(storedRules)) setRecurringRules(storedRules);
        if (Array.isArray(storedRules) && storedRules.length > 0) {
          const currentTx = (await loadTransactions(activeUser.email)) || [];
          const { newTransactions, updatedRules } = processRecurringRules(storedRules, currentTx);
          if (newTransactions.length > 0) {
            const finalTx = [...newTransactions, ...currentTx];
            setTransactions(finalTx);
            saveTransactions(finalTx, activeUser.email);
          }
          if (JSON.stringify(updatedRules) !== JSON.stringify(storedRules)) {
            setRecurringRules(updatedRules);
            saveRecurringRules(updatedRules, activeUser.email);
          }
        }
      });
    });

    loadDarkMode().then((isDark) => setDarkMode(isDark));
  }, []);

  const handleLoginSuccess = async (userData) => {
    setUser(userData);
    await saveUser(userData);

    const txs = await loadTransactions(userData.email);
    setTransactions(txs);

    const b = await loadBudgets(userData.email);
    setBudgets(b);

    const w = await loadWallets(userData.email);
    if (Array.isArray(w) && w.length > 0) {
      setWallets(w);
      setActiveWalletId(w[0].id);
    }

    const cats = await loadCategories(userData.email);
    setCustomCategories(Array.isArray(cats) && cats.length > 0 ? cats : defaultCategories);
    setCurrency(await loadCurrency(userData.email));
    setNotifications(await loadNotifications(userData.email));

    const rules = await loadRecurringRules(userData.email);
    setRecurringRules(rules || []);
    if (Array.isArray(rules) && rules.length > 0) {
      const { newTransactions, updatedRules } = processRecurringRules(rules, txs || []);
      if (newTransactions.length > 0) {
        const finalTx = [...newTransactions, ...(txs || [])];
        setTransactions(finalTx);
        saveTransactions(finalTx, userData.email);
      }
      if (JSON.stringify(updatedRules) !== JSON.stringify(rules)) {
        setRecurringRules(updatedRules);
        saveRecurringRules(updatedRules, userData.email);
      }
    }

    const isSetupDone = await loadSetupCompleted(userData.email);

    // If setup not completed yet for registered user (not guest):
    if (!isSetupDone && !userData.isGuest) {
      setHistory([SCREENS.INITIAL_SETUP]);
    } else {
      setHistory([SCREENS.HOME]);
    }
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
    setUser(guestUser);
    await saveUser(guestUser);

    loadTransactions(guestUser.email).then(setTransactions);
    loadBudgets(guestUser.email).then(setBudgets);
    loadWallets(guestUser.email).then((w) => {
      if (Array.isArray(w) && w.length > 0) {
        setWallets(w);
        setActiveWalletId(w[0].id);
      }
    });
    loadCategories(guestUser.email).then((cats) => setCustomCategories(Array.isArray(cats) && cats.length > 0 ? cats : defaultCategories));
    loadCurrency(guestUser.email).then(setCurrency);
    loadNotifications(guestUser.email).then(setNotifications);
    loadRecurringRules(guestUser.email).then((r) => setRecurringRules(Array.isArray(r) ? r : []));
    setHistory([SCREENS.HOME]);
  };

  const handleUpdateProfile = async (updatedUser) => {
    const result = await updateUserProfile(user.email, updatedUser);
    if (!result.success) return result;
    setUser(updatedUser);
    await saveUser(updatedUser);
    return result;
  };

  const handleUpdateCategories = async (updatedCategories) => {
    setCustomCategories(updatedCategories);
    await saveCategories(updatedCategories, user.email);
  };

  const handleLogout = async () => {
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
  };

  const handleDeleteAccount = async () => {
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
  };

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      saveDarkMode(next);
      return next;
    });
  };

  const handleAddTransaction = (transaction, recurringRule) => {
    // If a recurring rule is present, processRecurringRules automatically generates the transaction(s) starting from fromDate.
    // Therefore, txWithWallet is only included for non-recurring transactions to prevent duplicate entries on the start date.
    const txWithWallet = (transaction && !recurringRule)
      ? [
          {
            ...transaction,
            walletId: transaction.walletId || activeWalletId || 'default_wallet',
          },
        ]
      : [];

    setTransactions((currentTx) => {
      let updatedRulesList = recurringRules;
      let extraRecurringTx = [];

      if (recurringRule) {
        const newRules = [recurringRule, ...recurringRules];
        const processed = processRecurringRules(newRules, currentTx);
        extraRecurringTx = processed.newTransactions;
        updatedRulesList = processed.updatedRules;
        setRecurringRules(updatedRulesList);
        saveRecurringRules(updatedRulesList, user.email);
      }

      const finalTxList = [...extraRecurringTx, ...txWithWallet, ...currentTx];
      saveTransactions(finalTxList, user.email);
      return finalTxList;
    });

    popScreen();
  };

  const handleToggleRecurringRule = (ruleId) => {
    setRecurringRules((current) => {
      const updated = current.map((rule) => (rule.id === ruleId ? { ...rule, isActive: rule.isActive === false } : rule));
      saveRecurringRules(updated, user.email);
      return updated;
    });
  };

  const handleDeleteRecurringRule = (ruleId) => {
    setRecurringRules((current) => {
      const updated = current.filter((rule) => rule.id !== ruleId);
      saveRecurringRules(updated, user.email);
      return updated;
    });
  };

  const handleVoiceAdd = (transaction) => {
    const txWithWallet = {
      ...transaction,
      walletId: transaction.walletId || activeWalletId || 'default_wallet',
    };
    setTransactions((current) => {
      const updated = [txWithWallet, ...current];
      saveTransactions(updated, user.email);
      return updated;
    });
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

  const handleDeleteWallet = (walletId) => {
    const target = wallets.find((w) => w.id === walletId);
    if (!target || target.isDefault || walletId === 'default_wallet') return;

    const updatedWallets = wallets.filter((w) => w.id !== walletId);
    setWallets(updatedWallets);
    saveWallets(updatedWallets, user.email);

    // Reassign deleted wallet's transactions to default wallet
    setTransactions((prev) => {
      const updatedTx = prev.map((tx) => (tx.walletId === walletId ? { ...tx, walletId: 'default_wallet' } : tx));
      saveTransactions(updatedTx, user.email);
      return updatedTx;
    });

    if (activeWalletId === walletId) {
      setActiveWalletId('default_wallet');
    }
  };

  const handleEditTransaction = (updatedTransaction, recurringRule) => {
    if (recurringRule) {
      setRecurringRules((currentRules) => {
        const exists = currentRules.some((r) => r.id === recurringRule.id);
        const updatedRules = exists
          ? currentRules.map((r) => (r.id === recurringRule.id ? { ...r, ...recurringRule } : r))
          : [recurringRule, ...currentRules];
        saveRecurringRules(updatedRules, user.email);

        // Re-process recurring rules to generate/update transactions
        setTransactions((currentTx) => {
          const processed = processRecurringRules(updatedRules, currentTx);
          const finalTxList = processed.newTransactions.length > 0
            ? [...processed.newTransactions, ...currentTx]
            : currentTx;
          saveTransactions(finalTxList, user.email);
          return finalTxList;
        });

        return updatedRules;
      });
    }

    if (updatedTransaction && updatedTransaction.id) {
      setTransactions((current) => {
        const exists = current.some((item) => item.id === updatedTransaction.id);
        let updated;
        if (exists) {
          updated = current.map((item) => (item.id === updatedTransaction.id ? updatedTransaction : item));
        } else if (!recurringRule) {
          updated = [updatedTransaction, ...current];
        } else {
          updated = current;
        }
        saveTransactions(updated, user.email);
        return updated;
      });
      setSelectedTransaction(updatedTransaction);
    }
    popScreen();
  };

  const handleDeleteTransaction = (transactionId) => {
    setTransactions((current) => {
      const updated = current.filter((item) => item.id !== transactionId);
      saveTransactions(updated, user.email);
      return updated;
    });
    setSelectedTransaction(null);
    popScreen();
  };

  const handleSaveBudgets = (updatedBudgets) => {
    setBudgets(updatedBudgets);
    saveBudgets(updatedBudgets, user.email);
    popScreen();
  };

  const handleImportTransactions = (importedList) => {
    setTransactions((current) => {
      const existingIds = new Set(current.map((item) => item.id));
      const uniqueImported = importedList.filter((item) => !existingIds.has(item.id));
      const updated = [...uniqueImported, ...current];
      saveTransactions(updated, user.email);
      return updated;
    });
  };

  const handleResetAllData = async () => {
    setTransactions([]);
    setBudgets(null);
    setWallets(DEFAULT_WALLETS);
    setActiveWalletId('default_wallet');
    setCustomCategories(defaultCategories);
    setRecurringRules([]);
    await Promise.all([
      saveTransactions([], user.email),
      saveBudgets(null, user.email),
      saveWallets(DEFAULT_WALLETS, user.email),
      saveCategories(defaultCategories, user.email),
      saveRecurringRules([], user.email),
    ]);
    setHistory([SCREENS.HOME]);
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
      <SafeAreaView style={[styles.screen, (currentScreen === SCREENS.SPLASH || currentScreen === SCREENS.LOGIN || darkMode) && styles.splashScreen]}>
        <StatusBar style={currentScreen === SCREENS.SPLASH || (currentScreen === SCREENS.LOGIN && darkMode) || darkMode ? 'light' : 'dark'} />
        {renderScreen()}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
