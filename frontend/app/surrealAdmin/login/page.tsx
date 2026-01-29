'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SurrealAdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('surrealAdmin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/surrealAdmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Đăng nhập thất bại');
        return;
      }
      router.replace('/surrealAdmin');
    } catch {
      setError('Không thể kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101010] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-black border border-white/10 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Surreal Admin</h1>
        <p className="text-sm text-gray-400 mb-6">
          Đăng nhập admin bằng cookie phiên (đóng trình duyệt sẽ tự đăng xuất).
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#1E1E1E] text-white rounded-lg border border-white/10 focus:outline-none focus:border-[#D344FF]"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1E1E1E] text-white rounded-lg border border-white/10 focus:outline-none focus:border-[#D344FF]"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-300 bg-red-900/20 border border-red-500/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-[#D344FF] text-white rounded-lg hover:bg-[#B836E6] transition-all font-semibold disabled:opacity-60"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

