'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="py-16 border-t border-zinc-900 px-4 bg-black">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Image
              alt="Phù Thủy AI"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg object-cover shrink-0"
              src="/AItool.jpg"
            />
            <span className="text-xl font-black tracking-tighter text-white">
              PHÙ THỦY AI
            </span>
          </div>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Công cụ AI tối thượng nằm trong tay bạn. Tinh chỉnh bởi chuyên gia, dành cho người dùng thực chiến.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="text-white font-bold uppercase tracking-wider text-sm">
            Khám phá
          </h4>
          <ul className="text-zinc-500 text-sm space-y-2">
            <li>
              <Link href="/create-video" className="hover:text-purple-400 cursor-pointer transition">
                Tạo Video Kling AI
              </Link>
            </li>
            <li>
              <Link href="/upscale-image" className="hover:text-purple-400 cursor-pointer transition">
                Làm nét ảnh 4K
              </Link>
            </li>
            <li>
              <Link href="/change-outfit" className="hover:text-purple-400 cursor-pointer transition">
                Thay trang phục AI
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-3 md:col-span-2">
          <h2 className="text-xl font-bold mb-4 italic uppercase text-white">
            Chúng tôi làm hết phần khó cho bạn
          </h2>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="mt-0.5 shrink-0 w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big text-emerald-500" aria-hidden>
                  <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white uppercase tracking-wide text-xs md:text-sm">Prompt Engineer Tinh Chỉnh</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">Không cần viết câu lệnh dài dòng. Chuyên gia của chúng tôi đã tối ưu sẵn bộ prompt &quot;xịn&quot; nhất cho từng thể loại video.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-0.5 shrink-0 w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big text-emerald-500" aria-hidden>
                  <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white uppercase tracking-wide text-xs md:text-sm">Bắt Trend Mượt Mà</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">Trend AI nào hot trên TikTok, chúng tôi cập nhật Model đó trong 24h. Bạn chỉ việc vào và &quot;húp&quot; thành quả ngay lập tức.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-0.5 shrink-0 w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big text-emerald-500" aria-hidden>
                  <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white uppercase tracking-wide text-xs md:text-sm">Rẻ Hơn &amp; Nhanh Hơn</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">Không cần thuê GPU $20/tháng. Chỉ trả tiền cho những gì bạn thực sự tạo ra với chi phí cực kỳ hạt dẻ dành riêng cho ae Việt Nam.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-zinc-600 text-xs font-medium">
          © 2026 Phù Thủy AI - Sáng tạo không giới hạn
        </p>
        <div className="flex gap-6 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
          <Link href="#" className="hover:text-purple-400 transition">Điều khoản</Link>
          <Link href="#" className="hover:text-purple-400 transition">Bảo mật</Link>
        </div>
      </div>
    </footer>
  );
}
