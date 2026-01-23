'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Upload, CheckCircle, Clock, XCircle, Image, Video, FileText, Search, Filter } from 'lucide-react';
import axios from 'axios';

interface AdminJob {
  id: string;
  user_id: string;
  feature_type: string;
  status: string;
  progress: number;
  result_url?: string;
  input_file_url?: string;
  prompt?: string;
  admin_status?: string;
  admin_notes?: string;
  created_at?: string;
  completed_at?: string;
}

type JobStatus = 'all' | 'pending' | 'processing' | 'completed' | 'failed';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<JobStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (session) {
      const isAdmin = (session.user as any)?.isAdmin;
      if (!isAdmin) {
        alert('Bạn không có quyền truy cập trang admin!');
        router.push('/');
        return;
      }
    }
  }, [session, status, router]);

  useEffect(() => {
    // Chỉ fetch khi đã authenticated và là admin
    if (status === 'authenticated' && session && (session.user as any)?.isAdmin) {
      fetchJobs();
      // Polling mỗi 5 giây để cập nhật danh sách
      const interval = setInterval(fetchJobs, 5000);
      return () => clearInterval(interval);
    }
  }, [activeFilter, status, session]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/jobs', {
        params: { status: activeFilter === 'all' ? 'all' : activeFilter },
      });
      if (response.data && response.data.jobs) {
        setJobs(response.data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (job: AdminJob, file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      if (adminNotes) {
        formData.append('admin_notes', adminNotes);
      }

      const response = await axios.post(`/api/admin/jobs/${job.id}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data) {
        alert('Job đã được hoàn thành thành công!');
        setSelectedJob(null);
        setAdminNotes('');
        fetchJobs();
      }
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        job.id.toLowerCase().includes(query) ||
        job.feature_type.toLowerCase().includes(query) ||
        job.user_id.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getFeatureName = (featureType: string) => {
    const names: Record<string, string> = {
      'create-image': 'Tạo Ảnh',
      'create-video': 'Tạo Video',
      'upscale-image': 'Làm Nét Ảnh',
      'skin-edit': 'Chỉnh Sửa Da',
      'change-outfit': 'Thay Trang Phục',
      'dance-image-bg': 'Nhảy Với Nền Từ Ảnh',
      'dance-video-bg': 'Nhảy Với Nền Từ Video',
      'product-model': 'Người Mẫu Giới Thiệu Sản Phẩm',
      'face-swap': 'Face Swap',
      'character-swap': 'Character Swap',
      'character-swap-2': 'Character Swap',
      'edit-video': 'Edit Video',
      'replace-ad': 'Thay Nhân Vật Quảng Cáo',
      'replace-ad-2': 'Thay Nhân Vật Quảng Cáo',
      'product-intro-audio': 'Giới Thiệu Sản Phẩm Theo Âm Thanh',
      'lip-sync': 'Lips Sync',
      'google-banana-pro': 'Google Banana Pro',
    };
    return names[featureType] || featureType;
  };

  const getFeatureDescription = (featureType: string) => {
    const descriptions: Record<string, string> = {
      'create-image': 'Biến mọi trí tưởng tượng thành hiện thực',
      'create-video': 'Biến ảnh tĩnh nhàm chán trở nên hấp dẫn hơn',
      'upscale-image': 'Tăng chất lượng hình ảnh lên tới 4k',
      'google-banana-pro': 'Model tạo ảnh tốt nhất hiện nay',
      'product-model': 'Ghép người mẫu và sản phẩm tuỳ biến',
      'change-outfit': 'Thay mọi trang phục bạn muốn',
      'skin-edit': 'Làn da nhân vật thực tế hơn',
      'face-swap': 'Thay thế và hoà không',
      'character-swap': 'Thay thế và hoán đổi nhân vật',
      'character-swap-2': 'Thay thế và hoán đổi nhân vật',
      'dance-image-bg': 'AI sẽ tạo video nhảy dùng nền từ ảnh gốc',
      'dance-video-bg': 'AI sẽ tạo video nhảy dùng nền từ video gốc',
      'edit-video': 'Tuỳ chỉnh và thay đổi chi tiết video',
      'replace-ad': 'AI sẽ tạo video thay nhân vật quảng cáo',
      'replace-ad-2': 'AI tạo video thay nhân vật quảng cáo',
      'product-intro-audio': 'AI sẽ tạo video nói theo lời thoại',
      'lip-sync': 'AI sẽ nhại theo tiếng file âm thanh',
    };
    return descriptions[featureType] || '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'processing':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Admin Dashboard</h1>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm job..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#1E1E1E] text-white rounded-lg border border-[#8B2AB3]/30 focus:outline-none focus:border-[#D344FF]"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'processing', 'completed', 'failed'] as JobStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveFilter(status)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeFilter === status
                      ? 'bg-[#D344FF] text-white'
                      : 'bg-[#1E1E1E] text-gray-400 hover:bg-[#2a2a2a]'
                  }`}
                >
                  {status === 'all' ? 'Tất cả' : 
                   status === 'pending' ? 'Chờ xử lý' :
                   status === 'processing' ? 'Đang xử lý' :
                   status === 'completed' ? 'Hoàn thành' : 'Thất bại'}
                </button>
              ))}
            </div>
          </div>

          {/* Jobs List */}
          <div className="bg-[#1E1E1E] rounded-xl p-6">
            {loading ? (
              <div className="text-center text-gray-400 py-8">Đang tải...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center text-gray-400 py-8">Không có job nào</div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-[#2a2a2a] rounded-lg p-4 border border-[#8B2AB3]/30 hover:border-[#D344FF]/50 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-bold">{getFeatureName(job.feature_type)}</h3>
                          <span className={`text-sm ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                          {job.admin_status && (
                            <span className="text-xs text-gray-500">
                              ({job.admin_status})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 space-y-1">
                          <p>Job ID: <code className="text-[#D344FF]">{job.id}</code></p>
                          <p>User ID: <code className="text-gray-500">{job.user_id}</code></p>
                          {getFeatureDescription(job.feature_type) && (
                            <p>
                              <span className="text-gray-500">Yêu cầu:</span>{' '}
                              <span className="text-white">{getFeatureDescription(job.feature_type)}</span>
                            </p>
                          )}
                          {job.prompt && (
                            <p>
                              <span className="text-gray-500">Prompt:</span>{' '}
                              <span className="text-white">{job.prompt}</span>
                            </p>
                          )}
                          {job.input_file_url && (
                            <p>
                              Input: <a href={job.input_file_url} target="_blank" rel="noopener noreferrer" className="text-[#D344FF] hover:underline">Xem file</a>
                            </p>
                          )}
                          {job.created_at && (
                            <p>Created: {new Date(job.created_at).toLocaleString('vi-VN')}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {job.status === 'pending' && (
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="px-4 py-2 bg-[#D344FF] text-white rounded-lg hover:bg-[#B836E6] transition-all flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Upload kết quả
                          </button>
                        )}
                        {job.result_url && (
                          <a
                            href={job.result_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#1E1E1E] text-white rounded-lg hover:bg-[#2a2a2a] transition-all flex items-center gap-2 border border-[#8B2AB3]/30"
                          >
                            <Image className="w-4 h-4" />
                            Xem kết quả
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] rounded-xl p-6 max-w-md w-full border border-[#8B2AB3]/30">
            <h2 className="text-2xl font-bold text-white mb-4">Upload kết quả</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2">Job ID</label>
                <p className="text-gray-400 text-sm">{selectedJob.id}</p>
              </div>
              <div>
                <label className="block text-white mb-2">Ghi chú (tùy chọn)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-lg border border-[#8B2AB3]/30 focus:outline-none focus:border-[#D344FF]"
                  rows={3}
                  placeholder="Nhập ghi chú..."
                />
              </div>
              <div>
                <label className="block text-white mb-2">File kết quả</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(selectedJob, file);
                    }
                  }}
                  className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-lg border border-[#8B2AB3]/30 focus:outline-none focus:border-[#D344FF]"
                  disabled={uploading}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedJob(null);
                    setAdminNotes('');
                  }}
                  className="flex-1 px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a] transition-all"
                  disabled={uploading}
                >
                  Hủy
                </button>
              </div>
              {uploading && (
                <div className="text-center text-gray-400">Đang upload...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

