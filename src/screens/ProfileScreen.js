import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../components/AppIcon';
import { CustomAlertModal } from '../components/CustomAlertModal';
import { green, styles } from '../styles/styles';

const CURRENCIES = [
  { label: 'INR (₹)', symbol: '₹', code: 'INR' },
  { label: 'USD ($)', symbol: '$', code: 'USD' },
  { label: 'EUR (€)', symbol: '€', code: 'EUR' },
  { label: 'GBP (£)', symbol: '£', code: 'GBP' },
];

export function ProfileScreen({
  user,
  transactions = [],
  budgets = null,
  currency = 'INR (₹)',
  onSelectCurrency,
  darkMode = false,
  notifications = true,
  onToggleNotifications,
  onOpenEditBudget,
  onOpenManageCategories,
  onUpdateProfile,
  onLogout,
  onDeleteAccount,
  onImportTransactions,
  onResetAllData,
  onAdd,
  onNavigate,
  wallets = [],
  activeWalletId = 'default_wallet',
  onSelectWallet,
  onAddWallet,
  onRenameWallet,
  onDeleteWallet,
}) {
  const [activeTab, setActiveTab] = useState('Profile');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [editingWallet, setEditingWallet] = useState(null);
  const [renameText, setRenameText] = useState('');
  const [renameBalance, setRenameBalance] = useState('');
  const insets = useSafeAreaInsets();

  const isGuest = Boolean(user?.isGuest || user?.email === 'guest@checkpaisa.app');
  const userName = user?.name || (isGuest ? 'Guest User' : 'Siddharajsinh');
  const userEmail = user?.email || 'guest@checkpaisa.app';
  const initial = userName.charAt(0).toUpperCase();

  const [editName, setEditName] = useState(userName);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [importText, setImportText] = useState('');

  // Reusable Rounded Custom Alert Modal state
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: '',
    message: '',
    icon: '⚠️',
    confirmText: 'OK',
    cancelText: null,
    isDestructive: false,
    onConfirm: null,
  });

  const showAlert = (config) => {
    setAlertModal({
      visible: true,
      title: config.title || 'Notice',
      message: config.message || '',
      icon: config.icon || 'ℹ️',
      confirmText: config.confirmText || 'OK',
      cancelText: config.cancelText || null,
      isDestructive: Boolean(config.isDestructive),
      onConfirm: config.onConfirm || (() => setAlertModal((prev) => ({ ...prev, visible: false }))),
    });
  };

  const closeAlert = () => {
    setAlertModal((prev) => ({ ...prev, visible: false }));
  };

  const navigate = (tab) => {
    setActiveTab(tab);
    onNavigate?.(tab);
  };

  const handleOpenEditProfile = () => {
    setEditName(userName);
    setEditEmail(userEmail);
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = () => {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();
    if (!trimmedName) {
      return showAlert({ title: 'Invalid Name', message: 'Please enter your name.', icon: '⚠️' });
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return showAlert({ title: 'Invalid Email', message: 'Please enter a valid email address.', icon: '⚠️' });
    }

    onUpdateProfile({ name: trimmedName, email: trimmedEmail, isGuest });
    setShowEditProfileModal(false);
  };

  // CSV Export Generator
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      return showAlert({ title: 'No Data to Export', message: 'There are no transaction records available to export.', icon: '📄' });
    }

    let csvContent = 'ID,Type,Category,Amount,Date,Notes\n';
    transactions.forEach((t) => {
      const cleanNote = (t.note || '').replace(/"/g, '""');
      csvContent += `"${t.id}","${t.type}","${t.category}",${t.amount},"${t.createdAt}","${cleanNote}"\n`;
    });

    showAlert({
      title: 'Export Successful',
      message: `Successfully generated export for ${transactions.length} transaction record(s).\n\nSample:\n${csvContent.slice(0, 160)}...`,
      icon: '📊',
    });
  };

  // CSV Import Processor
  const handleProcessImport = () => {
    if (!importText.trim()) {
      return showAlert({ title: 'Empty Input', message: 'Please paste valid CSV data lines to import.', icon: '⚠️' });
    }

    try {
      const lines = importText.trim().split('\n');
      const importedList = [];

      lines.forEach((line, index) => {
        if (index === 0 && line.toLowerCase().includes('type')) return;
        const parts = line.split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 5) {
          const [id, type, category, amountStr, createdAt, note] = parts;
          const numAmount = Number(amountStr);
          if (numAmount > 0 && (type === 'Expense' || type === 'Income')) {
            importedList.push({
              id: id || String(Date.now() + index),
              type,
              category: category || 'Other',
              amount: numAmount,
              createdAt: createdAt || new Date().toISOString(),
              note: note || '',
            });
          }
        }
      });

      if (importedList.length === 0) {
        return showAlert({ title: 'Import Error', message: 'Could not parse any valid transaction records. Please check the CSV line format.', icon: '⚠️' });
      }

      onImportTransactions(importedList);
      setShowImportModal(false);
      setImportText('');
      showAlert({ title: 'Import Successful', message: `Successfully imported ${importedList.length} transaction record(s).`, icon: '✅' });
    } catch (e) {
      showAlert({ title: 'Import Error', message: 'An unexpected error occurred while processing CSV import.', icon: '⚠️' });
    }
  };

  // Reset All Confirmation
  const handleConfirmReset = () => {
    showAlert({
      title: 'Reset All Data',
      message: 'Are you sure you want to reset all app records? This will delete all your transactions and budget limits.',
      icon: '🗑️',
      confirmText: 'Reset All',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => {
        closeAlert();
        onResetAllData();
      },
    });
  };

  // Log Out Confirmation (For Registered Users Only)
  const handleConfirmLogout = () => {
    showAlert({
      title: 'Log Out Account',
      message: 'Are you sure you want to log out of your CheckPaisa account?',
      icon: '🚪',
      confirmText: 'Log Out',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => {
        closeAlert();
        onLogout();
      },
    });
  };

  // Delete Account Confirmation (For BOTH Guest User and Registered Users)
  const handleConfirmDeleteAccount = () => {
    showAlert({
      title: 'Delete Account',
      message: 'Are you sure you want to delete your account? All saved transactions, budgets, and account credentials will be permanently erased.',
      icon: '⚠️',
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => {
        closeAlert();
        onDeleteAccount();
      },
    });
  };

  const cardStyle = darkMode ? styles.darkProfileCard : styles.profileCard;
  const rowLabelStyle = darkMode ? styles.darkProfileRowLabel : styles.profileRowLabel;
  const sectionHeadingStyle = darkMode ? styles.darkProfileSectionHeading : styles.profileSectionHeading;

  const innerContent = (
    <>
      <ScrollView style={styles.homeMainScroll} contentContainerStyle={[styles.homeMainScrollContent, { paddingBottom: 110 }]} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeaderSection}>
          {darkMode ? (
            <LinearGradient colors={['#10B981', '#059669']} style={styles.profileAvatarLarge}>
              <Text style={[styles.profileAvatarText, { color: '#000' }]}>{initial}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.profileAvatarLarge}>
              <Text style={styles.profileAvatarText}>{initial}</Text>
            </View>
          )}

          <Text style={[styles.profileName, darkMode && { color: '#FFF' }]}>{userName}</Text>
          <Text style={[styles.profileEmail, darkMode && { color: '#94A3B8' }]}>{userEmail}</Text>

          <Pressable style={styles.editProfileButton} onPress={handleOpenEditProfile}>
            <Text style={styles.editProfileButtonText}>Edit Profile ✎</Text>
          </Pressable>
        </View>

        {/* 1. PREFERENCES Card */}
        <View style={styles.profileSectionGroup}>
          <Text style={sectionHeadingStyle}>PREFERENCES</Text>
          <View style={cardStyle}>
            {/* Currency Row */}
            <Pressable style={styles.profileRowItem} onPress={() => setShowCurrencyModal(true)}>
              <View style={[styles.profileRowIconTile, { backgroundColor: darkMode ? 'rgba(16,185,129,0.18)' : '#E6F9F2' }]}>
                <Text style={{ fontSize: 16, color: '#10B981', fontWeight: '800' }}>₹</Text>
              </View>
              <Text style={rowLabelStyle}>Currency</Text>
              <View style={styles.profileRowRight}>
                <Text style={[styles.profileRowValue, darkMode && { color: '#94A3B8' }]}>{currency}</Text>
                <Text style={styles.profileRowChevron}>›</Text>
              </View>
            </Pressable>

            <View style={[styles.profileDivider, darkMode && { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

            {/* Notifications Row */}
            <View style={styles.profileRowItem}>
              <View style={[styles.profileRowIconTile, { backgroundColor: darkMode ? 'rgba(217,119,6,0.2)' : '#FEF3C7' }]}>
                <AppIcon name="bell" color="#D97706" size={18} />
              </View>
              <Text style={rowLabelStyle}>Notifications</Text>
              <Switch
                value={notifications}
                onValueChange={onToggleNotifications}
                trackColor={{ false: '#CBD5E1', true: green }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* 2. MANAGEMENT Card */}
        <View style={styles.profileSectionGroup}>
          <Text style={sectionHeadingStyle}>MANAGEMENT</Text>
          <View style={cardStyle}>
            {/* Budget Settings */}
            <Pressable style={styles.profileRowItem} onPress={onOpenEditBudget}>
              <View style={[styles.profileRowIconTile, { backgroundColor: darkMode ? 'rgba(13,148,136,0.2)' : '#F0FDFA' }]}>
                <AppIcon name="budget" color="#0D9488" size={18} />
              </View>
              <Text style={rowLabelStyle}>Budget Settings</Text>
              <Text style={styles.profileRowChevron}>›</Text>
            </Pressable>

            <View style={[styles.profileDivider, darkMode && { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

            {/* Manage Categories */}
            <Pressable style={styles.profileRowItem} onPress={onOpenManageCategories}>
              <View style={[styles.profileRowIconTile, { backgroundColor: darkMode ? 'rgba(219,39,119,0.2)' : '#FDF2F8' }]}>
                <AppIcon name="food" color="#DB2777" size={18} />
              </View>
              <Text style={rowLabelStyle}>Manage Categories</Text>
              <Text style={styles.profileRowChevron}>›</Text>
            </Pressable>

            <View style={[styles.profileDivider, darkMode && { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

            {/* Manage Wallets */}
            <Pressable style={styles.profileRowItem} onPress={() => setShowWalletModal(true)}>
              <View style={[styles.profileRowIconTile, { backgroundColor: darkMode ? 'rgba(16,185,129,0.2)' : '#E6F9F2' }]}>
                <AppIcon name="wallet" color="#10B981" size={18} />
              </View>
              <Text style={rowLabelStyle}>Manage Wallets</Text>
              <View style={styles.profileRowRight}>
                <Text style={styles.profileRowValue}>{wallets.length} Wallets</Text>
                <Text style={styles.profileRowChevron}>›</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* 3. DATA MANAGEMENT & ACCOUNT Card */}
        <View style={styles.profileSectionGroup}>
          <Text style={sectionHeadingStyle}>DATA MANAGEMENT & ACCOUNT</Text>
          <View style={cardStyle}>
            {/* Export Data */}
            <Pressable style={styles.profileRowItem} onPress={handleExportCSV}>
              <View style={[styles.profileRowIconTile, { backgroundColor: darkMode ? 'rgba(37,99,235,0.2)' : '#EFF6FF' }]}>
                <AppIcon name="report" color="#2563EB" size={18} />
              </View>
              <Text style={rowLabelStyle}>Export Expenses (Excel / CSV)</Text>
              <Text style={styles.profileRowChevron}>›</Text>
            </Pressable>

            <View style={[styles.profileDivider, darkMode && { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

            {/* Import Data */}
            <Pressable style={styles.profileRowItem} onPress={() => setShowImportModal(true)}>
              <View style={[styles.profileRowIconTile, { backgroundColor: darkMode ? 'rgba(22,163,74,0.2)' : '#F0FDF4' }]}>
                <AppIcon name="plus" color="#16A34A" size={18} />
              </View>
              <Text style={rowLabelStyle}>Import Expenses</Text>
              <Text style={styles.profileRowChevron}>›</Text>
            </Pressable>

            <View style={[styles.profileDivider, darkMode && { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

            {/* Reset All Data */}
            <Pressable style={styles.profileRowItem} onPress={handleConfirmReset}>
              <View style={[styles.profileRowIconTile, { backgroundColor: '#FEF2F2' }]}>
                <Text style={{ fontSize: 16 }}>🗑️</Text>
              </View>
              <Text style={[rowLabelStyle, { color: '#DC2626', fontWeight: '800' }]}>Reset All Data</Text>
              <Text style={[styles.profileRowChevron, { color: '#DC2626' }]}>›</Text>
            </Pressable>

            {/* Log Out Option (For Registered Users ONLY) */}
            {!isGuest && (
              <>
                <View style={[styles.profileDivider, darkMode && { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
                <Pressable style={styles.profileRowItem} onPress={handleConfirmLogout}>
                  <View style={[styles.profileRowIconTile, { backgroundColor: '#FEF2F2' }]}>
                    <Text style={{ fontSize: 16 }}>🚪</Text>
                  </View>
                  <Text style={[rowLabelStyle, { color: '#EF4444', fontWeight: '800' }]}>Log Out Account</Text>
                  <Text style={[styles.profileRowChevron, { color: '#EF4444' }]}>›</Text>
                </Pressable>
              </>
            )}

            {/* Delete Account Option (For BOTH Guest User and Registered Users) */}
            <View style={[styles.profileDivider, darkMode && { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
            <Pressable style={styles.profileRowItem} onPress={handleConfirmDeleteAccount}>
              <View style={[styles.profileRowIconTile, { backgroundColor: '#FEF2F2' }]}>
                <Text style={{ fontSize: 16 }}>⚠️</Text>
              </View>
              <Text style={[rowLabelStyle, { color: '#DC2626', fontWeight: '800' }]}>Delete Account</Text>
              <Text style={[styles.profileRowChevron, { color: '#DC2626' }]}>›</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Popup Modal (Centered & Keyboard Safe) */}
      <Modal visible={showEditProfileModal} transparent animationType="fade" onRequestClose={() => setShowEditProfileModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalCenterBackdrop}>
          <Pressable style={darkMode ? styles.darkEditProfileModalCard : styles.currencyModalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.currencyModalTitle, darkMode && { color: '#FFF' }]}>Edit Profile Details</Text>

            <Text style={styles.addCatPickerLabel}>Full Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Your Full Name"
              placeholderTextColor="#94A3B8"
              style={darkMode ? styles.darkEditInput : styles.addCatInput}
            />

            <Text style={styles.addCatPickerLabel}>Email Address</Text>
            <TextInput
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@example.com"
              placeholderTextColor="#94A3B8"
              style={darkMode ? styles.darkEditInput : styles.addCatInput}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable style={styles.addCatCancelBtn} onPress={() => setShowEditProfileModal(false)}>
                <Text style={styles.addCatCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.addCatSaveBtn} onPress={handleSaveProfile}>
                <Text style={styles.addCatSaveText}>Save Changes</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal visible={showCurrencyModal} transparent animationType="fade" onRequestClose={() => setShowCurrencyModal(false)}>
        <Pressable style={styles.modalCenterBackdrop} onPress={() => setShowCurrencyModal(false)}>
          <Pressable style={darkMode ? styles.darkEditProfileModalCard : styles.currencyModalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.currencyModalTitle, darkMode && { color: '#FFF' }]}>Select Preferred Currency</Text>
            {CURRENCIES.map((curr) => (
              <Pressable
                key={curr.code}
                style={[styles.currencyOptionRow, currency === curr.label && styles.currencyOptionSelected]}
                onPress={() => {
                  onSelectCurrency(curr.label);
                  setShowCurrencyModal(false);
                }}
              >
                <Text style={[styles.currencyOptionText, darkMode && { color: '#FFF' }]}>{curr.label}</Text>
                {currency === curr.label && <Text style={{ color: green, fontWeight: '800' }}>✓</Text>}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Import Data Modal */}
      <Modal visible={showImportModal} transparent animationType="slide" onRequestClose={() => setShowImportModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowImportModal(false)}>
          <View style={[styles.addSheet, darkMode && { backgroundColor: '#091510', borderColor: 'rgba(16,185,129,0.3)', borderWidth: 1 }, { paddingBottom: 28 }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, darkMode && { color: '#FFF' }]}>Import Expenses (CSV)</Text>
            <Text style={[styles.sheetText, darkMode && { color: '#94A3B8' }]}>Paste CSV lines in format: ID,Type,Category,Amount,Date,Notes</Text>
            <TextInput
              value={importText}
              onChangeText={setImportText}
              placeholder={'ID,Type,Category,Amount,Date,Notes\n1,Expense,Food,350,2026-08-05,Lunch'}
              placeholderTextColor="#94A3B8"
              style={[styles.importTextInput, darkMode && { backgroundColor: '#040C08', borderColor: 'rgba(16,185,129,0.2)', color: '#FFF' }]}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 16 }}>
              <Pressable style={[styles.sheetClose, { flex: 1, backgroundColor: '#E2E8F0', marginTop: 0 }]} onPress={() => setShowImportModal(false)}>
                <Text style={[styles.sheetCloseText, { color: '#475569' }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.sheetClose, { flex: 1, marginTop: 0, backgroundColor: green }]} onPress={handleProcessImport}>
                <Text style={styles.sheetCloseText}>Import Data</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

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

      {/* Wallet Management Modal */}
      <Modal visible={showWalletModal} transparent animationType="fade" onRequestClose={() => setShowWalletModal(false)}>
        <Pressable style={styles.modalCenterBackdrop} onPress={() => setShowWalletModal(false)}>
          <Pressable style={[styles.walletModalCard, darkMode && { backgroundColor: '#091510', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.walletModalTitle, darkMode && { color: '#fff' }]}>Manage Wallets</Text>
            
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={true}>
              {wallets.map((w) => {
                const wTx = transactions.filter((tx) => !tx.walletId || tx.walletId === w.id);
                const wInc = wTx.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
                const wExp = wTx.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
                const currentBal = (w.initialBalance || 0) + wInc - wExp;
                const isSelected = w.id === activeWalletId;

                return (
                  <View key={w.id} style={[styles.walletItemCard, darkMode && styles.darkWalletItemCard, isSelected && { borderColor: green, borderWidth: 1.5 }]}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.walletItemName, darkMode && { color: '#fff' }]}>{w.name}</Text>
                        {w.isDefault && <Text style={styles.walletDefaultBadge}>Default</Text>}
                        {isSelected && <Text style={[styles.walletDefaultBadge, { backgroundColor: '#10B981', color: '#fff' }]}>Active</Text>}
                      </View>
                      <Text style={styles.walletItemSub}>
                        Balance: ₹{currentBal.toLocaleString('en-IN')} (Initial: ₹{(w.initialBalance || 0).toLocaleString('en-IN')})
                      </Text>
                    </View>

                    <View style={styles.walletItemActions}>
                      <Pressable
                        style={[styles.walletActionIconBtn, darkMode && styles.darkWalletActionIconBtn]}
                        onPress={() => {
                          setEditingWallet(w);
                          setRenameText(w.name);
                          setRenameBalance(String(w.initialBalance || 0));
                        }}
                      >
                        <AppIcon name="edit" color={darkMode ? "#A7F3D0" : "#334155"} size={16} />
                      </Pressable>

                      {!w.isDefault && w.id !== 'default_wallet' && (
                        <Pressable
                          style={[styles.walletActionIconBtn, styles.walletDeleteBtn]}
                          onPress={() => {
                            showAlert({
                              title: 'Delete Wallet',
                              message: `Are you sure you want to delete "${w.name}"? Transactions will be preserved in your default wallet.`,
                              icon: '🗑️',
                              confirmText: 'Delete',
                              cancelText: 'Cancel',
                              isDestructive: true,
                              onConfirm: () => onDeleteWallet?.(w.id),
                            });
                          }}
                        >
                          <AppIcon name="other" color="#EF4444" size={16} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <Pressable
              style={[styles.addCatTriggerButton, { marginTop: 14 }]}
              onPress={() => {
                setShowWalletModal(false);
                setShowAddWalletModal(true);
              }}
            >
              <Text style={styles.addCatTriggerText}>+ Create New Wallet</Text>
            </Pressable>

            <Pressable style={[styles.sheetClose, { marginTop: 12 }]} onPress={() => setShowWalletModal(false)}>
              <Text style={styles.sheetCloseText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create New Wallet Modal (Centered & Keyboard Safe) */}
      <Modal visible={showAddWalletModal} transparent animationType="fade" onRequestClose={() => setShowAddWalletModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalCenterBackdrop}>
          <View style={[styles.currencyModalCard, darkMode && styles.darkEditProfileModalCard]}>
            <Text style={[styles.currencyModalTitle, darkMode && { color: '#fff' }]}>Create New Wallet</Text>

            <Text style={[styles.inputLabel, darkMode && { color: '#A7F3D0' }]}>Wallet Name</Text>
            <TextInput
              style={[styles.budgetInput, { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 12 }, darkMode && styles.darkEditInput]}
              placeholder="e.g. Bank Account, Cash, Savings"
              placeholderTextColor="#94A3B8"
              value={newWalletName}
              onChangeText={setNewWalletName}
            />

            <Text style={[styles.inputLabel, darkMode && { color: '#A7F3D0' }]}>Initial Balance (₹)</Text>
            <TextInput
              style={[styles.budgetInput, { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 16 }, darkMode && styles.darkEditInput]}
              placeholder="0"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={newWalletBalance}
              onChangeText={setNewWalletBalance}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                style={[styles.addCatCancelBtn, { flex: 1 }]}
                onPress={() => {
                  setNewWalletName('');
                  setNewWalletBalance('');
                  setShowAddWalletModal(false);
                  setShowWalletModal(true);
                }}
              >
                <Text style={styles.addCatCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.addCatSaveBtn, { flex: 1 }]}
                onPress={() => {
                  if (!newWalletName.trim()) return showAlert('Name Required', 'Please enter a name for your wallet.');
                  onAddWallet?.({ name: newWalletName, initialBalance: newWalletBalance });
                  setNewWalletName('');
                  setNewWalletBalance('');
                  setShowAddWalletModal(false);
                  setShowWalletModal(true);
                }}
              >
                <Text style={styles.addCatSaveText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Wallet Modal (Centered & Keyboard Safe, Updates Name + Initial Balance) */}
      <Modal visible={Boolean(editingWallet)} transparent animationType="fade" onRequestClose={() => setEditingWallet(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalCenterBackdrop}>
          <View style={[styles.currencyModalCard, darkMode && styles.darkEditProfileModalCard]}>
            <Text style={[styles.currencyModalTitle, darkMode && { color: '#fff' }]}>Edit Wallet</Text>

            <Text style={[styles.inputLabel, darkMode && { color: '#A7F3D0' }]}>Wallet Name</Text>
            <TextInput
              style={[styles.budgetInput, { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 12 }, darkMode && styles.darkEditInput]}
              placeholder="Enter wallet name"
              placeholderTextColor="#94A3B8"
              value={renameText}
              onChangeText={setRenameText}
            />

            <Text style={[styles.inputLabel, darkMode && { color: '#A7F3D0' }]}>Initial Balance (₹)</Text>
            <TextInput
              style={[styles.budgetInput, { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 16 }, darkMode && styles.darkEditInput]}
              placeholder="0"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={renameBalance}
              onChangeText={setRenameBalance}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable style={[styles.addCatCancelBtn, { flex: 1 }]} onPress={() => setEditingWallet(null)}>
                <Text style={styles.addCatCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.addCatSaveBtn, { flex: 1 }]}
                onPress={() => {
                  if (!renameText.trim()) return showAlert('Name Required', 'Please enter a name.');
                  onRenameWallet?.(editingWallet.id, { name: renameText.trim(), initialBalance: renameBalance });
                  setEditingWallet(null);
                  setRenameText('');
                  setRenameBalance('');
                }}
              >
                <Text style={styles.addCatSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Reusable Rounded Custom Alert Modal */}
      <CustomAlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        icon={alertModal.icon}
        confirmText={alertModal.confirmText}
        cancelText={alertModal.cancelText}
        isDestructive={alertModal.isDestructive}
        darkMode={darkMode}
        onConfirm={alertModal.onConfirm}
        onCancel={closeAlert}
      />
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
