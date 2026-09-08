const test = require('node:test');
const assert = require('node:assert/strict');
const renderer = require('react-test-renderer');
const { loadModule, nativeMocks, React } = require('./helpers.cjs');
const { act } = renderer;
const categories = [{ name: 'Food', type: 'Expense', isActive: true }, { name: 'Salary', type: 'Income', isActive: true }];
async function mount(Component, props) { let tree; await act(async () => { tree = renderer.create(React.createElement(Component, props)); }); return tree; }
async function dispose(tree) { await act(async () => tree.unmount()); }

test('editing a generated occurrence saves only that entry and keeps its date', async () => {
  const { mocks } = nativeMocks();
  const { TransactionFormScreen } = loadModule('src/screens/TransactionFormScreen.js', mocks);
  let saved;
  const tx = { id: 'tx1', type: 'Expense', amount: 100, category: 'Food', createdAt: '2026-09-08T09:06:48.000Z', isRecurring: true, recurringRuleId: 'r1' };
  const tree = await mount(TransactionFormScreen, { transaction: tx, categories, recurringRules: [{ id: 'r1', frequency: 'Daily', fromDate: '2026-09-01', toDate: '2026-09-30' }], onSave: (...args) => { saved = args; } });
  assert.equal(tree.root.findAllByType('Switch').length, 0);
  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Save transaction' }).props.onPress());
  assert.equal(saved[0].createdAt, tx.createdAt); assert.equal(saved[1], null);
  await dispose(tree);
});
test('turning off recurrence in rule editor sends pause without a fake transaction', async () => {
  const { mocks } = nativeMocks();
  const { TransactionFormScreen } = loadModule('src/screens/TransactionFormScreen.js', mocks);
  let saved;
  const rule = { id: 'r1', amount: 100, category: 'Food', type: 'Expense', frequency: 'Daily', fromDate: '2026-09-01', toDate: '2026-09-30' };
  const tree = await mount(TransactionFormScreen, { transaction: rule, categories, onSave: (...args) => { saved = args; } });
  await act(async () => tree.root.findByType('Switch').props.onValueChange(false));
  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Save transaction' }).props.onPress());
  assert.equal(saved[0], null); assert.equal(saved[1], null); assert.equal(saved[2].editingRuleId, 'r1');
  await dispose(tree);
});
test('empty active categories block new transactions', async () => {
  const { mocks, alerts } = nativeMocks();
  const { TransactionFormScreen } = loadModule('src/screens/TransactionFormScreen.js', mocks);
  let calls = 0;
  const tree = await mount(TransactionFormScreen, { categories: categories.map((cat) => ({ ...cat, isActive: false })), onSave: () => { calls += 1; } });
  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Transaction amount' }).props.onChangeText('10'));
  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Save transaction' }).props.onPress());
  assert.equal(calls, 0); assert.equal(alerts[0][0], 'Choose a category');
  await dispose(tree);
});

test('budget form contains a scrolling header, separate save footer and handles write failure', async () => {
  const { mocks, alerts } = nativeMocks();
  const { EditBudgetScreen } = loadModule('src/screens/EditBudgetScreen.js', mocks);
  const tree = await mount(EditBudgetScreen, { categories, budgets: { Food: { amount: 100, isActive: true } }, onSaveBudgets: async () => { throw new Error('disk full'); } });
  const scroll = tree.root.findByType('ScrollView');
  assert.ok(scroll.findAllByType('TextInput').length > 0);
  assert.equal(scroll.findAllByProps({ accessibilityLabel: 'Save category budgets' }).length, 0);
  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Save category budgets' }).props.onPress());
  assert.equal(alerts.at(-1)[0], 'Could not save budgets');
  await dispose(tree);
});

