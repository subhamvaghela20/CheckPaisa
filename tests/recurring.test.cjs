const test = require('node:test');
const assert = require('node:assert/strict');
const { processRecurringRules, ruleStatus } = require('../src/utils/recurringProcessor.js');
const { applyTransactionSave, migrateCategory } = require('../src/utils/ledger.js');
const date = (value) => new Date(`${value}T12:00:00`);
const base = { id: 'r1', type: 'Expense', amount: 100, category: 'Food', walletId: 'wallet', frequency: 'Daily', fromDate: date('2026-09-01').toISOString(), toDate: date('2026-09-30').toISOString(), isActive: true };
const days = (txs) => txs.map((tx) => new Date(tx.createdAt).getDate());

test('daily generation is inclusive, idempotent, and never generates future dates', () => {
  const result = processRecurringRules([base], [], date('2026-09-03'));
  assert.deepEqual(days(result.newTransactions), [1, 2, 3]);
  assert.equal(processRecurringRules(result.updatedRules, result.newTransactions, date('2026-09-03')).newTransactions.length, 0);
  assert.equal(processRecurringRules([{ ...base, fromDate: date('2026-09-05') }], [], date('2026-09-03')).newTransactions.length, 0);
});
test('monthly clamps to month end including leap years', () => {
  const result = processRecurringRules([{ ...base, frequency: 'Monthly', repeatDayOfMonth: 31, fromDate: date('2024-01-01'), toDate: date('2024-04-30') }], [], date('2024-05-05'));
  assert.deepEqual(days(result.newTransactions), [31, 29, 31, 30]);
});
test('weekly edit follows new weekday even with an old processing cursor', () => {
  const result = processRecurringRules([{ ...base, frequency: 'Weekly', repeatDayOfWeek: 5, lastProcessedDate: date('2026-09-01') }], [], date('2026-09-15'));
  assert.deepEqual(days(result.newTransactions), [4, 11]);
});
test('paused rules generate nothing and resumed schedules skip paused dates', () => {
  assert.equal(processRecurringRules([{ ...base, isActive: false }], [], date('2026-09-10')).newTransactions.length, 0);
  const resumed = { ...base, lastProcessedDate: date('2026-09-10') };
  assert.deepEqual(days(processRecurringRules([resumed], [], date('2026-09-12')).newTransactions), [11, 12]);
});
test('invalid dates, frequencies, amounts and weekdays cannot loop or crash', () => {
  for (const change of [{ fromDate: 'invalid' }, { toDate: 'invalid' }, { amount: Infinity }, { frequency: 'bad' }, { frequency: 'Weekly', repeatDayOfWeek: 99 }]) {
    assert.equal(processRecurringRules([{ ...base, ...change }], [], date('2026-09-10')).newTransactions.length, 0);
  }
});
test('old timestamp IDs deduplicate by rule and local calendar day', () => {
  const old = { id: 'rec_r1_legacy', recurringRuleId: 'r1', createdAt: date('2026-09-01').toISOString() };
  assert.deepEqual(days(processRecurringRules([base], [old], date('2026-09-02')).newTransactions), [2]);
});
test('catch-up is bounded and resumes without loss', () => {
  let rules = [{ ...base, fromDate: date('2020-01-01'), toDate: date('2026-09-01') }];
  let transactions = [];
  let more = true;
  let passes = 0;
  while (more) {
    const result = processRecurringRules(rules, transactions, date('2026-09-01'), 50);
    assert.ok(result.newTransactions.length <= 50);
    transactions.push(...result.newTransactions); rules = result.updatedRules; more = result.hasMore;
    assert.ok(++passes < 60);
  }
  assert.equal(transactions.length, 2436);
  assert.equal(new Set(transactions.map((tx) => tx.id)).size, transactions.length);
});
test('conversion keeps the original entry once and creates only future repeats', () => {
  const tx = { id: 't1', amount: 100, createdAt: date('2026-09-01').toISOString() };
  const next = applyTransactionSave([tx], [], { ...tx, recurringRuleId: base.id, isRecurring: true }, base, {}, date('2026-09-03'));
  assert.equal(next.transactions.length, 1);
  assert.equal(processRecurringRules(next.rules, next.transactions, date('2026-09-03')).newTransactions.length, 0);
  assert.deepEqual(days(processRecurringRules(next.rules, next.transactions, date('2026-09-04')).newTransactions), [4]);
});
test('turning recurrence off pauses the rule and does not invent a transaction', () => {
  const next = applyTransactionSave([], [base], null, null, { editingRuleId: base.id });
  assert.equal(next.rules[0].isActive, false);
  assert.equal(next.transactions.length, 0);
});
test('editing an occurrence preserves its date and leaves the schedule unchanged', () => {
  const tx = { id: 'tx1', createdAt: date('2026-09-08').toISOString(), recurringRuleId: base.id, amount: 100 };
  const next = applyTransactionSave([tx], [base], { ...tx, amount: 200 }, null);
  assert.equal(next.transactions[0].createdAt, tx.createdAt);
  assert.equal(next.rules[0].amount, 100);
});
test('rule edit affects future entries without rewriting history', () => {
  const tx = { id: 'tx1', amount: 100 };
  const next = applyTransactionSave([tx], [base], null, { ...base, amount: 200 }, { editingRuleId: base.id }, date('2026-09-03'));
  assert.equal(next.transactions[0].amount, 100);
  assert.equal(processRecurringRules(next.rules, next.transactions, date('2026-09-04')).newTransactions[0].amount, 200);
});
test('category rename migrates ledger, budgets and rules together', () => {
  const next = migrateCategory([{ category: 'Food' }], { Food: { amount: 500, isActive: false } }, [base], 'Food', 'Meals');
  assert.equal(next.transactions[0].category, 'Meals');
  assert.deepEqual(next.budgets, { Meals: { amount: 500, isActive: false } });
  assert.equal(next.rules[0].category, 'Meals');
});
test('status distinguishes paused, scheduled and completed rules', () => {
  assert.equal(ruleStatus(base, date('2026-10-01')), 'Completed');
  assert.equal(ruleStatus(base, date('2026-08-01')), 'Scheduled');
  assert.equal(ruleStatus({ ...base, isActive: false }, date('2026-09-01')), 'Paused');
});
