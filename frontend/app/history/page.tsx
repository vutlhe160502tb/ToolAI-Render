'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Wallet, Coins, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Loader2, Search, Filter, DollarSign } from 'lucide-react';

interface Payment {
  id: string;
  transaction_id: string;
  amount: number;
  coins: number;
  status: string;
  payment_method: string | null;
  created_at: string | null;
  completed_at: string | null;
}

interface CreditTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  created_at: string | null;
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'payments' | 'transactions'>('transactions');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'deposit' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPayments = async () => {
    if (!session) return;
    
    const user_id = (session.user as any)?.id;
    if (!user_id) return;

    try {
      const response = await axios.get('/api/payments/history', {
        params: { user_id, limit: 100, offset: 0 }
      });
      if (response.data) {
        setPayments(response.data.payments || []);
        setPaymentsTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!session) return;
    
    const user_id = (session.user as any)?.id;
    if (!user_id) return;

    try {
      const response = await axios.get('/api/users/transactions', {
        params: { user_id, limit: 100, offset: 0 }
      });
      if (response.data) {
        setTransactions(response.data.transactions || []);
        setTransactionsTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  useEffect(() => {
    if (session) {
      setLoading(true);
      Promise.all([fetchPayments(), fetchTransactions()]).finally(() => {
        setLoading(false);
      });
    }
  }, [session]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return { time: 'N/A', date: 'N/A' };
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const dateStr = date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return { time, date: dateStr };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'paid') {
      return (
        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Thành công
        </span>
      );
    } else if (statusLower === 'pending') {
      return (
        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Đang chờ
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Thất bại
        </span>
      );
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'PAYMENT': 'Nạp tiền',
      'DEDUCTION': 'Sử dụng',
      'RELEASE': 'Hoàn trả',
      'REFUND': 'Hoàn tiền'
    };
    return typeMap[type] || type;
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === 'PAYMENT' || amount > 0) {
      return <ArrowUpRight className="w-5 h-5 text-green-400" strokeWidth={2.5} />;
    } else {
      return <ArrowDownLeft className="w-5 h-5 text-red-400" strokeWidth={2.5} />;
    }
  };

  // Filter và search transactions
  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by type
    if (filter === 'deposit' && transaction.amount <= 0) return false;
    if (filter === 'expense' && transaction.amount > 0) return false;
    
    // Search
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const description = (transaction.description || '').toLowerCase();
      return description.includes(searchLower);
    }
    
    return true;
  });

  // Calculate totals
  const totalExpense = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const totalDeposit = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#0f1115]">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-2">
                <div className="w-8 h-8 bg-[#D344FF] rounded-lg flex items-center justify-center text-white shadow-lg shadow-[#D344FF]/20">
                  <Wallet size={18} />
                </div>
                Lịch sử giao dịch
              </h1>
              <p className="text-gray-400 text-sm">Quản lý biến động số dư coin của bạn</p>
            </div>
            
            {/* Tabs */}
            <div className="flex items-center gap-2 bg-[#1a1d24] p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'payments'
                    ? 'bg-[#D344FF] text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Thanh toán ({paymentsTotal})
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'transactions'
                    ? 'bg-[#D344FF] text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Coin ({transactionsTotal})
              </button>
            </div>
          </div>

          {/* Search Bar - Only show for transactions tab */}
          {activeTab === 'transactions' && (
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-500" />
              </div>
              <input 
                type="text" 
                placeholder="Tìm kiếm giao dịch..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161920] border border-white/5 text-gray-300 text-sm rounded-xl focus:ring-2 focus:ring-[#D344FF]/50 focus:border-[#D344FF] block w-full pl-10 p-3 placeholder-gray-600 transition-all outline-none"
              />
            </div>
          )}

          {/* Filter Buttons - Only show for transactions tab */}
          {activeTab === 'transactions' && (
            <div className="flex items-center gap-2 mb-6 bg-[#1a1d24] p-1 rounded-lg border border-white/5">
              <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  filter === 'all' 
                    ? 'bg-[#D344FF] text-white shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Tất cả
              </button>
              <button 
                onClick={() => setFilter('deposit')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  filter === 'deposit' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Nạp tiền
              </button>
              <button 
                onClick={() => setFilter('expense')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  filter === 'expense' 
                    ? 'bg-rose-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Sử dụng
              </button>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#D344FF] animate-spin" />
            </div>
          ) : (
            <>
              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div className="bg-[#161920] rounded-2xl border border-white/5 shadow-xl overflow-hidden relative">
                  {/* Background Glow Effect */}
                  <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-[#D344FF]/5 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  {/* List Header */}
                  <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex justify-between items-center relative z-10">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Danh sách gần đây</span>
                  </div>
                  
                  {payments.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 relative z-10">
                      <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Chưa có lịch sử thanh toán</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5 relative z-10">
                      {payments.map((payment) => {
                        const createdDate = formatDate(payment.created_at);
                        const completedDate = formatDate(payment.completed_at);
                        const statusLower = payment.status.toLowerCase();
                        const isCompleted = statusLower === 'completed' || statusLower === 'paid';
                        const isPending = statusLower === 'pending';
                        
                        return (
                          <div
                            key={payment.id}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 hover:bg-white/5 border-b border-white/5 transition-all duration-200 last:border-0 cursor-default"
                          >
                            {/* Left Side: Icon & Info */}
                            <div className="flex items-start gap-4 mb-3 sm:mb-0">
                              {/* Icon Circle */}
                              <div className={`
                                flex items-center justify-center w-12 h-12 rounded-full shrink-0 shadow-lg
                                ${isCompleted
                                  ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500/20' 
                                  : isPending
                                  ? 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20 group-hover:bg-yellow-500/20'
                                  : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 group-hover:bg-rose-500/20'}
                                transition-colors duration-300
                              `}>
                                {isCompleted ? (
                                  <DollarSign className="w-5 h-5" strokeWidth={2.5} />
                                ) : isPending ? (
                                  <Clock className="w-5 h-5" strokeWidth={2.5} />
                                ) : (
                                  <XCircle className="w-5 h-5" strokeWidth={2.5} />
                                )}
                              </div>
                              {/* Text Content */}
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-gray-100 font-semibold text-base">Nạp tiền</h4>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400 opacity-70">
                                    IN
                                  </span>
                                </div>
                                <p className="text-gray-400 text-sm font-medium line-clamp-1 max-w-[280px] lg:max-w-md">
                                  {payment.transaction_id}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                  <span>{createdDate.time}</span>
                                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                  <span>{createdDate.date}</span>
                                </div>
                              </div>
                            </div>
                            {/* Right Side: Amount & Status */}
                            <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end gap-1 sm:gap-0 pl-16 sm:pl-0">
                              <div className="flex flex-col items-end sm:items-end gap-2">
                                <div className="text-lg font-bold tracking-tight text-emerald-400">
                                  +{payment.coins.toLocaleString('vi-VN')} coin
                                </div>
                                <div className="text-sm text-gray-400">
                                  {formatCurrency(payment.amount)}
                                </div>
                                <div className="mt-1">
                                  {getStatusBadge(payment.status)}
                                </div>
                                {completedDate.time !== 'N/A' && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Hoàn thành: {completedDate.time} {completedDate.date}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="bg-[#161920] rounded-2xl border border-white/5 shadow-xl overflow-hidden relative">
                  {/* Background Glow Effect */}
                  <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-[#D344FF]/5 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  {/* List Header */}
                  <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex justify-between items-center relative z-10">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Danh sách gần đây</span>
                  </div>
                  
                  {filteredTransactions.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 relative z-10">
                      <Coins className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Chưa có lịch sử giao dịch coin</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5 relative z-10">
                      {filteredTransactions.map((transaction) => {
                        const isDeposit = transaction.amount > 0;
                        const dateInfo = formatDate(transaction.created_at);
                        return (
                          <div
                            key={transaction.id}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 hover:bg-white/5 border-b border-white/5 transition-all duration-200 last:border-0 cursor-default"
                          >
                            {/* Left Side: Icon & Info */}
                            <div className="flex items-start gap-4 mb-3 sm:mb-0">
                              {/* Icon Circle */}
                              <div className={`
                                flex items-center justify-center w-12 h-12 rounded-full shrink-0 shadow-lg
                                ${isDeposit 
                                  ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 group-hover:bg-rose-500/20'}
                                transition-colors duration-300
                              `}>
                                {getTransactionIcon(transaction.transaction_type, transaction.amount)}
                              </div>
                              {/* Text Content */}
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-gray-100 font-semibold text-base">{getTransactionTypeLabel(transaction.transaction_type)}</h4>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${isDeposit ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'} opacity-70`}>
                                    {isDeposit ? 'IN' : 'OUT'}
                                  </span>
                                </div>
                                <p className="text-gray-400 text-sm font-medium line-clamp-1 max-w-[280px] lg:max-w-md">
                                  {transaction.description || 'Không có mô tả'}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                  <span>{dateInfo.time}</span>
                                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                  <span>{dateInfo.date}</span>
                                </div>
                              </div>
                            </div>
                            {/* Right Side: Amount & Balance */}
                            <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end gap-1 sm:gap-0 pl-16 sm:pl-0">
                              <div className={`text-lg font-bold tracking-tight ${isDeposit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isDeposit ? '+' : ''}{transaction.amount.toLocaleString('vi-VN')} coin
                              </div>
                              <div className="text-xs font-medium text-gray-500 bg-gray-800/50 px-2 py-1 rounded-md mt-1">
                                Số dư: <span className="text-gray-300">{transaction.balance_after.toLocaleString('vi-VN')} coin</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Summary Cards */}
                  {activeTab === 'transactions' && filteredTransactions.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 p-5 border-t border-white/5 bg-white/[0.02] relative z-10">
                      <div className="bg-[#1a1d24] p-4 rounded-xl border border-white/5 flex flex-col justify-between h-24 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <ArrowDownLeft size={48} />
                        </div>
                        <span className="text-gray-500 text-xs font-medium">Tổng chi tiêu</span>
                        <span className="text-2xl font-bold text-white">-{totalExpense.toLocaleString('vi-VN')} <span className="text-sm font-normal text-gray-500">coin</span></span>
                      </div>
                      <div className="bg-[#1a1d24] p-4 rounded-xl border border-white/5 flex flex-col justify-between h-24 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <ArrowUpRight size={48} />
                        </div>
                        <span className="text-gray-500 text-xs font-medium">Tổng nạp</span>
                        <span className="text-2xl font-bold text-white">+{totalDeposit.toLocaleString('vi-VN')} <span className="text-sm font-normal text-gray-500">coin</span></span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

