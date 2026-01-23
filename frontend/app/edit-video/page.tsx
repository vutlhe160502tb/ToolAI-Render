import FeaturePage from '@/components/FeaturePage';
import { Video } from 'lucide-react';

export default function EditVideoPage() {
  return (
    <FeaturePage
      config={{
        title: 'Edit Video',
        icon: <Video className="w-10 h-10 text-[#D344FF]" />,
        apiEndpoint: '/api/videos/edit-video',
        promptInput: true,
        promptPlaceholder: 'Nhập mô tả cho các chỉnh sửa bạn muốn...',
        fileInputs: [
          {
            name: 'file',
            label: 'Tải lên video',
            accept: 'video/*',
            maxSize: 200,
            allowedTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
          },
        ],
      }}
    />
  );
}

