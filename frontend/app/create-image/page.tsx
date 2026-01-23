'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { Upload, Image, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useProgressBar } from '@/hooks/useProgressBar';

export default function CreateImagePage() {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [serverProgress, setServerProgress] = useState<number | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  const progress = useProgressBar(serverProgress, isGenerating);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setFile(file);
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
    if (prompt) formData.append('prompt', prompt);
    formData.append('user_id', user_id);

    try {
      const response = await axios.post('/api/videos/create-image', formData, {
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
            setResultUrl(result_url);
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
            Tạo Ảnh
          </h1>

          <div className="bg-[#1E1E1E] rounded-xl p-8 border border-[#8B2AB3]/30">
            <div className="mb-6">
              <label className="block text-white mb-2">Tải lên ảnh (tùy chọn)</label>
              <div className="border-2 border-dashed border-[#D344FF] rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-[#D344FF] mx-auto mb-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-[#D344FF] hover:text-[#E066FF]"
                >
                  {file ? file.name : 'Chọn ảnh'}
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-white mb-2">Mô tả (Prompt)</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Nhập mô tả cho ảnh bạn muốn tạo..."
                className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-lg border border-[#8B2AB3]/30 focus:outline-none focus:border-[#D344FF]"
                rows={4}
              />
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
              disabled={isGenerating || !file}
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

            {/* Result Image Display */}
            {resultUrl && (
              <div className="mt-6">
                <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#8B2AB3]/30">
                  <h3 className="text-white font-semibold mb-4">Kết quả:</h3>
                  <div className="relative">
                    <img
                      src={resultUrl}
                      alt="Kết quả"
                      className="w-full rounded-lg"
                    />
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          const newWindow = window.open(resultUrl, '_blank');
                          if (newWindow) newWindow.focus();
                        }}
                        className="px-4 py-2 bg-[#2a2a2a] border border-[#D344FF] text-[#D344FF] rounded-lg hover:bg-[#D344FF] hover:text-white transition-all"
                      >
                        Xem ảnh
                      </button>
                      <a
                        href={resultUrl}
                        download
                        className="px-4 py-2 bg-[#D344FF] text-white rounded-lg hover:bg-[#B836E6] transition-all"
                      >
                        Tải xuống
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

