import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  getDocs 
} from 'firebase/firestore';
import { Account, AccountType, Transaction, TransactionType, StockHolding } from '../types';

// Helper to generate sample data for new users
const createSampleData = async (userId: string) => {
  const batch = writeBatch(db);

  // Sample Accounts
  const acc1Ref = doc(collection(db, `users/${userId}/accounts`));
  const acc2Ref = doc(collection(db, `users/${userId}/accounts`));
  const acc3Ref = doc(collection(db, `users/${userId}/accounts`));

  batch.set(acc1Ref, { 
    id: acc1Ref.id, userId, name: '玉山銀行薪轉戶', type: AccountType.BANK, balance: 150000, currency: 'TWD' 
  });
  batch.set(acc2Ref, { 
    id: acc2Ref.id, userId, name: '現金錢包', type: AccountType.CASH, balance: 5000, currency: 'TWD' 
  });
  batch.set(acc3Ref, { 
    id: acc3Ref.id, userId, name: '元大證券', type: AccountType.INVESTMENT, balance: 0, currency: 'TWD' 
  });

  // Sample Transactions
  const tx1Ref = doc(collection(db, `users/${userId}/transactions`));
  const tx2Ref = doc(collection(db, `users/${userId}/transactions`));
  
  batch.set(tx1Ref, { 
    id: tx1Ref.id, userId, accountId: acc1Ref.id, amount: 50000, date: new Date().toISOString(), type: TransactionType.INCOME, category: '薪資', note: '十月薪資' 
  });
  batch.set(tx2Ref, { 
    id: tx2Ref.id, userId, accountId: acc2Ref.id, amount: 120, date: new Date().toISOString(), type: TransactionType.EXPENSE, category: '飲食', note: '午餐' 
  });

  // Sample Stocks
  const stockRef = doc(collection(db, `users/${userId}/stocks`));
  batch.set(stockRef, { 
    id: stockRef.id, userId, symbol: '2330.TW', name: '台積電', shares: 1000, averageCost: 550, currentPrice: 580 
  });

  await batch.commit();
};

export const StorageService = {
  // Check if user has data, if not initialize
  initUserData: async (userId: string, userName: string) => {
    const userDocRef = doc(db, 'users', userId);
    // update profile just in case
    await setDoc(userDocRef, { name: userName, email: auth.currentUser?.email }, { merge: true });
    
    // Check if accounts exist to determine if new user
    const accountsSnapshot = await getDocs(collection(db, `users/${userId}/accounts`));
    if (accountsSnapshot.empty) {
      await createSampleData(userId);
    }
  },

  // --- Accounts ---
  addAccount: async (userId: string, account: Omit<Account, 'id'>) => {
    const ref = doc(collection(db, `users/${userId}/accounts`));
    await setDoc(ref, { ...account, id: ref.id });
  },

  updateAccount: async (userId: string, account: Account) => {
    const ref = doc(db, `users/${userId}/accounts`, account.id);
    await updateDoc(ref, { ...account });
  },

  deleteAccount: async (userId: string, accountId: string) => {
    await deleteDoc(doc(db, `users/${userId}/accounts`, accountId));
  },

  // --- Transactions ---
  addTransaction: async (userId: string, transaction: Transaction, updatedAccounts: Account[]) => {
    const batch = writeBatch(db);
    
    // Add transaction
    const txRef = doc(collection(db, `users/${userId}/transactions`));
    batch.set(txRef, { ...transaction, id: txRef.id });

    // Update account balances
    updatedAccounts.forEach(acc => {
      const accRef = doc(db, `users/${userId}/accounts`, acc.id);
      batch.update(accRef, { balance: acc.balance });
    });

    await batch.commit();
  },

  deleteTransaction: async (userId: string, transactionId: string, updatedAccounts: Account[]) => {
    const batch = writeBatch(db);
    
    // Delete transaction
    batch.delete(doc(db, `users/${userId}/transactions`, transactionId));

    // Revert account balances
    updatedAccounts.forEach(acc => {
      const accRef = doc(db, `users/${userId}/accounts`, acc.id);
      batch.update(accRef, { balance: acc.balance });
    });

    await batch.commit();
  },

  // --- Stocks ---
  addStock: async (userId: string, stock: Omit<StockHolding, 'id'>) => {
    const ref = doc(collection(db, `users/${userId}/stocks`));
    await setDoc(ref, { ...stock, id: ref.id });
  },

  deleteStock: async (userId: string, stockId: string) => {
    await deleteDoc(doc(db, `users/${userId}/stocks`, stockId));
  },

  updateStocks: async (userId: string, stocks: StockHolding[]) => {
    const batch = writeBatch(db);
    stocks.forEach(stock => {
      const ref = doc(db, `users/${userId}/stocks`, stock.id);
      batch.set(ref, stock, { merge: true });
    });
    await batch.commit();
  }
};