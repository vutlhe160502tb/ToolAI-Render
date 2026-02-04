'use client';

import { signIn, useSession } from 'next-auth/react';
import NextImage from 'next/image';

const REGISTER_API = '/api/auth/register';

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Header from '@/components/Header';
import { ShootingStars } from '@/components/ui/shooting-stars';
import { StarsBackground } from '@/components/ui/stars-background';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [toastOpen, setToastOpen] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [loading, setLoading] = useState(false);

  const rawCallbackUrl = searchParams?.get('callbackUrl') ?? '/';
  const callbackUrl =
    rawCallbackUrl.startsWith('/') && !rawCallbackUrl.startsWith('//')
      ? rawCallbackUrl
      : '/';

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace(callbackUrl);
    }
  }, [session, status, router, callbackUrl]);

  const showError = (msg: string) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 4000);
  };

  const handleGoogleLogin = async () => {
    try {
      setToastOpen(true);
      setTimeout(() => setToastOpen(false), 3000);
      await new Promise((r) => setTimeout(r, 100));
      await signIn('google', { callbackUrl });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password) {
      showError('Vui lòng nhập SĐT và mật khẩu.');
      return;
    }
    setLoading(true);
    setToastError(null);
    try {
      const res = await signIn('phone', {
        phone: phone.trim(),
        password,
        callbackUrl,
        redirect: false,
      });
      if (res?.error) {
        showError(res.error === 'CredentialsSignin' ? 'Số điện thoại hoặc mật khẩu không đúng.' : res.error);
        setLoading(false);
        return;
      }
      if (res?.ok) router.replace(callbackUrl);
    } catch {
      showError('Đăng nhập thất bại.');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password) {
      showError('Vui lòng nhập SĐT và mật khẩu.');
      return;
    }
    if (password.length < 6) {
      showError('Mật khẩu tối thiểu 6 ký tự.');
      return;
    }
    setLoading(true);
    setToastError(null);
    try {
      const res = await fetch(REGISTER_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password, name: registerName.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        showError(msg || 'Đăng ký thất bại.');
        setLoading(false);
        return;
      }
      const signRes = await signIn('phone', {
        phone: phone.trim(),
        password,
        callbackUrl,
        redirect: false,
      });
      if (signRes?.error) {
        showError('Đăng ký thành công. Vui lòng đăng nhập bằng SĐT.');
        setLoading(false);
        return;
      }
      if (signRes?.ok) router.replace(callbackUrl);
    } catch {
      showError('Đăng ký thất bại.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 overflow-hidden relative text-white flex flex-col">
      <Header />

      <div className="relative flex-1 flex items-center justify-center">
        <StarsBackground />
        <ShootingStars />

        <main className="relative z-10 w-full flex items-center justify-center">
          <div className="w-full max-w-md px-6">
            <div className="rounded-3xl p-8 sm:p-10 transition-all duration-500 ease-out transform hover:-translate-y-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.25)] hover:border-white/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              {!showPhoneForm ? (
                <>
                  <div className="text-center mb-10">
                    <div className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 overflow-hidden">
                      <NextImage
                        src="/AItool.jpg"
                        alt="Phù Thủy AI"
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover"
                      />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-purple-200">
                      Đăng nhập
                    </h1>
                    <p className="text-gray-400 text-sm font-light">
                      Truy cập để trải nghiệm các tính năng AI thế hệ mới
                    </p>
                  </div>
                  <div className="space-y-4">
                    <button
                      onClick={handleGoogleLogin}
                      type="button"
                      className="w-full flex items-center justify-center gap-3 bg-transparent border border-gray-600 text-gray-300 hover:text-white hover:border-purple-500 hover:bg-purple-500/10 font-medium py-3.5 px-4 rounded-xl transition-all duration-300 active:scale-95"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      <span>Đăng nhập với Google</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPhoneForm(true)}
                      className="w-full flex items-center justify-center gap-3 bg-transparent border border-gray-600 text-gray-300 hover:text-white hover:border-purple-500 hover:bg-purple-500/10 font-medium py-3.5 px-4 rounded-xl transition-all duration-300 active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>Đăng nhập bằng SĐT</span>
                    </button>
                  </div>
                </>
              ) : showRegister ? (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-purple-200">
                      Đăng ký
                    </h1>
                    <p className="text-gray-400 text-sm font-light">Tạo tài khoản bằng số điện thoại</p>
                  </div>
                  <form onSubmit={handleRegister} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Tên (tùy chọn)"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                    />
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="Số điện thoại"
                      value={phone}
                      onChange={(e) => setPhone(onlyDigits(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                    />
                    <input
                      type="password"
                      placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-200 hover:bg-purple-500/30 disabled:opacity-50"
                      >
                        {loading ? 'Đang xử lý...' : 'Đăng ký'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRegister(false)}
                        className="text-sm text-gray-400 hover:text-gray-300"
                      >
                        ← Quay lại đăng nhập
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setShowPhoneForm(false); setPhone(''); setPassword(''); }}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300 mb-6"
                  >
                    <span>←</span>
                    <span>Quay lại</span>
                  </button>
                  <div className="text-center mb-10">
                    <div className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 overflow-hidden">
                      <NextImage
                        src="/AItool.jpg"
                        alt="Phù Thủy AI"
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover"
                      />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-purple-200">
                      Đăng nhập
                    </h1>
                    <p className="text-gray-400 text-sm font-light">
                      Truy cập để trải nghiệm các tính năng AI thế hệ mới
                    </p>
                  </div>
                  <form onSubmit={handlePhoneLogin} className="space-y-3">
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="Số điện thoại"
                      value={phone}
                      onChange={(e) => setPhone(onlyDigits(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                    />
                    <input
                      type="password"
                      placeholder="Mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full max-w-[200px] py-2.5 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-200 hover:bg-purple-500/30 disabled:opacity-50"
                      >
                        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                      </button>
                      <p className="text-sm text-gray-400">
                        Bạn chưa có account?{' '}
                        <button
                          type="button"
                          onClick={() => setShowRegister(true)}
                          className="text-emerald-400 hover:text-emerald-300 font-medium underline"
                        >
                          Hãy đăng ký
                        </button>
                      </p>
                    </div>
                  </form>
                </>
              )}

              <div className="mt-8 text-center">
                <p className="text-xs text-gray-500">
                  Bằng việc tiếp tục, bạn đồng ý với{' '}
                  <a href="#" className="text-purple-400 hover:text-purple-300 underline transition-colors">
                    Điều khoản dịch vụ
                  </a>{' '}
                  và{' '}
                  <a href="#" className="text-purple-400 hover:text-purple-300 underline transition-colors">
                    Chính sách bảo mật
                  </a>
                </p>
              </div>
            </div>

            <p className="text-center text-gray-600 text-xs mt-6">
              © 2026 AI Platform. Secured by Google Cloud.
            </p>
          </div>
        </main>
      </div>

      <div
        className={`fixed top-5 right-5 transform ${toastOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-500 z-50`}
      >
        <div className="bg-white text-gray-800 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 border-l-4 border-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-bold text-sm">Đang kết nối...</h4>
            <p className="text-xs text-gray-500">Đang chuyển hướng đến trang xác thực Google.</p>
          </div>
        </div>
      </div>

      {toastError && (
        <div className="fixed top-5 right-5 z-50">
          <div className="bg-white text-gray-800 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 border-l-4 border-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{toastError}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-900" />}>
      <LoginPageInner />
    </Suspense>
  );
}
