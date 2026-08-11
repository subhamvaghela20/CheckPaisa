const HINDI_NUMBERS = {
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5, panch: 5,
  chhe: 6, saat: 7, aath: 8, nau: 9, das: 10,
  gyarah: 11, barah: 12, terah: 13, chaudah: 14, pandrah: 15,
  solah: 16, satrah: 17, atharah: 18, unnis: 19, bees: 20,
  pachees: 25, tees: 30, pachas: 50, saath: 60, sattar: 70,
  assi: 80, nabbe: 90,
};

const HINDI_MULTIPLIERS = {
  sau: 100,
  hazar: 1000,
  hazaar: 1000,
  lakh: 100000,
  lac: 100000,
};

const EXPENSE_KEYWORDS = ['spent', 'paid', 'bought', 'expense', 'kharcha', 'kharch', 'diya'];
const INCOME_KEYWORDS = ['earned', 'received', 'income', 'got', 'mila', 'aaya', 'kamai', 'salary'];

const HINDI_CATEGORY_ALIASES = {
  khana: 'Food',
  kiraya: 'Rent',
  bill: 'Bills',
  kharidari: 'Shopping',
  dawai: 'Health',
  ilaj: 'Health',
  sabzi: 'Groceries',
  ration: 'Groceries',
  padhai: 'Education',
  manoranjan: 'Entertainment',
  tankhah: 'Salary',
  naukri: 'Salary',
  nivesh: 'Investment',
};

function extractAmount(words) {
  let amount = 0;
  let currentNumber = 0;
  let hasAmount = false;
  const usedIndices = new Set();

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const digitMatch = word.match(/^\d+(\.\d+)?$/);

    if (digitMatch) {
      currentNumber = parseFloat(word);
      hasAmount = true;
      usedIndices.add(i);

      if (i + 1 < words.length && HINDI_MULTIPLIERS[words[i + 1]]) {
        currentNumber *= HINDI_MULTIPLIERS[words[i + 1]];
        usedIndices.add(i + 1);
        i++;
      }
      amount += currentNumber;
      currentNumber = 0;
    } else if (HINDI_NUMBERS[word] !== undefined) {
      currentNumber = HINDI_NUMBERS[word];
      hasAmount = true;
      usedIndices.add(i);

      if (i + 1 < words.length && HINDI_MULTIPLIERS[words[i + 1]]) {
        currentNumber *= HINDI_MULTIPLIERS[words[i + 1]];
        usedIndices.add(i + 1);
        i++;
      }
      amount += currentNumber;
      currentNumber = 0;
    } else if (HINDI_MULTIPLIERS[word]) {
      hasAmount = true;
      usedIndices.add(i);
      amount += HINDI_MULTIPLIERS[word];
    }
  }

  return { amount: hasAmount ? amount : null, usedIndices };
}

function matchCategory(words, allCategories) {
  const text = words.join(' ');
  const usedIndices = new Set();

  for (const alias in HINDI_CATEGORY_ALIASES) {
    const idx = words.indexOf(alias);
    if (idx !== -1) {
      const targetName = HINDI_CATEGORY_ALIASES[alias];
      const cat = allCategories.find(
        (c) => c.name.toLowerCase() === targetName.toLowerCase()
      );
      if (cat) {
        usedIndices.add(idx);
        return { category: cat.name, type: cat.type, usedIndices };
      }
    }
  }

  for (const cat of allCategories) {
    const catLower = cat.name.toLowerCase();
    const idx = words.indexOf(catLower);
    if (idx !== -1) {
      usedIndices.add(idx);
      return { category: cat.name, type: cat.type, usedIndices };
    }
  }

  for (const cat of allCategories) {
    const catLower = cat.name.toLowerCase();
    for (let i = 0; i < words.length; i++) {
      if (
        words[i].length >= 3 &&
        (catLower.includes(words[i]) || words[i].includes(catLower))
      ) {
        usedIndices.add(i);
        return { category: cat.name, type: cat.type, usedIndices };
      }
    }
  }

  return { category: null, type: null, usedIndices };
}

