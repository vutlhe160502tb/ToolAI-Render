import FeaturePage from '@/components/FeaturePage';
import { Image } from 'lucide-react';

export default function UpscaleImagePage() {
  return (
    <FeaturePage
      config={{
        title: 'Làm Nét Ảnh',
        icon: <Image className="w-10 h-10 text-[#D344FF]" />,
        apiEndpoint: '/api/videos/upscale-image',
        fileInputs: [
          {
            name: 'file',
            label: 'Tải lên ảnh',
            accept: 'image/*',
            maxSize: 50,
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          },
        ],
      }}
    />
  );
}

