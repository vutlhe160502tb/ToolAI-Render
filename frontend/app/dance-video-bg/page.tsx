import FeaturePage3Column from '@/components/FeaturePage3Column';

export default function DanceVideoBgPage() {
  return (
    <FeaturePage3Column
      featureType="dance-video-bg"
      title="Nhảy Với Nền Từ Video"
      description="Tạo nhân vật AI chuyển động với nền video"
      apiEndpoint="/api/videos/dance-video-bg"
      fileInputs={[
        {
          name: 'image',
          label: 'Tải lên ảnh',
          accept: 'image/*',
          maxSize: 50,
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          icon: 'image',
          placeholder: 'Tải lên ảnh',
          description: 'Chọn ảnh'
        },
        {
          name: 'video',
          label: 'Tải lên video nền',
          accept: 'video/*',
          maxSize: 200,
          allowedTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
          icon: 'video',
          placeholder: 'Tải lên video nền',
          description: 'Chọn video'
        }
      ]}
      hasQuality={true}
      coinCost={1}
      previewMedia={{
        type: 'video',
        src: '/nhayvoinentuvideo.mp4'
      }}
    />
  );
}
