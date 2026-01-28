'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Upload, Image as ImageIcon, Loader2, RotateCcw, Trash2, Video, ChevronDown, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useProgressBar } from '@/hooks/useProgressBar';
import LoadingPreview from '@/components/LoadingPreview';
import VideoDurationInfo from '@/components/VideoDurationInfo';
import { isImageUrl, formatDate, validateFile } from '@/lib/utils';
import { VideoJob } from '@/lib/types';
import { useDeletedJobs } from '@/hooks/useDeletedJobs';

export default function CreateImagePage() {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [quality, setQuality] = useState('720P');
  const [qualityCost, setQualityCost] = useState(1);
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const qualityRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [serverProgress, setServerProgress] = useState<number | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultJobs, setResultJobs] = useState<VideoJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [currentDisplayJob, setCurrentDisplayJob] = useState<VideoJob | null>(null);
  
  const { deletedJobIds, saveDeletedJobId } = useDeletedJobs('create-image');
  
  const progress = useProgressBar(serverProgress, isGenerating);

  // Close quality dropdown when clicking outside
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

  // Fetch jobs history
  useEffect(() => {
    if (session) {
      fetchJobs();
    }
  }, [session]);

  const fetchJobs = async () => {
    if (!session) return;
    
    const user_id = (session.user as any)?.id;
    if (!user_id) return;
    
    try {
      setLoadingJobs(true);
      const response = await axios.get('/api/jobs', { 
        params: { status: 'all', user_id: user_id },
        timeout: 5000,
      });
      if (response.data && response.data.jobs) {
        const createImageJobs = response.data.jobs.filter((job: VideoJob) => job.feature_type === 'create-image');
        const sortedJobs = createImageJobs.sort((a: VideoJob, b: VideoJob) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setResultJobs(sortedJobs.slice(0, 10));
        
        // Always set preview to latest completed job (replaces old one when new job is created)
        // But exclude jobs that have been deleted by user
        const latestCompleted = sortedJobs.find((job: VideoJob) => 
          job.status === 'completed' && 
          job.result_url && 
          !deletedJobIds.has(job.id)
        );
        if (latestCompleted && latestCompleted.result_url) {
          // Only update if this is a different job (newer) or if no current display job
          if (!currentDisplayJob || latestCompleted.id !== currentDisplayJob.id) {
            setPreviewUrl(latestCompleted.result_url);
            setCurrentDisplayJob(latestCompleted);
          }
        } else if (currentDisplayJob && deletedJobIds.has(currentDisplayJob.id)) {
          // If current display job was deleted, clear it
          setCurrentDisplayJob(null);
          setPreviewUrl(null);
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const validation = validateFile(file, allowedTypes, 50 * 1024 * 1024, 'ảnh');
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      setFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleGenerate = async () => {
    const user_id = (session?.user as any)?.id;
    if (!user_id) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này!');
      return;
    }

    if (!file) {
      alert('Vui lòng chọn file ảnh!');
      return;
    }

    setIsGenerating(true);
    const formData = new FormData();
    formData.append('file', file);
    if (prompt) formData.append('prompt', prompt);
    if (quality) formData.append('quality', quality);
    formData.append('user_id', user_id);

    try {
      const response = await axios.post('/api/videos/create-image', formData, {
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
        alert('Không đủ credits!');
      } else {
        alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
      }
      setIsGenerating(false);
    }
  };

  const startPolling = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/videos/${jobId}/progress`);
        const { status, progress: prog, result_url } = response.data;
        setServerProgress(prog || 0);

        if (status === 'completed') {
          clearInterval(interval);
          setIsGenerating(false);
          setServerProgress(100);
          // Update display with new completed job
          if (result_url) {
            // Create job object from polling response
            const completedJob: VideoJob = {
              id: jobId,
              feature_type: 'create-image',
              status: 'completed',
              progress: 100,
              result_url: result_url,
              created_at: new Date().toISOString(),
              input_file_url: undefined,
              prompt: undefined
            };
            setCurrentDisplayJob(completedJob);
            setPreviewUrl(result_url);
          }
          // Refresh jobs list
          fetchJobs();
        } else if (status === 'failed') {
          clearInterval(interval);
          setIsGenerating(false);
          alert('Tạo ảnh thất bại!');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };



  const handleRerun = async (job: VideoJob) => {
    if (!job.input_file_url && !job.prompt) {
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
    
    // Download và upload lại file nếu có
    if (job.input_file_url) {
      try {
        const fileResponse = await fetch(job.input_file_url);
        const blob = await fileResponse.blob();
        const fileName = job.input_file_url.split('/').pop() || 'image.jpg';
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
      const response = await axios.post('/api/videos/create-image', formData, {
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
        alert('Không đủ credits!');
      } else {
        alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
      }
      setIsGenerating(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa job này?')) {
      return;
    }

    try {
      // Save deleted job ID to localStorage so it won't show again
      saveDeletedJobId(jobId);
      
      // Remove from local state
      setResultJobs(resultJobs.filter(job => job.id !== jobId));
      
      // Clear display if this is the current displayed job
      if (currentDisplayJob && currentDisplayJob.id === jobId) {
        setCurrentDisplayJob(null);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Không thể xóa job!');
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
                <h1 className="block text-lg sm:text-xl font-medium text-white mb-[15px] pb-[10px] border-b border-gray-400/30 -mx-4 sm:-mx-6 px-4 sm:px-6">Kling Motion Control</h1>
                
                {/* Preview Card */}
                <div className="bg-[#2a2a2a] rounded-[25px] p-4 sm:p-6 mb-4 sm:mb-6 aspect-[450/260] overflow-hidden w-full min-w-0 relative">
                  <video
                    src="/taoanh.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                    <div className="text-[#D344FF] font-semibold mb-2 break-words" style={{ fontSize: 'clamp(0.875rem, 3vw, 1.25rem)' }}>Motion Control</div>
                    <p className="text-gray-400 break-words" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)' }}>Biến mọi trí tưởng tượng thành hiện thực</p>
                  </div>
                </div>
                
                {/* Upload Area */}
                <div className="mb-4 sm:mb-6 w-full min-w-0">
                  <div className="bg-[#252525] rounded-[20px] p-4 sm:p-6 text-center flex flex-col items-center justify-center min-h-[170px] sm:min-h-[220px]">
                    <ImageIcon className="text-white mx-auto mb-2 shrink-0" style={{ width: 'clamp(1.5rem, 5vw, 2.5rem)', height: 'clamp(1.5rem, 5vw, 2.5rem)' }} />
                    <input
                      accept="image/*"
                      className="hidden"
                      id="file-upload"
                      type="file"
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer w-full"
                    >
                      <div className="text-white font-semibold mb-1 break-words leading-tight" style={{ fontSize: 'clamp(0.75rem, 3vw, 1rem)' }}>
                        {file ? file.name : 'Tải lên ảnh (tùy chọn)'}
                      </div>
                      {!file && (
                        <div className="text-gray-400 break-words leading-tight mt-1" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.875rem)' }}>
                          Chọn ảnh từ máy tính
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Quality Selector */}
                <div className="mb-4 sm:mb-6 relative w-full min-w-0" ref={qualityRef}>
                  <div 
                    className="flex items-center justify-between bg-[#252525] rounded-[20px] px-3 sm:px-4 py-2 cursor-pointer hover:bg-[#3a3a3a] transition-all relative overflow-hidden w-full min-w-0"
                    onClick={() => setIsQualityOpen(!isQualityOpen)}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <label className="text-white mb-1 break-words" style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}>Chất lượng</label>
                      <span className="text-white font-semibold break-words" style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}>{quality}</span>
                    </div>
                    <ArrowRight className="text-gray-400 shrink-0 ml-2" style={{ width: 'clamp(0.625rem, 3vw, 1rem)', height: 'clamp(0.625rem, 3vw, 1rem)' }} />
                  </div>
                  
                  {/* Quality Dropdown */}
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

                {/* Advanced Mode */}
                <div className="mb-4 sm:mb-6 w-full min-w-0">
                  <button
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 sm:px-4 py-2 transition-all overflow-hidden min-w-0 ${
                      isAdvancedOpen ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A] hover:bg-[#3a3a3a]'
                    }`}
                  >
                    <span className="text-white break-words flex-1 text-left" style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}>Chế độ nâng cao</span>
                    <ChevronDown className={`text-gray-400 transition-transform shrink-0 ml-2 ${isAdvancedOpen ? 'rotate-180' : ''}`} style={{ width: 'clamp(0.625rem, 3vw, 1rem)', height: 'clamp(0.625rem, 3vw, 1rem)' }} />
                  </button>
                  
                  {/* Advanced Mode Panel */}
                  {isAdvancedOpen && (
                    <div className="mt-4 bg-[#2a2a2a] rounded-[20px] p-3 sm:p-4 overflow-hidden">
                      <div className="text-white font-semibold mb-2 break-words" style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}>Prompt</div>
                      <p className="text-white mb-3 break-words leading-tight" style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}>
                        Bạn có thể miêu tả thêm cho ảnh như nền hay đồ vật hay chi tiết của người để thêm sinh động.
                      </p>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Nhập prompt của bạn..."
                        className="w-full bg-[#1a1a1a] text-white rounded-lg px-3 sm:px-4 py-2 sm:py-3 min-h-[100px] sm:min-h-[120px] focus:outline-none resize-none break-words"
                        style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}
                      />
                    </div>
                  )}
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
                      <span className="break-words whitespace-nowrap" style={{ fontSize: 'clamp(0.75rem, 3vw, 1rem)' }}>Đang tạo ảnh...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5 shrink-0" />
                      <span className="break-words whitespace-nowrap" style={{ fontSize: 'clamp(0.75rem, 3vw, 1rem)' }}>Tạo</span>
                      <span className="shrink-0 whitespace-nowrap" style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}>{qualityCost} Coin</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Middle Column - Preview */}
            <div className="lg:col-span-6 flex items-center justify-center min-h-[400px] lg:min-h-0">
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
                      <p className="text-gray-400 text-xs sm:text-sm">Biến mọi trí tưởng tượng thành hiện thực</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right Column - Results/History */}
            <div className="lg:col-span-2 flex flex-col min-h-[400px] lg:min-h-0">
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
                      // Mock quality - in real app would get from metadata
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
                        onClick={() => handleDelete(currentDisplayJob.id)}
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
