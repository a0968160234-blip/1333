import React from 'react';
import { Account, Transaction, StockHolding, TransactionType } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  accounts: Account[];
  transactions: Transaction[];
  stocks: StockHolding[];
}

const Dashboard: React.FC<DashboardProps> = ({ accounts, transactions, stocks }) => {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  const stockValue = stocks.reduce((sum, stock) => 
    sum + (stock.shares * (stock.currentPrice || stock.averageCost)), 0
  );

  const totalAssets = totalBalance + stockValue;

  const currentMonth = new Date().getMonth();
  const monthlyIncome = transactions
    .filter(t => t.type === TransactionType.INCOME && new Date(t.date).getMonth() === currentMonth)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === currentMonth)
    .reduce((sum, t) => sum + t.amount, 0);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign size={20} />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">總資產</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">NT$ {totalAssets.toLocaleString()}</h3>
          <p className="text-sm text-gray-500 mt-1">包含銀行與投資</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">本月收入</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">NT$ {monthlyIncome.toLocaleString()}</h3>
          <p className="text-sm text-emerald-600 mt-1 flex items-center">
             累積至今日
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown size={20} />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">本月支出</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">NT$ {monthlyExpense.toLocaleString()}</h3>
          <p className="text-sm text-rose-600 mt-1 flex items-center">
             注意開銷
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Wallet size={20} />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">銀行餘額</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">NT$ {totalBalance.toLocaleString()}</h3>
          <p className="text-sm text-gray-500 mt-1">{accounts.length} 個帳戶</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">近期交易</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTransactions.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                    ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {t.type === TransactionType.INCOME ? '+' : '-'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t.note || t.category}</p>
                    <p className="text-xs text-gray-500">{format(new Date(t.date), 'yyyy/MM/dd HH:mm')} • {t.category}</p>
                  </div>
                </div>
                <span className={`font-semibold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-gray-900'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'} NT$ {t.amount.toLocaleString()}
                </span>
              </div>
            ))}
            {recentTransactions.length === 0 && (
               <div className="p-8 text-center text-gray-500">尚無交易紀錄</div>
            )}
          </div>
        </div>

        {/* Quick Accounts View */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h3 className="text-lg font-bold text-gray-900">我的帳戶</h3>
          </div>
          <div className="p-4 space-y-3">
            {accounts.slice(0, 4).map(acc => (
              <div key={acc.id} className="p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{acc.name}</p>
                  <p className="text-xs text-gray-500">{acc.type}</p>
                </div>
                <p className="font-bold text-gray-900">NT$ {acc.balance.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;