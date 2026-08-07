const CATEGORY_KEYWORDS = {
  Food: ['food', 'lunch', 'dinner', 'breakfast', 'tea', 'coffee', 'swiggy', 'zomato', 'restaurant', 'snack', 'eating', 'pizza', 'burger'],
  Transport: ['transport', 'petrol', 'fuel', 'diesel', 'cab', 'uber', 'ola', 'auto', 'bus', 'train', 'flight', 'fare', 'parking', 'bike'],
  Groceries: ['groceries', 'grocery', 'supermarket', 'vegetables', 'fruits', 'milk', 'd-mart', 'blinkit', 'zepto'],
  Bills: ['bill', 'bills', 'electricity', 'water', 'recharge', 'wifi', 'internet', 'mobile', 'gas', 'current'],
  Shopping: ['shopping', 'clothes', 'shoes', 'amazon', 'flipkart', 'myntra', 'shirt', 'pants', 'dress'],
  Rent: ['rent', 'house rent', 'room rent', 'flat rent'],
  Health: ['health', 'doctor', 'medicine', 'hospital', 'medical', 'pharmacy', 'clinic', 'tablet'],
  Education: ['education', 'school', 'college', 'tuition', 'fee', 'fees', 'books', 'course'],
  Entertainment: ['entertainment', 'movie', 'cinema', 'game', 'gaming', 'netflix', 'party', 'fun'],
  Salary: ['salary', 'paycheck', 'stipend', 'wages'],
  Bonus: ['bonus', 'reward', 'incentive', 'gift'],
  Freelance: ['freelance', 'client', 'project', 'contract'],
  Investment: ['investment', 'stocks', 'mutual fund', 'crypto', 'interest', 'dividend'],
  Cashback: ['cashback', 'refund', 'discount', 'cash back'],
};

const INCOME_KEYWORDS = ['salary', 'received', 'earned', 'bonus', 'freelance', 'cashback', 'got', 'income', 'credit', 'dividend', 'refund'];

export function parseVoiceInput(spokenText, availableCategories = []) {
  if (!spokenText || typeof spokenText !== 'string') {
    return { isValid: false, reason: 'No speech detected' };
  }

  const cleanText = spokenText.toLowerCase().trim();

  // 1. Extract Number Amount (e.g. 150, 2500, 35.50)
  const numberMatch = cleanText.match(/\d+(\.\d+)?/);
  let amount = null;

  if (numberMatch) {
    amount = parseFloat(numberMatch[0]);
  } else {
    // Basic word number fallback
    const wordNumbers = {
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      fifty: 50, hundred: 100, thousand: 1000,
    };
    Object.keys(wordNumbers).forEach((word) => {
      if (cleanText.includes(word)) {
        amount = wordNumbers[word];
      }
    });
  }

  if (!amount || amount <= 0) {
    return { isValid: false, reason: 'Amount missing', spokenText };
  }

  // 2. Determine Transaction Type (Income vs Expense)
  let type = 'Expense';
  const isIncome = INCOME_KEYWORDS.some((kw) => cleanText.includes(kw));
  if (isIncome) {
    type = 'Income';
  }

  // 3. Match Category
  let matchedCategory = null;

  // First try direct match with available categories
  availableCategories.forEach((cat) => {
    if (cleanText.includes(cat.name.toLowerCase())) {
      matchedCategory = cat.name;
    }
  });

  // Second try synonym keyword dictionary matching
  if (!matchedCategory) {
    for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((kw) => cleanText.includes(kw))) {
        // Verify category exists in available categories or fallback
        const exists = availableCategories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
        matchedCategory = exists ? exists.name : categoryName;
        break;
      }
    }
  }

  // Fallback to "Other" or default category if still null
  if (!matchedCategory) {
    return { isValid: false, amount, type, reason: 'Category not recognized', spokenText };
  }

  return {
    isValid: true,
    amount,
    type,
    category: matchedCategory,
    note: `Voice entry: "${spokenText}"`,
    spokenText,
  };
}
