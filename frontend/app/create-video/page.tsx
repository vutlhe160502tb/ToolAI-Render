'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Upload, Video, Loader2, RotateCcw, Trash2, Image as ImageIcon, ArrowRight } from 'lucide-react';
import axios from 'axios';
import LoadingPreview from '@/components/LoadingPreview';
import VideoDurationInfo from '@/components/VideoDurationInfo';
import { isImageUrl, formatDate, validateFile, truncateFilenameForTooltip } from '@/lib/utils';
import { VideoJob } from '@/lib/types';
import { useFeaturePage } from '@/hooks/useFeaturePage';
import { FILE_TYPES, FILE_SIZES } from '@/lib/constants';
import { useToast } from '@/contexts/ToastContext';

function CreateVideoPageInner() {
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileNameTooltip, setFileNameTooltip] = useState<{ x: number; y: number } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [quality, setQuality] = useState('720P');
  const [qualityCost, setQualityCost] = useState(1);
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const qualityRef = useRef<HTMLDivElement>(null);
  
  const {
    session,
    isGenerating,
    setIsGenerating,
    serverProgress,
    setServerProgress,
    jobId,
    setJobId,
    previewUrl,
    setPreviewUrl,
    currentDisplayJob,
    setCurrentDisplayJob,
    progress,
    startPolling,
    handleDelete,
  } = useFeaturePage({
    featureType: 'create-video',
    apiEndpoint: '/api/videos/create-video',
  });

  // Preview URL cho file đã chọn (chỉ hiển thị trong ô upload)
  useEffect(() => {
    if (!file) {
      setFilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Close quality dropdown (desktop) when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (qualityRef.current && !qualityRef.current.contains(event.target as Node)) {
        setIsQualityOpen(false);
      }
    };

    if (isQualityOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isQualityOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const allowedTypes = [...FILE_TYPES.image, ...FILE_TYPES.video];
      const validation = validateFile(f, allowedTypes, FILE_SIZES.video, 'file');
      if (!validation.valid) {
        showToast(validation.error ?? 'Lỗi validation', 'error');
        return;
      }
      setFile(f);
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

    setIsGenerating(true);
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (prompt) formData.append('prompt', prompt);
    if (quality) formData.append('quality', quality);
    formData.append('user_id', user_id);

    try {
      const response = await axios.post('/api/videos/create-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJobId(response.data.job_id);
      
      // Trigger credits update event for real-time update with amount to deduct
      window.dispatchEvent(new CustomEvent('credits-updated', {
        detail: { amount: qualityCost }
      }));
      
      startPolling(response.data.job_id);
    } catch (error: any) {
      if (error.response?.status === 402) {
        const qs = searchParams?.toString();
        const basePath = pathname || '/';
        const callbackUrl = qs ? `${basePath}?${qs}` : basePath;
        router.push(`/credits?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      } else {
        showToast('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message), 'error');
      }
      setIsGenerating(false);
    }
  };


  const isVideoFile = (file: File | null) => {
    if (!file) return false;
    return file.type.startsWith('video/');
  };

  const handleRerun = async (job: VideoJob) => {
    if (!job.input_file_url && !job.prompt) {
      showToast('Không thể rerun job này vì thiếu thông tin input!', 'error');
      return;
    }

    const user_id = (session?.user as any)?.id;
    if (!user_id) {
      const qs = searchParams?.toString();
      const basePath = pathname || '/';
      const callbackUrl = qs ? `${basePath}?${qs}` : basePath;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    setIsGenerating(true);
    const formData = new FormData();
    
    if (job.input_file_url) {
      try {
        const fileResponse = await fetch(job.input_file_url);
        const blob = await fileResponse.blob();
        const fileName = job.input_file_url.split('/').pop() || 'file';
        const file = new File([blob], fileName, { type: blob.type });
        formData.append('file', file);
      } catch (error) {
        console.error('Error downloading file:', error);
      }
    }
    
    if (job.prompt) {
      formData.append('prompt', job.prompt);
    }
    formData.append('user_id', user_id);

    try {
      const response = await axios.post('/api/videos/create-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJobId(response.data.job_id);
      
      // Trigger credits update event for real-time update with amount to deduct
      window.dispatchEvent(new CustomEvent('credits-updated', {
        detail: { amount: qualityCost }
      }));
      
      startPolling(response.data.job_id);
    } catch (error: any) {
      if (error.response?.status === 402) {
        const qs = searchParams?.toString();
        const basePath = pathname || '/';
        const callbackUrl = qs ? `${basePath}?${qs}` : basePath;
        router.push(`/credits?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      } else {
        showToast('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message), 'error');
      }
      setIsGenerating(false);
    }
  };


  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="w-full">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-[50px] py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 min-h-[calc(100vh-200px)]">
            {/* Left Column - Controls */}
            <div className="lg:col-span-4 flex flex-col min-w-0">
              <div className="bg-[#1A1A1A] rounded-[20px] pt-[10px] pb-6 px-4 sm:px-6 border-b border-gray-400/30 h-fit w-full min-w-0">
                <h1 className="block text-lg sm:text-xl font-medium text-white mb-[15px] pb-[10px] border-b border-gray-400/30 -mx-4 sm:-mx-6 px-4 sm:px-6">Tạo video</h1>
                
                {/* Preview Card */}
                <div className="bg-[#2a2a2a] rounded-[25px] p-4 sm:p-6 mb-4 sm:mb-6 aspect-[450/260] overflow-hidden w-full min-w-0 relative">
                  <video
                    src="/taovideo.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                    <div className="text-[#D344FF] font-semibold mb-2 break-words" style={{ fontSize: 'clamp(0.875rem, 3vw, 1.25rem)' }}>Motion Control</div>
                    <p className="text-gray-400 break-words" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)' }}>Biến ảnh tĩnh nhàm chán trở nên hấp dẫn hơn</p>
                  </div>
                </div>
                
                {/* Upload Area */}
                <div className="mb-4 sm:mb-6 w-full min-w-0">
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <div
                      className="bg-[#252525] rounded-[20px] p-4 sm:p-6 text-center flex flex-col items-center justify-center min-h-[170px] sm:min-h-[220px] overflow-hidden relative"
                      onMouseMove={(e) => file && setFileNameTooltip({ x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setFileNameTooltip(null)}
                    >
                      <input
                        accept="image/*,video/*"
                        className="hidden"
                        id="file-upload"
                        type="file"
                        onChange={handleFileUpload}
                      />
                      {fileNameTooltip && file && (
                        <div
                          className="fixed z-[100] pointer-events-none px-2 py-1 bg-black/85 text-white text-xs rounded shadow-lg whitespace-nowrap"
                          style={{ left: fileNameTooltip.x + 12, top: fileNameTooltip.y + 12 }}
                        >
                          {truncateFilenameForTooltip(file.name)}
                        </div>
                      )}
                      {filePreviewUrl ? (
                        isVideoFile(file) ? (
                          <video
                            src={filePreviewUrl}
                            className="w-full h-full min-h-[170px] sm:min-h-[220px] object-cover rounded-lg absolute inset-0"
                            muted
                            loop
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={filePreviewUrl}
                            alt="Ảnh đã chọn"
                            className="w-full h-full min-h-[170px] sm:min-h-[220px] object-cover rounded-lg absolute inset-0"
                          />
                        )
                      ) : (
                        <>
                          <Video className="text-white mx-auto mb-2 shrink-0" style={{ width: 'clamp(1.5rem, 5vw, 2.5rem)', height: 'clamp(1.5rem, 5vw, 2.5rem)' }} />
                          <div className="text-white font-semibold mb-1 break-words leading-tight" style={{ fontSize: 'clamp(0.75rem, 3vw, 1rem)' }}>
                            Tải lên file (ảnh hoặc video, tùy chọn)
                          </div>
                          <div className="text-gray-400 break-words leading-tight mt-1" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.875rem)' }}>
                            Chọn file từ máy tính
                          </div>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {/* Quality Selector */}
                <div className="mb-4 sm:mb-6 w-full min-w-0">
                  <label className="text-white mb-2 block break-words" style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}>
                    Chất lượng
                  </label>
                  {/* Mobile: pill switch */}
                  <div className="flex gap-2 bg-[#1a1a1a] rounded-[10px] p-1 w-full min-w-0 lg:hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setQuality('720P');
                        setQualityCost(1);
                      }}
                      className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-[7px] transition-all min-w-0 overflow-hidden flex flex-col items-center justify-center ${
                        quality === '720P' ? 'bg-[#4C4C4C] text-white' : 'bg-transparent text-gray-400 hover:bg-[#3a3a3a]'
                      }`}
                    >
                      <span className="font-semibold leading-tight" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>720P</span>
                      <span className="leading-tight opacity-80" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>Tốn 1 coin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuality('1080P');
                        setQualityCost(2);
                      }}
                      className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-[7px] transition-all min-w-0 overflow-hidden flex flex-col items-center justify-center ${
                        quality === '1080P' ? 'bg-[#4C4C4C] text-white' : 'bg-transparent text-gray-400 hover:bg-[#3a3a3a]'
                      }`}
                    >
                      <span className="font-semibold leading-tight" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>1080P</span>
                      <span className="leading-tight opacity-80" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>Tốn 2 coin</span>
                    </button>
                  </div>

                  {/* Desktop: dropdown (old behavior) */}
                  <div className="hidden lg:block relative w-full min-w-0" ref={qualityRef}>
                    <div
                      className="flex items-center justify-between bg-[#252525] rounded-[20px] px-3 sm:px-4 py-2 cursor-pointer hover:bg-[#3a3a3a] transition-all relative overflow-hidden w-full min-w-0"
                      onClick={() => setIsQualityOpen(!isQualityOpen)}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <label className="text-white mb-1 break-words" style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}>Chất lượng</label>
                        <span className="text-white font-semibold break-words" style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}>
                          {quality}
                        </span>
                      </div>
                      <ArrowRight className="text-gray-400 shrink-0 ml-2" style={{ width: 'clamp(0.625rem, 3vw, 1rem)', height: 'clamp(0.625rem, 3vw, 1rem)' }} />
                    </div>

                    {isQualityOpen && (
                      <div className="absolute left-full top-0 ml-2 bg-[#1a1a1a] rounded-[20px] p-1.5 z-10 w-[170px]">
                        <div
                          onClick={() => {
                            setQuality('720P');
                            setQualityCost(1);
                            setIsQualityOpen(false);
                          }}
                          className={`p-2 rounded-[10px] cursor-pointer transition-all mb-1.5 ${
                            quality === '720P' ? 'bg-[#2a2a2a]' : 'bg-[#1a1a1a] hover:bg-[#2a2a2a]'
                          }`}
                        >
                          <div className="text-white text-sm font-semibold mb-0.5">720P</div>
                          <div className="text-gray-400 text-xs">Tốn 1 coin</div>
                        </div>
                        <div
                          onClick={() => {
                            setQuality('1080P');
                            setQualityCost(2);
                            setIsQualityOpen(false);
                          }}
                          className={`p-2 rounded-[10px] cursor-pointer transition-all ${
                            quality === '1080P' ? 'bg-[#2a2a2a]' : 'bg-[#1a1a1a] hover:bg-[#2a2a2a]'
                          }`}
                        >
                          <div className="text-white text-sm font-semibold mb-0.5">1080P</div>
                          <div className="text-gray-400 text-xs">Tốn 2 coin</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prompt - luôn hiện */}
                <div className="mb-4 sm:mb-6 w-full min-w-0 bg-[#2a2a2a] rounded-[20px] p-3 sm:p-4 overflow-hidden">
                  <div className="text-white font-semibold mb-2 break-words" style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}>Prompt</div>
                  <p className="text-white mb-3 break-words leading-tight" style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}>
                    Bạn có thể miêu tả thêm cho video như nền hay đồ vật hay chi tiết của người để thêm sinh động.
                  </p>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Nhập prompt của bạn..."
                    className="w-full bg-[#1a1a1a] text-white rounded-lg px-3 sm:px-4 py-2 sm:py-3 min-h-[100px] sm:min-h-[120px] focus:outline-none resize-none break-words"
                    style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}
                  />
                </div>

                {/* Progress */}
                {isGenerating && (
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm">Đang xử lý...</span>
                      <span className="text-[#D344FF] text-sm">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-[#D344FF] h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-[#D344FF] text-white rounded-[20px] hover:bg-[#B836E6] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                      <span className="break-words whitespace-nowrap" style={{ fontSize: 'clamp(0.75rem, 3vw, 1rem)' }}>Đang tạo video...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5 shrink-0" />
                      <span className="break-words whitespace-nowrap" style={{ fontSize: 'clamp(0.75rem, 3vw, 1rem)' }}>Tạo</span>
                      <span className="shrink-0 whitespace-nowrap" style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}>{qualityCost} Coin</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Middle Column - Preview (hide on mobile) */}
            <div className="hidden lg:col-span-6 lg:flex items-center justify-center min-h-[400px] lg:min-h-0">
              <div className="w-full h-full bg-[#1A1A1A] rounded-[25px] flex items-center justify-center p-4 sm:p-8">
                {(() => {
                  // Hiển thị loading khi đang generating
                  if (isGenerating) {
                    return <LoadingPreview progress={progress} />;
                  }
                  
                  const displayUrl = currentDisplayJob?.result_url || previewUrl;
                  if (displayUrl) {
                    if (isImageUrl(displayUrl)) {
                      return (
                        <img
                          src={displayUrl}
                          alt="Result"
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      );
                    }
                    // Video removed - only show images
                  }
                  return (
                    <div className="text-center">
                      <div className="text-[#D344FF] text-xl sm:text-2xl font-semibold mb-2">Motion Control</div>
                      <p className="text-gray-400 text-xs sm:text-sm">Biến ảnh tĩnh nhàm chán trở nên hấp dẫn hơn</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right Column - Results/History (hide on mobile) */}
            <div className="hidden lg:col-span-2 lg:flex flex-col min-h-[400px] lg:min-h-0">
              <div className="bg-[#131313] rounded-[20px] px-[15px] pt-[20px] pb-4 sm:pb-6 overflow-y-auto h-full flex flex-col">
                {currentDisplayJob ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4 min-w-0 w-full">
                      <div className="bg-[#101010] border border-gray-400/30 rounded-[10px] px-2 py-1 text-white text-[9px] sm:text-[10px] font-medium whitespace-nowrap shrink-0 max-w-full overflow-hidden">
                        Kling motion control 2.6
                      </div>
                      {currentDisplayJob.created_at && (
                        <p className="text-white text-xs ml-auto">{formatDate(currentDisplayJob.created_at)}</p>
                      )}
                    </div>
                    
                    {/* Info Section - Quality and Duration */}
                    {currentDisplayJob.result_url && (() => {
                      const isImage = isImageUrl(currentDisplayJob.result_url);
                      const quality = '1080p';
                      
                      return (
                        <div className="mb-4 flex gap-2">
                          {isImage ? (
                            <span className="bg-[#2a2a2a] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              {quality}
                            </span>
                          ) : (
                            <>
                              <span className="bg-[#2a2a2a] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                {quality}
                              </span>
                              <VideoDurationInfo url={currentDisplayJob.result_url} />
                            </>
                          )}
                        </div>
                      );
                    })()}
                    
                    {/* Bottom Actions */}
                    <div className="mt-auto pt-4 border-t border-gray-400/20 flex items-center justify-between">
                      <button
                        onClick={() => handleRerun(currentDisplayJob)}
                        className="flex items-center gap-2 text-white text-xs hover:text-gray-300 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset</span>
                      </button>
                      <button
                        onClick={handleDelete}
                        className="text-white hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4 min-w-0 w-full">
                    <div className="bg-[#101010] border border-gray-400/30 rounded-[10px] px-2 py-1 text-white text-[9px] sm:text-[10px] font-medium whitespace-nowrap shrink-0 max-w-full overflow-hidden">
                      Kling motion control 2.6
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function CreateVideoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <CreateVideoPageInner />
    </Suspense>
  );
}
