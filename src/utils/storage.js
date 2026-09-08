import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@checkpaisa_active_user';
const DARK_MODE_KEY = '@checkpaisa_darkmode';
const LEGACY_CATEGORIES_KEY = '@checkpaisa_categories';
const CURRENCY_KEY = '@checkpaisa_currency';
const NOTIFICATIONS_KEY = '@checkpaisa_notifications';
const REGISTERED_USERS_KEY = '@checkpaisa_registered_users';

const DEFAULT_REGISTERED_USERS = [
  { name: 'Siddharajsinh', email: 'siddharajsinh@example.com', password: '1234' },
  { name: 'User', email: 'user@example.com', password: '1234' },
];

export const DEFAULT_WALLETS = [
  {
    id: 'default_wallet',
    name: 'Main Wallet',
    initialBalance: 0,
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
];

function getWalletKey(email) {
  const sanitized = email ? email.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'default';
  return `@checkpaisa_wallets_${sanitized}`;
}

export async function loadWallets(email) {
  try {
    const key = getWalletKey(email);
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return DEFAULT_WALLETS;
  } catch (e) {
    console.error('Failed to load wallets from storage:', e);
    return DEFAULT_WALLETS;
  }
}

export async function saveWallets(wallets, email) {
  try {
    const key = getWalletKey(email);
    const jsonValue = JSON.stringify(wallets);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Failed to save wallets to storage:', e);
  }
}

function getTxKey(email) {
  const sanitized = email ? email.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'default';
  return `@checkpaisa_tx_${sanitized}`;
}

function getBudgetKey(email) {
  const sanitized = email ? email.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'default';
  return `@checkpaisa_budgets_${sanitized}`;
}

function getCategoriesKey(email) {
  const sanitized = email ? email.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'default';
  return `@checkpaisa_categories_${sanitized}`;
}

function getPreferenceKey(baseKey, email) {
  const sanitized = email ? email.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'default';
  return `${baseKey}_${sanitized}`;
}

export async function loadTransactions(email) {
  try {
    const key = getTxKey(email);
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to load transactions from storage:', e);
    return [];
  }
}

export async function saveTransactions(transactions, email) {
  try {
    const key = getTxKey(email);
    const jsonValue = JSON.stringify(transactions);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Failed to save transactions to storage:', e);
  }
}

export async function loadBudgets(email) {
  try {
    const key = getBudgetKey(email);
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Failed to load budgets from storage:', e);
    return null;
  }
}

export async function saveBudgets(budgets, email) {
  try {
    const key = getBudgetKey(email);
    const jsonValue = JSON.stringify(budgets);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Failed to save budgets to storage:', e);
  }
}

export async function loadCategories(email) {
  try {
    const jsonValue = await AsyncStorage.getItem(getCategoriesKey(email));
    if (jsonValue != null) return JSON.parse(jsonValue);

    // Preserve categories saved by earlier app versions, then isolate future edits per user.
    const legacyValue = await AsyncStorage.getItem(LEGACY_CATEGORIES_KEY);
    return legacyValue != null ? JSON.parse(legacyValue) : null;
  } catch (e) {
    console.error('Failed to load categories:', e);
    return null;
  }
}

export async function saveCategories(categoriesList, email) {
  try {
    const jsonValue = JSON.stringify(categoriesList);
    await AsyncStorage.setItem(getCategoriesKey(email), jsonValue);
  } catch (e) {
    console.error('Failed to save categories:', e);
  }
}

export async function loadCurrency(email) {
  try {
    return (await AsyncStorage.getItem(getPreferenceKey(CURRENCY_KEY, email))) || 'INR (₹)';
  } catch (e) {
    return 'INR (₹)';
  }
}

export async function saveCurrency(currency, email) {
  try {
    await AsyncStorage.setItem(getPreferenceKey(CURRENCY_KEY, email), currency);
  } catch (e) {
    console.error('Failed to save currency preference:', e);
  }
}

export async function loadNotifications(email) {
  try {
    const value = await AsyncStorage.getItem(getPreferenceKey(NOTIFICATIONS_KEY, email));
    return value == null ? true : value === 'true';
  } catch (e) {
    return true;
  }
}

export async function saveNotifications(enabled, email) {
  try {
    await AsyncStorage.setItem(getPreferenceKey(NOTIFICATIONS_KEY, email), String(Boolean(enabled)));
  } catch (e) {
    console.error('Failed to save notification preference:', e);
  }
}

export async function loadRegisteredUsers() {
  try {
    const jsonValue = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Return default pre-seeded accounts out-of-the-box
    await AsyncStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(DEFAULT_REGISTERED_USERS));
    return DEFAULT_REGISTERED_USERS;
  } catch (e) {
    console.error('Failed to load registered users:', e);
    return DEFAULT_REGISTERED_USERS;
  }
}

