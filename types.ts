export interface User {
  id: string;
  name: string;
  email: string;
  // passwordHash removed: Auth is handled by Firebase
}

export enum AccountType {
  BANK = 'Bank',
  CASH = 'Cash',
  INVESTMENT = 'Investment',
  CREDIT = 'Credit'
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
}

export enum TransactionType {
  INCOME = 'Income',
  EXPENSE = 'Expense',
  TRANSFER = 'Transfer'
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  date: string; // ISO string
  type: TransactionType;
  category: string;
  note?: string;
}

export interface StockHolding {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  shares: number;
  averageCost: number;
  currentPrice?: number; // Fetched from API
  lastUpdated?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: '飲食', type: TransactionType.EXPENSE, icon: '🍔', color: 'bg-orange-100 text-orange-600' },
  { id: 'c2', name: '交通', type: TransactionType.EXPENSE, icon: '🚗', color: 'bg-blue-100 text-blue-600' },
  { id: 'c3', name: '居住', type: TransactionType.EXPENSE, icon: '🏠', color: 'bg-indigo-100 text-indigo-600' },
  { id: 'c4', name: '娛樂', type: TransactionType.EXPENSE, icon: '🎮', color: 'bg-purple-100 text-purple-600' },
  { id: 'c5', name: '薪資', type: TransactionType.INCOME, icon: '💰', color: 'bg-green-100 text-green-600' },
  { id: 'c6', name: '投資', type: TransactionType.INCOME, icon: '📈', color: 'bg-emerald-100 text-emerald-600' },
];