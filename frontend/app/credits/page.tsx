'use client';

import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { QRPaymentModal } from '@/components/QRPaymentModal';

type Package = { coins: number; amountVnd: number };

const PACKAGES: Package[] = [
  { coins: 20, amountVnd: 52000 },
  { coins: 60, amountVnd: 130000 },
  { coins: 130, amountVnd: 260000 },
  { coins: 270, amountVnd: 520000 },
  { coins: 700, amountVnd: 1300000 },
  { coins: 1500, amountVnd: 2600000 },
];

function formatVnd(v: number) {
  try {
    return new Intl.NumberFormat('vi-VN').format(v) + ' VNĐ';
  } catch {
    return `${v} VNĐ`;
  }
}

export default function CreditsPage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const userId = user?.id as string | undefined;
  const credits = user?.credits as number | undefined;

  const [selected, setSelected] = useState<Package | null>(null);

  const subtitle = useMemo(() => {
    if (status === 'loading') return 'Đang tải...';
    if (status !== 'authenticated') return 'Bạn cần đăng nhập để nạp credits.';
    return `Credits hiện tại: ${typeof credits === 'number' ? credits : 0}`;
  }, [status, credits]);

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', background: '#0a0a0a', color: 'white', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ margin: 0, marginBottom: 8 }}>Nạp Credits</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>{subtitle}</p>

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {PACKAGES.map((p) => (
            <div
              key={`${p.coins}-${p.amountVnd}`}
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 16,
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18 }}>{p.coins} coins</div>
              <div style={{ opacity: 0.8, marginTop: 2 }}>{formatVnd(p.amountVnd)}</div>

              <button
                type="button"
                disabled={status !== 'authenticated'}
                onClick={() => setSelected(p)}
                style={{
                  width: '100%',
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: status === 'authenticated' ? 'transparent' : 'rgba(255,255,255,0.08)',
                  color: 'white',
                  cursor: status === 'authenticated' ? 'pointer' : 'not-allowed',
                }}
              >
                Chuyển khoản (QR)
              </button>
            </div>
          ))}
        </div>
      </div>

      <QRPaymentModal
        open={!!selected}
        onClose={() => setSelected(null)}
        userId={userId ?? null}
        coins={selected?.coins ?? 0}
        amountVnd={selected?.amountVnd ?? 0}
      />
    </main>
  );
}

