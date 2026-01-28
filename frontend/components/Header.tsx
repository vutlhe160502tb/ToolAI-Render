'use client';

import Link from 'next/link';
import { Folder, Image, Video, Sparkles, Coins, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export default function Header() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCredits = useCallback(async () => {
    if (!session) return;
    
    // Lấy user_id từ session (đã được lưu từ backend auth)
    let user_id = (session.user as any)?.id;
    
    // Fallback: Nếu không có user_id, thử lấy từ email (query backend)
    if (!user_id && session.user?.email) {
      try {
        // Fetch user_id từ backend dựa trên email
        const response = await axios.get(`/api/users/by-email/${encodeURIComponent(session.user.email)}`);
        if (response.data?.user_id) {
          user_id = response.data.user_id;
        }
      } catch (error) {
        console.error('Error fetching user_id from email:', error);
      }
    }
    
    if (!user_id) {
      console.warn('User ID not found in session, user may need to re-login');
      setCredits(0);
      return;
    }
    
    try {
      const response = await axios.get(`/api/users/credits?user_id=${user_id}`);
      if (response.data && response.data.credits !== undefined) {
        setCredits(response.data.credits);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
      setCredits(0);
    }
  }, [session]);

  useEffect(() => {
    // Chỉ fetch credits khi đã authenticated (không phải loading)
    if (session && session.user) {
      fetchCredits();
    }
  }, [session, fetchCredits]);

  // Listen for credits update event
  useEffect(() => {
    const handleCreditsUpdate = (event: any) => {
      // Optimistic update: trừ credits ngay lập tức nếu có thông tin
      if (event.detail && event.detail.amount && credits !== null) {
        const newCredits = Math.max(0, credits - event.detail.amount);
        setCredits(newCredits);
      }
      // Sau đó fetch từ server để sync chính xác
      fetchCredits();
    };
    
    window.addEventListener('credits-updated', handleCreditsUpdate as EventListener);
    return () => {
      window.removeEventListener('credits-updated', handleCreditsUpdate as EventListener);
    };
  }, [fetchCredits, credits]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
    localStorage.removeItem('jwt_token');
  };

  return (
    <header className="w-full bg-[#101010]">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side: Logo + Navigation */}
          <div className="flex items-center gap-6">
            {/* Logo Icon - Purple rounded square */}
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 bg-[#D344FF] rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </Link>

            {/* Navigation Labels */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Khám Phá
              </Link>
              <Link
                href="/images"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
              >
                <Image className="w-4 h-4" />
                Ảnh
              </Link>
              <Link
                href="/videos"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
              >
                <Video className="w-4 h-4" />
                Video
              </Link>
              <Link
                href="/dance-image-bg"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Tạo Chuyển Động
              </Link>
            </nav>
          </div>

          {/* Right side: Credits, Library, Profile */}
          <div className="flex items-center gap-3">
            {/* Credits Button */}
            {session && (
              <Link
                href="/credits"
                className="px-4 py-2 bg-[#2E3031] text-gray-300 rounded-[12px] hover:bg-[#333] transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <span>{credits?.toLocaleString('vi-VN') || '0'}</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </Link>
            )}

            {/* Library Button */}
            {session && (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-[#2E3031] text-gray-300 rounded-[12px] hover:bg-[#333] transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Folder className="w-4 h-4" />
                Thư Viện
              </Link>
            )}

            {/* Profile Picture / Login */}
            {session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden hover:ring-2 ring-[#D344FF] transition-all"
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user?.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-800 text-xs font-semibold">
                      {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-black rounded-lg shadow-xl border border-[#D344FF]/40 overflow-hidden z-50">
                    <Link
                      href="/credits"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-center text-white hover:bg-[#333] transition-colors text-sm font-medium"
                    >
                      <Coins className="w-4 h-4" />
                      Nạp coin
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-center text-white hover:bg-[#333] transition-colors text-sm font-medium border-t border-[#D344FF]/10"
                    >
                      <Folder className="w-4 h-4" />
                      Thư viện
                    </Link>
                    <Link
                      href="/history"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-center text-white hover:bg-[#333] transition-colors text-sm font-medium border-t border-[#D344FF]/10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-history">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                        <path d="M21 3v5h-5"></path>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                        <path d="M3 21v-5h5"></path>
                      </svg>
                      Lịch sử
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-center text-red-300 hover:bg-red-900/20 transition-colors text-sm font-medium border-t border-[#D344FF]/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center"
              >
                <span className="text-gray-800 text-xs font-semibold">?</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

