import FeaturePage3Column from '@/components/FeaturePage3Column';

export default function EditVideoPage() {
  return (
    <FeaturePage3Column
      featureType="edit-video"
      title="Edit Video"
      description="Chỉnh sửa video theo prompt"
      apiEndpoint="/api/videos/edit-video"
      fileInputs={[
        {
          name: 'file',
          label: 'Tải lên video',
          accept: 'video/*',
          maxSize: 200,
          allowedTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
          icon: 'video',
          placeholder: 'Tải lên video',
          description: 'Chọn video'
        }
      ]}
      hasPrompt={true}
      promptPlaceholder="Nhập mô tả cho các chỉnh sửa bạn muốn..."
      hasQuality={true}
      coinCost={1}
    />
  );
}
