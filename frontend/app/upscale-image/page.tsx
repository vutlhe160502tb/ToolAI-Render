'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Upload, Image as ImageIcon, Loader2, RotateCcw, Trash2, Video, ChevronDown, ChevronRight, ArrowRight, Heart, Download } from 'lucide-react';
import axios from 'axios';
import LoadingPreview from '@/components/LoadingPreview';
import VideoDurationInfo from '@/components/VideoDurationInfo';
import { isImageUrl, formatDate, validateFile, truncateFilenameForTooltip } from '@/lib/utils';
import { VideoJob } from '@/lib/types';
import { useFeaturePage } from '@/hooks/useFeaturePage';
import { FILE_TYPES, FILE_SIZES } from '@/lib/constants';

export default function UpscaleImagePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileNameTooltip, setFileNameTooltip] = useState<{ x: number; y: number } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [quality, setQuality] = useState('2K');
  // Số coin hiển thị trên nút = số coin trừ khi ấn (dùng chung qualityCost)
  const [qualityCost, setQualityCost] = useState(0.5);
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [favoriteJobs, setFavoriteJobs] = useState<Set<string>>(new Set());
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
    featureType: 'upscale-image',
    apiEndpoint: '/api/videos/upscale-image',
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const validation = validateFile(f, [...FILE_TYPES.image], FILE_SIZES.image, 'ảnh');
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      setFile(f);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      alert('Vui lòng tải lên ảnh!');
      return;
    }

    const user_id = (session?.user as any)?.id;
    if (!user_id) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này!');
      return;
    }

    setIsGenerating(true);
    const formData = new FormData();
    formData.append('file', file);
    // Convert 2K/4K to backend format
    const backendQuality = quality === '2K' ? '720P' : quality === '4K' ? '1080P' : quality;
    if (backendQuality) formData.append('quality', backendQuality);
    formData.append('user_id', user_id);

    try {
      const response = await axios.post('/api/videos/upscale-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJobId(response.data.job_id);
      
      // Trừ đúng số coin đã hiển thị trên nút (qualityCost)
      window.dispatchEvent(new CustomEvent('credits-updated', {
        detail: { amount: qualityCost }
      }));
      
      startPolling(response.data.job_id);
    } catch (error: any) {
      if (error.response?.status === 402) {
        alert('Không đủ credits!');
      } else {
        alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
      }
      setIsGenerating(false);
    }
  };


  const handleRerun = async (job: VideoJob) => {
    if (!job.input_file_url) {
      alert('Không thể rerun job này vì thiếu thông tin input!');
      return;
    }

    const user_id = (session?.user as any)?.id;
    if (!user_id) {
      alert('Vui lòng đăng nhập!');
      return;
    }

    setIsGenerating(true);
    const formData = new FormData();
    
    try {
      const fileResponse = await fetch(job.input_file_url);
      const blob = await fileResponse.blob();
      const fileName = job.input_file_url.split('/').pop() || 'image.jpg';
      const file = new File([blob], fileName, { type: blob.type });
      formData.append('file', file);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Không thể tải file để rerun!');
      setIsGenerating(false);
      return;
    }
    
    formData.append('user_id', user_id);

    try {
      const response = await axios.post('/api/videos/upscale-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJobId(response.data.job_id);
      
      // Trừ đúng số coin đã hiển thị trên nút (qualityCost)
      window.dispatchEvent(new CustomEvent('credits-updated', {
        detail: { amount: qualityCost }
      }));
      
      startPolling(response.data.job_id);
    } catch (error: any) {
      if (error.response?.status === 402) {
        alert('Không đủ credits!');
      } else {
        alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
      }
      setIsGenerating(false);
    }
  };

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

  // Rút gọn tên file
  const truncateFileName = (fileName: string, maxLength: number = 15) => {
    if (fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncated = nameWithoutExt.substring(0, maxLength);
    return `${truncated}...${extension}`;
  };

  const handleDownload = async () => {
    const displayUrl = currentDisplayJob?.result_url || previewUrl;
    if (displayUrl) {
      try {
        const response = await fetch(displayUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch file');
        }
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        
        // Lấy tên file từ URL hoặc dùng tên mặc định
        const fileName = displayUrl.split('/').pop() || `upscaled-image-${Date.now()}.jpg`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Error downloading file:', error);
        // Fallback: mở trong tab mới
        window.open(displayUrl, '_blank');
      }
    }
  };

  const toggleFavorite = (jobId: string) => {
    setFavoriteJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      
      // Save to localStorage
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
      // Chuyển đến dashboard sau khi toggle
      router.push('/dashboard');
    } else if (previewUrl && file) {
      // Nếu chưa có job nhưng có preview, vẫn chuyển đến dashboard
      router.push('/dashboard');
    }
  };

  // Close quality dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (qualityRef.current && !qualityRef.current.contains(event.target as Node)) {
        setIsQualityOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="w-full">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-[50px] py-8 md:py-12">
          <div className="bg-[#151515] rounded-[50px] border border-gray-800/50 py-[25px] px-[25px] max-w-[1119px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Left Column - Input and Controls (1/3) */}
              <div className="flex flex-col space-y-6 lg:col-span-1 justify-start">
                {/* Header */}
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                    Làm Nét Ảnh
                  </h1>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Làm nét ảnh chỉ trong 1 click
                  </p>
                </div>

                {/* Image Upload Area */}
                <div>
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <div
                      className="bg-[#1A1A1A] rounded-[20px] p-8 sm:p-12 text-center flex flex-col items-center justify-center aspect-[298/317] md:aspect-[298/475] hover:bg-[#333333] transition-colors border border-gray-600/50 overflow-hidden relative"
                      onMouseMove={(e) => file && setFileNameTooltip({ x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setFileNameTooltip(null)}
                    >
                      <input
                        accept="image/*"
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
                        <img
                          src={filePreviewUrl}
                          alt="Ảnh cần làm nét"
                          className="absolute inset-0 w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center mb-4">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-400 text-sm sm:text-base">
                            Thêm ảnh ở đây
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {/* Quality Selection */}
                <div className="relative" ref={qualityRef}>
                  <div 
                    className="bg-[#1A1A1A] rounded-[20px] px-4 py-2.5 cursor-pointer hover:bg-[#333333] transition-colors flex items-center justify-between border border-gray-600/50"
                    onClick={() => setIsQualityOpen(!isQualityOpen)}
                  >
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Chất lượng</p>
                      <p className="text-white font-bold text-lg">{quality}</p>
                    </div>
                    <ChevronRight className="text-gray-400 w-4 h-4" />
                  </div>
                  
                  {/* Quality Dropdown - Mobile: bên dưới, Desktop: bên phải */}
                  {isQualityOpen && (
                    <div className="absolute top-full left-0 mt-2 md:top-0 md:left-full md:mt-0 md:ml-2 bg-[#1a1a1a] rounded-[20px] p-2 w-[200px] z-10 shadow-lg">
                      <div
                        onClick={() => {
                          setQuality('2K');
                          setQualityCost(0.5);
                          setIsQualityOpen(false);
                        }}
                        className={`p-3 rounded-[15px] cursor-pointer transition-all mb-2 ${
                          quality === '2K' ? 'bg-[#2a2a2a]' : 'hover:bg-[#2a2a2a]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">2K</span>
                          <span className="text-gray-400 text-sm">Tốn 0.5 coin</span>
                        </div>
                      </div>
                      <div
                        onClick={() => {
                          setQuality('4K');
                          setQualityCost(0.8);
                          setIsQualityOpen(false);
                        }}
                        className={`p-3 rounded-[15px] cursor-pointer transition-all ${
                          quality === '4K' ? 'bg-[#2a2a2a]' : 'hover:bg-[#2a2a2a]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">4K</span>
                          <span className="text-gray-400 text-sm">Tốn 0.8 coin</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !file}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#D344FF] to-[#FF6B9D] text-white rounded-[20px] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <span>Làm nét</span>
                      <span className="text-sm font-normal opacity-90">{qualityCost} Coin</span>
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

              {/* Right Column - Preview (2/3), chiều cao tăng thêm */}
              <div className="relative lg:col-span-2">
                <div className="bg-[#1A1A1A] rounded-[20px] p-8 sm:p-12 aspect-[1119/1300] flex items-center justify-center relative border border-gray-600/50">
                  {(() => {
                    if (isGenerating) {
                      return <LoadingPreview progress={progress} />;
                    }
                    
                    const displayUrl = currentDisplayJob?.result_url || previewUrl;
                    if (displayUrl && isImageUrl(displayUrl)) {
                      return (
                        <img
                          src={displayUrl}
                          alt="Preview"
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      );
                    }
                    
                    return (
                      <p className="text-gray-500 text-lg">Ảnh preview</p>
                    );
                  })()}
                </div>

                {/* Action Buttons - Top Right - Hiển thị khi có ảnh */}
                {(() => {
                  const displayUrl = currentDisplayJob?.result_url || previewUrl;
                  const jobId = currentDisplayJob?.id;
                  const isFavorite = jobId ? favoriteJobs.has(jobId) : false;
                  
                  return displayUrl && isImageUrl(displayUrl) ? (
                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                      <button
                        onClick={handleFavoriteClick}
                        className="w-10 h-10 bg-[#2a2a2a]/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-[#2a2a2a] transition-colors border border-white/10 cursor-pointer"
                      >
                        <Heart 
                          className={`w-5 h-5 ${isFavorite ? 'text-red-500' : 'text-white'}`} 
                          fill={isFavorite ? 'red' : 'none'} 
                        />
                      </button>
                      <button
                        onClick={handleDownload}
                        className="w-10 h-10 bg-[#2a2a2a]/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-[#2a2a2a] transition-colors border border-white/10 cursor-pointer"
                      >
                        <Download className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
