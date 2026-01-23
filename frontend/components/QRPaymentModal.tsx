'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import { useSession } from 'next-auth/react';

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
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | 'loading'>('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState('https://img.vietqr.io/image/vietinbank-113366668888-compact.jpg');
  const [qrContent, setQrContent] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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

  const startPolling = useCallback((txnId: string) => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await axios.get(`/api/payments/${txnId}/status`);
        const { status } = response.data;

        setPaymentStatus(status);

        if (status === 'completed') {
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          // Trigger credits update event for real-time update
          window.dispatchEvent(new CustomEvent('credits-updated'));

          // Show success and close after 2 seconds
          setTimeout(() => {
            onClose();
          }, 2000);
        } else if (status === 'failed') {
          // Stop polling
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
  }, [onClose]);

  const createPaymentOrder = useCallback(async () => {
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

      const { transaction_id, qr_code_url, qr_content } = response.data;
      
      setTransactionId(transaction_id);
      if (qr_code_url) {
        setQrCodeUrl(qr_code_url);
      }
      setQrContent(qr_content || `NAPCOIN${transaction_id}`);
      setPaymentStatus('pending');
      
      // Start polling for payment status
      startPolling(transaction_id);
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      alert('Lỗi tạo đơn thanh toán: ' + (error.response?.data?.message || error.message));
      setPaymentStatus('failed');
    }
  }, [pkg, startPolling, userId, onClose]);

  // Create payment order when modal opens AND userId is available
  useEffect(() => {
    // Only create order if we have both package and userId
    if (pkg && userId) {
      console.log('Creating payment order with userId:', userId);
      createPaymentOrder();
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
    };
  }, [pkg, userId, createPaymentOrder]);

  const handleClose = () => {
    // Stop polling before closing
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    onClose();
  };

  // Check if test webhook is enabled (development only)
  const isTestWebhookEnabled = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    process.env.NEXT_PUBLIC_ENABLE_TEST_WEBHOOK === 'true'
  );

  const handleTestWebhook = useCallback(async () => {
    if (!transactionId) {
      alert('Chưa có transaction ID');
      return;
    }

    if (!isTestWebhookEnabled) {
      alert('Tính năng test chỉ có trong môi trường development');
      return;
    }

    try {
      const response = await axios.post('/api/payments/test-webhook', {
        transaction_id: transactionId
      });

      if (response.data.status === 'completed' || response.data.status === 'already_completed') {
        // Trigger credits update event for real-time update
        window.dispatchEvent(new CustomEvent('credits-updated'));
        
        // Success - polling will detect the change automatically
        alert('✅ Test webhook thành công! Coin đã được cộng.');
      } else {
        alert('⚠️ Webhook được xử lý nhưng status: ' + response.data.status);
      }
    } catch (error: any) {
      console.error('Test webhook error:', error);
      alert('❌ Lỗi: ' + (error.response?.data?.detail || error.message));
    }
  }, [transactionId, isTestWebhookEnabled]);

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

          {/* QR Code */}
          {paymentStatus !== 'loading' && (
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

              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="text-gray-700">
                  <span className="font-semibold">Ngân hàng:</span> VietinBank
                </div>
                <div className="text-gray-700">
                  <span className="font-semibold">Số tài khoản:</span> 113366668888
                </div>
                <div className="text-gray-700">
                  <span className="font-semibold">Nội dung:</span> {qrContent || `NAPCOIN${pkg.id}`}
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

              <div className="text-center text-sm text-gray-500">
                Vui lòng quét QR code hoặc chuyển khoản theo thông tin trên
              </div>

              {/* Test Webhook Button - Development Only */}
              {isTestWebhookEnabled && paymentStatus === 'pending' && (
                <button
                  onClick={handleTestWebhook}
                  className="w-full mt-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  title="Test webhook - Development only"
                >
                  <span>🧪</span>
                  <span>Test Payment (Mock Webhook)</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

