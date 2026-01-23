'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full">
      {/* Main Purple Section */}
      <div className="bg-[#D344FF] relative pt-16 md:pt-24 pb-[5px]">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-[50px]">
          {/* Brand Name - Center */}
          <div className="text-center mb-6">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-black via-[#8B2AB3] to-[#8B2AB3] bg-clip-text text-transparent">
              Surreal AI
            </h2>
          </div>

          {/* Slogan - Center */}
          <div className="text-center mb-12 md:mb-16">
            <p className="text-black text-lg md:text-xl lg:text-2xl font-medium">
              Công cụ AI tối thượng nằm trong tay bạn
            </p>
          </div>

          {/* Bottom Section - Location and Social Links */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 md:mt-16">
            {/* Location - Bottom Left */}
            <div className="text-black text-sm md:text-base">
              Mỹ Đình, Hà Nội, Việt Nam
            </div>

            {/* Social Links - Bottom Right */}
            <div className="flex items-center gap-4 text-black text-sm md:text-base">
              <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors">
                X / Twitter
              </Link>
              <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors">
                Facebook
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Copyright Section - Black */}
      <div className="bg-black py-4 border-t border-gray-800">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-[50px]">
          <p className="text-center text-white text-xs md:text-sm">
            © 2026 Surreal AI™. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

