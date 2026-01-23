'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Wallet, Coins, ArrowUp, ArrowDown, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'payments' | 'transactions'>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [transactionsTotal, setTransactionsTotal] = useState(0);

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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      return <ArrowUp className="w-4 h-4 text-green-400" />;
    } else {
      return <ArrowDown className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#101010]">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
            <Wallet className="w-10 h-10 text-[#D344FF]" />
            Lịch sử giao dịch
          </h1>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-[#D344FF]/20">
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'payments'
                  ? 'text-[#D344FF] border-b-2 border-[#D344FF]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Lịch sử thanh toán ({paymentsTotal})
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'text-[#D344FF] border-b-2 border-[#D344FF]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Lịch sử coin ({transactionsTotal})
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#D344FF] animate-spin" />
            </div>
          ) : (
            <>
              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div className="bg-[#2d1b4e] rounded-xl border border-[#8B2AB3]/30 overflow-hidden">
                  {payments.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                      <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Chưa có lịch sử thanh toán</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                         <thead className="bg-[#101010] border-b border-[#8B2AB3]/30">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Mã giao dịch</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Số tiền</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Coin</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Trạng thái</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Ngày tạo</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Ngày hoàn thành</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#8B2AB3]/10">
                          {payments.map((payment) => (
                             <tr key={payment.id} className="bg-[#2a2a2a]">
                              <td className="px-6 py-4 text-sm text-white font-mono">
                                {payment.transaction_id}
                              </td>
                              <td className="px-6 py-4 text-sm text-white">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td className="px-6 py-4 text-sm text-green-400 font-medium flex items-center gap-1">
                                <Coins className="w-4 h-4" />
                                {payment.coins.toLocaleString('vi-VN')}
                              </td>
                              <td className="px-6 py-4">
                                {getStatusBadge(payment.status)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-400">
                                {formatDate(payment.created_at)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-400">
                                {formatDate(payment.completed_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="bg-[#2d1b4e] rounded-xl border border-[#8B2AB3]/30 overflow-hidden">
                  {transactions.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                      <Coins className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Chưa có lịch sử giao dịch coin</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#8B2AB3]/10">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="p-6 hover:bg-[#1a0a2e]/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                transaction.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                              }`}>
                                {getTransactionIcon(transaction.transaction_type, transaction.amount)}
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  {getTransactionTypeLabel(transaction.transaction_type)}
                                </p>
                                <p className="text-gray-400 text-sm mt-1">
                                  {transaction.description || 'Không có mô tả'}
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                  {formatDate(transaction.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${
                                transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {transaction.amount > 0 ? '+' : ''}
                                {transaction.amount.toLocaleString('vi-VN')} coin
                              </p>
                              <p className="text-gray-400 text-sm mt-1">
                                Số dư: {transaction.balance_after.toLocaleString('vi-VN')} coin
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
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

