/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus, 
  LayoutDashboard, 
  PieChart as PieChartIcon, 
  Trash2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  X
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility for Tailwind Class Merging ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
}

const CATEGORIES = {
  expense: [
    { label: 'Ăn uống', icon: '🍕', color: '#F87171' },
    { label: 'Di chuyển', icon: '🚗', color: '#60A5FA' },
    { label: 'Mua sắm', icon: '🛍️', color: '#F472B6' },
    { label: 'Giải trí', icon: '🎬', color: '#A78BFA' },
    { label: 'Sức khỏe', icon: '🏥', color: '#34D399' },
    { label: 'Khác', icon: '✨', color: '#94A3B8' },
  ],
  income: [
    { label: 'Lương', icon: '💰', color: '#10B981' },
    { label: 'Thưởng', icon: '🧧', color: '#FBBF24' },
    { label: 'Đầu tư', icon: '📈', color: '#3B82F6' },
    { label: 'Khác', icon: '💵', color: '#6366F1' },
  ]
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function App() {
  // --- State ---
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('money_tracker_data');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'insights'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  // Modal Form State
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: 'expense',
    category: CATEGORIES.expense[0].label,
    date: new Date().toISOString().split('T')[0]
  });

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('money_tracker_data', JSON.stringify(transactions));
  }, [transactions]);

  // --- Calculations ---
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => filterType === 'all' || t.type === filterType)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType]);

  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return {
      balance: totalIncome - totalExpense,
      income: totalIncome,
      expense: totalExpense
    };
  }, [transactions]);

  const insightsData = useMemo(() => {
    const expenseOnly = transactions.filter(t => t.type === 'expense');
    const grouped = expenseOnly.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => {
      const categoryInfo = CATEGORIES.expense.find(c => c.label === name);
      return {
        name,
        value,
        color: categoryInfo?.color || '#94A3B8'
      };
    }).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // --- Handlers ---
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.title || !newTx.amount) return;

    const tx: Transaction = {
      id: crypto.randomUUID(),
      title: newTx.title as string,
      amount: Number(newTx.amount),
      type: newTx.type as TransactionType,
      category: newTx.category as string,
      date: newTx.date as string,
    };

    setTransactions([tx, ...transactions]);
    setIsModalOpen(false);
    setNewTx({
      type: 'expense',
      category: CATEGORIES.expense[0].label,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-slate-50 overflow-hidden relative border-x border-slate-200">
      
      {/* Header Section */}
      <header className="px-6 pt-8 pb-32 bg-indigo-600 text-white relative">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold opacity-90">Xin chào!</h1>
            <p className="text-sm opacity-70">Chào mừng trở lại.</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Wallet size={20} />
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest opacity-60 font-medium">Tổng số dư</p>
          <h2 className="text-4xl font-bold tracking-tight">
            {formatCurrency(stats.balance)}
          </h2>
        </div>
      </header>

      {/* Floating Balance Cards */}
      <div className="px-6 -mt-24 relative z-10 grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-50 rounded-full">
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thu nhập</span>
          </div>
          <p className="text-lg font-bold text-emerald-600 truncate">{formatCurrency(stats.income)}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-rose-50 rounded-full">
              <TrendingDown size={16} className="text-rose-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chi tiêu</span>
          </div>
          <p className="text-lg font-bold text-rose-600 truncate">{formatCurrency(stats.expense)}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto mt-6 px-6 pb-32 scrollbar-hide">
        
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Giao dịch gần đây</h3>
                <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                  {(['all', 'income', 'expense'] as const).map(f => (
                    <button 
                      key={f}
                      onClick={() => setFilterType(f)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all",
                        filterType === f ? "bg-indigo-600 text-white" : "bg-white text-slate-400 border border-slate-100"
                      )}
                    >
                      {f === 'all' ? 'Tất cả' : f === 'income' ? 'Thu' : 'Chi'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t) => (
                    <motion.div 
                      layout
                      key={t.id}
                      className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 transition-all active:scale-98 group"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-xl",
                        t.type === 'income' ? "bg-emerald-50" : "bg-rose-50"
                      )}>
                        {CATEGORIES[t.type].find(c => c.label === t.category)?.icon || '💸'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 truncate">{t.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <span>{t.category}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span>{t.date}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-bold",
                          t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                        <button 
                          onClick={() => deleteTransaction(t.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-300 hover:text-rose-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-2 opacity-30">
                    <LayoutDashboard size={48} className="mx-auto mb-4" />
                    <p className="font-medium">Chưa có giao dịch nào.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="font-bold text-lg">Phân tích chi tiêu</h3>
              
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                {insightsData.length > 0 ? (
                  <>
                    <div className="h-64 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={insightsData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {insightsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng chi</span>
                        <span className="text-lg font-bold">{formatCurrency(stats.expense)}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-4 mt-6">
                      {insightsData.map(item => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">{item.name}</span>
                            <span className="text-[10px] text-slate-400">
                              {Math.round((item.value / stats.expense) * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-center text-slate-400 italic">
                    Cập nhật thêm chi tiêu để xem biểu đồ.
                  </div>
                )}
              </div>

              {/* Weekly Trend Placeholder */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100">
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-600" />
                  Xu hướng chi tiêu
                </h4>
                <div className="h-32 flex items-end justify-between gap-1">
                  {[40, 20, 60, 45, 90, 50, 70].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-slate-100 rounded-lg relative overflow-hidden group"
                        style={{ height: `${h}%` }}
                      >
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: '100%' }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-indigo-600/40 w-full absolute bottom-0 group-hover:bg-indigo-600 transition-colors"
                        />
                      </div>
                      <span className="text-[8px] font-bold text-slate-400">T{i+2}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white/80 backdrop-blur-xl border-t border-slate-100 px-10 pt-4 pb-10 flex justify-between items-center z-40">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'dashboard' ? "text-indigo-600 scale-110" : "text-slate-400 hover:text-indigo-400"
          )}
        >
          <LayoutDashboard size={24} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Trang chủ</span>
        </button>
        
        {/* Floating Add Button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-300 ring-4 ring-slate-50 transition-transform active:scale-90"
        >
          <Plus size={28} />
        </button>

        <button 
          onClick={() => setActiveTab('insights')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'insights' ? "text-indigo-600 scale-110" : "text-slate-400 hover:text-indigo-400"
          )}
        >
          <PieChartIcon size={24} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Báo cáo</span>
        </button>
      </nav>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            {/* Sheet */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-[40px] p-8 shadow-2xl flex flex-col gap-6"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-2 mb-2" />
              
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Thêm giao dịch</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Type Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button 
                  onClick={() => setNewTx({ ...newTx, type: 'expense', category: CATEGORIES.expense[0].label })}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold text-xs transition-all",
                    newTx.type === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-slate-400"
                  )}
                >
                  CHI TIÊU
                </button>
                <button 
                onClick={() => setNewTx({ ...newTx, type: 'income', category: CATEGORIES.income[0].label })}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold text-xs transition-all",
                    newTx.type === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"
                  )}
                >
                  THU NHẬP
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Số tiền (VND)</label>
                    <input 
                      required
                      type="number"
                      placeholder="0"
                      value={newTx.amount || ''}
                      onChange={(e) => setNewTx({ ...newTx, amount: Number(e.target.value) })}
                      className="w-full text-3xl font-bold bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Ghi chú</label>
                    <input 
                      required
                      type="text"
                      placeholder="Ví dụ: Ăn tối, Lương tháng 5..."
                      value={newTx.title || ''}
                      onChange={(e) => setNewTx({ ...newTx, title: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Ngày</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="date"
                        value={newTx.date}
                        onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-xs font-bold uppercase"
                      />
                    </div>
                  </div>

                  <div className="col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Hạng mục</label>
                    <div className="relative">
                      <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select 
                        value={newTx.category}
                        onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-xs font-bold uppercase appearance-none"
                      >
                        {CATEGORIES[newTx.type as TransactionType].map(c => (
                          <option key={c.label} value={c.label}>{c.icon} {c.label}</option>
                        ))}
                      </select>
                      <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none rotate-90" />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className={cn(
                    "w-full py-5 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95 mt-4",
                    newTx.type === 'expense' ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                  )}
                >
                  Xác nhận
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
