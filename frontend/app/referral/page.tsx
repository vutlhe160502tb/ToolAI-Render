'use client';

import Header from '@/components/Header';
import { Gift } from 'lucide-react';

export default function ReferralPage() {
  return (
    <div className="min-h-screen bg-[#1a0a2e]">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
            <Gift className="w-10 h-10 text-[#D344FF]" />
            Giới thiệu nhận thưởng
          </h1>
          <div className="bg-[#2d1b4e] rounded-xl p-8 border border-[#8B2AB3]/30">
            <p className="text-gray-300">Tính năng đang phát triển...</p>
          </div>
        </div>
      </main>
    </div>
  );
}

