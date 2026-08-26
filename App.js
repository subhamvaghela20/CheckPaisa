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
  loadDarkMode,
  loadSetupCompleted,
  loadTransactions,
  loadUser,
  loadWallets,
  saveBudgets,
  saveCategories,
  saveDarkMode,
  saveSetupCompleted,
  saveTransactions,
  saveUser,
  saveWallets,
} from './src/utils/storage';
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
        if (Array.isArray(storedWallets) && storedWallets.length > 0) setWallets(storedWallets);
      });
    });

    loadCategories().then((storedCats) => {
      if (Array.isArray(storedCats) && storedCats.length > 0) {
        setCustomCategories(storedCats);
      }
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
      if (Array.isArray(w) && w.length > 0) setWallets(w);
    });
    saveUser(guestUser);
    setHistory([SCREENS.HOME]);
  };

  const handleUpdateProfile = async (updatedUser) => {
    setUser(updatedUser);
    await saveUser(updatedUser);
  };

  const handleUpdateCategories = async (updatedCategories) => {
    setCustomCategories(updatedCategories);
    await saveCategories(updatedCategories);
  };

  const handleLogout = async () => {
    await saveUser(null);
    const defaultUser = { name: 'Siddharajsinh', email: 'siddharajsinh@example.com' };
    setUser(defaultUser);
    setTransactions([]);
    setBudgets(null);
    setHistory([SCREENS.LOGIN]);
  };

  const handleDeleteAccount = async () => {
    await deleteUserData(user.email);
    await saveUser(null);

    const defaultUser = { name: 'Siddharajsinh', email: 'siddharajsinh@example.com' };
    setUser(defaultUser);
    setTransactions([]);
    setBudgets(null);
    setHistory([SCREENS.LOGIN]);
  };

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      saveDarkMode(next);
      return next;
    });
  };

  const handleAddTransaction = (transaction) => {
    const txWithWallet = {
      ...transaction,
      walletId: transaction.walletId || activeWalletId || 'default_wallet',
    };
    setTransactions((current) => {
      const updated = [txWithWallet, ...current];
      saveTransactions(updated, user.email);
      return updated;
    });
    popScreen();
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

  const handleEditTransaction = (updatedTransaction) => {
    setTransactions((current) => {
      const updated = current.map((item) => (item.id === updatedTransaction.id ? updatedTransaction : item));
      saveTransactions(updated, user.email);
      return updated;
    });
    setSelectedTransaction(updatedTransaction);
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
      const updated = [...importedList, ...current];
      saveTransactions(updated, user.email);
      return updated;
    });
  };

  const handleResetAllData = () => {
    setTransactions([]);
    setBudgets(null);
    saveTransactions([], user.email);
    saveBudgets(null, user.email);
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
            onOpenEditBudget={() => pushScreen(SCREENS.EDIT_BUDGET)}
            onAdd={() => pushScreen(SCREENS.ADD)}
            onOpenTransaction={openTransaction}
            onNavigate={switchTab}
          />
        );
      case SCREENS.EDIT_BUDGET:
        return <EditBudgetScreen budgets={budgets} darkMode={darkMode} onBack={popScreen} onSaveBudgets={handleSaveBudgets} />;
      case SCREENS.PROFILE:
        return (
          <ProfileScreen
            user={user}
            transactions={transactions}
            budgets={budgets}
            currency={currency}
            onSelectCurrency={setCurrency}
            darkMode={darkMode}
            onToggleDarkMode={handleToggleDarkMode}
            notifications={notifications}
            onToggleNotifications={() => setNotifications((prev) => !prev)}
            wallets={wallets}
            activeWalletId={activeWalletId}
            onSelectWallet={handleSelectWallet}
            onAddWallet={handleAddWallet}
            onRenameWallet={handleRenameWallet}
            onDeleteWallet={handleDeleteWallet}
            onOpenEditBudget={() => pushScreen(SCREENS.EDIT_BUDGET)}
            onOpenManageCategories={() => pushScreen(SCREENS.MANAGE_CATEGORIES)}
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
      case SCREENS.ADD:
        return (
          <TransactionFormScreen
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
              categories={customCategories}
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
