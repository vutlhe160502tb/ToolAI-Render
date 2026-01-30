'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { ShootingStars } from '@/components/ui/shooting-stars';
import { StarsBackground } from '@/components/ui/stars-background';

export default function LoginPage() {
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
    <div className="min-h-screen bg-neutral-900 overflow-hidden relative text-white flex flex-col">
      <Header />

      <div className="relative flex-1 flex items-center justify-center">
        <StarsBackground />
        <ShootingStars />

        {/* Main Container */}
        <main className="relative z-10 w-full flex items-center justify-center">
          <div className="w-full max-w-md px-6">
            {/* Login Card */}
            <div className="rounded-3xl p-8 sm:p-10 transition-all duration-500 ease-out transform hover:-translate-y-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.25)] hover:border-white/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            {/* Header Section */}
            <div className="text-center mb-10">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>

              <h1 className="text-3xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-purple-200">
                Đăng nhập
              </h1>
              <p className="text-gray-400 text-sm font-light">
                Truy cập để trải nghiệm các tính năng AI thế hệ mới
              </p>
            </div>

            {/* Login Options */}
            <div className="space-y-4">
              {/* Google Button */}
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
            </div>

            {/* Footer Links */}
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

          {/* Footer Text Outside */}
          <p className="text-center text-gray-600 text-xs mt-6">
            © 2026 AI Platform. Secured by Google Cloud.
          </p>
        </div>
        </main>
      </div>

      {/* Notification Toast */}
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
    </div>
  );
}

