import FeaturePage from '@/components/FeaturePage';
import { Video } from 'lucide-react';

export default function CharacterSwapPage() {
  return (
    <FeaturePage
      config={{
        title: 'Character Swap',
        icon: <Video className="w-10 h-10 text-[#D344FF]" />,
        apiEndpoint: '/api/videos/character-swap',
        fileInputs: [
          {
            name: 'file1',
            label: 'Tải lên file 1 (ảnh hoặc video)',
            accept: 'image/*,video/*',
            maxSize: 200,
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp',
                          'video/mp4', 'video/quicktime', 'video/x-msvideo'],
          },
          {
            name: 'file2',
            label: 'Tải lên file 2 (ảnh hoặc video)',
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

