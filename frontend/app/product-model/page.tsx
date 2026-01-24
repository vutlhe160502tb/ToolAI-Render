import FeaturePage3Column from '@/components/FeaturePage3Column';

export default function ProductModelPage() {
  return (
    <FeaturePage3Column
      featureType="product-model"
      title="Người Mẫu Giới Thiệu Sản Phẩm"
      description="Tạo video người mẫu giới thiệu sản phẩm"
      apiEndpoint="/api/videos/product-model"
      fileInputs={[
        {
          name: 'product_image',
          label: 'Tải lên ảnh sản phẩm',
          accept: 'image/*',
          maxSize: 50,
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          icon: 'image',
          placeholder: 'Tải lên ảnh sản phẩm',
          description: 'Chọn ảnh'
        },
        {
          name: 'model_image',
          label: 'Tải lên ảnh người mẫu',
          accept: 'image/*',
          maxSize: 50,
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          icon: 'image',
          placeholder: 'Tải lên ảnh người mẫu',
          description: 'Chọn ảnh'
        }
      ]}
      coinCost={1}
    />
  );
}
