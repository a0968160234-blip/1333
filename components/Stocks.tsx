import React, { useState } from 'react';
import { StockHolding, User } from '../types';
import { Plus, Trash2, RefreshCw, BrainCircuit, Loader2 } from 'lucide-react';
import { GeminiService } from '../services/gemini';

interface StocksProps {
  user: User;
  stocks: StockHolding[];
  onUpdate: (stocks: StockHolding[]) => void;
  totalAssets: number;
}

const Stocks: React.FC<StocksProps> = ({ user, stocks, onUpdate, totalAssets }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  
  // New Stock Form
  const [newStock, setNewStock] = useState({ symbol: '', name: '', shares: 0, averageCost: 0 });

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    const stock: StockHolding = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      ...newStock,
      currentPrice: newStock.averageCost // Init with cost
    };
    onUpdate([...stocks, stock]);
    setNewStock({ symbol: '', name: '', shares: 0, averageCost: 0 });
  };

  const handleRemove = (id: string) => {
    if (confirm('確定移除此持股？')) {
      onUpdate(stocks.filter(s => s.id !== id));
    }
  };

  const handleUpdatePrices = async () => {
    setIsUpdating(true);
    const updated = await GeminiService.updateStockPrices(stocks);
    onUpdate(updated);
    setIsUpdating(false);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    const result = await GeminiService.analyzePortfolio(stocks, totalAssets);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const totalMarketValue = stocks.reduce((sum, s) => sum + (s.shares * (s.currentPrice || s.averageCost)), 0);
  const totalCost = stocks.reduce((sum, s) => sum + (s.shares * s.averageCost), 0);
  const totalPL = totalMarketValue - totalCost;
  const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">股市投資組合</h2>
           <p className="text-sm text-gray-500">即時追蹤與 AI 建議</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
                {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
                AI 診斷
            </button>
            <button 
                onClick={handleUpdatePrices}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
                {isUpdating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                更新股價
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">證券總市值</p>
            <h3 className="text-2xl font-bold text-gray-900">NT$ {totalMarketValue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">總投入成本</p>
            <h3 className="text-2xl font-bold text-gray-900">NT$ {totalCost.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">未實現損益</p>
            <h3 className={`text-2xl font-bold ${totalPL >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {totalPL >= 0 ? '+' : ''}{totalPL.toLocaleString()} ({totalPLPercent.toFixed(2)}%)
            </h3>
            <p className="text-xs text-gray-400 mt-1">台股紅漲綠跌</p>
        </div>
      </div>

      {/* AI Analysis Result */}
      {analysisResult && (
        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
                <BrainCircuit className="text-purple-600" size={20} />
                <h3 className="font-bold text-purple-900">AI 投資顧問建議</h3>
            </div>
            <div className="prose prose-purple prose-sm max-w-none text-purple-800 whitespace-pre-wrap">
                {analysisResult}
            </div>
        </div>
      )}

      {/* Add Stock Form (Inline for simplicity) */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">新增持股</h3>
        <form onSubmit={handleAddStock} className="flex flex-col md:flex-row gap-3">
            <input 
                placeholder="代號 (如: 2330.TW)" 
                className="border rounded-lg px-3 py-2 flex-1 text-sm"
                value={newStock.symbol}
                onChange={e => setNewStock({...newStock, symbol: e.target.value.toUpperCase()})}
                required
            />
            <input 
                placeholder="股票名稱" 
                className="border rounded-lg px-3 py-2 flex-1 text-sm"
                value={newStock.name}
                onChange={e => setNewStock({...newStock, name: e.target.value})}
                required
            />
            <input 
                type="number" 
                placeholder="股數" 
                className="border rounded-lg px-3 py-2 w-full md:w-32 text-sm"
                value={newStock.shares || ''}
                onChange={e => setNewStock({...newStock, shares: Number(e.target.value)})}
                required
            />
            <input 
                type="number" 
                placeholder="平均成本" 
                className="border rounded-lg px-3 py-2 w-full md:w-32 text-sm"
                value={newStock.averageCost || ''}
                onChange={e => setNewStock({...newStock, averageCost: Number(e.target.value)})}
                required
            />
            <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 flex items-center justify-center">
                <Plus size={16} /> 新增
            </button>
        </form>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">標的</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">股數</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">均價</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">現價</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">損益</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {stocks.map(s => {
                        const marketVal = s.shares * (s.currentPrice || s.averageCost);
                        const costVal = s.shares * s.averageCost;
                        const pl = marketVal - costVal;
                        const plPercent = (pl / costVal) * 100;

                        return (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{s.symbol}</div>
                                    <div className="text-xs text-gray-500">{s.name}</div>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-700">{s.shares}</td>
                                <td className="px-6 py-4 text-right text-gray-700">{s.averageCost}</td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">
                                    {s.currentPrice || '-'}
                                    {s.lastUpdated && <div className="text-[10px] text-gray-400 font-normal">更新: {new Date(s.lastUpdated).toLocaleTimeString()}</div>}
                                </td>
                                <td className={`px-6 py-4 text-right font-bold ${pl >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {pl.toLocaleString()} <br/>
                                    <span className="text-xs font-normal">({plPercent.toFixed(2)}%)</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleRemove(s.id)} className="text-gray-300 hover:text-red-500 p-1">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {stocks.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-500">尚無持股資料</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Stocks;