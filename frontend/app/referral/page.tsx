'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Copy, Gift, Share2, Users } from 'lucide-react';
import axios from 'axios';
import { useSession, signIn } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';

type ReferralMilestone = {
  milestone: number;
  reward_coins: number;
  reached: boolean;
  granted: boolean;
};

type ReferralSummary = {
  user_id: string;
  referral_code: string;
  referral_link: string;
  referred_paid_count: number;
  milestones: ReferralMilestone[];
  granted_milestones: number[];
  next_milestone: { milestone: number; reward_coins: number } | null;
};

export default function ReferralPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);

  const userId = useMemo(() => (session?.user as any)?.id as string | undefined, [session]);

  const fetchSummary = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/referral/me?user_id=${encodeURIComponent(userId)}`);
      setSummary(res.data);
    } catch (e: unknown) {
      let msg = 'Không thể tải dữ liệu';
      if (axios.isAxiosError(e)) {
        const data = e.response?.data;
        if (data && typeof data === 'object') {
          const record = data as Record<string, unknown>;
          const detail = record.detail;
          const message = record.message;
          if (typeof detail === 'string') msg = detail;
          else if (typeof message === 'string') msg = message;
        }
        if (msg === 'Không thể tải dữ liệu' && typeof e.message === 'string') {
          msg = e.message;
        }
      } else if (e instanceof Error) {
        msg = e.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && userId) {
      fetchSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userId]);

  const referredCount = Number(summary?.referred_paid_count || 0);
  const nextMilestone = summary?.next_milestone?.milestone as number | undefined;
  const progressPct =
    !nextMilestone ? 100 : Math.min(100, Math.round((referredCount / nextMilestone) * 100));

  const handleCopy = async () => {
    const text = summary?.referral_link as string | undefined;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert('Đã copy link giới thiệu');
    } catch {
      try {
        // Fallback
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        alert('Đã copy link giới thiệu');
      } catch {}
    }
  };

  const handleShare = async () => {
    const url = summary?.referral_link as string | undefined;
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Nhận coin miễn phí',
          text: 'Tham gia và nạp coin để cả hai cùng nhận thưởng.',
          url,
        });
      } else {
        await handleCopy();
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-[50px] py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <Gift className="w-9 h-9 text-[#D344FF]" />
              Giới thiệu nhận thưởng
            </h1>
            {status === 'authenticated' && (
              <button
                onClick={fetchSummary}
                className="px-4 py-2 bg-[#2E3031] text-gray-200 rounded-[12px] hover:bg-[#333] transition-colors text-sm font-medium"
              >
                Làm mới
              </button>
            )}
          </div>

          {status !== 'authenticated' ? (
            <div className="bg-[#1A1A1A] rounded-[20px] p-6 border border-white/10">
              <p className="text-gray-300 mb-4">
                Đăng nhập để lấy link giới thiệu và theo dõi tiến độ nhận thưởng.
              </p>
              <button
                onClick={() => signIn('google', { callbackUrl: '/referral' })}
                className="px-5 py-3 bg-[#D344FF] text-black rounded-[12px] hover:bg-[#B836E6] transition-colors font-semibold"
              >
                Đăng nhập với Google
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-[#1A1A1A] rounded-[20px] p-6 border border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Bạn bè đã thanh toán & nhận coin</span>
                    </div>
                    <div className="text-4xl font-bold text-white mt-2">{referredCount}</div>
                    <p className="text-gray-400 text-sm mt-2">
                      Chỉ tính khi người được mời <b>thanh toán thành công</b> và đã được <b>cộng coin</b>.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={!summary?.referral_link}
                      onClick={handleCopy}
                      className="px-4 py-2 bg-[#2E3031] text-gray-200 rounded-[12px] hover:bg-[#333] transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      <Copy className="w-4 h-4" />
                      Copy link
                    </button>
                    <button
                      disabled={!summary?.referral_link}
                      onClick={handleShare}
                      className="px-4 py-2 bg-[#2E3031] text-gray-200 rounded-[12px] hover:bg-[#333] transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      <Share2 className="w-4 h-4" />
                      Chia sẻ
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <span>Tiến độ</span>
                    <span>
                      {nextMilestone ? `${referredCount}/${nextMilestone}` : 'Đã đạt mốc cao nhất'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#2E3031] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D344FF] rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-sm text-gray-400">Mã giới thiệu</div>
                  <div className="text-white font-mono mt-1">{summary?.referral_code || '-'}</div>
                  <div className="text-sm text-gray-400 mt-3">Link giới thiệu</div>
                  <div className="text-white break-all mt-1">{summary?.referral_link || '-'}</div>
                </div>
              </div>

              <div className="bg-[#1A1A1A] rounded-[20px] p-6 border border-white/10">
                <h2 className="text-white font-semibold mb-4">Mốc thưởng</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(summary?.milestones || []).map((m: ReferralMilestone) => {
                    const reached = !!m?.reached;
                    const granted = !!m?.granted;
                    return (
                      <div
                        key={m.milestone}
                        className={`rounded-[16px] p-4 border ${
                          reached ? 'border-[#D344FF]/60 bg-[#272727]' : 'border-white/10 bg-[#111]'
                        }`}
                      >
                        <div className="text-gray-300 text-sm">Mời {m.milestone} người</div>
                        <div className="text-white text-2xl font-bold mt-1">
                          +{m.reward_coins} coin
                        </div>
                        <div className="text-xs mt-2">
                          {granted ? (
                            <span className="text-green-400">Đã cộng thưởng</span>
                          ) : reached ? (
                            <span className="text-yellow-300">Đã đạt, đang xử lý tự động</span>
                          ) : (
                            <span className="text-gray-500">Chưa đạt</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {loading && (
                <div className="text-gray-400 text-sm">Đang tải dữ liệu...</div>
              )}
              {error && (
                <div className="text-red-300 text-sm">
                  Lỗi: {error}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

