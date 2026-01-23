'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Upload, Video, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useProgressBar } from '@/hooks/useProgressBar';

export default function DanceImageBgPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [serverProgress, setServerProgress] = useState<number | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  
  // Sử dụng hook để tính progress: 0-99% trong 15 phút
  const progress = useProgressBar(serverProgress, isGenerating);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Chỉ chấp nhận file ảnh: JPEG, PNG, WebP');
        return;
      }
      
      // Validate file size (50MB)
      const MAX_SIZE = 50 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        alert('Kích thước ảnh không được vượt quá 50MB');
        return;
      }
      
      setImageFile(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
      if (!allowedTypes.includes(file.type)) {
        alert('Chỉ chấp nhận file video: MP4, MOV, AVI');
        return;
      }
      
      // Validate file size (200MB)
      const MAX_SIZE = 200 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        alert('Kích thước video không được vượt quá 200MB');
        return;
      }
      
      setVideoFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile || !videoFile) {
      alert('Vui lòng tải lên cả ảnh và video!');
      return;
    }

    // Lấy user_id từ session
    const user_id = (session?.user as any)?.id;
    if (!user_id) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này!');
      return;
    }

    setIsGenerating(true);
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('video', videoFile);
    formData.append('user_id', user_id);

    try {
      const response = await axios.post('/api/videos/dance-image-bg', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJobId(response.data.job_id);
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

        // Cập nhật server progress (sẽ được hook xử lý)
        setServerProgress(prog || 0);

        if (status === 'completed') {
          clearInterval(interval);
          setIsGenerating(false);
          setServerProgress(100);
          if (result_url) {
            // Hiển thị kết quả
            alert('Tạo video thành công! Đang mở kết quả...');
            window.open(result_url, '_blank');
          }
        } else if (status === 'failed') {
          clearInterval(interval);
          setIsGenerating(false);
          alert('Tạo video thất bại!');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#1a0a2e]">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
            <Video className="w-10 h-10 text-[#D344FF]" />
            AI Nhảy Với Nền Từ Ảnh
          </h1>

          <div className="bg-[#2d1b4e] rounded-xl p-8 border border-[#8B2AB3]/30">
            {/* Upload Image */}
            <div className="mb-6">
              <label className="block text-white mb-2">Tải lên ảnh (9:16)</label>
              <div className="border-2 border-dashed border-[#D344FF] rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-[#D344FF] mx-auto mb-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer text-[#D344FF] hover:text-[#E066FF]"
                >
                  {imageFile ? imageFile.name : 'Chọn ảnh'}
                </label>
              </div>
            </div>

            {/* Upload Video */}
            <div className="mb-6">
              <label className="block text-white mb-2">Tải lên video mẫu (9:16)</label>
              <div className="border-2 border-dashed border-[#D344FF] rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-[#D344FF] mx-auto mb-4" />
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="cursor-pointer text-[#D344FF] hover:text-[#E066FF]"
                >
                  {videoFile ? videoFile.name : 'Chọn video'}
                </label>
              </div>
            </div>

            {/* Progress */}
            {isGenerating && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white">Đang xử lý...</span>
                  <span className="text-[#D344FF]">{progress}%</span>
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
              disabled={isGenerating || !imageFile || !videoFile}
              className="w-full px-6 py-4 bg-[#D344FF] text-white rounded-lg hover:bg-[#B836E6] glow-purple glow-purple-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang tạo video...</span>
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  <span>Tạo Video</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

