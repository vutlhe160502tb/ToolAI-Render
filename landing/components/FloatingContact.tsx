import { Phone, Send } from "lucide-react";

export function FloatingContact() {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <a
        href="https://zalo.me/0929862699"
        target="_blank"
        rel="noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 bg-[#0068ff] text-white rounded-full shadow-lg shadow-blue-500/40 hover:scale-110 transition-all"
      >
        <span className="absolute right-full mr-3 bg-white text-[#0068ff] px-3 py-1 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
          Chat Zalo ngay
        </span>
        <Phone size={28} aria-hidden />
      </a>
      <a
        href="https://t.me/mmon_6789"
        target="_blank"
        rel="noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 bg-[#229ED9] text-white rounded-full shadow-lg shadow-sky-500/40 hover:scale-110 transition-all"
      >
        <span className="absolute right-full mr-3 bg-white text-[#229ED9] px-3 py-1 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
          Telegram Support
        </span>
        <Send size={28} aria-hidden />
      </a>
    </div>
  );
}
