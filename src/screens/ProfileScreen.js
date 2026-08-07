import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
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
}) {
  const [activeTab, setActiveTab] = useState('Profile');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

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

      {/* Edit Profile Popup Modal */}
      <Modal visible={showEditProfileModal} transparent animationType="fade" onRequestClose={() => setShowEditProfileModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowEditProfileModal(false)}>
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
        </Pressable>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal visible={showCurrencyModal} transparent animationType="fade" onRequestClose={() => setShowCurrencyModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCurrencyModal(false)}>
          <View style={darkMode ? styles.darkEditProfileModalCard : styles.currencyModalCard}>
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
          </View>
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
