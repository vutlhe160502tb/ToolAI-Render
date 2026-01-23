import FeaturePage from '@/components/FeaturePage';
import { Video } from 'lucide-react';

export default function DanceVideoBgPage() {
  return (
    <FeaturePage
      config={{
        title: 'Nhảy Với Nền Từ Video',
        icon: <Video className="w-10 h-10 text-[#D344FF]" />,
        apiEndpoint: '/api/videos/dance-video-bg',
        fileInputs: [
          {
            name: 'image',
            label: 'Tải lên ảnh (9:16)',
            accept: 'image/*',
            maxSize: 50,
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          },
          {
            name: 'video',
            label: 'Tải lên video nền (9:16)',
            accept: 'video/*',
            maxSize: 200,
            allowedTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
          },
        ],
      }}
    />
  );
}

