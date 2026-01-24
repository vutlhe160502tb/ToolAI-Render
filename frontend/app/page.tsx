import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  // Main Features Section - 4 cards ngang
  const mainFeatures = [
    {
      title: 'Tạo Ảnh',
      description: 'Biến mọi trí tưởng tượng thành hiện thực',
      route: '/create-image',
    },
    {
      title: 'Tạo Video',
      description: 'Biến ảnh tĩnh nhàm chán trở nên hấp dẫn hơn',
      route: '/create-video',
    },
    {
      title: 'Tạo Chuyển Động',
      description: 'Tạo nhân vật AI chuyển động theo ý muốn',
      route: '/dance-image-bg',
    },
    {
      title: 'Làm Nét Ảnh',
      description: 'Tăng chất lượng hình ảnh lên tới 4k',
      route: '/upscale-image',
    },
  ];

  // Top Choices Section - 4 cards ngang
  const topChoices = [
    {
      title: 'Google Banana Pro',
      description: 'Model tạo ảnh tốt nhất hiện nay',
      route: '/models/google-banana-pro',
    },
    {
      title: 'Nhảy Với Nền Từ Ảnh',
      description: 'AI sẽ tạo video nhảy dùng nền từ ảnh gốc',
      route: '/dance-image-bg',
    },
    {
      title: 'Nhảy Với Nền Từ Video',
      description: 'AI sẽ tạo video nhảy dùng nền từ video gốc',
      route: '/dance-video-bg',
    },
    {
      title: 'Thay Trang Phục',
      description: 'Thay mọi trang phục bạn muốn',
      route: '/change-outfit',
    },
  ];

  // TẠO ẢNH Section - 8 cards
  const createImageFeatures = [
    {
      title: 'Google Banana Pro',
      description: 'Model tạo ảnh 2k 4k tốt nhất hiện nay',
      route: '/models/google-banana-pro',
    },
    {
      title: 'Người Mẫu Giới Thiệu Sản Phẩm',
      description: 'Ghép người mẫu và sản phẩm tuỳ biến',
      route: '/product-model',
    },
    {
      title: 'Thay Trang Phục',
      description: 'Thay mọi trang phục bạn muốn',
      route: '/change-outfit',
    },
    {
      title: 'Chỉnh Sửa Da',
      description: 'Làn da nhân vật thực tế hơn',
      route: '/skin-edit',
    },
    {
      title: 'Face Swap',
      description: 'Thay thế và hoà không',
      route: '/face-swap',
    },
    {
      title: 'Character Swap',
      description: 'Thay thế và hoán đổi nhân vật',
      route: '/character-swap',
    },
    {
      title: 'Character Swap',
      description: 'Thay thế và hoán đổi nhân vật',
      route: '/character-swap-2',
    },
    {
      title: 'Làm Nét Ảnh',
      description: 'Tăng chất lượng hình ảnh tới 4k',
      route: '/upscale-image',
    },
  ];

  // TẠO VIDEO Section - 8 cards
  const createVideoFeatures = [
    {
      title: 'Tạo Chuyển Động',
      description: 'Tạo nhân vật AI chuyển động theo ý muốn',
      route: '/dance-image-bg',
    },
    {
      title: 'Edit Video',
      description: 'Tuỳ chỉnh và thay đổi chi tiết video',
      route: '/edit-video',
    },
    {
      title: 'Nhảy Với Nền Từ Ảnh',
      description: 'AI sẽ tạo video nhảy dùng nền từ ảnh gốc',
      route: '/dance-image-bg',
    },
    {
      title: 'Nhảy Với Nền Từ Video',
      description: 'AI sẽ tạo video nhảy dùng nền từ video gốc',
      route: '/dance-video-bg',
    },
    {
      title: 'Thay Nhân Vật Quảng Cáo',
      description: 'AI sẽ tạo video thay nhân vật quảng cáo',
      route: '/replace-ad',
    },
    {
      title: 'Thay Nhân Vật Quảng Cáo',
      description: 'AI tạo video thay nhân vật quảng cáo',
      route: '/replace-ad-2',
    },
    {
      title: 'Giới Thiệu Sản Phẩm Theo Âm Thanh',
      description: 'AI sẽ tạo video nói theo lời thoại',
      route: '/product-intro-audio',
    },
    {
      title: 'Lips Sync',
      description: 'AI sẽ nhại theo tiếng file âm thanh',
      route: '/lip-sync',
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
              Surreal.AI
            </h1>
          </div>
        </div>

        {/* Main Features Section - 4 cards ngang */}
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-[50px] mb-[100px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {mainFeatures.map((feature, idx) => (
              <a key={idx} className="block h-full" href={feature.route}>
                <div className="group rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-black border border-black">
                  <div className="w-full aspect-[4/3] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0">
                    <div className="text-gray-500 text-xs sm:text-xs md:text-sm">Preview</div>
                  </div>
                  <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white group-hover:bg-gradient-to-b group-hover:from-[#D344FF] group-hover:to-white/70 group-hover:bg-clip-text group-hover:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">{feature.title}</h2>
                  <p className="text-gray-400 text-xs sm:text-xs md:text-sm leading-relaxed truncate shrink pl-1 sm:pl-1.5 md:pl-2 -mt-1">{feature.description}</p>
                </div>
              </a>
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
            {topChoices.map((feature, idx) => (
              <a key={idx} className="block h-full" href={feature.route}>
                <div className="group rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-[#1E1E1E]">
                  <div className="w-full aspect-[4/3] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0">
                    <div className="text-gray-500 text-xs sm:text-sm md:text-base">Preview</div>
                  </div>
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white group-hover:bg-gradient-to-b group-hover:from-[#D344FF] group-hover:to-white/70 group-hover:bg-clip-text group-hover:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">{feature.title}</h2>
                  <p className="text-gray-400 text-xs sm:text-sm md:text-base leading-relaxed truncate shrink pl-1 sm:pl-1.5 md:pl-2 -mt-1">{feature.description}</p>
                </div>
              </a>
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
            {createImageFeatures.map((feature, idx) => (
              <a key={idx} className="block h-full" href={feature.route}>
                <div className="group rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-[#1E1E1E]">
                  <div className="w-full aspect-[4/3] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0">
                    <div className="text-gray-500 text-xs sm:text-sm md:text-base">Preview</div>
                  </div>
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white group-hover:bg-gradient-to-b group-hover:from-[#D344FF] group-hover:to-white/70 group-hover:bg-clip-text group-hover:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">{feature.title}</h2>
                  <p className="text-gray-400 text-xs sm:text-sm md:text-base leading-relaxed truncate shrink pl-1 sm:pl-1.5 md:pl-2 -mt-1">{feature.description}</p>
                </div>
              </a>
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
              <a key={idx} className="block h-full" href={feature.route}>
                <div className="group rounded-[25px] p-1 sm:p-1.5 md:p-2 transition-all cursor-pointer flex flex-col bg-[#1E1E1E]">
                  <div className="w-full aspect-[4/3] bg-[#2a2a2a] rounded-[20px] mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shrink-0">
                    <div className="text-gray-500 text-xs sm:text-sm md:text-base">Preview</div>
                  </div>
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white group-hover:bg-gradient-to-b group-hover:from-[#D344FF] group-hover:to-white/70 group-hover:bg-clip-text group-hover:text-transparent mb-[5px] transition-all truncate pl-1 sm:pl-1.5 md:pl-2">{feature.title}</h2>
                  <p className="text-gray-400 text-xs sm:text-sm md:text-base leading-relaxed truncate shrink pl-1 sm:pl-1.5 md:pl-2 -mt-1">{feature.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* VIDEO TỪ CỘNG ĐỒNG Section */}
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-[50px] mb-[100px]">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#D344FF] mb-2">VIDEO TỪ CỘNG ĐỒNG</h2>
            <p className="text-white text-sm md:text-base">Khám phá các video từ người dùng trên nền tảng</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mx-[100px]">
            {communityVideos.map((video, idx) => (
              <a key={idx} className="block" href={video.route}>
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
