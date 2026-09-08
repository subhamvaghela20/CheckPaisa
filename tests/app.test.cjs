const test = require('node:test');
const assert = require('node:assert/strict');
const renderer = require('react-test-renderer');
const { loadModule, nativeMocks, React } = require('./helpers.cjs');
const { act } = renderer;
const screenNames = ['Home', 'InitialSetup', 'Login', 'Onboarding', 'Splash', 'Profile', 'Budget', 'EditBudget', 'ManageCategories', 'ManageRecurring', 'TransactionForm', 'TransactionDetails', 'Reports', 'AdvancedReports'];

async function app(initial = {}) {
  const records = [];
  const wallets = [{ id: 'default_wallet', name: 'Main', isDefault: true }, { id: 'extra', name: 'Extra' }];
  const storage = {
    DEFAULT_WALLETS: wallets.slice(0, 1),
    loadUser: async () => ({ name: 'Guest', email: 'guest@checkpaisa.app', isGuest: true }),
    loadDarkMode: async () => false, loadTransactions: async () => initial.transactions || [],
    loadRecurringRules: async () => initial.rules || [], loadBudgets: async () => ({ Food: 100 }),
    loadWallets: async () => wallets, loadCategories: async () => [{ name: 'Food', type: 'Expense', isActive: true }],
    loadCurrency: async () => 'INR (₹)', loadNotifications: async () => true, loadSetupCompleted: async () => true,
    saveLedger: async (tx, rules, email, related) => records.push({ tx, rules, email, related }),
    saveUser: async () => {}, saveCategories: async () => {}, saveBudgets: async () => {},
    saveWallets: async () => {}, saveRecurringRules: async () => {}, saveTransactions: async () => {},
    deleteUserData: async () => {}, updateUserProfile: async () => ({ success: true }),
  };
  const { mocks, alerts } = nativeMocks({ './src/utils/storage': storage, 'expo-status-bar': { StatusBar: 'StatusBar' } });
  for (const name of screenNames) mocks[`./src/screens/${name}Screen`] = { [`${name}Screen`]: `${name}Screen` };
  let tick;
  const { default: App } = loadModule('App.js', mocks, { setInterval: (callback) => { tick = callback; return 1; }, clearInterval() {} });
  let tree;
  await act(async () => { tree = renderer.create(React.createElement(App)); });
  return { tree, storage, records, alerts, tick: async () => { await act(async () => { tick(); }); } };
}
const rule = { id: 'r1', amount: 100, category: 'Food', type: 'Expense', frequency: 'Daily', walletId: 'extra', fromDate: new Date().toISOString(), toDate: new Date().toISOString(), isActive: true };
async function dispose(tree) { await act(async () => tree.unmount()); }
test('guest startup generates due recurring entries and persists them once', async () => {
  const { tree, tick, records } = await app({ rules: [rule] });
  await tick(); await tick();
  assert.equal(tree.root.findByType('HomeScreen').props.transactions.length, 1);
  assert.equal(records.length, 1); assert.equal(records[0].email, 'guest@checkpaisa.app');
  await dispose(tree);
});
test('failed persistence keeps the form open and ledger unchanged', async () => {
  const { tree, storage } = await app();
  await act(async () => tree.root.findByType('HomeScreen').props.onAdd());
  storage.saveLedger = async () => { throw new Error('disk full'); };
  await act(async () => { await assert.rejects(tree.root.findByType('TransactionFormScreen').props.onSave({ id: 'new', amount: 5 }), /disk full/); });
  assert.equal(tree.root.findAllByType('TransactionFormScreen').length, 1);
  await act(async () => tree.root.findByType('TransactionFormScreen').props.onClose());
  assert.equal(tree.root.findByType('HomeScreen').props.transactions.length, 0);
  await dispose(tree);
});
test('import deduplicates IDs both within the workbook and against the ledger', async () => {
  const tx = { id: 'existing', category: 'Food', type: 'Expense', amount: 1 };
  const { tree } = await app({ transactions: [tx] });
  await act(async () => tree.root.findByType('HomeScreen').props.onNavigate('Profile'));
  let result;
  await act(async () => { result = await tree.root.findByType('ProfileScreen').props.onImportTransactions([tx, { ...tx, id: 'new' }, { ...tx, id: 'new' }]); });
  assert.equal(result.imported, 1); assert.equal(result.duplicates, 2);
  assert.equal(tree.root.findByType('ProfileScreen').props.transactions.length, 2);
  await dispose(tree);
});
test('deleting a wallet reassigns both transactions and recurring rules', async () => {
  const { tree, records } = await app({ transactions: [{ id: 't', walletId: 'extra' }], rules: [rule] });
  await act(async () => tree.root.findByType('HomeScreen').props.onNavigate('Profile'));
  await act(async () => tree.root.findByType('ProfileScreen').props.onDeleteWallet('extra'));
  const result = records.at(-1);
  assert.equal(result.tx[0].walletId, 'default_wallet'); assert.equal(result.rules[0].walletId, 'default_wallet');
  await dispose(tree);
});
test('category rename persists related data and historical transactions together', async () => {
  const { tree, records } = await app({ transactions: [{ id: 't', category: 'Food' }], rules: [rule] });
  await act(async () => tree.root.findByType('HomeScreen').props.onNavigate('Profile'));
  await act(async () => tree.root.findByType('ProfileScreen').props.onOpenManageCategories());
  await act(async () => tree.root.findByType('ManageCategoriesScreen').props.onUpdateCategories([{ name: 'Meals' }], { from: 'Food', to: 'Meals' }));
  const result = records.at(-1);
  assert.equal(result.tx[0].category, 'Meals'); assert.equal(result.rules[0].category, 'Meals');
  assert.equal(result.related.budgets.Meals, 100);
  await dispose(tree);
});
test('stale import callbacks cannot write after logout', async () => {
  const { tree, records } = await app();
  await act(async () => tree.root.findByType('HomeScreen').props.onNavigate('Profile'));
  const stale = tree.root.findByType('ProfileScreen').props.onImportTransactions;
  await act(async () => tree.root.findByType('ProfileScreen').props.onLogout());
  await assert.rejects(stale([{ id: 't', type: 'Expense', category: 'Food', amount: 1 }]), /Account changed/);
  assert.equal(records.length, 0);
  await dispose(tree);
});

test('removing an unused category also removes its budget limit', async () => {
  const { tree, records } = await app();
  await act(async () => tree.root.findByType('HomeScreen').props.onNavigate('Profile'));
  await act(async () => tree.root.findByType('ProfileScreen').props.onOpenManageCategories());
  await act(async () => tree.root.findByType('ManageCategoriesScreen').props.onUpdateCategories([{ name: 'Salary', type: 'Income' }]));
  assert.equal(Object.keys(records.at(-1).related.budgets).length, 0);
  await dispose(tree);
});
