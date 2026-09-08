const test = require('node:test');
const assert = require('node:assert/strict');
const XLSX = require('xlsx');
const { exportTransactionsExcel, importTransactionsExcel } = require('../src/utils/excel.js');
const options = { wallets: [{ id: 'w1' }], activeWalletId: 'w1', rules: [{ id: 'r1' }] };
const tx = { id: '000123', type: 'Expense', category: 'Food', amount: 123.45, createdAt: '2026-09-08T09:06:48.000Z', note: '=not a formula\nગુજરાતી, "lunch"', walletId: 'w1', recurringRuleId: 'r1' };
function workbook(rows, type = 'xlsx') {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), 'Transactions');
  return XLSX.write(book, { bookType: type, type: 'base64' });
}
test('genuine xlsx round-trips amounts, dates, identifiers, Unicode and notes', () => {
  const file = exportTransactionsExcel([tx]);
  assert.ok(file.startsWith('UEsDB'));
  const result = importTransactionsExcel(file, options).transactions[0];
  for (const key of Object.keys(tx)) assert.equal(result[key], tx[key], key);
  const sheet = XLSX.read(file, { type: 'base64' }).Sheets.Transactions;
  assert.equal(sheet.D2.t, 'n'); assert.equal(sheet.F2.f, undefined);
});
test('legacy Excel workbook and ISO dates import', () => {
  const file = workbook([['Type', 'Category', 'Amount', 'Date'], ['Income', 'Salary', 5000, '2026-09-01']], 'biff8');
  assert.equal(importTransactionsExcel(file, options).transactions[0].amount, 5000);
});
test('renamed CSV and invalid bytes are rejected', () => {
  assert.throws(() => importTransactionsExcel(Buffer.from('Type,Amount\nExpense,50').toString('base64')), /genuine Excel/);
});
test('bad rows fail the entire import instead of silently losing records', () => {
  for (const row of [['Expense', 'Food', -1, '2026-09-01'], ['Expense', 'Food', 1, '2026-02-30'], ['Other', 'Food', 1, '2026-09-01']]) {
    assert.throws(() => importTransactionsExcel(workbook([['Type', 'Category', 'Amount', 'Date'], row])), /Nothing was imported/);
  }
});
test('missing columns and formulas are rejected', () => {
  assert.throws(() => importTransactionsExcel(workbook([['Type'], ['Expense']])), /Missing column/);
  assert.throws(() => importTransactionsExcel(workbook([['Type', 'Category', 'Amount', 'Date'], ['Expense', 'Food', { t: 'n', v: 5, f: '2+3' }, '2026-09-01']])), /replace formulas/);
});
test('unknown wallets map to selected wallet; import never creates schedules', () => {
  const result = importTransactionsExcel(exportTransactionsExcel([{ ...tx, walletId: 'missing' }]), { ...options, rules: [] });
  assert.equal(result.reassignedWallets, 1);
  assert.equal(result.transactions[0].walletId, 'w1');
  assert.equal(result.transactions[0].isRecurring, false);
});
test('rows without IDs get repeatable identifiers', () => {
  const file = workbook([['Type', 'Category', 'Amount', 'Date'], ['Expense', 'Food', 2, '2026-09-01']]);
  assert.equal(importTransactionsExcel(file).transactions[0].id, importTransactionsExcel(file).transactions[0].id);
});
