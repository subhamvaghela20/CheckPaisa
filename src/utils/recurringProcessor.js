export function localDay(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function ruleStatus(rule, now = new Date()) {
  if (!rule || !localDay(rule.fromDate) || !localDay(rule.toDate)) return 'Invalid';
  if (localDay(rule.toDate) < localDay(now)) return 'Completed';
  if (rule.isActive === false) return 'Paused';
  return localDay(rule.fromDate) > localDay(now) ? 'Scheduled' : 'Active';
}

// Bounded work per pass keeps historical catch-up from blocking the UI.
export function processRecurringRules(rules = [], existingTransactions = [], now = new Date(), limit = 200) {
  if (!Array.isArray(rules)) return { newTransactions: [], updatedRules: [], hasMore: false };
  const newTransactions = [];
  const seen = new Set();
  for (const tx of existingTransactions || []) {
    const date = localDay(tx.createdAt);
    if (date && tx.recurringRuleId) seen.add(`${tx.recurringRuleId}:${dayKey(date)}`);
  }
  let hasMore = false;
  const today = localDay(now);
  const updatedRules = rules.map((rule) => {
    if (!rule || rule.isActive === false) return rule;
    const start = localDay(rule.fromDate);
    const end = localDay(rule.toDate);
    const amount = Number(rule.amount);
    if (!start || !end || !today || start > end || start > today || !Number.isFinite(amount) || amount <= 0 ||
        !['Daily', 'Weekly', 'Monthly'].includes(rule.frequency)) return rule;
    const upper = end < today ? end : today;
    const last = localDay(rule.lastProcessedDate);
    let pointer = new Date(start);
    if (last && last >= pointer) {
      pointer = new Date(last);
      pointer.setDate(pointer.getDate() + 1);
    }
    const weekDay = Number(rule.repeatDayOfWeek ?? start.getDay());
    const monthDay = Number(rule.repeatDayOfMonth ?? start.getDate());
    if (rule.frequency === 'Weekly' && (!Number.isInteger(weekDay) || weekDay < 0 || weekDay > 6)) return rule;
    if (rule.frequency === 'Monthly' && (!Number.isInteger(monthDay) || monthDay < 1 || monthDay > 31)) return rule;
    const align = () => {
      if (rule.frequency === 'Weekly') pointer.setDate(pointer.getDate() + (weekDay - pointer.getDay() + 7) % 7);
      if (rule.frequency === 'Monthly') {
        let target = new Date(pointer.getFullYear(), pointer.getMonth(), Math.min(monthDay, new Date(pointer.getFullYear(), pointer.getMonth() + 1, 0).getDate()));
        if (target < pointer) target = new Date(pointer.getFullYear(), pointer.getMonth() + 1, Math.min(monthDay, new Date(pointer.getFullYear(), pointer.getMonth() + 2, 0).getDate()));
        pointer = target;
      }
    };
    align();
    let processed = last;
    let visits = 0;
    while (pointer <= upper) {
      if (newTransactions.length >= limit || visits >= limit) { hasMore = true; break; }
      visits += 1;
      const key = `${rule.id}:${dayKey(pointer)}`;
      if (!seen.has(key)) {
        newTransactions.push({
          id: `rec_${rule.id}_${dayKey(pointer)}`, type: rule.type === 'Income' ? 'Income' : 'Expense',
          amount, category: rule.category, walletId: rule.walletId || 'default_wallet',
          note: rule.note || '', createdAt: pointer.toISOString(), isRecurring: true, recurringRuleId: rule.id,
        });
        seen.add(key);
      }
      processed = new Date(pointer);
      pointer.setDate(pointer.getDate() + 1);
      align();
    }
    return processed ? { ...rule, lastProcessedDate: processed.toISOString() } : rule;
  });
  return { newTransactions, updatedRules, hasMore };
}
