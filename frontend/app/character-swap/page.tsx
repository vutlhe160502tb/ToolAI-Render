import FeaturePage3Column from '@/components/FeaturePage3Column';

export default function CharacterSwapPage() {
  return (
    <FeaturePage3Column
      featureType="character-swap"
      title="Character Swap"
      description="Hoán đổi nhân vật giữa 2 file"
      apiEndpoint="/api/videos/character-swap"
      fileInputs={[
        {
          name: 'file1',
          label: 'Tải lên file 1',
          accept: 'image/*,video/*',
          maxSize: 200,
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp',
                        'video/mp4', 'video/quicktime', 'video/x-msvideo'],
          icon: 'file',
          placeholder: 'Tải lên file 1',
          description: 'Chọn file'
        },
        {
          name: 'file2',
          label: 'Tải lên file 2',
          accept: 'image/*,video/*',
          maxSize: 200,
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp',
                        'video/mp4', 'video/quicktime', 'video/x-msvideo'],
          icon: 'file',
          placeholder: 'Tải lên file 2',
          description: 'Chọn file'
        }
      ]}
      coinCost={1}
    />
  );
}
