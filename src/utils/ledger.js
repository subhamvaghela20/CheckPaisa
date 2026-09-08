// A rule edit affects future occurrences; editing a transaction affects only that entry.
export function applyTransactionSave(transactions, rules, transaction, rule, options = {}, now = new Date()) {
  let nextRules = rules;
  let nextTransactions = transactions;
  if (options.editingRuleId) {
    nextRules = rules.map((current) => current.id === options.editingRuleId
      ? rule ? { ...current, ...rule, lastProcessedDate: now.toISOString() } : { ...current, isActive: false }
      : current);
    return { transactions: nextTransactions, rules: nextRules };
  }
  const existing = transaction && transactions.find((item) => item.id === transaction.id);
  if (rule) {
    nextRules = [{ ...rule, ...(existing ? { lastProcessedDate: now.toISOString() } : {}) }, ...rules.filter((item) => item.id !== rule.id)];
  }
  if (transaction && (existing || !rule)) {
    nextTransactions = existing
      ? transactions.map((item) => item.id === transaction.id ? transaction : item)
      : [transaction, ...transactions];
  }
  return { transactions: nextTransactions, rules: nextRules };
}

export function migrateCategory(transactions, budgets, rules, oldName, newName) {
  const nextBudgets = { ...(budgets || {}) };
  if (Object.prototype.hasOwnProperty.call(nextBudgets, oldName)) {
    if (newName !== oldName && !Object.prototype.hasOwnProperty.call(nextBudgets, newName)) nextBudgets[newName] = nextBudgets[oldName];
    if (newName !== oldName) delete nextBudgets[oldName];
  }
  return {
    transactions: transactions.map((tx) => tx.category === oldName ? { ...tx, category: newName } : tx),
    budgets: nextBudgets,
    rules: rules.map((rule) => rule.category === oldName ? { ...rule, category: newName } : rule),
  };
}
