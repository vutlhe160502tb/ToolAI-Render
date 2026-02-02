'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Search, Heart, Download, CheckCircle, Clock, Settings, XCircle, Video as VideoIcon, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface VideoJob {
  id: string;
  feature_type: string;
  status: string;
  progress: number;
  result_url?: string;
  input_file_url?: string;
  created_at: string;
}

// Các feature_type liên quan đến video
const VIDEO_FEATURE_TYPES = [
  'create-video',
  'dance-video-bg',
  'edit-video',
  'replace-ad',
  'replace-ad-2'
];

export default function VideosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, [session]);

  const fetchJobs = async () => {
    if (!session) return;
    
    const user_id = (session.user as any)?.id;
    if (!user_id) {
      console.error('User ID not found in session');
      setJobs([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get('/api/jobs', { 
        params: { status: 'all', user_id: user_id },
        timeout: 5000,
      });
      if (response.data && response.data.jobs) {
        // Filter chỉ lấy các job liên quan đến video
        const videoJobs = response.data.jobs.filter((job: VideoJob) => 
          VIDEO_FEATURE_TYPES.includes(job.feature_type)
        );
        setJobs(videoJobs);
      } else {
        setJobs([]);
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
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

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      window.open(url, '_blank');
    }
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

  const selectedJobsData = jobs.filter(job => selectedJobs.has(job.id));

  const handleDownloadSelected = async () => {
    for (const job of selectedJobsData) {
      if (job.result_url) {
        const fileExtension = job.result_url.split('.').pop() || 'mp4';
        const filename = `${job.feature_type}-${job.id}.${fileExtension}`;
        await downloadFile(job.result_url, filename);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#000000]">
      <Header />
      <main className="container mx-auto px-4 pt-12 min-h-[calc(100vh-65px)] pb-5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Quay lại</span>
            </button>
            <h1 className="text-white text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
              <VideoIcon className="w-8 h-8 text-[#D344FF]" />
              Video
            </h1>
            <p className="text-gray-400 text-sm">Tất cả các video đã và đang chờ xử lý</p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] border border-gray-900 rounded-[12px] text-white placeholder-gray-500 focus:outline-none text-sm"
            />
          </div>

          {/* Content */}
          <div className="bg-[#1A1A1A] rounded-xl p-4 sm:p-6 md:p-8">
            {loading ? (
              <div className="flex items-center justify-center h-full py-20">
                <div className="text-gray-400">Đang tải...</div>
              </div>
            ) : groupedJobs.length === 0 ? (
              <div className="flex items-center justify-center h-full py-20">
                <div className="text-center">
                  <VideoIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Chưa có video nào</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {groupedJobs.map(({ date, jobs: dateJobs }) => (
                  <div key={date} className="space-y-4">
                    <h2 className="text-white text-lg font-semibold">{date}</h2>
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
                              if (hasResult && previewUrl) {
                                setViewingImage(previewUrl);
                              }
                            }}
                          >
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
                                    <video
                                      src={previewUrl}
                                      muted
                                      loop
                                      playsInline
                                      preload="metadata"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLVideoElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <VideoIcon className="w-12 h-12 text-gray-600" />
                                    </div>
                                  )}
                                  {isVideo && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                      <div className="w-12 h-12 bg-[#D344FF]/80 rounded-full flex items-center justify-center">
                                        <VideoIcon className="w-6 h-6 text-white" />
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
                                    <VideoIcon className="w-12 h-12 text-gray-600" />
                                  )}
                                </div>
                              )}
                              
                              {job.status === 'completed' && job.result_url && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const fileExtension = job.result_url!.split('.').pop() || 'mp4';
                                    const filename = `${job.feature_type}-${job.id}.${fileExtension}`;
                                    await downloadFile(job.result_url!, filename);
                                  }}
                                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-all z-10 cursor-pointer"
                                >
                                  <Download className="w-4 h-4 text-white" />
                                </button>
                              )}
                              
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
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Selection Control Bar */}
      {selectedJobs.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center mb-[20px] z-40">
          <div className="bg-[#101010]/20 backdrop-blur-md border border-gray-400/30 rounded-[30px] pl-4 pr-[7px] py-2 flex items-center gap-3 shadow-lg">
            <div className="text-white text-sm font-medium">
              {selectedJobs.size} selected
            </div>
            <button
              onClick={handleDownloadSelected}
              className="px-3 py-1.5 bg-[#95FF00]/80 backdrop-blur-sm text-white text-sm rounded-[30px] hover:bg-[#95FF00] transition-all flex items-center gap-2 shadow-md border border-[#95FF00]/30 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      )}

      {/* Video View Modal */}
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
              <video
                src={viewingImage}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
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

      <Footer />
    </div>
  );
}

