const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule } = require('./helpers.cjs');

function storage() {
  const data = new Map();
  const native = {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => { data.set(key, value); },
    removeItem: async (key) => { data.delete(key); },
    multiRemove: async (keys) => keys.forEach((key) => data.delete(key)),
    multiSet: async (pairs) => pairs.forEach(([key, value]) => data.set(key, value)),
  };
  return { data, native, api: loadModule('src/utils/storage.js', { '@react-native-async-storage/async-storage': native }) };
}
test('account deletion removes recurring schedules as well as ledger data', async () => {
  const { api } = storage();
  await api.saveLedger([], [{ id: 'r' }], 'one@test.com');
  await api.deleteUserData('one@test.com');
  assert.equal((await api.loadRecurringRules('one@test.com')).length, 0);
});
test('email changes migrate schedules, transactions and related data', async () => {
  const { api } = storage();
  await api.saveLedger([], [{ id: 'r' }], 'one@test.com', { budgets: { Food: 100 } });
  assert.equal((await api.updateUserProfile('one@test.com', { email: 'two@test.com', name: 'Two' })).success, true);
  assert.equal((await api.loadRecurringRules('two@test.com'))[0].id, 'r');
  assert.equal((await api.loadRecurringRules('one@test.com')).length, 0);
  assert.equal((await api.loadBudgets('two@test.com')).Food, 100);
});
test('ledger writes report failures and subsequent writes can recover', async () => {
  const { api, native } = storage();
  const write = native.multiSet;
  native.multiSet = async () => { throw new Error('disk full'); };
  await assert.rejects(api.saveLedger([], [], 'one@test.com'), /disk full/);
  native.multiSet = write;
  await api.saveLedger([], [{ id: 'recovered' }], 'one@test.com');
  assert.equal((await api.loadRecurringRules('one@test.com'))[0].id, 'recovered');
});
test('malformed persisted arrays do not reach screens', async () => {
  const { api, data } = storage();
  data.set('@checkpaisa_tx_one_test_com', 'null');
  data.set('@checkpaisa_recurring_rules_one_test_com', '{}');
  assert.equal((await api.loadTransactions('one@test.com')).length, 0);
  assert.equal((await api.loadRecurringRules('one@test.com')).length, 0);
});
