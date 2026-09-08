/**
 * Utility to process active recurring rules and auto-generate transactions
 * strictly bounded between start date (fromDate) and end date (toDate).
 * Supports Day-of-Week selection for Weekly rules and Day-of-Month selection for Monthly rules.
 */

export function processRecurringRules(rules = [], existingTransactions = []) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return { newTransactions: [], updatedRules: rules };
  }

  const now = new Date();
  const newTransactions = [];
  const existingIdSet = new Set(existingTransactions.map((t) => t.id));

  const updatedRules = rules.map((rule) => {
    if (rule.isActive === false) return rule;

    const fromDate = new Date(rule.fromDate);
    const toDate = new Date(rule.toDate);

    // Normalize fromDate to start of day (00:00:00.000)
    const startBound = new Date(fromDate);
    startBound.setHours(0, 0, 0, 0);

    // Normalize toDate to end of day (23:59:59.999)
    const endBound = new Date(toDate);
    endBound.setHours(23, 59, 59, 999);

    // If start date is strictly in the future relative to current time, don't generate entries yet
    if (startBound > now) return rule;

    // Upper limit date for entry generation (must NOT exceed endBound or current time)
    const effectiveEnd = now < endBound ? now : endBound;

    let lastProcessed = rule.lastProcessedDate ? new Date(rule.lastProcessedDate) : null;

    const addTx = (date) => {
      const txId = `rec_${rule.id}_${date.getTime()}`;
      if (!existingIdSet.has(txId)) {
        newTransactions.push({
          id: txId,
          type: rule.type || 'Expense',
          amount: Number(rule.amount) || 0,
          category: rule.category || 'Other',
          walletId: rule.walletId || 'default_wallet',
          note: rule.note ? `${rule.note} (Recurring)` : 'Recurring Entry',
          createdAt: new Date(date).toISOString(),
          isRecurring: true,
          recurringRuleId: rule.id,
        });
        existingIdSet.add(txId);
      }
    };

    if (rule.frequency === 'Daily') {
      let pointerDate = lastProcessed ? new Date(lastProcessed) : new Date(startBound);
      if (!lastProcessed && pointerDate <= effectiveEnd && pointerDate <= endBound) {
        addTx(pointerDate);
        lastProcessed = new Date(pointerDate);
      }

      while (true) {
        const nextDate = new Date(pointerDate);
        nextDate.setDate(nextDate.getDate() + 1);
        if (nextDate > effectiveEnd || nextDate > endBound) break;
        pointerDate = nextDate;
        addTx(pointerDate);
        lastProcessed = new Date(pointerDate);
      }
    } else if (rule.frequency === 'Weekly') {
      const targetDayOfWeek = rule.repeatDayOfWeek !== undefined ? Number(rule.repeatDayOfWeek) : fromDate.getDay();
      let pointerDate;

      if (lastProcessed) {
        pointerDate = new Date(lastProcessed);
      } else {
        pointerDate = new Date(startBound);
        while (pointerDate.getDay() !== targetDayOfWeek && pointerDate <= endBound) {
          pointerDate.setDate(pointerDate.getDate() + 1);
        }
      }

      if (!lastProcessed && pointerDate >= startBound && pointerDate <= effectiveEnd && pointerDate <= endBound) {
        addTx(pointerDate);
        lastProcessed = new Date(pointerDate);
      }

      while (true) {
        const nextDate = new Date(pointerDate);
        nextDate.setDate(nextDate.getDate() + 7);
        if (nextDate > effectiveEnd || nextDate > endBound) break;
        pointerDate = nextDate;
        addTx(pointerDate);
        lastProcessed = new Date(pointerDate);
      }
    } else {
      // Default: Monthly frequency
      const targetDayOfMonth = rule.repeatDayOfMonth !== undefined ? Number(rule.repeatDayOfMonth) : fromDate.getDate();
      let monthCursor = new Date(startBound.getFullYear(), startBound.getMonth(), 1);
      const endMonthCursor = new Date(endBound.getFullYear(), endBound.getMonth(), 1);

      while (monthCursor <= endMonthCursor) {
        const year = monthCursor.getFullYear();
        const month = monthCursor.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const day = Math.min(targetDayOfMonth, daysInMonth);
        const targetDate = new Date(year, month, day, 0, 0, 0, 0);

        if (
          targetDate >= startBound &&
          targetDate <= effectiveEnd &&
          targetDate <= endBound &&
          (!lastProcessed || targetDate > lastProcessed)
        ) {
          addTx(targetDate);
          lastProcessed = new Date(targetDate);
        }

        monthCursor.setMonth(monthCursor.getMonth() + 1);
      }
    }

    return {
      ...rule,
      lastProcessedDate: lastProcessed ? lastProcessed.toISOString() : rule.lastProcessedDate,
    };
  });

  return { newTransactions, updatedRules };
}
