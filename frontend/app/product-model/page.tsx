import FeaturePage from '@/components/FeaturePage';
import { Image } from 'lucide-react';

export default function ProductModelPage() {
  return (
    <FeaturePage
      config={{
        title: 'Người Mẫu Giới Thiệu Sản Phẩm',
        icon: <Image className="w-10 h-10 text-[#D344FF]" />,
        apiEndpoint: '/api/videos/product-model',
        fileInputs: [
          {
            name: 'product_image',
            label: 'Tải lên ảnh sản phẩm',
            accept: 'image/*',
            maxSize: 50,
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          },
          {
            name: 'model_image',
            label: 'Tải lên ảnh người mẫu',
            accept: 'image/*',
            maxSize: 50,
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          },
        ],
      }}
    />
  );
}

