import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Transactions from './components/Transactions';
import Stocks from './components/Stocks';
import Reports from './components/Reports';
import { auth, db } from './services/firebase';
import { StorageService } from './services/storage';
import { User, Account, Transaction, StockHolding } from './types';
import { Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // App Data State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stocks, setStocks] = useState<StockHolding[]>([]);

  // Auth Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');

  // 1. Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
        });
      } else {
        setCurrentUser(null);
        setAccounts([]);
        setTransactions([]);
        setStocks([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Data Listeners
  useEffect(() => {
    if (!currentUser) return;

    // Listen to Accounts
    const unsubAccounts = onSnapshot(collection(db, `users/${currentUser.id}/accounts`), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Account));
      setAccounts(data);
    });

    // Listen to Transactions (Ordered by date desc)
    // Note: Requires a composite index in Firestore for complex queries, keeping it simple here.
    // We sort on client side for simplicity with the "no-build" setup constraints, 
    // or you can add orderBy('date', 'desc') if you create the index.
    const unsubTransactions = onSnapshot(collection(db, `users/${currentUser.id}/transactions`), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(data);
    });

    // Listen to Stocks
    const unsubStocks = onSnapshot(collection(db, `users/${currentUser.id}/stocks`), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StockHolding));
      setStocks(data);
    });

    return () => {
      unsubAccounts();
      unsubTransactions();
      unsubStocks();
    };
  }, [currentUser]);

  // Handle Actions (Calls StorageService which wraps Firebase)
  const handleAccountUpdate = async (newAccounts: Account[]) => {
    if (!currentUser) return;
    // Basic diffing logic to see what changed (add/update/delete)
    // Since Accounts.tsx passes the full new array, we need to reconcile or just use specific methods.
    // For simplicity in this refactor, we modified Accounts.tsx to manage the array locally, 
    // but here we should ideally change Accounts.tsx to call 'addAccount', 'deleteAccount' directly.
    // However, to keep prop interfaces consistent with the previous 'onUpdate' pattern:
    
    // Find removed
    const currentIds = accounts.map(a => a.id);
    const newIds = newAccounts.map(a => a.id);
    const removedId = currentIds.find(id => !newIds.includes(id));
    
    if (removedId) {
      await StorageService.deleteAccount(currentUser.id, removedId);
      return;
    }

    // Find added/updated
    for (const acc of newAccounts) {
        const existing = accounts.find(a => a.id === acc.id);
        if (!existing) {
            await StorageService.addAccount(currentUser.id, acc);
        } else if (JSON.stringify(existing) !== JSON.stringify(acc)) {
            await StorageService.updateAccount(currentUser.id, acc);
        }
    }
  };

  const handleTransactionUpdate = async (newTransactions: Transaction[], updatedAccounts: Account[]) => {
      if (!currentUser) return;
      
      // Check if added
      if (newTransactions.length > transactions.length) {
          const newTx = newTransactions[0]; // Assuming Transactions.tsx prepends new one
          await StorageService.addTransaction(currentUser.id, newTx, updatedAccounts);
      } 
      // Check if deleted
      else if (newTransactions.length < transactions.length) {
          const removedTx = transactions.find(t => !newTransactions.find(nt => nt.id === t.id));
          if (removedTx) {
              await StorageService.deleteTransaction(currentUser.id, removedTx.id, updatedAccounts);
          }
      }
  };

  const handleStockUpdate = async (newStocks: StockHolding[]) => {
    if (!currentUser) return;
    
    // Check delete
    if (newStocks.length < stocks.length) {
        const removed = stocks.find(s => !newStocks.find(ns => ns.id === s.id));
        if (removed) await StorageService.deleteStock(currentUser.id, removed.id);
        return;
    }

    // Check add
    if (newStocks.length > stocks.length) {
        // Find the one with ID generated by client in Stocks.tsx (which uses Math.random)
        // Ideally Stocks.tsx should let us handle ID gen, but we adapt:
        const added = newStocks.find(ns => !stocks.find(s => s.id === ns.id));
        if (added) await StorageService.addStock(currentUser.id, added);
        return;
    }

    // Check Update (e.g. AI price update)
    await StorageService.updateStocks(currentUser.id, newStocks);
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
    } catch (err: any) {
      setAuthError('登入失敗：' + (err.message || '請檢查帳號密碼'));
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      await updateProfile(cred.user, { displayName: authName });
      await StorageService.initUserData(cred.user.uid, authName);
      // Auto triggers auth state change
    } catch (err: any) {
      setAuthError('註冊失敗：' + (err.message || 'Email 可能已被使用'));
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-indigo-600 mb-2">WealthFlow</h1>
            <p className="text-gray-500">您的個人智慧理財管家 (Cloud)</p>
          </div>

          <form onSubmit={isRegistering ? onRegister : onLogin} className="space-y-6">
            {authError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                    {authError}
                </div>
            )}
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">您的姓名</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    placeholder="王大明"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                 <input
                    type="email"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    placeholder="user@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200"
            >
              {isRegistering ? '立即註冊' : '登入'}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              {isRegistering ? '已經有帳號？登入' : '還沒有帳號？免費註冊'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard accounts={accounts} transactions={transactions} stocks={stocks} />;
      case 'accounts':
        return <Accounts user={currentUser} accounts={accounts} onUpdate={handleAccountUpdate} />;
      case 'transactions':
        return <Transactions user={currentUser} transactions={transactions} accounts={accounts} onUpdate={handleTransactionUpdate} />;
      case 'stocks':
        return <Stocks user={currentUser} stocks={stocks} onUpdate={handleStockUpdate} totalAssets={accounts.reduce((sum, a) => sum + a.balance, 0)} />;
      case 'reports':
        return <Reports transactions={transactions} />;
      default:
        return <Dashboard accounts={accounts} transactions={transactions} stocks={stocks} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      user={currentUser}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;