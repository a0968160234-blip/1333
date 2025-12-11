import React from 'react';
import { Transaction, TransactionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface ReportsProps {
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#64748b'];

const Reports: React.FC<ReportsProps> = ({ transactions }) => {
  // Process data for charts
  const expenseByCategory = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  // Process monthly trend
  const monthlyData = transactions.reduce((acc, t) => {
    const month = new Date(t.date).toLocaleDateString('zh-TW', { month: 'short' });
    if (!acc[month]) acc[month] = { name: month, Income: 0, Expense: 0 };
    if (t.type === TransactionType.INCOME) acc[month].Income += t.amount;
    if (t.type === TransactionType.EXPENSE) acc[month].Expense += t.amount;
    return acc;
  }, {} as Record<string, any>);

  const barData = Object.values(monthlyData);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">收支分析報表</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">支出類別分佈</h3>
          <div className="h-80">
            {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: number) => `NT$ ${value.toLocaleString()}`}
                    />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400">暫無支出資料</div>
            )}
          </div>
        </div>

        {/* Monthly Trend Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">每月收支趨勢</h3>
          <div className="h-80">
            {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`}/>
                    <Tooltip 
                        formatter={(value: number) => `NT$ ${value.toLocaleString()}`}
                        cursor={{fill: '#f1f5f9'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="Income" name="收入" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expense" name="支出" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400">暫無交易資料</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;