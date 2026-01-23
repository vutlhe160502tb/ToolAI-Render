import FeaturePage from '@/components/FeaturePage';
import { Video } from 'lucide-react';

export default function CreateVideoPage() {
  return (
    <FeaturePage
      config={{
        title: 'Tạo Video',
        icon: <Video className="w-10 h-10 text-[#D344FF]" />,
        apiEndpoint: '/api/videos/create-video',
        promptInput: true,
        promptPlaceholder: 'Nhập mô tả cho video bạn muốn tạo...',
        fileInputs: [
          {
            name: 'file',
            label: 'Tải lên file (ảnh hoặc video, tùy chọn)',
            accept: 'image/*,video/*',
            maxSize: 200,
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
                          'video/mp4', 'video/quicktime', 'video/x-msvideo'],
          },
        ],
      }}
    />
  );
}

