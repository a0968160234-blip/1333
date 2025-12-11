import React, { useState } from 'react';
import { Account, AccountType, User } from '../types';
import { Plus, Trash2, Edit2, Wallet } from 'lucide-react';

interface AccountsProps {
  user: User;
  accounts: Account[];
  onUpdate: (accounts: Account[]) => void;
}

const Accounts: React.FC<AccountsProps> = ({ user, accounts, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: AccountType.BANK,
    balance: 0,
    currency: 'TWD'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedAccounts = [...accounts];

    if (editingId) {
      updatedAccounts = updatedAccounts.map(acc => 
        acc.id === editingId ? { ...acc, ...formData } : acc
      );
    } else {
      updatedAccounts.push({
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        ...formData
      });
    }

    onUpdate(updatedAccounts);
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除此帳戶嗎？所有相關交易紀錄將會保留，但帳戶連結將失效。')) {
      onUpdate(accounts.filter(a => a.id !== id));
    }
  };

  const handleEdit = (account: Account) => {
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency
    });
    setEditingId(account.id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', type: AccountType.BANK, balance: 0, currency: 'TWD' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">帳戶管理</h2>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} /> 新增帳戶
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(account)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(account.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Wallet size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{account.name}</h3>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">{account.type}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-gray-500">當前餘額</p>
              <p className="text-2xl font-bold text-gray-900">
                {account.currency} {account.balance.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{editingId ? '編輯帳戶' : '新增帳戶'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">帳戶名稱</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
                <select 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as AccountType})}
                >
                  {Object.values(AccountType).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">初始餘額</label>
                <input 
                  type="number" 
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.balance}
                  onChange={e => setFormData({...formData, balance: Number(e.target.value)})}
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
                  確認
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;