export async function saveRegisteredUsers(users) {
  try {
    const jsonValue = JSON.stringify(users);
    await AsyncStorage.setItem(REGISTERED_USERS_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to save registered users:', e);
  }
}

export async function deleteUserData(email) {
  try {
    const txKey = getTxKey(email);
    const budgetKey = getBudgetKey(email);
    const walletKey = getWalletKey(email);
    await AsyncStorage.multiRemove([
      txKey,
      budgetKey,
      walletKey,
      getCategoriesKey(email),
      getSetupKey(email),
      getPreferenceKey(CURRENCY_KEY, email),
      getPreferenceKey(NOTIFICATIONS_KEY, email),
    ]);

    // Remove from registered users list if present
    const users = await loadRegisteredUsers();
    const updatedUsers = users.filter((u) => u.email.toLowerCase() !== email.toLowerCase());
    await saveRegisteredUsers(updatedUsers);
  } catch (e) {
    console.error('Failed to delete user data:', e);
  }
}

export async function updateUserProfile(oldEmail, updatedUser) {
  const nextEmail = updatedUser.email.toLowerCase();
  const previousEmail = oldEmail.toLowerCase();
  try {
    const users = await loadRegisteredUsers();
    const conflictingUser = users.find((item) => item.email.toLowerCase() === nextEmail && item.email.toLowerCase() !== previousEmail);
    if (conflictingUser) return { success: false, error: 'An account already uses this email address.' };

    if (previousEmail !== nextEmail) {
      const keyPairs = [
        [getTxKey(oldEmail), getTxKey(updatedUser.email)],
        [getBudgetKey(oldEmail), getBudgetKey(updatedUser.email)],
        [getWalletKey(oldEmail), getWalletKey(updatedUser.email)],
        [getCategoriesKey(oldEmail), getCategoriesKey(updatedUser.email)],
        [getSetupKey(oldEmail), getSetupKey(updatedUser.email)],
        [getPreferenceKey(CURRENCY_KEY, oldEmail), getPreferenceKey(CURRENCY_KEY, updatedUser.email)],
        [getPreferenceKey(NOTIFICATIONS_KEY, oldEmail), getPreferenceKey(NOTIFICATIONS_KEY, updatedUser.email)],
      ];
      for (const [oldKey, newKey] of keyPairs) {
        const value = await AsyncStorage.getItem(oldKey);
        if (value != null) await AsyncStorage.setItem(newKey, value);
      }
      await AsyncStorage.multiRemove(keyPairs.map(([oldKey]) => oldKey));
    }

    const updatedUsers = users.map((item) => item.email.toLowerCase() === previousEmail
      ? { ...item, name: updatedUser.name, email: updatedUser.email }
      : item);
    await saveRegisteredUsers(updatedUsers);
    return { success: true };
  } catch (e) {
    console.error('Failed to update profile:', e);
    return { success: false, error: 'Could not save profile changes. Please try again.' };
  }
}

export async function loadUser() {
  try {
    const jsonValue = await AsyncStorage.getItem(USER_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Failed to load user:', e);
    return null;
  }
}

export async function saveUser(user) {
  try {
    if (user) {
      const jsonValue = JSON.stringify(user);
      await AsyncStorage.setItem(USER_KEY, jsonValue);
    } else {
      await AsyncStorage.removeItem(USER_KEY);
    }
  } catch (e) {
    console.error('Failed to save user:', e);
  }
}

export async function loadDarkMode() {
  try {
    const jsonValue = await AsyncStorage.getItem(DARK_MODE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : false;
  } catch (e) {
    console.error('Failed to load dark mode preference:', e);
    return false;
  }
}

export async function saveDarkMode(isDark) {
  try {
    const jsonValue = JSON.stringify(isDark);
    await AsyncStorage.setItem(DARK_MODE_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to save dark mode preference:', e);
  }
}


function getSetupKey(email) {
  const sanitized = email ? email.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'default';
  return `@checkpaisa_setup_done_${sanitized}`;
}

export async function loadSetupCompleted(email) {
  try {
    const key = getSetupKey(email);
    const value = await AsyncStorage.getItem(key);
    return value === 'true';
  } catch (e) {
    return false;
  }
}

export async function saveSetupCompleted(email, isCompleted = true) {
  try {
    const key = getSetupKey(email);
    if (isCompleted) {
      await AsyncStorage.setItem(key, 'true');
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (e) {
    console.error('Failed to save setup completed:', e);
  }
}

function getRecurringRulesKey(email) {
  const sanitized = email ? email.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'default';
  return `@checkpaisa_recurring_rules_${sanitized}`;
}

export async function loadRecurringRules(email) {
  try {
    const key = getRecurringRulesKey(email);
    const value = await AsyncStorage.getItem(key);
    return value != null ? JSON.parse(value) : [];
  } catch (e) {
    console.error('Failed to load recurring rules:', e);
    return [];
  }
}

export async function saveRecurringRules(rules, email) {
  try {
    const key = getRecurringRulesKey(email);
    await AsyncStorage.setItem(key, JSON.stringify(rules || []));
  } catch (e) {
    console.error('Failed to save recurring rules:', e);
  }
}
