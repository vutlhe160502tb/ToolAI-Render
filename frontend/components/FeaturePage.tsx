'use client';

import { Suspense, useState } from 'react';
import Header from '@/components/Header';
import { Upload, Video, Image, Music, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useProgressBar } from '@/hooks/useProgressBar';
import { useToast } from '@/contexts/ToastContext';

interface FileInput {
  name: string;
  label: string;
  accept: string;
  maxSize: number; // MB
  allowedTypes: string[];
  icon?: React.ReactNode;
}

interface FeatureConfig {
  title: string;
  description?: string;
  icon: React.ReactNode;
  apiEndpoint: string;
  fileInputs: FileInput[];
  promptInput?: boolean;
  promptPlaceholder?: string;
}

function FeaturePageInner({ config }: { config: FeatureConfig }) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [serverProgress, setServerProgress] = useState<number | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  const progress = useProgressBar(serverProgress, isGenerating);

  const handleFileUpload = (inputName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const inputConfig = config.fileInputs.find(inp => inp.name === inputName);
      
      if (!inputConfig) return;
      
      if (!inputConfig.allowedTypes.includes(file.type)) {
        showToast(`Chỉ chấp nhận: ${inputConfig.accept}`, 'error');
        return;
      }
      
      const MAX_SIZE = inputConfig.maxSize * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        showToast(`Kích thước file không được vượt quá ${inputConfig.maxSize}MB`, 'error');
        return;
      }
      
      setFiles(prev => ({ ...prev, [inputName]: file }));
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

    // Check all required files
    const missingFiles = config.fileInputs.filter(inp => !files[inp.name]);
    if (missingFiles.length > 0) {
      showToast(`Vui lòng tải lên: ${missingFiles.map(f => f.label).join(', ')}`, 'error');
      return;
    }

    setIsGenerating(true);
    const formData = new FormData();
    
    // Add all files
    config.fileInputs.forEach(input => {
      const file = files[input.name];
      if (file) {
        formData.append(input.name, file);
      }
    });
    
    // Add prompt if available
    if (config.promptInput && prompt) {
      formData.append('prompt', prompt);
    }
    
    formData.append('user_id', user_id);

    try {
      const response = await axios.post(config.apiEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJobId(response.data.job_id);
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

  const startPolling = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/videos/progress`, { params: { jobId } });
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
          showToast('Thất bại!', 'error');
        }
      } catch (error: any) {
        if (error?.response?.status === 404) {
          clearInterval(interval);
          setIsGenerating(false);
          return;
        }
        console.error('Polling error:', error);
      }
    }, 3000);
  };

  const allFilesUploaded = config.fileInputs.every(inp => files[inp.name]);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
            {config.icon}
            {config.title}
          </h1>

          {config.description && (
            <p className="text-gray-400 mb-6">{config.description}</p>
          )}

          <div className="bg-[#1E1E1E] rounded-xl p-8 border border-[#8B2AB3]/30">
            {config.fileInputs.map((input) => (
              <div key={input.name} className="mb-6">
                <label className="block text-white mb-2">{input.label}</label>
                <div className="border-2 border-dashed border-[#D344FF] rounded-lg p-8 text-center">
                  {input.icon || <Upload className="w-12 h-12 text-[#D344FF] mx-auto mb-4" />}
                  <input
                    type="file"
                    accept={input.accept}
                    onChange={(e) => handleFileUpload(input.name, e)}
                    className="hidden"
                    id={`${input.name}-upload`}
                  />
                  <label
                    htmlFor={`${input.name}-upload`}
                    className="cursor-pointer text-[#D344FF] hover:text-[#E066FF]"
                  >
                    {files[input.name] ? files[input.name]!.name : `Chọn ${input.label.toLowerCase()}`}
                  </label>
                </div>
              </div>
            ))}

            {config.promptInput && (
              <div className="mb-6">
                <label className="block text-white mb-2">Mô tả (Prompt)</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={config.promptPlaceholder || 'Nhập mô tả...'}
                  className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-lg border border-[#8B2AB3]/30 focus:outline-none focus:border-[#D344FF]"
                  rows={4}
                />
              </div>
            )}

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
              disabled={isGenerating}
              className="w-full px-6 py-4 bg-[#D344FF] text-white rounded-lg hover:bg-[#B836E6] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  {config.icon}
                  <span>Tạo</span>
                </>
              )}
            </button>

            {/* Result Image Modal */}
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

export default function FeaturePage(props: { config: FeatureConfig }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <FeaturePageInner {...props} />
    </Suspense>
  );
}

