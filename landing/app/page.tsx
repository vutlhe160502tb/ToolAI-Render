import React from "react";
import { Vortex } from "@/components/ui/vortex";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import {
  Play,
  Image as ImageIcon,
  Wand2,
  Zap,
  ChevronRight,
  Star,
  Aperture,
  Film,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-fuchsia-500 selection:text-white overflow-x-hidden">
      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden">
        <Vortex
          backgroundColor="black"
          rangeY={800}
          particleCount={500}
          baseHue={280}
          className="pt-24 pb-20 md:pt-32 md:pb-32 px-6"
        >
          <div className="container mx-auto text-center max-w-4xl">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Wand2 className="text-white w-10 h-10" />
            </div>
            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-fuchsia-200 to-fuchsia-400">
              Surreal.AI
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Biến mọi trí tưởng tượng <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-purple-500">
              thành hiện thực
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Surreal.AI cung cấp bộ công cụ sáng tạo toàn diện: Tạo ảnh, dựng
            video, làm nét và chuyển động hóa nhân vật chỉ trong vài giây.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button className="w-full md:w-auto px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-100 transition-transform hover:scale-105 flex items-center justify-center gap-2 group">
              <Zap className="w-5 h-5 fill-black" />
              Sáng tạo ngay
            </button>
            <button className="w-full md:w-auto px-8 py-4 bg-white/10 border border-white/10 backdrop-blur-sm rounded-full font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              Xem demo
            </button>
          </div>

          {/* --- APP DASHBOARD PREVIEW --- */}
          <div className="mt-20 relative group/preview max-w-5xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl blur opacity-30 group-hover/preview:opacity-50 transition duration-1000"></div>
            <div className="relative bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Fake Browser Toolbar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-neutral-900/90 backdrop-blur">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-black/50 px-4 py-1 rounded-md text-xs text-gray-400 font-mono border border-white/5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    app.surreal.ai/dashboard
                  </div>
                </div>
                <div className="w-12"></div> {/* Spacer for alignment */}
              </div>

              {/* App Interface Body */}
              <div className="aspect-[16/10] bg-black p-6 md:p-10 flex flex-col items-center justify-center">
                {/* App Header */}
                <div className="mb-8 md:mb-12 text-center">
                  <h3 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-300 via-pink-400 to-purple-400 tracking-tight">
                    Surreal.AI
                  </h3>
                </div>

                {/* Feature Grid - Recreated from User Image */}
                <div className="w-full max-w-4xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <a className="block h-full" href="/create-image">
                      <div className="group/card rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-black border border-black">
                        <div className="w-full aspect-[450/260] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0 overflow-hidden">
                          <video
                            src="/assets/taoanh.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white group-hover/card:bg-gradient-to-b group-hover/card:from-[#D344FF] group-hover/card:to-white/70 group-hover/card:bg-clip-text group-hover/card:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">
                          Tạo Ảnh
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-xs md:text-sm leading-relaxed truncate shrink pl-1 sm:pl-1.5 md:pl-2 -mt-1">
                          Biến mọi trí tưởng tượng thành hiện thực
                        </p>
                      </div>
                    </a>

                    <a className="block h-full" href="/create-video">
                      <div className="group/card rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-black border border-black">
                        <div className="w-full aspect-[450/260] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0 overflow-hidden">
                          <video
                            src="/assets/taovideo.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white group-hover/card:bg-gradient-to-b group-hover/card:from-[#D344FF] group-hover/card:to-white/70 group-hover/card:bg-clip-text group-hover/card:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">
                          Tạo Video
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-xs md:text-sm leading-relaxed truncate shrink pl-1 sm:pl-1.5 md:pl-2 -mt-1">
                          Biến ảnh tĩnh nhàm chán trở nên hấp dẫn hơn
                        </p>
                      </div>
                    </a>

                    <a className="block h-full" href="/dance-image-bg">
                      <div className="group/card rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-black border border-black">
                        <div className="w-full aspect-[450/260] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0 overflow-hidden">
                          <video
                            src="/assets/taochuyendong.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white group-hover/card:bg-gradient-to-b group-hover/card:from-[#D344FF] group-hover/card:to-white/70 group-hover/card:bg-clip-text group-hover/card:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">
                          Tạo Chuyển Động
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-xs md:text-sm leading-relaxed truncate shrink pl-1 sm:pl-1.5 md:pl-2 -mt-1">
                          Tạo nhân vật AI chuyển động theo ý muốn
                        </p>
                      </div>
                    </a>

                    <a className="block h-full" href="/upscale-image">
                      <div className="group/card rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-black border border-black">
                        <div className="w-full aspect-[450/260] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            alt="Làm Nét Ảnh"
                            loading="lazy"
                            width={400}
                            height={300}
                            decoding="async"
                            className="w-full h-full object-cover"
                            src="/assets/lamnetanh.jpg"
                            style={{ color: "transparent" }}
                          />
                        </div>
                        <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white group-hover/card:bg-gradient-to-b group-hover/card:from-[#D344FF] group-hover/card:to-white/70 group-hover/card:bg-clip-text group-hover/card:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">
                          Làm Nét Ảnh
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-xs md:text-sm leading-relaxed truncate shrink pl-1 sm:pl-1.5 md:pl-2 -mt-1">
                          Tăng chất lượng hình ảnh lên tới 4k
                        </p>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Top Picks Section inside App */}
                <div className="w-full max-w-4xl mt-8">
                  <h5 className="text-sm font-bold text-fuchsia-500 mb-3 uppercase tracking-wider text-left">
                    Top Lựa Chọn
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <a className="block h-full" href="/models/google-banana-pro">
                      <div className="group/card rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-[#1E1E1E]">
                        <div className="w-full aspect-[450/260] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0 overflow-hidden">
                          <video
                            src="/assets/ggbanana.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white group-hover/card:bg-gradient-to-b group-hover/card:from-[#D344FF] group-hover/card:to-white/70 group-hover/card:bg-clip-text group-hover/card:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">
                          Google Banana Pro
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm md:text-base leading-relaxed truncate shrink pl-1 sm:pl-1.5 md:pl-2 -mt-1">
                          Model tạo ảnh tốt nhất hiện nay
                        </p>
                      </div>
                    </a>

                    <a className="block h-full" href="/dance-image-bg">
                      <div className="group/card rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-[#1E1E1E]">
                        <div className="w-full aspect-[450/260] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0 overflow-hidden">
                          <video
                            src="/assets/nhayvoinentuanh.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white group-hover/card:bg-gradient-to-b group-hover/card:from-[#D344FF] group-hover/card:to-white/70 group-hover/card:bg-clip-text group-hover/card:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">
                          Nhảy Với Nền Từ Ảnh
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm md:text-base leading-relaxed truncate shrink pl-1 sm:pl-1.5 md:pl-2 -mt-1">
                          AI sẽ tạo video nhảy dùng nền từ ảnh gốc
                        </p>
                      </div>
                    </a>

                    <a className="block h-full" href="/dance-video-bg">
                      <div className="group/card rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-[#1E1E1E]">
                        <div className="w-full aspect-[450/260] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0 overflow-hidden">
                          <video
                            src="/assets/nhayvoinentuvideo.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white group-hover/card:bg-gradient-to-b group-hover/card:from-[#D344FF] group-hover/card:to-white/70 group-hover/card:bg-clip-text group-hover/card:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">
                          Nhảy Với Nền Từ Video
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm md:text-base leading-relaxed truncate shrink pl-1 sm:pl-1.5 md:pl-2 -mt-1">
                          AI sẽ tạo video nhảy dùng nền từ video gốc
                        </p>
                      </div>
                    </a>

                    <a className="block h-full" href="/change-outfit">
                      <div className="group/card rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-[#1E1E1E]">
                        <div className="w-full aspect-[450/260] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            alt="Thay Trang Phục"
                            loading="lazy"
                            width={400}
                            height={300}
                            decoding="async"
                            className="w-full h-full object-cover"
                            src="/assets/thaytrangphuc.jpg"
                            style={{ color: "transparent" }}
                          />
                        </div>
                        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white group-hover/card:bg-gradient-to-b group-hover/card:from-[#D344FF] group-hover/card:to-white/70 group-hover/card:bg-clip-text group-hover/card:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">
                          Thay Trang Phục
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm md:text-base leading-relaxed truncate shrink pl-1 sm:pl-1.5 md:pl-2 -mt-1">
                          Thay mọi trang phục bạn muốn
                        </p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </Vortex>
      </section>

      {/* --- PARTNERS --- */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-gray-500 mb-8 uppercase tracking-widest">
            Được tin dùng bởi các nhà sáng tạo từ
          </p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Mock Logos */}
            {["Studio X", "DesignLab", "FutureVision", "ArtTech", "PixelPerfect"].map(
              (brand) => (
                <span
                  key={brand}
                  className="text-xl font-bold font-mono text-white flex items-center gap-2"
                >
                  <Aperture className="w-6 h-6" /> {brand}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Bộ công cụ <span className="text-fuchsia-500">toàn năng</span>
            </h2>
            <p className="text-gray-400 max-w-2xl text-lg">
              Không chỉ là tạo ảnh. Surreal.AI mang đến một hệ sinh thái đầy đủ
              để bạn sản xuất nội dung số chất lượng điện ảnh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1: Image Gen */}
            <div className="group relative bg-neutral-900 border border-white/10 rounded-3xl p-8 hover:border-fuchsia-500/50 transition-colors overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ImageIcon className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
                  <Wand2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Tạo Ảnh (Text-to-Image)
                </h3>
                <p className="text-gray-400 mb-6">
                  Biến những dòng mô tả văn bản thành tác phẩm nghệ thuật chi tiết
                  đến kinh ngạc. Hỗ trợ nhiều phong cách từ Anime, 3D đến Siêu
                  thực.
                </p>
                <div className="rounded-xl overflow-hidden h-64 w-full bg-black/50 border border-white/5 relative">
                  <video
                    src="/assets/taoanh.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>

            {/* Feature 2: Video Gen */}
            <div className="group relative bg-neutral-900 border border-white/10 rounded-3xl p-8 hover:border-purple-500/50 transition-colors overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Film className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-6">
                  <Film className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Tạo Video (Text-to-Video)
                </h3>
                <p className="text-gray-400 mb-6">
                  Biến ảnh tĩnh nhàm chán trở nên hấp dẫn hơn với các hiệu ứng
                  chuyển động AI. Tạo thước phim ngắn chỉ từ một tấm ảnh gốc.
                </p>
                <div className="rounded-xl overflow-hidden h-64 w-full bg-black/50 border border-white/5 relative flex items-center justify-center">
                  <video
                    src="/assets/taovideo.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className="absolute w-full h-full object-cover opacity-60"
                  />
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center z-20 group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Upscale */}
            <div className="group relative bg-neutral-900 border border-white/10 rounded-3xl p-8 hover:border-green-500/50 transition-colors overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center mb-6">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Làm Nét Ảnh (Upscale 4K)
                </h3>
                <p className="text-gray-400 mb-6">
                  Phục hồi ảnh cũ, ảnh mờ hoặc ảnh chất lượng thấp lên độ phân
                  giải 4K sắc nét. Giữ nguyên chi tiết khuôn mặt và kết cấu.
                </p>
              </div>
              <div className="mt-4 flex gap-1 h-40">
                <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden relative border-r border-white/20">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100"
                    className="w-full h-full object-cover blur-[2px]"
                    alt="Blurry"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] bg-black/50 px-2 py-0.5 rounded text-white">
                    Trước
                  </span>
                </div>
                <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976"
                    className="w-full h-full object-cover"
                    alt="Sharp"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] bg-green-500/80 px-2 py-0.5 rounded text-white font-bold">
                    Sau (4K)
                  </span>
                </div>
              </div>
            </div>

            {/* Feature 4: Animation */}
            <div className="group relative bg-neutral-900 border border-white/10 rounded-3xl p-8 hover:border-pink-500/50 transition-colors overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-6">
                  <Wand2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Tạo Chuyển Động</h3>
                <p className="text-gray-400 mb-6">
                  Tạo nhân vật AI chuyển động theo ý muốn. Kiểm soát biểu cảm
                  khuôn mặt, cử chỉ tay và hướng nhìn một cách chính xác.
                </p>
              </div>
              <div className="mt-4 relative h-40 bg-gradient-to-r from-pink-900/20 to-purple-900/20 rounded-xl border border-white/5 flex items-center justify-between px-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-600 mb-2 mx-auto"></div>
                  <span className="text-xs text-gray-500">Pose Gốc</span>
                </div>
                <ArrowRight className="text-gray-600" />
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 mb-2 mx-auto shadow-[0_0_15px_rgba(236,72,153,0.5)]"></div>
                  <span className="text-xs text-fuchsia-400 font-bold">
                    Kết quả
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SHOWCASE / TOP PICKS --- */}
      <section id="showcase" className="py-20">
        <BackgroundBeamsWithCollision className="rounded-none">
          <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">Thư viện sáng tạo</h2>
              <p className="text-gray-400">
                Các tác phẩm nổi bật được cộng đồng Surreal tạo ra.
              </p>
            </div>
            <a
              href="#"
              className="flex items-center text-fuchsia-400 hover:text-fuchsia-300 font-medium transition-colors"
            >
              Xem tất cả <ChevronRight className="w-4 h-4 ml-1" />
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[600px] md:h-[500px]">
            <div className="col-span-2 md:col-span-1 row-span-2 rounded-2xl overflow-hidden relative group">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt="Gallery 1"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <span className="text-sm font-bold">Chân dung Cyberpunk</span>
                <span className="text-xs text-gray-400">@creator_one</span>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden relative group">
              <img
                src="https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=2008&auto=format&fit=crop"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt="Gallery 2"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"></div>
            </div>
            <div className="col-span-2 md:col-span-2 row-span-2 rounded-2xl overflow-hidden relative group">
              <img
                src="https://images.unsplash.com/photo-1633511090164-b43840ea1607?q=80&w=2070&auto=format&fit=crop"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt="Gallery 3"
              />
              <div className="absolute top-4 left-4 bg-fuchsia-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                Top Lựa Chọn
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                <span className="text-xl font-bold">Thế giới ảo ảnh 3D</span>
                <p className="text-sm text-gray-300 line-clamp-2 mt-1">
                  Sử dụng model Surreal V4 để tạo ra độ chi tiết đáng kinh ngạc
                  trong môi trường thiếu sáng.
                </p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden relative group">
              <img
                src="https://images.unsplash.com/photo-1618172193763-c511deb635ca?q=80&w=1964&auto=format&fit=crop"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt="Gallery 4"
              />
            </div>
          </div>
          </div>
        </BackgroundBeamsWithCollision>
      </section>

      {/* --- PRICING CTA --- */}
      <section id="pricing" className="py-24 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 rounded-full blur-[100px] -z-10"></div>

        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Sẵn sàng để bứt phá giới hạn?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Gia nhập cộng đồng hơn 100,000 creator đang sử dụng Surreal.AI để
            kiến tạo tương lai.
          </p>

          <div className="bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-fuchsia-500/50 transition-all shadow-2xl">
            <div className="text-left">
              <span className="text-fuchsia-400 font-bold tracking-wider text-sm uppercase">
                Gói Agency
              </span>
              <div className="text-5xl font-bold mt-2 mb-1 flex items-baseline">
                500.000đ<span className="text-lg text-gray-500 font-normal">/500 coin</span>
              </div>
             
            </div>

            <div className="h-px w-full md:w-px md:h-24 bg-white/10"></div>

            <ul className="text-left space-y-3">
              {[
                "Không giới hạn tạo ảnh",
                "Video 4K chất lượng cao",
                "Ưu tiên xử lý nhanh",
                "Quyền thương mại",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-gray-300">
                  <div className="bg-green-500/20 p-1 rounded-full">
                    <Star className="w-3 h-3 text-green-400 fill-green-400" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <button className="w-full md:w-auto bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-fuchsia-50 transition-colors shadow-lg shadow-white/10">
              Bắt đầu ngay
            </button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-black border-t border-white/10 pt-20 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded flex items-center justify-center">
                  <Wand2 className="text-white w-3 h-3" />
                </div>
                <span className="text-xl font-bold text-white">Surreal.AI</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Nền tảng trí tuệ nhân tạo tiên phong, giúp bạn hiện thực hóa mọi ý
                tưởng điên rồ nhất thành hình ảnh và video sống động.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white">Sản phẩm</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li>
                  <a href="#" className="hover:text-fuchsia-400 transition-colors">
                    AI Generator
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-fuchsia-400 transition-colors">
                    Video Maker
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-fuchsia-400 transition-colors">
                    Image Upscaler
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-fuchsia-400 transition-colors">
                    API cho Developers
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white">Tài nguyên</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li>
                  <a href="#" className="hover:text-fuchsia-400 transition-colors">
                    Cộng đồng
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-fuchsia-400 transition-colors">
                    Hướng dẫn sử dụng
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-fuchsia-400 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-fuchsia-400 transition-colors">
                    Trung tâm hỗ trợ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white">Pháp lý</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li>
                  <a href="#" className="hover:text-fuchsia-400 transition-colors">
                    Điều khoản sử dụng
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-fuchsia-400 transition-colors">
                    Chính sách bảo mật
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-fuchsia-400 transition-colors">
                    Bản quyền
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">
              © 2024 Surreal.AI Inc. All rights reserved.
            </p>
            <div className="flex gap-6">
              {/* Social Icons placeholders */}
              <div className="w-5 h-5 bg-gray-800 hover:bg-fuchsia-500 transition-colors rounded-full cursor-pointer"></div>
              <div className="w-5 h-5 bg-gray-800 hover:bg-fuchsia-500 transition-colors rounded-full cursor-pointer"></div>
              <div className="w-5 h-5 bg-gray-800 hover:bg-fuchsia-500 transition-colors rounded-full cursor-pointer"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

