'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useToast } from '@/contexts/ToastContext';

interface QRPaymentModalProps {
  package: {
    id: number;
    coins: number;
    price: number;
  };
  onClose: () => void;
}

export default function QRPaymentModal({ package: pkg, onClose }: QRPaymentModalProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentCode, setPaymentCode] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | 'expired' | 'cancelled' | 'loading'>('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const orderCreatedRef = useRef<boolean>(false); // Prevent creating multiple orders
  const hasCheckedExistingPaymentRef = useRef<boolean>(false); // Track if we've checked for existing payment
  
  // Lấy user_id từ session (đã được lưu từ backend auth)
  const session_user_id = (session?.user as any)?.id;
  const user_email = session?.user?.email;
  
  // Fetch user_id by email if not in session (fallback)
  useEffect(() => {
    const fetchUserId = async () => {
      // If already have user_id from session, use it
      if (session_user_id) {
        console.log('Using user_id from session:', session_user_id);
        setUserId(session_user_id);
        return;
      }
      
      // Otherwise, try to fetch by email
      if (user_email) {
        console.log('Fetching user_id by email:', user_email);
        try {
          const response = await axios.get(`/api/users/by-email/${encodeURIComponent(user_email)}`);
          if (response.data?.user_id) {
            console.log('Fetched user_id from email:', response.data.user_id);
            setUserId(response.data.user_id);
          } else {
            console.error('No user_id in response:', response.data);
          }
        } catch (error) {
          console.error('Error fetching user_id by email:', error);
        }
      } else {
        console.error('No email in session');
      }
    };
    
    if (session) {
      fetchUserId();
    }
  }, [session, session_user_id, user_email]);
  
  // Nếu không có user_id sau khi đã fetch, hiển thị lỗi
  useEffect(() => {
    // Only show error if we have session but no userId after a delay
    if (session && !userId && !user_email) {
      const timer = setTimeout(() => {
        console.error('No user_id or email available after fetch attempt');
        alert('Vui lòng đăng nhập để nạp coin');
        onClose();
      }, 2000); // Wait 2 seconds for fetch to complete
      
      return () => clearTimeout(timer);
    }
  }, [session, userId, user_email, onClose]);

  const startPolling = useCallback((identifier: string) => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await axios.get(`/api/payments/${identifier}/status`);
        const { status } = response.data;

        // Map backend status to frontend status
        const mappedStatus = status === 'completed' ? 'completed' : 
                            status === 'failed' ? 'failed' :
                            status === 'expired' ? 'expired' :
                            status === 'cancelled' ? 'cancelled' : 'pending';
        
        setPaymentStatus(mappedStatus);

        if (mappedStatus === 'completed') {
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          // Trigger credits update event for real-time update
          window.dispatchEvent(new CustomEvent('credits-updated'));

          // Show success toast notification
          showToast('Thanh toán thành công! Coin đã được cập nhật.', 'success');

          // Show success and close after 2 seconds
          setTimeout(() => {
            onClose();
          }, 2000);
        } else if (mappedStatus === 'failed' || mappedStatus === 'expired' || mappedStatus === 'cancelled') {
          // Stop polling for failed/expired/cancelled
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Continue polling even on error (network issues)
      }
    }, 3000); // Poll every 3 seconds
  }, [onClose, showToast]);

  // Check for existing pending/completed payment before creating new one
  const checkExistingPayment = useCallback(async (user_id: string) => {
    try {
      const response = await axios.get(`/api/payments/history`, {
        params: { user_id, limit: 10, offset: 0 }
      });
      const payments = response.data?.payments || [];
      
      // Check if there's a recent pending or completed payment for the same package
      const recentPayment = payments.find((payment: any) => {
        const isSamePackage = payment.coins === pkg.coins && payment.amount === pkg.price;
        const isRecent = new Date(payment.created_at) > new Date(Date.now() - 30 * 60 * 1000); // Within 30 minutes
        const isPendingOrCompleted = payment.status === 'pending' || payment.status === 'completed';
        return isSamePackage && isRecent && isPendingOrCompleted;
      });

      if (recentPayment) {
        console.log('Found existing payment:', recentPayment);
        // Use existing payment
        if (recentPayment.payment_code) {
          setPaymentCode(recentPayment.payment_code);
        }
        setTransactionId(recentPayment.transaction_id);
        if (recentPayment.qr_code_url) {
          setQrCodeUrl(recentPayment.qr_code_url);
        }
        
        if (recentPayment.status === 'completed') {
          setPaymentStatus('completed');
          showToast('Giao dịch này đã được thanh toán thành công!', 'success');
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setPaymentStatus('pending');
          // Start polling for existing payment
          const identifier = recentPayment.payment_code || recentPayment.transaction_id;
          if (identifier) {
            startPolling(identifier);
          }
        }
        orderCreatedRef.current = true; // Mark as handled to prevent creating new order
        return true; // Found existing payment
      }
      return false; // No existing payment found
    } catch (error) {
      console.error('Error checking existing payment:', error);
      return false;
    }
  }, [pkg, startPolling, onClose, showToast]);

  const createPaymentOrder = useCallback(async () => {
    // Prevent creating order if already created
    if (orderCreatedRef.current) {
      console.log('Order already created, skipping...');
      return;
    }

    // Validate user_id before making request
    if (!userId) {
      console.error('User ID is missing, userId:', userId);
      alert('Vui lòng đăng nhập để nạp coin');
      setPaymentStatus('failed');
      onClose();
      return;
    }

    // Validate package data
    if (!pkg || !pkg.id || !pkg.price || !pkg.coins) {
      console.error('Invalid package data:', pkg);
      alert('Dữ liệu gói thanh toán không hợp lệ');
      setPaymentStatus('failed');
      return;
    }

    console.log('Creating payment order with:', {
      package_id: pkg.id,
      amount: pkg.price,
      coins: pkg.coins,
      user_id: userId
    });

    try {
      setPaymentStatus('loading');
      const response = await axios.post('/api/payments/create-order', {
        package_id: pkg.id,
        amount: pkg.price,
        coins: pkg.coins,
        user_id: userId,
      });

      const { transaction_id, payment_code, qr_code_url, qrUrl } = response.data;
      
      // SePay returns payment_code and qrUrl (required)
      if (!payment_code || !qrUrl) {
        throw new Error('SePay API không trả về payment_code hoặc qrUrl');
      }
      
      // Store both payment_code (for SePay) and transaction_id (for compatibility)
      setPaymentCode(payment_code);
      setTransactionId(transaction_id || payment_code);
      
      // Use SePay qrUrl (required)
      setQrCodeUrl(qrUrl);
      setPaymentStatus('pending');
      
      // Mark order as created
      orderCreatedRef.current = true;
      
      // Start polling for payment status using payment_code
      startPolling(payment_code);
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message;
      alert('Lỗi tạo đơn thanh toán: ' + errorMessage);
      setPaymentStatus('failed');
      // Reset orderCreatedRef on error so user can retry
      orderCreatedRef.current = false;
    }
  }, [pkg, startPolling, userId, onClose]);

  // Create payment order when modal opens AND userId is available
  useEffect(() => {
    // Only check/create order if we have both package and userId
    if (pkg && userId) {
      // First, check for existing payment
      if (!hasCheckedExistingPaymentRef.current) {
        hasCheckedExistingPaymentRef.current = true;
        checkExistingPayment(userId).then((hasExisting) => {
          // If no existing payment found, create new one
          if (!hasExisting && !orderCreatedRef.current) {
            console.log('No existing payment found, creating new order with userId:', userId);
            createPaymentOrder();
          }
        });
      }
    } else if (pkg && !userId) {
      // Still loading userId, keep loading state
      console.log('Waiting for userId...');
      setPaymentStatus('loading');
    }

    // Cleanup: stop polling when component unmounts
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      // Reset refs when modal closes
      orderCreatedRef.current = false;
      hasCheckedExistingPaymentRef.current = false;
    };
  }, [pkg, userId, createPaymentOrder, checkExistingPayment]);

  const handleClose = () => {
    // Stop polling before closing
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    // Reset refs when closing
    orderCreatedRef.current = false;
    hasCheckedExistingPaymentRef.current = false;
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Thanh toán</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={paymentStatus === 'loading'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Payment Info */}
          <div className="text-center">
            <div className="text-gray-700 mb-2">Số tiền: {pkg.price.toLocaleString('vi-VN')} VNĐ</div>
            <div className="text-[#D344FF] font-semibold">
              Nhận được: +{pkg.coins} coin
            </div>
          </div>

          {/* Loading State */}
          {paymentStatus === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#D344FF] mb-2" />
              <p className="text-gray-600 text-sm">
                {!userId ? 'Đang xác thực người dùng...' : 'Đang tạo đơn thanh toán...'}
              </p>
            </div>
          )}

          {/* Error State - No QR Code */}
          {paymentStatus === 'failed' && !qrCodeUrl && (
            <div className="flex flex-col items-center justify-center py-8">
              <XCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium mb-2">Không thể tạo đơn thanh toán</p>
              <p className="text-gray-600 text-sm text-center">
                Vui lòng thử lại sau hoặc liên hệ hỗ trợ
              </p>
            </div>
          )}

          {/* QR Code */}
          {paymentStatus !== 'loading' && qrCodeUrl && (
            <>
              <div className="flex justify-center bg-gray-100 p-4 rounded-lg">
                <Image
                  src={qrCodeUrl}
                  alt="QR Code"
                  width={250}
                  height={250}
                  className="bg-white p-2 rounded"
                />
              </div>

              {/* SePay Payment Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="text-gray-700">
                  <span className="font-semibold">Phương thức:</span> SePay QR Code
                </div>
                {paymentCode && (
                  <div className="text-gray-700">
                    <span className="font-semibold">Mã thanh toán:</span> {paymentCode}
                  </div>
                )}
                <div className="text-gray-500 text-xs mt-2">
                  Quét QR code bằng app ngân hàng để thanh toán. QR code sẽ hết hạn sau 30 phút.
                </div>
              </div>

              {/* Status Indicator */}
              {paymentStatus === 'pending' && (
                <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 rounded-lg p-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Đang chờ thanh toán...</span>
                </div>
              )}

              {paymentStatus === 'completed' && (
                <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Thanh toán thành công! Đang cập nhật...</span>
                </div>
              )}

              {paymentStatus === 'failed' && (
                <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Thanh toán thất bại</span>
                </div>
              )}

              {paymentStatus === 'expired' && (
                <div className="flex items-center justify-center gap-2 text-orange-600 bg-orange-50 rounded-lg p-3">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">QR code đã hết hạn (30 phút)</span>
                </div>
              )}

              {paymentStatus === 'cancelled' && (
                <div className="flex items-center justify-center gap-2 text-gray-600 bg-gray-50 rounded-lg p-3">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Thanh toán đã bị hủy</span>
                </div>
              )}

              {paymentStatus === 'pending' && (
                <div className="text-center text-sm text-gray-500">
                  Vui lòng quét QR code bằng app ngân hàng để thanh toán
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

