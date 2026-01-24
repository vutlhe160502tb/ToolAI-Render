import FeaturePage3Column from '@/components/FeaturePage3Column';

export default function ProductIntroAudioPage() {
  return (
    <FeaturePage3Column
      featureType="product-intro-audio"
      title="Giới Thiệu Sản Phẩm Theo Âm Thanh"
      description="Tạo video giới thiệu sản phẩm với âm thanh"
      apiEndpoint="/api/videos/product-intro-audio"
      fileInputs={[
        {
          name: 'file',
          label: 'Tải lên ảnh hoặc video',
          accept: 'image/*,video/*',
          maxSize: 200,
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp',
                        'video/mp4', 'video/quicktime', 'video/x-msvideo'],
          icon: 'file',
          placeholder: 'Tải lên ảnh hoặc video',
          description: 'Chọn file'
        },
        {
          name: 'audio',
          label: 'Tải lên file âm thanh',
          accept: 'audio/*',
          maxSize: 50,
          allowedTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
          icon: 'audio',
          placeholder: 'Tải lên file âm thanh',
          description: 'Chọn audio'
        }
      ]}
      coinCost={1}
    />
  );
}
