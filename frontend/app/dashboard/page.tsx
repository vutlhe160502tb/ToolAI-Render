'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { LayoutDashboard, Search, Sparkles, Clock, Settings, CheckCircle, XCircle, Smile, Box, Heart, Image, Video, Mic, ArrowUpDown, ChevronDown, Plus, Folder } from 'lucide-react';
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

  const filteredJobs = jobs.filter(job => {
    if (activeFilter === 'favorite') {
      // TODO: Implement favorite filter logic when favorite feature is added
      return false;
    }
    if (activeFilter !== 'all' && job.status !== activeFilter) {
      return false;
    }
    if (searchQuery && !job.feature_type.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const imageJobs = jobs.filter(j => j.feature_type?.includes('image') || j.feature_type === 'create-image' || j.feature_type === 'upscale-image').length;
  const videoJobs = jobs.filter(j => j.feature_type?.includes('video') || j.feature_type === 'create-video' || j.feature_type === 'dance-image-bg' || j.feature_type === 'dance-video-bg').length;
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
      <main className="container mx-auto px-4 pt-12 pb-5 min-h-[calc(100vh-65px)]">
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
                    <Heart className="w-4 h-4" />
                    <span>Yêu thích</span>
                  </div>
                  <span className="bg-black text-[#898A8B] text-xs px-1.5 py-0.5 rounded">0</span>
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
                {/* Hôm nay Header */}
                <div className="flex items-center gap-2 mb-6">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-600 bg-[#2a2a2a] text-[#D344FF] focus:ring-[#D344FF]"
                  />
                  <h2 className="text-white text-lg font-semibold">Hôm nay</h2>
                </div>

                {/* Content */}
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-400">Đang tải...</div>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div></div>
                ) : (
                  <div className="space-y-4">
                    {filteredJobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-[#1a0a2e] rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-semibold">{job.feature_type}</h3>
                            <p className="text-gray-400 text-sm">
                              {new Date(job.created_at).toLocaleString('vi-VN')}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            {job.status === 'processing' && (
                              <div className="flex items-center gap-2">
                                <div className="w-32 bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-[#D344FF] h-2 rounded-full transition-all"
                                    style={{ width: `${job.progress}%` }}
                                  />
                                </div>
                                <span className="text-gray-400 text-sm">{job.progress}%</span>
                              </div>
                            )}
                            {job.status === 'completed' && job.result_url && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setViewingImage(job.result_url!)}
                                  className="px-4 py-2 bg-[#2a2a2a] border border-[#D344FF] text-[#D344FF] rounded-lg hover:bg-[#D344FF] hover:text-white transition-all"
                                >
                                  Xem ảnh
                                </button>
                                <a
                                  href={job.result_url}
                                  download
                                  className="px-4 py-2 bg-[#D344FF] text-white rounded-lg hover:bg-[#B836E6] transition-all"
                                >
                                  Tải xuống
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Image View Modal */}
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
            <img
              src={viewingImage}
              alt="Kết quả"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
