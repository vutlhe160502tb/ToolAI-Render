import FeaturePage3Column from '@/components/FeaturePage3Column';

export default function SkinEditPage() {
  return (
    <FeaturePage3Column
      featureType="skin-edit"
      title="Chỉnh Sửa Da"
      description="Chỉnh sửa da trong ảnh"
      apiEndpoint="/api/videos/skin-edit"
      fileInputs={[
        {
          name: 'file',
          label: 'Tải lên ảnh',
          accept: 'image/*',
          maxSize: 50,
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          icon: 'image',
          placeholder: 'Tải lên ảnh',
          description: 'Chọn ảnh'
        }
      ]}
      hasQuality={true}
      coinCost={1}
    />
  );
}
