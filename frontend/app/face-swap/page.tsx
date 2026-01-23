import FeaturePage from '@/components/FeaturePage';
import { Image } from 'lucide-react';

export default function FaceSwapPage() {
  return (
    <FeaturePage
      config={{
        title: 'Face Swap',
        icon: <Image className="w-10 h-10 text-[#D344FF]" />,
        apiEndpoint: '/api/videos/face-swap',
        fileInputs: [
          {
            name: 'source_image',
            label: 'Tải lên ảnh nguồn (khuôn mặt cần thay)',
            accept: 'image/*',
            maxSize: 50,
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          },
          {
            name: 'target_image',
            label: 'Tải lên ảnh đích (ảnh sẽ được thay khuôn mặt)',
            accept: 'image/*',
            maxSize: 50,
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          },
        ],
      }}
    />
  );
}

