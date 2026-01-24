'use client';

import { Loader2 } from 'lucide-react';

interface LoadingPreviewProps {
  progress: number;
}

export default function LoadingPreview({ progress }: LoadingPreviewProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6">
      {/* Loading Animation */}
      <div className="relative">
        <Loader2 className="w-16 h-16 text-[#D344FF] animate-spin" />
      </div>
      
      {/* Loading Text */}
      <div className="text-center">
        <div className="text-white text-xl sm:text-2xl font-semibold mb-2">
          Loading ...
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full max-w-md px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Đang xử lý...</span>
          <span className="text-[#D344FF] text-sm font-semibold">{progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#D344FF] to-[#B836E6] h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