test('Excel import reads selected file and reports the actual import summary', async () => {
  const { exportTransactionsExcel } = require('../src/utils/excel.js');
  const content = exportTransactionsExcel([{ id: '1', type: 'Expense', category: 'Food', amount: 10, createdAt: new Date().toISOString() }]);
  let received;
  const { mocks } = nativeMocks({
    'expo-file-system/legacy': { EncodingType: { Base64: 'base64' }, getInfoAsync: async () => ({ exists: true, size: 2000 }), readAsStringAsync: async () => content },
    'expo-sharing': {},
    'expo-document-picker': { getDocumentAsync: async () => ({ canceled: false, assets: [{ name: 'transactions.xlsx', uri: 'file:///picked.xlsx' }] }) },
  });
  const { ProfileScreen } = loadModule('src/screens/ProfileScreen.js', mocks);
  const tree = await mount(ProfileScreen, { onImportTransactions: async (rows) => { received = rows; return { imported: 1, duplicates: 0 }; } });
  const button = tree.root.findAllByType('Pressable').find((node) => node.findAllByType('Text').some((text) => text.props.children === 'Import Excel File (.xlsx / .xls)'));
  await act(async () => button.props.onPress());
  assert.equal(received[0].amount, 10);
  assert.match(tree.root.findByType('CustomAlertModal').props.message, /1 transaction\(s\) imported/);
  await dispose(tree);
});

test('Excel export writes xlsx bytes and shares with the Excel MIME type', async () => {
  let written, shared;
  const { mocks } = nativeMocks({
    'expo-file-system/legacy': { cacheDirectory: 'file:///cache/', EncodingType: { Base64: 'base64' }, writeAsStringAsync: async (...args) => { written = args; } },
    'expo-sharing': { isAvailableAsync: async () => true, shareAsync: async (...args) => { shared = args; } },
    'expo-document-picker': {},
  });
  const { ProfileScreen } = loadModule('src/screens/ProfileScreen.js', mocks);
  const tree = await mount(ProfileScreen, { transactions: [{ id: '1', type: 'Expense', category: 'Food', amount: 10, createdAt: new Date().toISOString() }] });
  const button = tree.root.findAllByType('Pressable').find((node) => node.findAllByType('Text').some((text) => text.props.children === 'Export Transactions (.xlsx)'));
  await act(async () => button.props.onPress());
  assert.match(written[0], /\.xlsx$/); assert.ok(written[1].startsWith('UEsDB'));
  assert.equal(shared[1].mimeType, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  await dispose(tree);
});
test('category editing has a scrollable modal and used categories cannot be deleted', async () => {
  const { mocks, alerts } = nativeMocks();
  const { ManageCategoriesScreen } = loadModule('src/screens/ManageCategoriesScreen.js', mocks);
  const tree = await mount(ManageCategoriesScreen, { customCategories: [{ ...categories[0], isCustom: true }], transactions: [{ category: 'Food' }], onUpdateCategories() {} });
  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Edit Food' }).props.onPress());
  assert.equal(tree.root.findByType('Modal').findAllByType('ScrollView').length, 1);
  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Delete Food' }).props.onPress());
  assert.equal(alerts.at(-1)[0], 'Category is in use');
  await dispose(tree);
});
test('Excel picker cancellation does not import anything', async () => {
  let imported = false, picker;
  const { mocks } = nativeMocks({
    'expo-file-system/legacy': {}, 'expo-sharing': {},
    'expo-document-picker': { getDocumentAsync: async (options) => { picker = options; return { canceled: true }; } },
  });
  const { ProfileScreen } = loadModule('src/screens/ProfileScreen.js', mocks);
  const tree = await mount(ProfileScreen, { onImportTransactions() { imported = true; } });
  const button = tree.root.findAllByType('Pressable').find((node) => node.findAllByType('Text').some((text) => text.props.children === 'Import Excel File (.xlsx / .xls)'));
  await act(async () => button.props.onPress());
  assert.equal(imported, false); assert.equal(picker.copyToCacheDirectory, true); assert.equal(picker.multiple, false);
  await dispose(tree);
});
