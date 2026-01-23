'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { Upload, Image, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useProgressBar } from '@/hooks/useProgressBar';

export default function ChangeOutfitPage() {
  const { data: session } = useSession();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [outfitFile, setOutfitFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [serverProgress, setServerProgress] = useState<number | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  
  const progress = useProgressBar(serverProgress, isGenerating);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Chỉ chấp nhận file ảnh: JPEG, PNG, WebP');
        return;
      }
      const MAX_SIZE = 50 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        alert('Kích thước ảnh không được vượt quá 50MB');
        return;
      }
      setImageFile(file);
    }
  };

  const handleOutfitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Chỉ chấp nhận file ảnh: JPEG, PNG, WebP');
        return;
      }
      const MAX_SIZE = 50 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        alert('Kích thước ảnh không được vượt quá 50MB');
        return;
      }
      setOutfitFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile || !outfitFile) {
      alert('Vui lòng tải lên cả ảnh người và ảnh trang phục!');
      return;
    }

    const user_id = (session?.user as any)?.id;
    if (!user_id) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này!');
      return;
    }

    setIsGenerating(true);
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('outfit_image', outfitFile);
    formData.append('user_id', user_id);

    try {
      const response = await axios.post('/api/videos/change-outfit', formData, {
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
        setServerProgress(prog || 0);

        if (status === 'completed') {
          clearInterval(interval);
          setIsGenerating(false);
          setServerProgress(100);
          if (result_url) {
            alert('Tạo ảnh thành công! Đang mở kết quả...');
            window.open(result_url, '_blank');
          }
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

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
            <Image className="w-10 h-10 text-[#D344FF]" />
            Thay Trang Phục
          </h1>

          <div className="bg-[#1E1E1E] rounded-xl p-8 border border-[#8B2AB3]/30">
            <div className="mb-6">
              <label className="block text-white mb-2">Tải lên ảnh người</label>
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
                  {imageFile ? imageFile.name : 'Chọn ảnh người'}
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-white mb-2">Tải lên ảnh trang phục</label>
              <div className="border-2 border-dashed border-[#D344FF] rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-[#D344FF] mx-auto mb-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleOutfitUpload}
                  className="hidden"
                  id="outfit-upload"
                />
                <label
                  htmlFor="outfit-upload"
                  className="cursor-pointer text-[#D344FF] hover:text-[#E066FF]"
                >
                  {outfitFile ? outfitFile.name : 'Chọn ảnh trang phục'}
                </label>
              </div>
            </div>

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

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !imageFile || !outfitFile}
              className="w-full px-6 py-4 bg-[#D344FF] text-white rounded-lg hover:bg-[#B836E6] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang tạo ảnh...</span>
                </>
              ) : (
                <>
                  <Image className="w-5 h-5" />
                  <span>Tạo Ảnh</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

