import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../components/AppIcon';
import { categories as defaultCategories } from '../data/appData';
import { green, styles } from '../styles/styles';

const AVAILABLE_ICONS = ['food', 'transport', 'bills', 'shopping', 'health', 'groceries', 'rent', 'education', 'entertainment', 'other', 'salary', 'bonus', 'freelance', 'investment', 'cashback'];
const AVAILABLE_COLORS = ['#EF4444', '#3B82F6', '#F59E0B', '#F97316', '#EC4899', '#10B981', '#8B5CF6', '#6366F1', '#14B8A6', '#059669', '#84CC16', '#06B6D4', '#64748B'];

export function ManageCategoriesScreen({ customCategories, transactions = [], recurringRules = [], darkMode = false, onBack, onUpdateCategories }) {
  const insets = useSafeAreaInsets();
  const [activeType, setActiveType] = useState('Expense');
  const [newCatName, setNewCatName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('food');
  const [selectedColor, setSelectedColor] = useState('#EF4444');
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit category modal state
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('food');
  const [editColor, setEditColor] = useState('#EF4444');

  const scrollViewRef = useRef(null);

  const allCategories = customCategories && customCategories.length > 0 ? customCategories : defaultCategories;
  const filteredCategories = allCategories.filter((c) => c.type === activeType);

  const persistCategories = async (updated, migration) => {
    try { await onUpdateCategories(updated, migration); return true; }
    catch { Alert.alert('Could not save category', 'Please free device storage and try again.'); return false; }
  };

  const handleAddCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      return Alert.alert('Invalid Name', 'Please enter a category name.');
    }
    if (allCategories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return Alert.alert('Duplicate Category', 'A category with this name already exists.');
    }

    const newCategoryObj = {
      name: trimmed,
      icon: selectedIcon,
      type: activeType,
      color: selectedColor,
      isCustom: true,
      isActive: true,
    };

    const updated = [...allCategories, newCategoryObj];
    if (!(await persistCategories(updated))) return;
    setNewCatName('');
    setShowAddForm(false);
  };

  const handleToggleActive = (catName, nextActiveState) => {
    const updated = allCategories.map((c) => {
      if (c.name === catName) {
        return { ...c, isActive: nextActiveState };
      }
      return c;
    });
    persistCategories(updated);
  };

  const handleStartEdit = (cat) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditIcon(cat.icon || 'food');
    setEditColor(cat.color || '#EF4444');
  };

  const handleSaveEdit = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      return Alert.alert('Invalid Name', 'Please enter a category name.');
    }
    const duplicate = allCategories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.name !== editingCategory.name);
    if (duplicate) {
      return Alert.alert('Duplicate Category', 'Another category with this name already exists.');
    }

    const updated = allCategories.map((c) => {
      if (c.name === editingCategory.name) {
        return {
          ...c,
          name: trimmed,
          icon: editIcon,
          color: editColor,
          isActive: c.isActive !== false,
        };
      }
      return c;
    });

    try {
      await onUpdateCategories(updated, { from: editingCategory.name, to: trimmed });
      setEditingCategory(null);
    } catch { Alert.alert('Could not save category', 'Please try again.'); }
  };

  const handleRemoveCategory = (catName) => {
    if (transactions.some((tx) => tx.category === catName) || recurringRules.some((rule) => rule.category === catName)) {
      Alert.alert('Category is in use', 'Deactivate this category to hide it from new entries. Existing transactions and schedules keep their category.');
      return;
    }
    Alert.alert('Remove Category', `Remove "${catName}" and its budget limit?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = allCategories.filter((c) => c.name !== catName);
          persistCategories(updated);
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.formScreen, darkMode && { backgroundColor: '#040C08' }]}>
        <View style={[styles.formHero, { paddingTop: insets.top + 12 }, darkMode && { backgroundColor: '#0B2E21' }]}>
          <View style={styles.formHeader}>
            <Pressable style={styles.formClose} onPress={onBack}>
              <AppIcon name="back" size={20} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.formTitle}>Manage Categories</Text>
            <View style={styles.headerBlank} />
          </View>
          <Text style={styles.howMuch}>Categories</Text>
          <Text style={styles.editBudgetSubtitle}>Edit, toggle active status, or add custom categories</Text>
        </View>

        <View style={[styles.formPanel, darkMode && { backgroundColor: '#091510' }]}>
          <ScrollView ref={scrollViewRef} style={styles.formPanelContent} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Type Switcher */}
            <View style={[styles.typeToggle, darkMode && { backgroundColor: '#040C08', borderColor: 'rgba(16,185,129,0.2)', borderWidth: 1 }]}>
              <Pressable style={[styles.typeOption, activeType === 'Expense' && (darkMode ? { backgroundColor: '#EF4444' } : styles.selectedType)]} onPress={() => setActiveType('Expense')}>
                <Text style={[styles.typeText, activeType === 'Expense' && (darkMode ? { color: '#FFF', fontWeight: '800' } : styles.expenseTypeText)]}>Expense</Text>
              </Pressable>
              <Pressable style={[styles.typeOption, activeType === 'Income' && (darkMode ? { backgroundColor: '#10B981' } : styles.selectedType)]} onPress={() => setActiveType('Income')}>
                <Text style={[styles.typeText, activeType === 'Income' && (darkMode ? { color: '#000', fontWeight: '800' } : styles.incomeTypeText)]}>Income</Text>
              </Pressable>
            </View>

            {/* Add Category Trigger / Form */}
            {!showAddForm ? (
              <Pressable style={[styles.addCatTriggerButton, darkMode && { backgroundColor: '#040C08', borderColor: 'rgba(16,185,129,0.3)' }]} onPress={() => setShowAddForm(true)}>
                <Text style={[styles.addCatTriggerText, darkMode && { color: '#10B981' }]}>+ Add New {activeType} Category</Text>
              </Pressable>
            ) : (
              <View style={[styles.addCatFormBox, darkMode && { backgroundColor: '#040C08', borderColor: 'rgba(16,185,129,0.3)' }]}>
                <Text style={[styles.addCatFormTitle, darkMode && { color: '#FFF' }]}>Add {activeType} Category</Text>
                <TextInput
                  value={newCatName}
                  onChangeText={setNewCatName}
                  placeholder="Category Name (e.g. Pet Care)"
                  placeholderTextColor="#94A3B8"
                  style={[styles.addCatInput, darkMode && { backgroundColor: '#091510', borderColor: 'rgba(16,185,129,0.2)', color: '#FFF' }]}
                  onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 130, animated: true }), 120)}
                  accessibilityLabel="New category name"
                />

                <Text style={[styles.addCatPickerLabel, darkMode && { color: '#A7F3D0' }]}>Select Icon</Text>
                <View style={styles.addCatIconPickerGrid}>
                  {AVAILABLE_ICONS.map((iconName) => (
                    <Pressable
                      key={iconName}
                      style={[styles.addCatIconChoice, darkMode && { backgroundColor: '#091510', borderColor: 'rgba(16,185,129,0.2)' }, selectedIcon === iconName && styles.addCatIconChoiceSelected]}
                      onPress={() => setSelectedIcon(iconName)}
                    >
                      <AppIcon name={iconName} color={selectedIcon === iconName ? green : '#64748B'} size={20} />
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.addCatPickerLabel, darkMode && { color: '#A7F3D0' }]}>Select Color</Text>
                <View style={styles.addCatColorPickerGrid}>
                  {AVAILABLE_COLORS.map((colorHex) => (
                    <Pressable
                      key={colorHex}
                      style={[styles.addCatColorChoice, { backgroundColor: colorHex }, selectedColor === colorHex && styles.addCatColorChoiceSelected]}
                      onPress={() => setSelectedColor(colorHex)}
                    />
                  ))}
                </View>

                <View style={styles.addCatFormActions}>
                  <Pressable style={styles.addCatCancelBtn} onPress={() => setShowAddForm(false)}>
                    <Text style={styles.addCatCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.addCatSaveBtn} onPress={handleAddCategory}>
                    <Text style={styles.addCatSaveText}>Save Category</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Category List */}
            <Text style={[styles.categoryHeading, { marginTop: 12, marginBottom: 6 }, darkMode && { color: '#FFF' }]}>{activeType} Categories ({filteredCategories.length})</Text>
            {filteredCategories.map((cat) => {
              const isActive = cat.isActive !== false;
              return (
                <View key={cat.name} style={[styles.editBudgetRow, { paddingVertical: 8, gap: 10 }, darkMode && { borderBottomColor: 'rgba(255,255,255,0.08)' }, !isActive && { opacity: 0.6 }]}>
                  <View style={[styles.transactionCategoryIcon, { width: 36, height: 36, borderRadius: 11, backgroundColor: `${cat.color || '#10B981'}18` }]}>
                    <AppIcon name={cat.icon || 'other'} color={cat.color || green} size={20} />
                  </View>
                  
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Text style={[styles.editBudgetCatName, { flex: 0, marginLeft: 0, fontSize: 14 }, darkMode && { color: '#FFF' }, !isActive && { textDecorationLine: 'line-through', color: '#94A3B8' }]} numberOfLines={1}>
                      {cat.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: isActive ? green : '#EF4444', fontWeight: '700', marginTop: 1 }}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {/* Active Toggle Switch */}
                    <Switch
                      value={isActive}
                      accessibilityLabel={`Activate ${cat.name}`}
                      onValueChange={(val) => handleToggleActive(cat.name, val)}
                      trackColor={{ false: '#CBD5E1', true: green }}
                      thumbColor="#FFFFFF"
                    />

                    {/* Edit Button */}
                    <Pressable
                      style={[styles.catActionBtn, darkMode && styles.darkCatActionBtn]}
                      onPress={() => handleStartEdit(cat)}
                      accessibilityLabel={`Edit ${cat.name}`}
                      hitSlop={6}
                    >
                      <AppIcon name="edit" color={darkMode ? "#A7F3D0" : "#334155"} size={16} />
                    </Pressable>

                    {/* Delete Button (for custom categories) */}
                    {cat.isCustom && (
                      <Pressable
                        style={[styles.catActionBtn, styles.walletDeleteBtn]}
                        onPress={() => handleRemoveCategory(cat.name)}
                        accessibilityLabel={`Delete ${cat.name}`}
                        hitSlop={6}
                      >
                        <AppIcon name="delete" color="#EF4444" size={16} />
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Modal for Editing Existing Category */}
        <Modal visible={Boolean(editingCategory)} transparent animationType="fade" onRequestClose={() => setEditingCategory(null)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalCenterBackdrop}>
            <ScrollView style={{ maxHeight: '100%', width: '100%' }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
            <View style={[styles.currencyModalCard, darkMode && styles.darkEditProfileModalCard, { width: '100%' }]}>
              <Text style={[styles.currencyModalTitle, darkMode && { color: '#FFF' }]}>Edit Category</Text>

              <Text style={[styles.addCatPickerLabel, darkMode && { color: '#A7F3D0' }]}>Category Name</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Category Name"
                placeholderTextColor="#94A3B8"
                style={[styles.addCatInput, darkMode && styles.darkEditInput]}
              />

              <Text style={[styles.addCatPickerLabel, darkMode && { color: '#A7F3D0' }]}>Select Icon</Text>
              <View style={styles.addCatIconPickerGrid}>
                {AVAILABLE_ICONS.map((iconName) => (
                  <Pressable
                    key={iconName}
                    style={[styles.addCatIconChoice, darkMode && { backgroundColor: '#091510', borderColor: 'rgba(16,185,129,0.2)' }, editIcon === iconName && styles.addCatIconChoiceSelected]}
                    onPress={() => setEditIcon(iconName)}
                  >
                    <AppIcon name={iconName} color={editIcon === iconName ? green : '#64748B'} size={20} />
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.addCatPickerLabel, darkMode && { color: '#A7F3D0' }]}>Select Color</Text>
              <View style={styles.addCatColorPickerGrid}>
                {AVAILABLE_COLORS.map((colorHex) => (
                  <Pressable
                    key={colorHex}
                    style={[styles.addCatColorChoice, { backgroundColor: colorHex }, editColor === colorHex && styles.addCatColorChoiceSelected]}
                    onPress={() => setEditColor(colorHex)}
                  />
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <Pressable style={[styles.addCatCancelBtn, { flex: 1 }]} onPress={() => setEditingCategory(null)}>
                  <Text style={styles.addCatCancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.addCatSaveBtn, { flex: 1 }]} onPress={handleSaveEdit}>
                  <Text style={styles.addCatSaveText}>Save Changes</Text>
                </Pressable>
              </View>
            </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}
