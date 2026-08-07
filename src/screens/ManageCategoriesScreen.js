import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AppIcon } from '../components/AppIcon';
import { categories as defaultCategories } from '../data/appData';
import { green, styles } from '../styles/styles';

const AVAILABLE_ICONS = ['food', 'transport', 'bills', 'shopping', 'health', 'groceries', 'rent', 'education', 'entertainment', 'other', 'salary', 'bonus', 'freelance', 'investment', 'cashback'];
const AVAILABLE_COLORS = ['#EF4444', '#3B82F6', '#F59E0B', '#F97316', '#EC4899', '#10B981', '#8B5CF6', '#6366F1', '#14B8A6', '#059669', '#84CC16', '#06B6D4', '#64748B'];

export function ManageCategoriesScreen({ customCategories, darkMode = false, onBack, onUpdateCategories }) {
  const [activeType, setActiveType] = useState('Expense');
  const [newCatName, setNewCatName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('food');
  const [selectedColor, setSelectedColor] = useState('#EF4444');
  const [showAddForm, setShowAddForm] = useState(false);

  const allCategories = customCategories && customCategories.length > 0 ? customCategories : defaultCategories;
  const filteredCategories = allCategories.filter((c) => c.type === activeType);

  const handleAddCategory = () => {
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
    };

    const updated = [...allCategories, newCategoryObj];
    onUpdateCategories(updated);
    setNewCatName('');
    setShowAddForm(false);
  };

  const handleRemoveCategory = (catName) => {
    Alert.alert('Remove Category', `Are you sure you want to remove "${catName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = allCategories.filter((c) => c.name !== catName);
          onUpdateCategories(updated);
        },
      },
    ]);
  };

  return (
    <View style={[styles.formScreen, darkMode && { backgroundColor: '#040C08' }]}>
      <View style={[styles.formHero, darkMode && { backgroundColor: '#0B2E21' }]}>
        <View style={styles.formHeader}>
          <Pressable style={styles.formClose} onPress={onBack}>
            <AppIcon name="back" size={20} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.formTitle}>Manage Categories</Text>
          <View style={styles.headerBlank} />
        </View>
        <Text style={styles.howMuch}>Categories</Text>
        <Text style={styles.editBudgetSubtitle}>Add or remove custom Expense & Income categories</Text>
      </View>

      <View style={[styles.formPanel, darkMode && { backgroundColor: '#091510' }]}>
        <ScrollView style={styles.formPanelContent} contentContainerStyle={[styles.formPanelContentInner, { paddingBottom: 240 }]} showsVerticalScrollIndicator={false}>
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
          <Text style={[styles.categoryHeading, darkMode && { color: '#FFF' }]}>{activeType} Categories ({filteredCategories.length})</Text>
          {filteredCategories.map((cat) => (
            <View key={cat.name} style={[styles.editBudgetRow, darkMode && { borderBottomColor: 'rgba(255,255,255,0.08)' }]}>
              <View style={[styles.transactionCategoryIcon, { backgroundColor: `${cat.color}18` }]}>
                <AppIcon name={cat.icon} color={cat.color} size={21} />
              </View>
              <Text style={[styles.editBudgetCatName, darkMode && { color: '#FFF' }]}>{cat.name}</Text>
              {cat.isCustom ? (
                <Pressable style={styles.removeCatButton} onPress={() => handleRemoveCategory(cat.name)}>
                  <Text style={styles.removeCatText}>Delete</Text>
                </Pressable>
              ) : (
                <Text style={styles.defaultCatTag}>Default</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
