'use client';

import Link from 'next/link';

interface VideoCardProps {
  route: string;
}

export default function VideoCard({ route }: VideoCardProps) {
  return (
    <Link href={route} className="block">
      <div className="group rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer bg-[#343434]">
        {/* Video Preview Placeholder */}
        <div className="w-full aspect-[1/1.5] bg-[#2a2a2a] rounded-[20px] flex items-center justify-center">
          <div className="text-gray-500 text-xs sm:text-sm md:text-base">Preview</div>
        </div>
      </div>
    </Link>
  );
}

