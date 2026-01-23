'use client';

import Link from 'next/link';

interface FeatureCardProps {
  title: string;
  description: string;
  route: string;
  showButton?: boolean;
  bgColor?: string;
  compact?: boolean;
}

export default function FeatureCard({ title, description, route, showButton = false, bgColor = "black", compact = false }: FeatureCardProps) {
  return (
    <Link href={route} className="block h-full">
      <div className={`group rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col ${bgColor === "#343434" ? "bg-[#1E1E1E]" : "bg-black border border-black"}`}>
        {/* Image Placeholder - Large grey rectangle with rounded corners, giữ tỉ lệ khi resize */}
        <div className="w-full aspect-[4/3] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0">
          <div className={`text-gray-500 ${compact ? "text-xs sm:text-xs md:text-sm" : "text-xs sm:text-sm md:text-base"}`}>Preview</div>
        </div>

        {/* Title */}
        <h2 className={`${compact ? "text-xs sm:text-sm md:text-base lg:text-lg" : "text-sm sm:text-base md:text-lg lg:text-xl"} font-bold text-white group-hover:bg-gradient-to-b group-hover:from-[#D344FF] group-hover:to-white/70 group-hover:bg-clip-text group-hover:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2`}>{title}</h2>

        {/* Description */}
        <p className={`text-gray-400 ${compact ? "text-xs sm:text-xs md:text-sm" : "text-xs sm:text-sm md:text-base"} leading-relaxed truncate shrink pl-1 sm:pl-1.5 md:pl-2 -mt-1`}>{description}</p>

        {/* Optional Action button */}
        {showButton && (
          <div className="mt-6">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#D344FF] text-white rounded-lg hover:bg-[#B836E6] transition-all">
              <span>Tạo Video</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
