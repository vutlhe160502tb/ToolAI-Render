'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

const DEFAULT_TELEGRAM = 'https://t.me/mmon_6789';
const DEFAULT_ZALO = 'https://zalo.me/0929862699';

export default function SupportChatFloating() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const telegramUrl =
    process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM_URL?.trim() || DEFAULT_TELEGRAM;
  const zaloUrl =
    process.env.NEXT_PUBLIC_SUPPORT_ZALO_URL?.trim() || DEFAULT_ZALO;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleTelegram = () => {
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const handleZalo = () => {
    window.open(zaloUrl, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-[#D344FF]/40 bg-[#101010] py-2 shadow-xl">
          <button
            type="button"
            onClick={handleTelegram}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#2E3031] hover:text-white"
          >
            <span className="text-lg">✈</span>
            Chat qua Telegram
          </button>
          <button
            type="button"
            onClick={handleZalo}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#2E3031] hover:text-white"
          >
            <span className="text-lg">💬</span>
            Chat qua Zalo
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D344FF] text-white shadow-lg transition hover:bg-[#b83ae0]"
        aria-label="Chat hỗ trợ"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
