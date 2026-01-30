'use client';

import { Suspense, useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image as ImageIcon, Loader2, Download, Heart } from 'lucide-react';
import axios from 'axios';
import LoadingPreview from '@/components/LoadingPreview';
import { isImageUrl, validateFile, truncateFilenameForTooltip } from '@/lib/utils';
import { useFeaturePage } from '@/hooks/useFeaturePage';
import { FILE_TYPES, FILE_SIZES } from '@/lib/constants';

// Số coin hiển thị trên nút = số coin trừ khi ấn (dùng chung SKIN_EDIT_COST)
const SKIN_EDIT_COST = 0.8;

type SkinType = 'smooth' | 'real' | 'imperfect' | null;

function SkinEditPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [fileNameTooltip, setFileNameTooltip] = useState<{ x: number; y: number } | null>(null);
  const [favoriteJobs, setFavoriteJobs] = useState<Set<string>>(new Set());
  const [skinType, setSkinType] = useState<SkinType>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const {
    session,
    isGenerating,
    setIsGenerating,
    jobId,
    setJobId,
    previewUrl,
    setPreviewUrl,
    currentDisplayJob,
    progress,
    startPolling,
    handleDelete,
  } = useFeaturePage({
    featureType: 'skin-edit',
    apiEndpoint: '/api/videos/skin-edit',
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateFile(file, [...FILE_TYPES.image], FILE_SIZES.image, 'ảnh');
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleGenerate = async () => {
    const user_id = (session?.user as any)?.id;
    if (!user_id) {
      const qs = searchParams?.toString();
      const basePath = pathname || '/';
      const callbackUrl = qs ? `${basePath}?${qs}` : basePath;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    if (!imageFile) {
      alert('Vui lòng tải lên ảnh!');
      return;
    }

    setIsGenerating(true);
    const formData = new FormData();
    formData.append('file', imageFile);
    if (skinType) formData.append('skin_type', skinType);
    formData.append('user_id', user_id);

    try {
      const response = await axios.post('/api/videos/skin-edit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJobId(response.data.job_id);
      // Trừ đúng số coin đã hiển thị trên nút (SKIN_EDIT_COST)
      window.dispatchEvent(
        new CustomEvent('credits-updated', { detail: { amount: SKIN_EDIT_COST } })
      );

      startPolling(response.data.job_id);
    } catch (error: any) {
      if (error.response?.status === 402) {
        const qs = searchParams?.toString();
        const basePath = pathname || '/';
        const callbackUrl = qs ? `${basePath}?${qs}` : basePath;
        router.push(`/credits?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      } else {
        alert(
          'Có lỗi xảy ra: ' + (error.response?.data?.message || error.message)
        );
      }
      setIsGenerating(false);
    }
  };

  const displayUrl =
    currentDisplayJob?.result_url ||
    (imageFile ? imagePreviewUrl : previewUrl) ||
    null;
  const hasPreview = !!displayUrl && isImageUrl(displayUrl);

  // Load favorites from localStorage on mount
  useEffect(() => {
    if (session) {
      const user_id = (session.user as any)?.id;
      if (user_id) {
        const savedFavorites = localStorage.getItem(`favorites_${user_id}`);
        if (savedFavorites) {
          try {
            setFavoriteJobs(new Set(JSON.parse(savedFavorites)));
          } catch (e) {
            console.error('Error loading favorites:', e);
          }
        }
      }
    }
  }, [session]);

  const truncateFileName = (fileName: string, maxLength: number = 15) => {
    if (fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncated = nameWithoutExt.substring(0, maxLength);
    return `${truncated}...${extension}`;
  };

  const handleDownload = async () => {
    if (!displayUrl) return;
    try {
      const response = await fetch(displayUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const fileName = displayUrl.split('/').pop() || `skin-edit-${Date.now()}.jpg`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      window.open(displayUrl, '_blank');
    }
  };

  const toggleFavorite = (jobId: string) => {
    setFavoriteJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      if (session) {
        const user_id = (session.user as any)?.id;
        if (user_id) {
          localStorage.setItem(`favorites_${user_id}`, JSON.stringify(Array.from(newSet)));
        }
      }
      return newSet;
    });
  };

  const handleFavoriteClick = () => {
    if (currentDisplayJob?.id) {
      toggleFavorite(currentDisplayJob.id);
      router.push('/dashboard');
    } else if (previewUrl && imageFile) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="w-full">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-[50px] py-8 md:py-12">
          <div className="bg-[#151515] rounded-[50px] border border-gray-800/50 py-[25px] px-[25px] max-w-[1119px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Left Column - Input and Controls (1/3) */}
              <div className="flex flex-col space-y-6 lg:col-span-1 justify-start">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                    Chỉnh Sửa Da
                  </h1>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Chỉnh sửa da trong ảnh
                  </p>
                </div>

                {/* Image Upload Area */}
                <div>
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <div
                      className="bg-[#1A1A1A] rounded-[20px] p-8 sm:p-12 text-center flex flex-col items-center justify-center aspect-[298/400] hover:bg-[#333333] transition-colors border border-gray-600/50 overflow-hidden relative"
                      onMouseMove={(e) => imageFile && setFileNameTooltip({ x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setFileNameTooltip(null)}
                    >
                      <input
                        accept="image/*"
                        className="hidden"
                        id="file-upload"
                        type="file"
                        onChange={handleImageUpload}
                      />
                      {fileNameTooltip && imageFile && (
                        <div
                          className="fixed z-[100] pointer-events-none px-2 py-1 bg-black/85 text-white text-xs rounded shadow-lg whitespace-nowrap"
                          style={{ left: fileNameTooltip.x + 12, top: fileNameTooltip.y + 12 }}
                        >
                          {truncateFilenameForTooltip(imageFile.name)}
                        </div>
                      )}
                      {imagePreviewUrl ? (
                        <img
                          src={imagePreviewUrl}
                          alt="Ảnh cần chỉnh da"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center mb-4">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-400 text-sm sm:text-base">
                            {imageFile ? truncateFileName(imageFile.name) : 'Thêm ảnh ở đây'}
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {/* Skin Type Selection */}
                <div>
                  <h2 className="text-white text-lg font-semibold mb-4">Chọn loại da:</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Smooth */}
                    <button
                      onClick={() => setSkinType('smooth')}
                      className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                        skinType === 'smooth'
                          ? 'ring-2 ring-[#D344FF] ring-offset-2 ring-offset-[#151515]'
                          : 'hover:opacity-90'
                      }`}
                    >
                      <img
                        src="/skin-edit/min.jpg"
                        alt="Mịn"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 text-white text-[10px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        Mịn
                      </span>
                    </button>

                    {/* Real */}
                    <button
                      onClick={() => setSkinType('real')}
                      className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                        skinType === 'real'
                          ? 'ring-2 ring-[#D344FF] ring-offset-2 ring-offset-[#151515]'
                          : 'hover:opacity-90'
                      }`}
                    >
                      <img
                        src="/skin-edit/that.jpg"
                        alt="Thật"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 text-white text-[10px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        Thật
                      </span>
                    </button>

                    {/* Imperfect */}
                    <button
                      onClick={() => setSkinType('imperfect')}
                      className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                        skinType === 'imperfect'
                          ? 'ring-2 ring-[#D344FF] ring-offset-2 ring-offset-[#151515]'
                          : 'hover:opacity-90'
                      }`}
                    >
                      <img
                        src="/skin-edit/khonghoanhao.jpg"
                        alt="không hoàn hảo"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 text-white text-[10px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        không hoàn hảo
                      </span>
                    </button>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#D344FF] to-[#FF6B9D] text-white rounded-[20px] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <span>Tạo ảnh</span>
                      <span className="bg-white/20 px-2 py-1 rounded-lg text-sm font-normal">
                        {SKIN_EDIT_COST} Coin
                      </span>
                    </>
                  )}
                </button>

                {/* Progress */}
                {isGenerating && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm">Đang xử lý...</span>
                      <span className="text-[#D344FF] text-sm font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#D344FF] to-[#FF6B9D] h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Preview (2/3) */}
              <div className="relative lg:col-span-2">
                <div className="bg-[#1A1A1A] rounded-[20px] p-8 sm:p-12 aspect-[1119/1300] flex items-center justify-center relative border border-gray-600/50">
                  {isGenerating ? (
                    <LoadingPreview progress={progress} />
                  ) : hasPreview && displayUrl ? (
                    <img
                      src={displayUrl}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-500 text-lg">Ảnh preview</p>
                  )}
                </div>

                {/* Action Buttons - Top Right */}
                {hasPreview && displayUrl ? (
                  <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                    <button
                      onClick={handleFavoriteClick}
                      className="w-10 h-10 bg-[#2a2a2a]/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-[#2a2a2a] transition-colors border border-white/10 cursor-pointer"
                    >
                      <Heart
                        className={`w-5 h-5 ${currentDisplayJob?.id && favoriteJobs.has(currentDisplayJob.id) ? 'text-red-500' : 'text-white'}`}
                        fill={currentDisplayJob?.id && favoriteJobs.has(currentDisplayJob.id) ? 'red' : 'none'}
                      />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="w-10 h-10 bg-[#2a2a2a]/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-[#2a2a2a] transition-colors border border-white/10 cursor-pointer"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SkinEditPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SkinEditPageInner />
    </Suspense>
  );
}
