import FeaturePage from '@/components/FeaturePage';
import { Video } from 'lucide-react';

export default function ReplaceAdPage() {
  return (
    <FeaturePage
      config={{
        title: 'Thay Nhân Vật Quảng Cáo',
        icon: <Video className="w-10 h-10 text-[#D344FF]" />,
        apiEndpoint: '/api/videos/replace-ad',
        fileInputs: [
          {
            name: 'video',
            label: 'Tải lên video quảng cáo',
            accept: 'video/*',
            maxSize: 200,
            allowedTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
          },
          {
            name: 'character_image',
            label: 'Tải lên ảnh nhân vật',
            accept: 'image/*',
            maxSize: 50,
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          },
        ],
      }}
    />
  );
}

