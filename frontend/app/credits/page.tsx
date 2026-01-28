'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QRPaymentModal from '@/components/QRPaymentModal';
import { Wallet, QrCode } from 'lucide-react';
import axios from 'axios';
import { useSession } from 'next-auth/react';

const packages = [
  { id: 1, coins: 10, price: 10000, title: 'Starter' },
  { id: 2, coins: 20, price: 20000, title: 'Basic' },
  { id: 3, coins: 50, price: 50000, title: 'Pro' },
  { id: 4, coins: 100, price: 100000, title: 'Studio' },
  { id: 5, coins: 500, price: 500000, title: 'Agency' },
];

export default function CreditsPage() {
  const { data: session } = useSession();
  const [selectedPackage, setSelectedPackage] = useState<typeof packages[0] | null>(null);
  const [currentCredits, setCurrentCredits] = useState<number>(0);

  const fetchCredits = async () => {
    // Lấy user_id từ session (đã được lưu từ backend auth)
    const user_id = (session?.user as any)?.id;
    
    if (!user_id) {
      console.error('User ID not found in session');
      setCurrentCredits(0);
      return;
    }
    
    try {
      const response = await axios.get(`/api/users/credits?user_id=${user_id}`);
      if (response.data && response.data.credits !== undefined) {
        setCurrentCredits(response.data.credits);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
      setCurrentCredits(0);
    }
  };

  useEffect(() => {
    if (session) {
      fetchCredits();
    }
    
    // Listen for credits update event
    const handleCreditsUpdate = () => {
      fetchCredits();
    };
    
    window.addEventListener('credits-updated', handleCreditsUpdate);
    return () => {
      window.removeEventListener('credits-updated', handleCreditsUpdate);
    };
  }, [session]);

  const handleQRPayment = (pkg: typeof packages[0]) => {
    setSelectedPackage(pkg);
  };

  const handleClosePaymentModal = useCallback(() => setSelectedPackage(null), []);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-[50px] py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Nạp Thêm Coin</h1>
          <p className="text-gray-400 text-lg">Chọn phương thức thanh toán - Mở khoá sáng tạo</p>
        </div>

        {/* Packages Grid */}
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Top Row - 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.slice(0, 3).map((pkg) => (
              <div
                key={pkg.id}
                className="bg-[#1A1A1A] rounded-[20px] px-[5px] pt-[5px] pb-[5px] hover:shadow-lg transition-shadow flex flex-col"
              >
                {/* Title and Coin Package Details - Wrapped in bg-[#272727] */}
                <div className="bg-[#272727] rounded-[17px] px-3 sm:px-4 md:px-6 py-[10px] mb-[10px]">
                  {/* Title - Top Left */}
                  <div className="text-white text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3 md:mb-4 text-left">
                    {pkg.title}
                  </div>

                  {/* Coin Package Details - Left aligned */}
                  <div className="text-left">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">{pkg.coins}</span>
                      <span className="text-white text-sm sm:text-base">Coin</span>
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-300">
                      <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-sm sm:text-base md:text-lg font-semibold">{pkg.price.toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>
                </div>

                {/* Price Info - Wrapped in bg-[#272727] */}
                <div className="bg-[#272727] rounded-[15px] p-0.5 sm:p-1 md:p-1.5 mb-[18px] w-1/3 self-start">
                  <div className="flex items-center gap-0.5 sm:gap-1 text-[#D344FF]">
                    <Wallet className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                    <span className="text-[10px] sm:text-xs">Giá:</span>
                    <span className="font-semibold text-[#D344FF] text-[10px] sm:text-xs">{pkg.price.toLocaleString('vi-VN')}₫</span>
                  </div>
                </div>

                {/* Payment Button */}
                <button
                  onClick={() => handleQRPayment(pkg)}
                  className="w-full px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 bg-[#D344FF] text-black rounded-[10px] hover:bg-[#B836E6] transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base font-semibold"
                >
                  <QrCode className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <span className="truncate">Chuyển Khoản Qua QR</span>
                </button>
              </div>
            ))}
          </div>

          {/* Bottom Row - 2 cards centered */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:justify-center gap-6">
            {packages.slice(3, 5).map((pkg) => (
              <div
                key={pkg.id}
                className="bg-[#1A1A1A] rounded-[20px] px-[5px] pt-[5px] pb-[5px] hover:shadow-lg transition-shadow lg:max-w-[calc(33.333%-0.75rem)] lg:w-full flex flex-col"
              >
                {/* Title and Coin Package Details - Wrapped in bg-[#272727] */}
                <div className="bg-[#272727] rounded-[17px] px-3 sm:px-4 md:px-6 py-[10px] mb-[10px]">
                  {/* Title - Top Left */}
                  <div className="text-white text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3 md:mb-4 text-left">
                    {pkg.title}
                  </div>

                  {/* Coin Package Details - Left aligned */}
                  <div className="text-left">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">{pkg.coins}</span>
                      <span className="text-white text-sm sm:text-base">Coin</span>
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-300">
                      <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-sm sm:text-base md:text-lg font-semibold">{pkg.price.toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>
                </div>

                {/* Price Info - Wrapped in bg-[#272727] */}
                <div className="bg-[#272727] rounded-[15px] p-0.5 sm:p-1 md:p-1.5 mb-[18px] w-1/3 self-start">
                  <div className="flex items-center gap-0.5 sm:gap-1 text-[#D344FF]">
                    <Wallet className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                    <span className="text-[10px] sm:text-xs">Giá:</span>
                    <span className="font-semibold text-[#D344FF] text-[10px] sm:text-xs">{pkg.price.toLocaleString('vi-VN')}₫</span>
                  </div>
                </div>

                {/* Payment Button */}
                <button
                  onClick={() => handleQRPayment(pkg)}
                  className="w-full px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 bg-[#D344FF] text-black rounded-[10px] hover:bg-[#B836E6] transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base font-semibold"
                >
                  <QrCode className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <span className="truncate">Chuyển Khoản Qua QR</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />

      {selectedPackage && (
        <QRPaymentModal
          package={selectedPackage}
          onClose={handleClosePaymentModal}
        />
      )}
    </div>
  );
}
