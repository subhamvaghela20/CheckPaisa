import * as XLSX from 'xlsx';

export const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const MAX_EXCEL_BYTES = 5 * 1024 * 1024;
export const MAX_EXCEL_ROWS = 10000;
const HEADERS = ['ID', 'Type', 'Category', 'Amount', 'Date', 'Notes', 'Wallet ID', 'Recurring Rule ID'];

export function exportTransactionsExcel(transactions) {
  if (transactions.length > MAX_EXCEL_ROWS) throw new Error('Export supports up to 10,000 transactions per file.');
  if (transactions.some((tx) => String(tx.note || '').length > 32767)) throw new Error('A note exceeds the Excel limit of 32,767 characters. Shorten that note before exporting.');
  const rows = transactions.map((tx) => [String(tx.id), tx.type, tx.category, Number(tx.amount),
    new Date(tx.createdAt), tx.note || '', tx.walletId || '', tx.recurringRuleId || '']);
  const sheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows], { cellDates: true, dateNF: 'yyyy-mm-dd hh:mm:ss' });
  sheet['!cols'] = [30, 12, 24, 16, 24, 50, 24, 30].map((wch) => ({ wch }));
  sheet['!autofilter'] = { ref: sheet['!ref'] };
  rows.forEach((_, index) => { sheet[`D${index + 2}`].z = '#,##0.00'; });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Transactions');
  const file = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx', compression: true });
  if (file.length > Math.ceil(MAX_EXCEL_BYTES * 4 / 3)) throw new Error('This export exceeds the 5 MB workbook limit.');
  return file;
}

function importDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    return date ? new Date(date.y, date.m - 1, date.d, date.H, date.M, date.S) : new Date(NaN);
  }
  // Accept unambiguous ISO dates only; do not silently replace invalid dates with today.
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value.trim())) return new Date(NaN);
  const text = value.trim();
  const [year, month, day] = text.slice(0, 10).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return new Date(NaN);
  return text.length === 10 ? date : new Date(text);
}

function stableId(values) {
  let hash = 2166136261;
  for (const char of JSON.stringify(values)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `import_${(hash >>> 0).toString(16)}`;
}

export function importTransactionsExcel(base64, { wallets = [], activeWalletId = 'default_wallet', rules = [], categories = [] } = {}) {
  // Reject renamed CSV/text files before SheetJS's permissive format detection.
  if (!base64.startsWith('UEsDB') && !base64.startsWith('0M8R4')) throw new Error('Select a genuine Excel workbook (.xlsx or .xls).');
  if (base64.length > Math.ceil(MAX_EXCEL_BYTES * 4 / 3) + 4) throw new Error('Choose an Excel file smaller than 5 MB.');
  let workbook;
  try { workbook = XLSX.read(base64, { type: 'base64', cellDates: true, sheetRows: MAX_EXCEL_ROWS + 2 }); }
  catch { throw new Error('This workbook is damaged, encrypted, or unsupported. Save it as an unprotected .xlsx file and try again.'); }
  const sheet = workbook.Sheets.Transactions || workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet?.['!ref']) throw new Error('The workbook has no transaction rows.');
  const range = XLSX.utils.decode_range(sheet['!fullref'] || sheet['!ref']);
  if (range.s.r !== 0 || range.s.c !== 0) throw new Error('Place the column headers in the first row, starting at A1.');
  if (range.e.r > MAX_EXCEL_ROWS || range.e.c > 50) throw new Error('Use a workbook with at most 10,000 transaction rows and 51 columns.');
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true, blankrows: true });
  const headers = rows[0].map((value) => String(value).trim().toLowerCase());
  for (const name of ['type', 'category', 'amount', 'date']) {
    if (!headers.includes(name)) throw new Error(`Missing column: ${name}. Use an exported CheckPaisa workbook as the template.`);
    if (headers.filter((header) => header === name).length > 1) throw new Error(`Duplicate column: ${name}.`);
  }
  const value = (row, name) => row[headers.indexOf(name)] ?? '';
  const fallback = wallets.find((wallet) => wallet.id === activeWalletId)?.id || wallets[0]?.id || 'default_wallet';
  const errors = [];
  let reassignedWallets = 0;
  const transactions = [];
  const knownCategories = [...categories];
  rows.slice(1).forEach((row, index) => {
    if (row.every((cell) => cell === '')) return;
    const rowNumber = index + 2;
    if (row.some((_, col) => sheet[XLSX.utils.encode_cell({ r: index + 1, c: col })]?.f)) {
      errors.push(`Row ${rowNumber}: replace formulas with values.`); return;
    }
    const typeText = String(value(row, 'type')).trim().toLowerCase();
    const type = typeText === 'income' ? 'Income' : typeText === 'expense' ? 'Expense' : null;
    const category = String(value(row, 'category')).trim();
    const amount = Number(value(row, 'amount'));
    const date = importDate(value(row, 'date'));
    if (!type || !category || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(date.getTime())) {
      errors.push(`Row ${rowNumber}: use Income/Expense, a category, a positive amount, and an Excel date or YYYY-MM-DD.`); return;
    }
    if (knownCategories.some((cat) => cat.name.toLowerCase() === category.toLowerCase() && cat.type !== type)) {
      errors.push(`Row ${rowNumber}: category ${category} belongs to a different transaction type.`); return;
    }
    const canonicalCategory = knownCategories.find((cat) => cat.name.toLowerCase() === category.toLowerCase())?.name || category;
    knownCategories.push({ name: canonicalCategory, type });
    const importedWallet = String(value(row, 'wallet id')).trim();
    const walletId = wallets.some((wallet) => wallet.id === importedWallet) ? importedWallet : fallback;
    if (importedWallet && importedWallet !== walletId) reassignedWallets += 1;
    const note = String(value(row, 'notes'));
    const createdAt = date.toISOString();
    const ruleId = String(value(row, 'recurring rule id')).trim();
    const recurringRuleId = rules.some((rule) => rule.id === ruleId) ? ruleId : undefined;
    transactions.push({ id: String(value(row, 'id')).trim() || stableId([type, category, amount, createdAt, note, walletId]),
      type, category: canonicalCategory, amount, createdAt, note, walletId, isRecurring: Boolean(recurringRuleId), recurringRuleId });
  });
  if (errors.length) throw new Error(`${errors.length} invalid row(s). Nothing was imported.\n${errors.slice(0, 4).join('\n')}`);
  if (!transactions.length) throw new Error('The workbook has no transaction rows.');
  return { transactions, reassignedWallets };
}
