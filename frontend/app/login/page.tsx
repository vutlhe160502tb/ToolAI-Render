'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [toastOpen, setToastOpen] = useState(false);

  const rawCallbackUrl = searchParams?.get('callbackUrl') ?? '/';
  const callbackUrl =
    rawCallbackUrl.startsWith('/') && !rawCallbackUrl.startsWith('//')
      ? rawCallbackUrl
      : '/';

  // Nếu đã login, quay lại trang trước đó
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace(callbackUrl);
    }
  }, [session, status, router, callbackUrl]);

  const handleGoogleLogin = async () => {
    try {
      // Hiển thị toast (để người dùng thấy phản hồi ngay)
      setToastOpen(true);
      setTimeout(() => setToastOpen(false), 3000);

      // Cho UI kịp render toast rồi mới gọi signIn
      await new Promise((r) => setTimeout(r, 100));
      await signIn('google', { callbackUrl });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 420, maxWidth: '92vw', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 24 }}>
        <h1 style={{ margin: 0, marginBottom: 12 }}>Đăng nhập</h1>
        <button
          onClick={handleGoogleLogin}
          type="button"
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: 'white', cursor: 'pointer' }}
        >
          Đăng nhập với Google
        </button>

        <div
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            transform: toastOpen ? 'translateX(0)' : 'translateX(120%)',
            transition: 'transform 300ms',
          }}
        >
          <div style={{ background: 'white', color: '#111', padding: '10px 12px', borderRadius: 10, borderLeft: '4px solid #22c55e' }}>
            <div style={{ fontWeight: 700, fontSize: 12 }}>Đang kết nối...</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Đang chuyển hướng đến trang xác thực Google.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a0a' }} />}>
      <LoginPageInner />
    </Suspense>
  );
}

