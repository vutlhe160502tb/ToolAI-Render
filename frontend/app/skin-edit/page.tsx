import FeaturePage from '@/components/FeaturePage';
import { Image } from 'lucide-react';

export default function SkinEditPage() {
  return (
    <FeaturePage
      config={{
        title: 'Chỉnh Sửa Da',
        icon: <Image className="w-10 h-10 text-[#D344FF]" />,
        apiEndpoint: '/api/videos/skin-edit',
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

