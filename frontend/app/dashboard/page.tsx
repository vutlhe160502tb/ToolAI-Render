'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { LayoutDashboard, Search, Sparkles, Clock, Settings, CheckCircle, XCircle, Smile, Box, Heart, Image, Video, Mic, ArrowUpDown, ChevronDown, Plus, Folder, Trash2, Download } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

type JobStatus = 'all' | 'pending' | 'processing' | 'completed' | 'failed';

interface VideoJob {
  id: string;
  feature_type: string;
  status: string;
  progress: number;
  result_url?: string;
  input_file_url?: string;
  created_at: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<JobStatus | 'favorite'>('all');
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [favoriteJobs, setFavoriteJobs] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    if (session) {
      fetchJobs();
    }
  }, [activeFilter, session]);

  const fetchJobs = async () => {
    if (!session) return;
    
    // Lấy user_id từ session
    const user_id = (session.user as any)?.id;
    if (!user_id) {
      console.error('User ID not found in session');
      setJobs([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      // Don't send 'favorite' to backend, use 'all' instead and filter on frontend
      const apiStatus = activeFilter === 'favorite' ? 'all' : activeFilter;
      const response = await axios.get('/api/jobs', { 
        params: { status: apiStatus, user_id: user_id },
        timeout: 5000,
      });
      if (response.data && response.data.jobs) {
        setJobs(response.data.jobs);
      } else {
        setJobs([]);
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      // Always set empty array on error to show empty state
      setJobs([]);
    } finally {
      setLoading(false);
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

  const filteredJobs = jobs.filter(job => {
    if (activeFilter === 'favorite') {
      return favoriteJobs.has(job.id);
    }
    if (activeFilter !== 'all' && job.status !== activeFilter) {
      return false;
    }
    if (searchQuery && !job.feature_type.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Group jobs by date
  const groupJobsByDate = (jobs: VideoJob[]) => {
    const groups: { [key: string]: VideoJob[] } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    jobs.forEach(job => {
      const jobDate = new Date(job.created_at);
      jobDate.setHours(0, 0, 0, 0);
      
      let dateKey: string;
      if (jobDate.getTime() === today.getTime()) {
        dateKey = 'Hôm nay';
      } else {
        dateKey = jobDate.toLocaleDateString('vi-VN', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(job);
    });
    
    // Sort dates: "Hôm nay" first, then by date descending
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'Hôm nay') return -1;
      if (b === 'Hôm nay') return 1;
      return b.localeCompare(a);
    });
    
    return sortedKeys.map(key => ({ date: key, jobs: groups[key] }));
  };

  const groupedJobs = groupJobsByDate(filteredJobs);

  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('image');
  };

  const isVideoUrl = (url: string) => {
    return /\.(mp4|webm|ogg|mov)$/i.test(url) || url.includes('video');
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      // Fetch file from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      // Convert to blob
      const blob = await response.blob();
      
      // Create object URL from blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const handleDownloadSelected = async () => {
    for (const job of selectedJobsData) {
      if (job.result_url) {
        const fileExtension = job.result_url.split('.').pop() || 'jpg';
        const filename = `${job.feature_type}-${job.id}.${fileExtension}`;
        await downloadFile(job.result_url, filename);
        // Small delay between downloads to avoid browser blocking
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  const handleFavoriteSelected = () => {
    selectedJobsData.forEach(job => {
      toggleFavorite(job.id);
    });
  };

  const handleDeleteSelected = () => {
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedJobs.size} item(s) đã chọn?`)) {
      // TODO: Implement delete functionality
      console.log('Delete jobs:', Array.from(selectedJobs));
      setSelectedJobs(new Set());
      alert('Tính năng xóa đang được phát triển');
    }
  };

  const selectedJobsCount = selectedJobs.size;
  const selectedJobsData = jobs.filter(job => selectedJobs.has(job.id));

  const toggleAllJobsInGroup = (jobs: VideoJob[]) => {
    const allSelected = jobs.every(job => selectedJobs.has(job.id));
    setSelectedJobs(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        jobs.forEach(job => newSet.delete(job.id));
      } else {
        jobs.forEach(job => newSet.add(job.id));
      }
      return newSet;
    });
  };

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const imageJobs = jobs.filter(j => j.feature_type?.includes('image') || j.feature_type === 'create-image' || j.feature_type === 'upscale-image').length;
  const videoJobs = jobs.filter(j => j.feature_type?.includes('video') || j.feature_type === 'create-video' || j.feature_type === 'dance-image-bg' || j.feature_type === 'dance-video-bg').length;
  const favoriteJobsCount = favoriteJobs.size;
  const currentPage = 1;
  const totalPages = Math.ceil(filteredJobs.length / 10) || 1;

  const filters = [
    { id: 'all' as JobStatus, label: 'Tất cả', icon: Sparkles },
    { id: 'pending' as JobStatus, label: 'Hàng đợi', icon: Clock },
    { id: 'processing' as JobStatus, label: 'Đang xử lý', icon: Settings },
    { id: 'completed' as JobStatus, label: 'Đã hoàn thành', icon: CheckCircle },
    { id: 'failed' as JobStatus, label: 'Chưa thành công', icon: XCircle },
  ];

  return (
    <div className="min-h-screen bg-[#000000]">
      <Header />
      <main className={`container mx-auto px-4 pt-12 min-h-[calc(100vh-65px)] ${selectedJobsCount > 0 ? 'pb-20' : 'pb-5'}`}>
        <div className="max-w-7xl mx-auto h-full">
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Left Sidebar */}
            <div className="w-full lg:w-64 shrink-0">
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] border border-gray-900 rounded-[12px] text-white placeholder-gray-500 focus:outline-none  text-sm"
                />
              </div>

              {/* Navigation */}
              <div className="space-y-1">
                {/* Tất cả */}
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[12px] transition-all text-sm ${
                    activeFilter === 'all'
                      ? 'bg-[#2E3031] text-white'
                      : 'text-[#898A8B] hover:bg-[#2a2a2a]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4" />
                    <span>Tất cả</span>
                  </div>
                  <span className="bg-black text-[#898A8B] text-xs px-1.5 py-0.5 rounded">{totalJobs}</span>
                </button>

                {/* Yêu thích */}
                <button
                  onClick={() => setActiveFilter('favorite')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[12px] transition-all text-sm ${
                    activeFilter === 'favorite'
                      ? 'bg-[#2E3031] text-white'
                      : 'text-[#898A8B] hover:bg-[#2a2a2a]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Heart 
                      className={`w-4 h-4 ${activeFilter === 'favorite' ? 'text-white' : ''}`} 
                      fill={activeFilter === 'favorite' ? 'white' : 'none'} 
                    />
                    <span>Yêu thích</span>
                  </div>
                  <span className="bg-black text-[#898A8B] text-xs px-1.5 py-0.5 rounded">{favoriteJobsCount}</span>
                </button>

                {/* Công Cụ Section */}
                <div className="mt-4">
                  <div className="px-3 py-2 text-gray-500 text-xs font-semibold uppercase mb-1">
                    Công Cụ
                  </div>
                  <div className="space-y-1">
                    <Link href="/images" className="w-full flex items-center justify-between px-3 py-2 rounded-[12px] transition-all text-sm text-[#898A8B] hover:bg-[#2a2a2a]">
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        <span>Ảnh</span>
                      </div>
                      <span className="bg-black text-[#898A8B] text-xs px-1.5 py-0.5 rounded">{imageJobs}</span>
                    </Link>
                    <Link href="/videos" className="w-full flex items-center justify-between px-3 py-2 rounded-[12px] transition-all text-sm text-[#898A8B] hover:bg-[#2a2a2a]">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        <span>Video</span>
                      </div>
                      <span className="bg-black text-[#898A8B] text-xs px-1.5 py-0.5 rounded">{videoJobs}</span>
                    </Link>
                    <Link href="/lipsync" className="w-full flex items-center justify-between px-3 py-2 rounded-[12px] transition-all text-sm text-[#898A8B] hover:bg-[#2a2a2a]">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4" />
                        <span>Lipsynic</span>
                      </div>
                      <span className="bg-black text-[#898A8B] text-xs px-1.5 py-0.5 rounded">0</span>
                    </Link>
                    <Link href="/sharpen-image" className="w-full flex items-center justify-between px-3 py-2 rounded-[12px] transition-all text-sm text-[#898A8B] hover:bg-[#2a2a2a]">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4" />
                        <span>Làm nét ảnh</span>
                      </div>
                      <span className="bg-black text-[#898A8B] text-xs px-1.5 py-0.5 rounded">0</span>
                    </Link>
                  </div>
                </div>

                {/* Projects Section */}
                <div className="mt-4">
                  <button
                    onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-[12px] transition-all text-sm text-[#898A8B] hover:bg-[#2a2a2a]"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-4 h-4 transition-transform ${isProjectsOpen ? '' : '-rotate-90'}`} />
                      <span>Projects</span>
                    </div>
                    <Plus className="w-4 h-4 text-[#898A8B]" />
                  </button>
                  {isProjectsOpen && (
                    <div className="ml-4 mt-1">
                      <button className="w-full flex items-center justify-between px-3 py-2 rounded-[12px] transition-all text-sm text-[#898A8B] hover:bg-[#2a2a2a]">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4" />
                          <span>Titok</span>
                        </div>
                        <span className="bg-black text-[#898A8B] text-xs px-1.5 py-0.5 rounded">0</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 flex flex-col">
              <h1 className="text-white text-2xl md:text-3xl font-bold mb-4">Thư viện</h1>
              <div className="bg-[#1A1A1A] rounded-xl p-4 sm:p-6 md:p-8 flex-1">
                {/* Content */}
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-400">Đang tải...</div>
                  </div>
                ) : groupedJobs.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-400">Không có dữ liệu</div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {groupedJobs.map(({ date, jobs: dateJobs }) => {
                      const allSelected = dateJobs.every(job => selectedJobs.has(job.id));
                      const someSelected = dateJobs.some(job => selectedJobs.has(job.id));
                      
                      return (
                        <div key={date} className="space-y-4">
                          {/* Date Header */}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={() => toggleAllJobsInGroup(dateJobs)}
                              className="w-4 h-4 rounded border-gray-600 bg-[#2a2a2a] text-[#D344FF] focus:ring-[#D344FF]"
                              style={{
                                ...(someSelected && !allSelected ? { opacity: 0.5 } : {})
                              }}
                            />
                            <h2 className="text-white text-lg font-semibold">{date}</h2>
                          </div>

                          {/* Grid of Thumbnails */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {dateJobs.map((job) => {
                              const hasResult = job.status === 'completed' && job.result_url;
                              const previewUrl = hasResult ? job.result_url : job.input_file_url;
                              const isImage = previewUrl && isImageUrl(previewUrl);
                              const isVideo = previewUrl && isVideoUrl(previewUrl);
                              
                              return (
                                <div
                                  key={job.id}
                                  className={`group relative bg-[#1a0a2e] rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#D344FF] transition-all ${
                                    selectedJobs.has(job.id) ? 'ring-2 ring-white' : ''
                                  }`}
                                  onClick={() => {
                                    // Click vào thumbnail sẽ mở preview (nếu có result)
                                    if (hasResult && previewUrl) {
                                      setViewingImage(previewUrl);
                                    }
                                  }}
                                >
                                  {/* Checkbox overlay */}
                                  <div 
                                    className="absolute top-2 left-2 z-10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleJobSelection(job.id);
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedJobs.has(job.id)}
                                      onChange={() => toggleJobSelection(job.id)}
                                      className="w-4 h-4 rounded border-gray-600 bg-[#2a2a2a] text-[#D344FF] focus:ring-[#D344FF]"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>

                                  {/* Thumbnail */}
                                  <div className="aspect-square bg-[#0a0519] relative overflow-hidden">
                                    {previewUrl ? (
                                      <>
                                        {isImage ? (
                                          <img
                                            src={previewUrl}
                                            alt={job.feature_type}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                        ) : isVideo ? (
                                          // Video removed - show placeholder
                                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                            <span className="text-gray-400 text-sm">Video preview removed</span>
                                          </div>
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <Image className="w-12 h-12 text-gray-600" />
                                          </div>
                                        )}
                                        {/* Play icon for video */}
                                        {isVideo && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <div className="w-12 h-12 bg-[#D344FF]/80 rounded-full flex items-center justify-center">
                                              <Video className="w-6 h-6 text-white" />
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        {job.status === 'processing' ? (
                                          <div className="text-center">
                                            <div className="w-12 h-12 border-4 border-[#D344FF] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                            <p className="text-gray-400 text-xs">{job.progress}%</p>
                                          </div>
                                        ) : job.status === 'pending' ? (
                                          <Clock className="w-12 h-12 text-gray-600" />
                                        ) : (
                                          <Image className="w-12 h-12 text-gray-600" />
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Download button for completed jobs */}
                                    {job.status === 'completed' && job.result_url && (
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          const fileExtension = job.result_url!.split('.').pop() || 'jpg';
                                          const filename = `${job.feature_type}-${job.id}.${fileExtension}`;
                                          await downloadFile(job.result_url!, filename);
                                        }}
                                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-all z-10 cursor-pointer"
                                      >
                                        <Download className="w-4 h-4 text-white" />
                                      </button>
                                    )}
                                    
                                    {/* Status badge for other statuses */}
                                    {job.status !== 'completed' && (
                                      <div className="absolute top-2 right-2">
                                        {job.status === 'processing' && (
                                          <span className="px-2 py-1 bg-[#D344FF]/80 text-white text-xs rounded">Đang xử lý</span>
                                        )}
                                        {job.status === 'pending' && (
                                          <span className="px-2 py-1 bg-yellow-500/80 text-white text-xs rounded">Chờ xử lý</span>
                                        )}
                                        {job.status === 'failed' && (
                                          <span className="px-2 py-1 bg-red-500/80 text-white text-xs rounded">Thất bại</span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Favorite button - always visible */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(job.id);
                                    }}
                                    className="absolute bottom-2 left-2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-all z-10 cursor-pointer"
                                  >
                                    <Heart 
                                      className={`w-4 h-4 ${
                                        favoriteJobs.has(job.id) ? 'text-red-500' : 'text-white'
                                      }`} 
                                      fill={favoriteJobs.has(job.id) ? 'red' : 'none'} 
                                    />
                                  </button>

                                  {/* Selected indicator */}
                                  {selectedJobs.has(job.id) && (
                                    <div className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none">
                                      <div className="absolute top-2 left-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-[#D344FF]" fill="#D344FF" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Selection Control Bar */}
      {selectedJobsCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center mb-[20px] z-40">
          <div className="bg-[#101010]/20 backdrop-blur-md border border-gray-400/30 rounded-[30px] pl-4 pr-[7px] py-2 flex items-center gap-3 shadow-lg">
            <div className="text-white text-sm font-medium">
              {selectedJobsCount} selected
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleDownloadSelected}
                className="px-3 py-1.5 bg-[#95FF00]/80 backdrop-blur-sm text-white text-sm rounded-[30px] hover:bg-[#95FF00] transition-all flex items-center gap-2 shadow-md border border-[#95FF00]/30 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleFavoriteSelected}
                className="w-8 h-8 bg-[#C8C8C8]/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-[#C8C8C8]/30 transition-all border border-[#C8C8C8]/20 shadow-md cursor-pointer"
              >
                <Heart 
                  className={`w-4 h-4 ${
                    selectedJobsData.length > 0 && selectedJobsData.every(job => favoriteJobs.has(job.id))
                      ? 'text-red-500' 
                      : 'text-white'
                  }`} 
                  fill={
                    selectedJobsData.length > 0 && selectedJobsData.every(job => favoriteJobs.has(job.id))
                      ? 'red' 
                      : 'none'
                  } 
                />
              </button>
              <button
                onClick={handleDeleteSelected}
                className="w-8 h-8 bg-[#C8C8C8]/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-[#C8C8C8]/30 transition-all border border-[#C8C8C8]/20 shadow-md cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image/Video View Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 bg-[#D344FF] text-white rounded-full p-2 hover:bg-[#B836E6] transition-all z-10"
            >
              ✕
            </button>
            {isImageUrl(viewingImage) ? (
              <img
                src={viewingImage}
                alt="Kết quả"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            ) : isVideoUrl(viewingImage) ? (
              // Video removed - show placeholder
              <div className="max-w-full max-h-[90vh] flex items-center justify-center bg-gray-800 rounded-lg p-8">
                <span className="text-gray-400 text-lg">Video preview removed</span>
              </div>
            ) : (
              <div className="max-w-full max-h-[90vh] flex items-center justify-center">
                <a
                  href={viewingImage}
                  download
                  className="px-6 py-3 bg-[#D344FF] text-white rounded-lg hover:bg-[#B836E6] transition-all"
                >
                  Tải xuống
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
