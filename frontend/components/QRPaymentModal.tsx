'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type CreateOrderResponse = {
  transaction_id: string;
  qr_code_url: string;
  qr_content?: string; // transfer content
  transfer_content?: string;
  bank_name?: string;
  account_number?: string;
  amount?: number;
  amount_vnd?: number;
  coins?: number;
  status?: string;
};

type PaymentStatusResponse = {
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed' | string;
  amount?: number;
  coins?: number;
  credits?: number;
};

export function QRPaymentModal(props: {
  open: boolean;
  onClose: () => void;
  userId?: string | null;
  coins: number;
  amountVnd: number;
}) {
  const { open, onClose, userId, coins, amountVnd } = props;

  const [creating, setCreating] = useState(false);
  const [order, setOrder] = useState<CreateOrderResponse | null>(null);
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);

  const transactionId = order?.transaction_id;
  const normalizedStatus = (status?.status || order?.status || 'pending').toLowerCase();

  const amountText = useMemo(() => {
    const a = order?.amount ?? order?.amount_vnd ?? amountVnd;
    try {
      return new Intl.NumberFormat('vi-VN').format(Number(a)) + ' VNĐ';
    } catch {
      return `${a} VNĐ`;
    }
  }, [order?.amount, order?.amount_vnd, amountVnd]);

  const clearPolling = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Create order on mount/open
  useEffect(() => {
    if (!open) return;

    setCreating(true);
    setOrder(null);
    setStatus(null);
    setMessage(null);

    (async () => {
      try {
        const res = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId || undefined,
            coins,
            amount_vnd: amountVnd,
          }),
        });

        const data = (await res.json()) as any;
        if (!res.ok) {
          throw new Error(data?.detail || data?.message || 'Create order failed');
        }

        setOrder(data as CreateOrderResponse);
      } catch (e: any) {
        setMessage(e?.message || 'Không tạo được đơn thanh toán.');
      } finally {
        setCreating(false);
      }
    })();

    return () => {
      clearPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Polling every 3s when we have a transaction id
  useEffect(() => {
    if (!open) return;
    if (!transactionId) return;

    const pollOnce = async () => {
      const res = await fetch(`/api/payments/${encodeURIComponent(transactionId)}/status`, {
        method: 'GET',
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data?.detail || data?.message || 'Status check failed');
      setStatus(data as PaymentStatusResponse);
      return data as PaymentStatusResponse;
    };

    let cancelled = false;

    const start = async () => {
      try {
        // First call immediately
        const first = await pollOnce();
        const st = (first.status || '').toLowerCase();
        if (st === 'completed' || st === 'failed') return;
      } catch {
        // ignore first error; will try again in interval
      }

      if (cancelled) return;
      clearPolling();
      intervalRef.current = window.setInterval(async () => {
        try {
          const s = await pollOnce();
          const st = (s.status || '').toLowerCase();
          if (st === 'completed') {
            clearPolling();
            setMessage('Thanh toán thành công! Đang cập nhật...');
            window.setTimeout(() => window.location.reload(), 2000);
          } else if (st === 'failed') {
            clearPolling();
            setMessage('Thanh toán thất bại. Vui lòng thử lại.');
          }
        } catch (e: any) {
          // network errors: keep polling but show a lightweight message
          setMessage(e?.message || 'Lỗi mạng khi kiểm tra trạng thái.');
        }
      }, 3000);
    };

    start();

    return () => {
      cancelled = true;
      clearPolling();
    };
  }, [open, transactionId]);

  if (!open) return null;

  const close = () => {
    clearPolling();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 100,
      }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: '96vw',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.12)',
          background: '#0a0a0a',
          color: 'white',
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800 }}>Chuyển khoản (QR)</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {coins} coins • {amountText}
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            style={{
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Đóng
          </button>
        </div>

        <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: 12 }}>
          {creating ? (
            <div style={{ opacity: 0.85 }}>Đang tạo đơn thanh toán...</div>
          ) : !order ? (
            <div style={{ color: '#fca5a5' }}>{message || 'Không có dữ liệu đơn thanh toán.'}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12, alignItems: 'start' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12, padding: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="VietQR"
                  src={order.qr_code_url}
                  style={{ width: '100%', borderRadius: 8, display: 'block' }}
                />
              </div>

              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                <div style={{ opacity: 0.9 }}>
                  <div>
                    <b>Ngân hàng:</b> {order.bank_name || 'VietinBank'}
                  </div>
                  <div>
                    <b>Số tài khoản:</b> {order.account_number || '113366668888'}
                  </div>
                  <div>
                    <b>Số tiền:</b> {amountText}
                  </div>
                  <div>
                    <b>Nội dung:</b> {order.qr_content || order.transfer_content}
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <div>
                    <b>Trạng thái:</b>{' '}
                    {normalizedStatus === 'completed'
                      ? 'Thành công'
                      : normalizedStatus === 'failed'
                        ? 'Thất bại'
                        : 'Đang chờ thanh toán...'}
                  </div>
                  {message ? <div style={{ marginTop: 6, opacity: 0.85 }}>{message}</div> : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