function determineType(words, categoryType) {
  let type = categoryType || 'Expense';
  const keywordIndices = new Set();

  for (let i = 0; i < words.length; i++) {
    if (INCOME_KEYWORDS.includes(words[i])) {
      type = 'Income';
      keywordIndices.add(i);
    }
    if (EXPENSE_KEYWORDS.includes(words[i])) {
      type = 'Expense';
      keywordIndices.add(i);
    }
  }

  return { type, keywordIndices };
}

const MONTHS = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

function extractDate(words) {
  const usedIndices = new Set();
  const text = words.join(' ');
  const now = new Date();
  let targetDate = null;

  if (text.includes('yesterday') || text.includes('beeta hua kal')) {
    targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0, 0);
    words.forEach((w, i) => {
      if (w === 'yesterday' || w === 'kal' || w === 'beeta' || w === 'hua') usedIndices.add(i);
    });
    return { createdAt: targetDate.toISOString(), usedIndices };
  }

  for (let i = 0; i < words.length; i++) {
    const cleanWord = words[i];
    const dayStr = cleanWord.replace(/(st|nd|rd|th)$/, '');
    const dayNum = parseInt(dayStr, 10);

    if (i + 1 < words.length && !isNaN(dayNum) && dayNum >= 1 && dayNum <= 31 && MONTHS[words[i + 1]] !== undefined) {
      targetDate = new Date(now.getFullYear(), MONTHS[words[i + 1]], dayNum, 10, 0, 0);
      usedIndices.add(i);
      usedIndices.add(i + 1);
      if (i > 0 && (words[i - 1] === 'on' || words[i - 1] === 'ko' || words[i - 1] === 'par')) {
        usedIndices.add(i - 1);
      }
      if (i + 2 < words.length && words[i + 2] === 'tarikh') {
        usedIndices.add(i + 2);
      }
      return { createdAt: targetDate.toISOString(), usedIndices };
    }

    if (i + 1 < words.length && MONTHS[cleanWord] !== undefined) {
      const nextDayStr = words[i + 1].replace(/(st|nd|rd|th)$/, '');
      const nextDayNum = parseInt(nextDayStr, 10);
      if (!isNaN(nextDayNum) && nextDayNum >= 1 && nextDayNum <= 31) {
        targetDate = new Date(now.getFullYear(), MONTHS[cleanWord], nextDayNum, 10, 0, 0);
        usedIndices.add(i);
        usedIndices.add(i + 1);
        if (i > 0 && (words[i - 1] === 'on' || words[i - 1] === 'ko' || words[i - 1] === 'par')) {
          usedIndices.add(i - 1);
        }
        return { createdAt: targetDate.toISOString(), usedIndices };
      }
    }
  }

  return { createdAt: now.toISOString(), usedIndices };
}

export function parseVoiceInput(text, allCategories) {
  if (!text || typeof text !== 'string') {
    return { success: false, error: 'Could not detect amount. Please say an amount.' };
  }

  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return { success: false, error: 'Could not detect amount. Please say an amount.' };
  }

  const { amount, usedIndices: amountIndices } = extractAmount(words);

  if (amount === null || amount <= 0) {
    return { success: false, error: 'Could not detect amount. Please say an amount.' };
  }

  const { category, type: categoryType, usedIndices: categoryIndices } = matchCategory(
    words,
    allCategories
  );

  const { type, keywordIndices } = determineType(words, categoryType);
  const { createdAt, usedIndices: dateIndices } = extractDate(words);

  const allUsedIndices = new Set([
    ...amountIndices,
    ...categoryIndices,
    ...keywordIndices,
    ...dateIndices,
  ]);

  const FILLER_WORDS = ['on', 'for', 'in', 'ka', 'ki', 'ke', 'me', 'pe', 'se', 'ko', 'the', 'a', 'an', 'tarikh'];

  const remainingWords = words.filter(
    (word, i) => !allUsedIndices.has(i) && !FILLER_WORDS.includes(word)
  );
  const note = remainingWords.join(' ').trim();

  const defaultCategory = type === 'Income' ? 'Other Income' : 'Other Expense';

  return {
    success: true,
    transaction: {
      id: String(Date.now()),
      type,
      amount,
      category: category || defaultCategory,
      note,
      createdAt,
    },
  };
}
