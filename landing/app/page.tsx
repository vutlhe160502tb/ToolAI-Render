import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ChevronRight,
  CircleCheckBig,
  Video,
  MousePointer2,
  Cpu,
  TrendingUp,
  CircleHelp,
  ShieldCheck,
  Phone,
  MessageCircle,
} from "lucide-react";
import { FloatingContact } from "@/components/FloatingContact";
import { FeatureCard } from "@/components/FeatureCard";
import { FAQItem } from "@/components/FAQItem";

const APP_URL = "https://phuthuyai.xyz/";

const faqs = [
  {
    question: "Tôi không biết gì về AI, không rành kỹ thuật có dùng được không?",
    answer:
      "Hoàn toàn được! Phù Thủy AI thiết kế riêng cho anh em 'no-tech'. Bạn không cần cài đặt, không cần viết code hay prompt dài dòng. Chỉ cần chọn mẫu, up ảnh và nhấn nút, mọi thứ còn lại AI và các Prompt Engineer của chúng tôi lo.",
  },
  {
    question: "Máy tính yếu hoặc dùng điện thoại có tạo được video không?",
    answer:
      "Có! Mọi quá trình xử lý nặng nhất đều diễn ra trên hệ thống máy chủ GPU khủng của Phù Thủy AI. Bạn chỉ cần một thiết bị có trình duyệt web và kết nối internet là có thể tạo video 4K mượt mà.",
  },
  {
    question: "Video tạo ra có bị dính bản quyền không?",
    answer:
      "Nội dung bạn tạo ra là duy nhất và bạn có toàn quyền sử dụng cho mục đích cá nhân hoặc thương mại (chạy quảng cáo, làm TikTok, YouTube...) mà không lo về vấn đề bản quyền hình ảnh.",
  },
  {
    question: "Tại sao nên dùng Phù Thủy AI thay vì các tool quốc tế?",
    answer:
      "Chúng tôi tối ưu riêng cho người dùng Việt Nam: Thanh toán dễ dàng, giá rẻ hơn nhiều so với thuê GPU nước ngoài ($20-50/tháng), và quan trọng nhất là các Model đã được tinh chỉnh (Fine-tuned) sẵn để bắt đúng trend Việt Nam.",
  },
  {
    question: "Làm sao để biết khi nào có trend mới?",
    answer:
      "Chúng tôi có đội ngũ săn trend 24/7. Khi có bất kỳ trend AI nào mới hot trên toàn cầu (như Kling AI, Sora mới...), hệ thống sẽ cập nhật model và thông báo ngay tại trang chủ để anh em 'vã' luôn.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-purple-500/30">
      <FloatingContact />

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/AItool.jpg"
              alt="Phù Thủy AI"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
              PHÙ THỦY AI
            </span>
          </div>
          <Link
            href={APP_URL}
            className="bg-white text-black px-5 py-2 rounded-full font-bold text-sm hover:bg-zinc-200 transition"
          >
            Bắt đầu ngay
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-full mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </span>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
              Dành riêng cho anh em No-Tech
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
            Tạo Video AI Chuyên Nghiệp <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400">
              Không Cần Biết Kỹ Thuật
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Bạn mệt mỏi vì cài đặt Stable Diffusion? Phù Thủy AI mang đến những
            Model đã được tinh chỉnh sẵn, nét căng 4K và luôn cập nhật Trend mới
            nhất chỉ với 1 click.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={APP_URL}
              className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20"
            >
              Trải nghiệm Model Pro Miễn Phí
              <ChevronRight size={20} aria-hidden />
            </Link>
            <Link
              href={APP_URL}
              className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all inline-flex items-center justify-center"
            >
              Xem Video mẫu
            </Link>
          </div>
        </div>
      </section>

      {/* Chúng tôi làm hết phần khó */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />
              <div className="relative bg-zinc-900 rounded-2xl p-4 border border-zinc-800 overflow-hidden">
                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-sm font-bold text-purple-400">
                    Kết quả từ Phù Thủy AI
                  </span>
                  <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 uppercase">
                    Model: Kling AI v1.5
                  </span>
                </div>
                <div className="aspect-video bg-zinc-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6 z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                        <Video size={18} className="text-white" aria-hidden />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Chất lượng thực tế</p>
                        <p className="text-xs text-zinc-400">
                          Sử dụng công nghệ Kling AI tối tân nhất hiện nay
                        </p>
                      </div>
                    </div>
                  </div>
                  <Image
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200"
                    alt="Kling AI Example"
                    fill
                    className="object-cover opacity-60"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6 italic uppercase text-white">
                Chúng tôi làm hết phần khó cho bạn
              </h2>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="mt-1 shrink-0 w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <CircleCheckBig
                      className="text-emerald-500"
                      size={16}
                      aria-hidden
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-wide text-sm md:text-base">
                      Prompt Engineer Tinh Chỉnh
                    </h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      Không cần viết câu lệnh dài dòng. Chuyên gia của chúng tôi
                      đã tối ưu sẵn bộ prompt &quot;xịn&quot; nhất cho từng thể loại
                      video.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 shrink-0 w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <CircleCheckBig
                      className="text-emerald-500"
                      size={16}
                      aria-hidden
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-wide text-sm md:text-base">
                      Bắt Trend Mượt Mà
                    </h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      Trend AI nào hot trên TikTok, chúng tôi cập nhật Model đó
                      trong 24h. Bạn chỉ việc vào và &quot;húp&quot; thành quả
                      ngay lập tức.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 shrink-0 w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <CircleCheckBig
                      className="text-emerald-500"
                      size={16}
                      aria-hidden
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-wide text-sm md:text-base">
                      Rẻ Hơn & Nhanh Hơn
                    </h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      Không cần thuê GPU $20/tháng. Chỉ trả tiền cho những gì bạn
                      thực sự tạo ra với chi phí cực kỳ hạt dẻ dành riêng cho ae
                      Việt Nam.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Đặc Quyền */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 italic uppercase tracking-tighter text-white">
              Đặc Quyền Của Phù Thủy AI
            </h2>
            <p className="text-zinc-400">
              Tại sao hàng ngàn Creator tin dùng chúng tôi thay vì tự cài đặt?
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={MousePointer2}
              title="Cực Dễ Cho No-Tech"
              description="Giao diện thuần Việt, lược bỏ mọi thông số kỹ thuật đau đầu. Bạn chỉ cần chọn phong cách và upload ảnh."
              badge="Dễ dùng"
            />
            <FeatureCard
              icon={Cpu}
              title="Model Tối Tân (Kling AI)"
              description="Sử dụng các model chuyên nghiệp nhất: Kling AI, Flux, SDXL, Sora... đã được lọc lỗi và tinh chỉnh độ nét 4K."
              badge="Cực xịn"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Không Lo Lỗi Thời"
              description="Quên việc update model thủ công đi. Phù Thủy AI tự động cập nhật những công nghệ AI mới nhất toàn cầu."
              badge="Cập nhật"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20">
              <CircleHelp size={28} className="text-white" aria-hidden />
            </div>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase text-white">
              Giải đáp thắc mắc
            </h2>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/20 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={120} aria-hidden />
          </div>
          <h2 className="text-4xl font-black mb-6 text-white">
            Bạn Đã Sẵn Sàng Bẻ Cong Timeline?
          </h2>
          <p className="text-lg text-zinc-300 mb-8 max-w-xl mx-auto leading-relaxed">
            Gia nhập cộng đồng Phù Thủy AI ngay hôm nay. Tạo video sắc nét với
            Kling AI, bắt trend cực nhanh mà không cần máy mạnh.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={APP_URL}
              className="bg-white text-black px-10 py-4 rounded-2xl font-black text-xl hover:scale-105 transition active:scale-95 shadow-xl"
            >
              DÙNG THỬ MIỄN PHÍ
            </Link>
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <ShieldCheck size={18} className="text-emerald-500" aria-hidden />
              <span>Không cần cài đặt - Dùng ngay</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-zinc-900 px-4 bg-black">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image
                src="/AItool.jpg"
                alt="Phù Thủy AI"
                width={32}
                height={32}
                className="w-8 h-8 rounded-lg object-cover shrink-0"
              />
              <span className="text-xl font-black tracking-tighter text-white">
                PHÙ THỦY AI
              </span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Công cụ AI tối thượng nằm trong tay bạn. Tinh chỉnh bởi chuyên
              gia, dành cho người dùng thực chiến.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-wider text-sm">
              Khám phá
            </h4>
            <ul className="text-zinc-500 text-sm space-y-2">
              <li>
                <Link href={`${APP_URL}/create-video`} className="hover:text-purple-400 cursor-pointer transition">
                  Tạo Video Kling AI
                </Link>
              </li>
              <li>
                <Link href={`${APP_URL}/upscale-image`} className="hover:text-purple-400 cursor-pointer transition">
                  Làm nét ảnh 4K
                </Link>
              </li>
              <li>
                <Link href={`${APP_URL}/change-outfit`} className="hover:text-purple-400 cursor-pointer transition">
                  Thay trang phục AI
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4 md:col-span-2">
            <h4 className="text-white font-bold uppercase tracking-wider text-sm">
              📞 Liên hệ với chúng tôi
            </h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <a
                href="https://zalo.me/0929862699"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-blue-500 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Phone size={20} className="text-blue-400" aria-hidden />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">
                    Zalo cá nhân
                  </p>
                  <p className="text-white font-bold">0929 862 699</p>
                </div>
              </a>
              <a
                href="https://t.me/mmon_6789"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-sky-500 transition-all group"
              >
                <div className="w-10 h-10 bg-sky-500/10 rounded-full flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                  <MessageCircle size={20} className="text-sky-400" aria-hidden />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">
                    Telegram
                  </p>
                  <p className="text-white font-bold">@mmon_6789</p>
                </div>
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-600 text-xs font-medium">
            © 2026 Phù Thủy AI - Sáng tạo không giới hạn
          </p>
          <div className="flex gap-6 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
            <Link href="#" className="hover:text-purple-400 transition">
              Điều khoản
            </Link>
            <Link href="#" className="hover:text-purple-400 transition">
              Bảo mật
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
