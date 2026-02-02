'use client';

import { Suspense, useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image as ImageIcon, Loader2, Download, Heart } from 'lucide-react';
import axios from 'axios';
import LoadingPreview from '@/components/LoadingPreview';
import { isImageUrl, validateFile } from '@/lib/utils';
import { useFeaturePage } from '@/hooks/useFeaturePage';
import { FILE_TYPES, FILE_SIZES } from '@/lib/constants';
import { useToast } from '@/contexts/ToastContext';

const FACE_SWAP_COST = 0.5;

function FaceSwapPageInner() {
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [targetPreviewUrl, setTargetPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceFile) {
      setSourcePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(sourceFile);
    setSourcePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [sourceFile]);

  useEffect(() => {
    if (!targetFile) {
      setTargetPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(targetFile);
    setTargetPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [targetFile]);

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
    featureType: 'face-swap',
    apiEndpoint: '/api/videos/face-swap',
  });

  const handleSourceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateFile(file, [...FILE_TYPES.image], FILE_SIZES.image, 'ảnh');
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return;
      }
      setSourceFile(file);
    }
  };

  const handleTargetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateFile(file, [...FILE_TYPES.image], FILE_SIZES.image, 'ảnh');
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return;
      }
      setTargetFile(file);
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

    if (!sourceFile || !targetFile) {
      showToast('Vui lòng tải lên cả ảnh nguồn và ảnh đích!', 'error');
      return;
    }

    setIsGenerating(true);
    const formData = new FormData();
    formData.append('source_image', sourceFile);
    formData.append('target_image', targetFile);
    formData.append('quality', '720P');
    formData.append('user_id', user_id);

    try {
      const response = await axios.post('/api/videos/face-swap', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJobId(response.data.job_id);

      window.dispatchEvent(
        new CustomEvent('credits-updated', { detail: { amount: FACE_SWAP_COST } })
      );

      startPolling(response.data.job_id);
    } catch (error: any) {
      if (error.response?.status === 402) {
        const qs = searchParams?.toString();
        const basePath = pathname || '/';
        const callbackUrl = qs ? `${basePath}?${qs}` : basePath;
        router.push(`/credits?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      } else {
        showToast(
          'Có lỗi xảy ra: ' + (error.response?.data?.message || error.message),
          'error'
        );
      }
      setIsGenerating(false);
    }
  };

  const displayUrl =
    currentDisplayJob?.result_url ||
    (sourceFile ? sourcePreviewUrl : previewUrl) ||
    null;
  const hasPreview = !!displayUrl && isImageUrl(displayUrl);

  const handleDownload = () => {
    if (!displayUrl) return;
    const link = document.createElement('a');
    link.href = displayUrl;
    link.download = `face-swap-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Header />
      <main className="w-full">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
          <div className="bg-[#1A1A1A] rounded-[20px] p-6 md:p-8 flex flex-col lg:flex-row gap-6 md:gap-8">
            <div className="flex-1 flex flex-col min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
                Thay Khuôn Mặt
              </h1>
              <p className="text-gray-400 text-sm md:text-base mb-0.5">
                Thay khuôn mặt từ ảnh nguồn sang ảnh đích
              </p>
              <p className="text-gray-500 text-xs mb-6">
                Note: Ảnh rõ nét, khuôn mặt nhìn thẳng
              </p>

              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                <label
                  htmlFor="source-upload"
                  className="bg-[#252525] rounded-[16px] aspect-3/4 flex flex-col items-center justify-center cursor-pointer hover:bg-[#2a2a2a] transition-colors border-2 border-dashed border-gray-600/50 hover:border-[#D344FF]/40 overflow-hidden"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSourceUpload}
                    className="hidden"
                    id="source-upload"
                  />
                  {sourcePreviewUrl ? (
                    <img
                      src={sourcePreviewUrl}
                      alt="Ảnh nguồn"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <ImageIcon className="w-10 h-10 text-gray-500 mb-2" />
                      <span className="text-white font-semibold text-sm text-center px-2">
                        Thêm ảnh nguồn
                      </span>
                      <span className="text-gray-500 text-xs mt-1">
                        Khuôn mặt cần thay
                      </span>
                    </>
                  )}
                </label>

                <label
                  htmlFor="target-upload"
                  className="bg-[#252525] rounded-[16px] aspect-3/4 flex flex-col items-center justify-center cursor-pointer hover:bg-[#2a2a2a] transition-colors border-2 border-dashed border-gray-600/50 hover:border-[#D344FF]/40 overflow-hidden"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTargetUpload}
                    className="hidden"
                    id="target-upload"
                  />
                  {targetPreviewUrl ? (
                    <img
                      src={targetPreviewUrl}
                      alt="Ảnh đích"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <ImageIcon className="w-10 h-10 text-gray-500 mb-2" />
                      <span className="text-white font-semibold text-sm text-center px-2">
                        Thêm ảnh đích
                      </span>
                      <span className="text-gray-500 text-xs mt-1">
                        Ảnh sẽ được thay khuôn mặt
                      </span>
                    </>
                  )}
                </label>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3.5 rounded-[16px] bg-gradient-to-r from-[#D344FF] to-[#B836E6] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 transition-opacity"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang tạo ảnh...</span>
                  </>
                ) : (
                  <>
                    <span>Tạo ảnh</span>
                    <span className="text-white/90 text-sm">
                      {FACE_SWAP_COST} Coin
                    </span>
                  </>
                )}
              </button>

              {isGenerating && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                    <span>Đang xử lý...</span>
                    <span className="text-[#D344FF]">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D344FF] rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 min-h-[320px] lg:min-h-[400px] relative">
              <div className="bg-[#252525] rounded-[20px] w-full h-full min-h-[320px] flex items-center justify-center overflow-hidden relative">
                {isGenerating && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#252525]/90">
                    <LoadingPreview progress={progress} />
                  </div>
                )}

                {!isGenerating && hasPreview && (
                  <img
                    src={displayUrl}
                    alt="Kết quả"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                )}

                {!isGenerating && !hasPreview && (
                  <span className="text-gray-500 text-base md:text-lg">
                    Ảnh preview
                  </span>
                )}

                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                  <button
                    type="button"
                    className="w-10 h-10 bg-[#2a2a2a]/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-[#2a2a2a] transition-colors border border-white/10 cursor-pointer"
                    aria-label="Yêu thích"
                  >
                    <Heart className="w-5 h-5 text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!hasPreview}
                    className="w-10 h-10 bg-[#2a2a2a]/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-[#2a2a2a] transition-colors border border-white/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Tải xuống"
                  >
                    <Download className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function FaceSwapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0d0d]" />}>
      <FaceSwapPageInner />
    </Suspense>
  );
}
