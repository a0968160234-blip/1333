import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Account, User, DEFAULT_CATEGORIES, Category } from '../types';
import { Plus, Trash2, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionsProps {
  user: User;
  transactions: Transaction[];
  accounts: Account[];
  onUpdate: (transactions: Transaction[], accounts: Account[]) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ user, transactions, accounts, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  
  const [formData, setFormData] = useState({
    accountId: accounts[0]?.id || '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd HH:mm'),
    type: TransactionType.EXPENSE,
    category: DEFAULT_CATEGORIES[0].name,
    note: ''
  });

  // Derived filtered list
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => filterType === 'ALL' || t.type === filterType)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(formData.amount);
    
    // Create new transaction
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      accountId: formData.accountId,
      amount: amountNum,
      date: new Date(formData.date).toISOString(),
      type: formData.type,
      category: formData.category,
      note: formData.note
    };

    // Update account balance
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === formData.accountId) {
        const balanceChange = formData.type === TransactionType.INCOME ? amountNum : -amountNum;
        return { ...acc, balance: acc.balance + balanceChange };
      }
      return acc;
    });

    onUpdate([newTx, ...transactions], updatedAccounts);
    setIsModalOpen(false);
    setFormData({ ...formData, amount: '', note: '' });
  };

  const handleDelete = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    if (confirm('確定刪除此紀錄？帳戶餘額將會回滾。')) {
        // Rollback balance
        const updatedAccounts = accounts.map(acc => {
            if (acc.id === tx.accountId) {
                const rollback = tx.type === TransactionType.INCOME ? -tx.amount : tx.amount;
                return { ...acc, balance: acc.balance + rollback };
            }
            return acc;
        });
        
        onUpdate(transactions.filter(t => t.id !== id), updatedAccounts);
    }
  };

  const getCategoryColor = (catName: string) => {
    const cat = DEFAULT_CATEGORIES.find(c => c.name === catName);
    return cat ? cat.color : 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">財務紀錄</h2>
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select 
                    className="pl-9 pr-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-full"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                >
                    <option value="ALL">全部類別</option>
                    <option value={TransactionType.INCOME}>收入</option>
                    <option value={TransactionType.EXPENSE}>支出</option>
                </select>
            </div>
            <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
            <Plus size={18} /> 新增
            </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">日期</th>
                <th className="px-6 py-4 font-semibold">類別</th>
                <th className="px-6 py-4 font-semibold">備註</th>
                <th className="px-6 py-4 font-semibold">帳戶</th>
                <th className="px-6 py-4 font-semibold text-right">金額</th>
                <th className="px-6 py-4 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.map(t => {
                const accountName = accounts.find(a => a.id === t.accountId)?.name || '未知帳戶';
                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {format(new Date(t.date), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(t.category)}`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{t.note || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{accountName}</td>
                    <td className={`px-6 py-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'} {t.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        暫無資料
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4">新增紀錄</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">收支類型</label>
                        <select 
                            className="w-full px-4 py-2 border rounded-lg"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value as TransactionType, category: DEFAULT_CATEGORIES.find(c => c.type === e.target.value)?.name || ''})}
                        >
                            <option value={TransactionType.EXPENSE}>支出</option>
                            <option value={TransactionType.INCOME}>收入</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                        <input 
                            type="datetime-local" 
                            className="w-full px-4 py-2 border rounded-lg"
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                    <input 
                        type="number" 
                        required
                        min="0"
                        placeholder="0"
                        className="w-full px-4 py-2 border rounded-lg text-lg font-bold"
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                        <select 
                            className="w-full px-4 py-2 border rounded-lg"
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                        >
                            {DEFAULT_CATEGORIES
                                .filter(c => c.type === formData.type)
                                .map(c => (
                                    <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                                ))
                            }
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">帳戶</label>
                        <select 
                            className="w-full px-4 py-2 border rounded-lg"
                            value={formData.accountId}
                            onChange={e => setFormData({...formData, accountId: e.target.value})}
                        >
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="例如：午餐、薪水..."
                        value={formData.note}
                        onChange={e => setFormData({...formData, note: e.target.value})}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                    取消
                    </button>
                    <button 
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                    儲存
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;