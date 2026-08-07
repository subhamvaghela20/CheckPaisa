export function formatTransactionDateTime(createdAt) {
  const date = new Date(createdAt);
  return `${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

export function formatDate(date) {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function getDateHeaderLabel(createdAt) {
  if (!createdAt) return 'Recent';
  const d = new Date(createdAt);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function groupTransactionsByDate(transactionsList) {
  const sorted = [...transactionsList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const groups = [];
  const map = new Map();

  sorted.forEach((tx) => {
    const label = getDateHeaderLabel(tx.createdAt);
    if (!map.has(label)) {
      const newGroup = { label, data: [] };
      map.set(label, newGroup);
      groups.push(newGroup);
    }
    map.get(label).data.push(tx);
  });

  return groups;
}
