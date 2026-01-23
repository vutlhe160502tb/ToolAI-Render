import FeaturePage from '@/components/FeaturePage';
import { Video, Music } from 'lucide-react';

export default function LipSyncPage() {
  return (
    <FeaturePage
      config={{
        title: 'Lips Sync',
        icon: <Video className="w-10 h-10 text-[#D344FF]" />,
        apiEndpoint: '/api/videos/lip-sync',
        fileInputs: [
          {
            name: 'file',
            label: 'Tải lên ảnh hoặc video',
            accept: 'image/*,video/*',
            maxSize: 200,
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp',
                          'video/mp4', 'video/quicktime', 'video/x-msvideo'],
          },
          {
            name: 'audio',
            label: 'Tải lên file âm thanh',
            accept: 'audio/*',
            maxSize: 50,
            allowedTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
            icon: <Music className="w-12 h-12 text-[#D344FF] mx-auto mb-4" />,
          },
        ],
      }}
    />
  );
}

