import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';

export default function Home() {
  // Main Features Section - 4 cards ngang
  const mainFeatures = [
    {
      title: 'Tạo Ảnh',
      description: 'Biến mọi trí tưởng tượng thành hiện thực',
      route: '/create-image',
      video: '/taoanh.mp4',
    },
    {
      title: 'Tạo Video',
      description: 'Biến ảnh tĩnh nhàm chán trở nên hấp dẫn hơn',
      route: '/create-video',
      video: '/taovideo.mp4',
    },
    {
      title: 'Tạo Chuyển Động',
      description: 'Tạo nhân vật AI chuyển động theo ý muốn',
      route: '/dance-image-bg',
      video: '/taochuyendong.mp4',
    },
    {
      title: 'Làm Nét Ảnh',
      description: 'Tăng chất lượng hình ảnh lên tới 4k',
      route: '/upscale-image',
      image: '/lamnetanh.jpg',
    },
  ];

  // Top Choices Section - 4 cards ngang
  const topChoices = [
    {
      title: 'Google Banana Pro',
      description: 'Model tạo ảnh tốt nhất hiện nay',
      route: '/models/google-banana-pro',
      video: '/ggbanana.mp4',
    },
    {
      title: 'Nhảy Với Nền Từ Ảnh',
      description: 'AI sẽ tạo video nhảy dùng nền từ ảnh gốc',
      route: '/dance-image-bg',
      video: '/nhayvoinentuanh.mp4',
    },
    {
      title: 'Nhảy Với Nền Từ Video',
      description: 'AI sẽ tạo video nhảy dùng nền từ video gốc',
      route: '/dance-video-bg',
      video: '/nhayvoinentuvideo.mp4',
    },
    {
      title: 'Thay Trang Phục',
      description: 'Thay mọi trang phục bạn muốn',
      route: '/change-outfit',
      image: '/thaytrangphuc.jpg',
    },
  ];

  // TẠO ẢNH Section - 7 cards
  const createImageFeatures = [
    {
      title: 'Google Banana Pro',
      description: 'Model tạo ảnh 2k 4k tốt nhất hiện nay',
      route: '/models/google-banana-pro',
      video: '/ggbanana.mp4',
    },
    {
      title: 'Người Mẫu Giới Thiệu Sản Phẩm',
      description: 'Ghép người mẫu và sản phẩm tuỳ biến',
      route: '/product-model',
      image: '/nguoimaugioithieu.jpg',
    },
    {
      title: 'Thay Trang Phục',
      description: 'Thay mọi trang phục bạn muốn',
      route: '/change-outfit',
      image: '/thaytrangphuc.jpg',
    },
    {
      title: 'Chỉnh Sửa Da',
      description: 'Làn da nhân vật thực tế hơn',
      route: '/skin-edit',
      image: '/chinhsuada.jpg',
    },
    {
      title: 'Thay khuôn mặt',
      description: 'Thay thế và hoà không',
      route: '/face-swap',
      image: '/thaykhuonmat.jpg',
    },
    {
      title: 'Thay nhân vật',
      description: 'Thay thế và hoán đổi nhân vật',
      route: '/character-swap',
      image: '/thaynhanvat.jpg',
    },
    {
      title: 'Làm Nét Ảnh',
      description: 'Tăng chất lượng hình ảnh tới 4k',
      route: '/upscale-image',
      image: '/lamnetanh.jpg',
    },
  ];

  // Hide Google Banana Pro cards (all breakpoints)
  const hiddenRoutes = new Set(['/models/google-banana-pro']);
  const topChoicesVisible = topChoices.filter((f) => !hiddenRoutes.has(f.route));
  const createImageFeaturesVisible = createImageFeatures.filter((f) => !hiddenRoutes.has(f.route));

  // TẠO VIDEO Section - 4 cards
  const createVideoFeatures = [
    {
      title: 'Tạo Chuyển Động',
      description: 'Tạo nhân vật AI chuyển động theo ý muốn',
      route: '/dance-image-bg',
      video: '/taochuyendong.mp4',
    },
    {
      title: 'Nhảy Với Nền Từ Ảnh',
      description: 'AI sẽ tạo video nhảy dùng nền từ ảnh gốc',
      route: '/dance-image-bg',
      video: '/nhayvoinentuanh.mp4',
    },
    {
      title: 'Nhảy Với Nền Từ Video',
      description: 'AI sẽ tạo video nhảy dùng nền từ video gốc',
      route: '/dance-video-bg',
      video: '/nhayvoinentuvideo.mp4',
    },
    {
      title: 'Thay Nhân Vật Quảng Cáo',
      description: 'AI sẽ tạo video thay nhân vật quảng cáo',
      route: '/replace-ad',
      image: '/thaynhanvatquangcao.jpg',
    },
  ];

  // VIDEO TỪ CỘNG ĐỒNG Section - 8 cards
  const communityVideos = [
    { route: '/video/1' },
    { route: '/video/2' },
    { route: '/video/3' },
    { route: '/video/4' },
    { route: '/video/5' },
    { route: '/video/6' },
    { route: '/video/7' },
    { route: '/video/8' },
  ];

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="w-full">
        {/* Logo/Title */}
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-[50px] py-8 md:py-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold bg-gradient-to-b from-[#D344FF] to-white bg-clip-text text-transparent">
              Phù Thuỷ AI 
            </h1>
          </div>
        </div>

        {/* Main Features Section - 4 cards ngang */}
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-[50px] mb-[100px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {mainFeatures.map((feature, idx) => (
              <div key={idx} className="relative block h-full">
                <a href={feature.route} className="absolute inset-0 z-10 hidden lg:block" aria-hidden="true" />
                <div className="group rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-black border border-black">
                  <div className="w-full aspect-[450/260] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0 overflow-hidden">
                    {feature.video ? (
                      <video
                        src={feature.video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : feature.image ? (
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-500 text-xs sm:text-xs md:text-sm">Preview</div>
                    )}
                  </div>
                  {/* Title: desktop only */}
                  <h2 className="hidden lg:block text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white group-hover:bg-gradient-to-b group-hover:from-[#D344FF] group-hover:to-white/70 group-hover:bg-clip-text group-hover:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">
                    {feature.title}
                  </h2>
                  {/* Description: keep on mobile, desktop keeps old */}
                  <p className="text-gray-300 text-base text-center leading-relaxed truncate px-2 lg:text-gray-400 lg:text-xs lg:sm:text-xs lg:md:text-sm lg:text-left lg:pl-1 lg:sm:pl-1.5 lg:md:pl-2 -mt-1 lg:mb-[10px]">
                    {feature.description}
                  </p>

                  {/* Mobile CTA - only button navigates */}
                  <div className="flex justify-center mt-[10px] lg:hidden">
                    <a href={feature.route} className="bg-[#D344FF] text-white rounded-[20px] px-4 py-2 text-sm font-semibold inline-block">
                      {feature.route === '/create-image'
                        ? 'Tạo ảnh'
                        : feature.route === '/create-video'
                          ? 'Tạo video'
                          : feature.route === '/dance-image-bg'
                            ? 'Tạo chuyển động'
                            : feature.route === '/upscale-image'
                              ? 'Làm nét ảnh'
                              : 'Tạo'}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP LỰA CHỌN Section */}
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-[50px] mb-[100px]">
          <div className="text-left mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#D344FF] mb-2">TOP LỰA CHỌN</h2>
            <p className="text-white text-sm md:text-base">CÁC CREATOR SÁNG TẠO TIN DÙNG</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {topChoicesVisible.map((feature, idx) => (
              <div key={idx} className="relative block h-full">
                <a href={feature.route} className="absolute inset-0 z-10 hidden lg:block" aria-hidden="true" />
                {/* Mobile title (outside card) */}
                <h2 className="text-lg font-bold text-white text-center mb-2 lg:hidden">
                  {feature.title}
                </h2>
                <div className="group rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-[#1E1E1E]">
                  <div className="w-full aspect-[450/260] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0 overflow-hidden">
                    {feature.video ? (
                      <video
                        src={feature.video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : feature.image ? (
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-500 text-xs sm:text-sm md:text-base">Preview</div>
                    )}
                  </div>
                  {/* Desktop title (keep old, hide on mobile) */}
                  <h2 className="hidden lg:block text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white group-hover:bg-gradient-to-b group-hover:from-[#D344FF] group-hover:to-white/70 group-hover:bg-clip-text group-hover:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">{feature.title}</h2>
                  <p className="text-gray-300 text-base text-center leading-relaxed truncate px-2 -mt-1 lg:text-gray-400 lg:text-xs lg:sm:text-sm lg:md:text-base lg:text-left lg:pl-1 lg:sm:pl-1.5 lg:md:pl-2">
                    {feature.description}
                  </p>

                  {/* Mobile CTA - only button navigates */}
                  <div className="flex justify-center mt-[7px] mb-[10px] lg:hidden">
                    <a href={feature.route} className="bg-[#D344FF] text-white rounded-[20px] px-4 py-2 text-sm font-semibold inline-block">
                      {feature.route.startsWith('/dance') ? 'Tạo video' : 'Tạo ảnh'}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TẠO ẢNH Section */}
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-[50px] mb-[100px]">
          <div className="text-left mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#D344FF] mb-2">TẠO ẢNH</h2>
            <p className="text-white text-sm md:text-base">Khám phá các tool tạo ảnh</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {createImageFeaturesVisible.map((feature, idx) => (
              <div key={idx} className="relative block h-full">
                <a href={feature.route} className="absolute inset-0 z-10 hidden lg:block" aria-hidden="true" />
                {/* Mobile title (outside card) */}
                <h2 className="text-lg font-bold text-white text-center mb-2 lg:hidden">{feature.title}</h2>
                <div className="group rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-[#1E1E1E]">
                  <div className="w-full aspect-[450/260] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0 overflow-hidden">
                    {feature.video ? (
                      <video
                        src={feature.video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : feature.image ? (
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-500 text-xs sm:text-sm md:text-base">Preview</div>
                    )}
                  </div>
                  {/* Desktop title (keep old, hide on mobile) */}
                  <h2 className="hidden lg:block text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white group-hover:bg-gradient-to-b group-hover:from-[#D344FF] group-hover:to-white/70 group-hover:bg-clip-text group-hover:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">{feature.title}</h2>
                  <p className="text-gray-300 text-base text-center leading-relaxed truncate px-2 -mt-1 lg:text-gray-400 lg:text-xs lg:sm:text-sm lg:md:text-base lg:text-left lg:pl-1 lg:sm:pl-1.5 lg:md:pl-2">
                    {feature.description}
                  </p>

                  {/* Mobile CTA - only button navigates */}
                  <div className="flex justify-center mt-[7px] mb-[10px] lg:hidden">
                    <a href={feature.route} className="bg-[#D344FF] text-white rounded-[20px] px-4 py-2 text-sm font-semibold inline-block">Tạo ảnh</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TẠO VIDEO Section */}
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-[50px] mb-[100px]">
          <div className="text-left mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#D344FF] mb-2">TẠO VIDEO</h2>
            <p className="text-white text-sm md:text-base">Khám phá các tool tạo video</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {createVideoFeatures.map((feature, idx) => (
              <div key={idx} className="relative block h-full">
                <a href={feature.route} className="absolute inset-0 z-10 hidden lg:block" aria-hidden="true" />
                {/* Mobile title (outside card) */}
                <h2 className="text-lg font-bold text-white text-center mb-2 lg:hidden">{feature.title}</h2>
                <div className="group rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-[#1E1E1E]">
                  <div className="w-full aspect-[450/260] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0 overflow-hidden">
                    {feature.video ? (
                      <video
                        src={feature.video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : feature.image ? (
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-500 text-xs sm:text-sm md:text-base">Preview</div>
                    )}
                  </div>
                  {/* Desktop title (keep old, hide on mobile) */}
                  <h2 className="hidden lg:block text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white group-hover:bg-gradient-to-b group-hover:from-[#D344FF] group-hover:to-white/70 group-hover:bg-clip-text group-hover:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">{feature.title}</h2>
                  <p className="text-gray-300 text-base text-center leading-relaxed truncate px-2 -mt-1 lg:text-gray-400 lg:text-xs lg:sm:text-sm lg:md:text-base lg:text-left lg:pl-1 lg:sm:pl-1.5 lg:md:pl-2">
                    {feature.description}
                  </p>

                  {/* Mobile CTA - only button navigates */}
                  <div className="flex justify-center mt-[7px] mb-[10px] lg:hidden">
                    <a href={feature.route} className="bg-[#D344FF] text-white rounded-[20px] px-4 py-2 text-sm font-semibold inline-block">Tạo video</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VIDEO TỪ CỘNG ĐỒNG Section */}
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-[50px] mb-[100px]">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#D344FF] mb-2">VIDEO TỪ CỘNG ĐỒNG</h2>
            <p className="text-white text-sm md:text-base">Khám phá các video từ người dùng trên nền tảng</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {communityVideos.map((video, idx) => (
              <a key={idx} className={`block ${idx >= 3 ? 'hidden sm:block' : ''}`} href={video.route}>
                <div className="group rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer bg-[#343434]">
                  <div className="w-full aspect-[1/1.5] bg-[#2a2a2a] rounded-[20px] flex items-center justify-center">
                    <div className="text-gray-500 text-xs sm:text-sm md:text-base">Preview</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
