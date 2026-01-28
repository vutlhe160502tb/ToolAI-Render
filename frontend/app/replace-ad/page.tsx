import FeaturePage3Column from '@/components/FeaturePage3Column';

export default function ReplaceAdPage() {
  return (
    <FeaturePage3Column
      featureType="replace-ad"
      title="Thay Nhân Vật Quảng Cáo"
      description="Thay nhân vật trong video quảng cáo"
      apiEndpoint="/api/videos/replace-ad"
      fileInputs={[
          {
            name: 'video',
          label: 'Tải lên video',
            accept: 'video/*',
            maxSize: 200,
            allowedTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
          icon: 'video',
          placeholder: 'Tải lên video',
          description: 'Chọn video'
          },
          {
            name: 'character_image',
            label: 'Tải lên ảnh nhân vật',
            accept: 'image/*',
            maxSize: 50,
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          icon: 'image',
          placeholder: 'Tải lên ảnh nhân vật',
          description: 'Chọn ảnh'
        }
      ]}
      hasQuality={true}
      coinCost={1}
      previewMedia={{
        type: 'image',
        src: '/thaynhanvatquangcao.jpg'
      }}
    />
  );
}
