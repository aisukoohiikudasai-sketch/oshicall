import React, { useState } from 'react';
import { Calendar, Clock, DollarSign, TrendingUp, X, Upload, Image as ImageIcon } from 'lucide-react';
import { createCallSlot, CreateCallSlotInput } from '../api/callSlots';
import { uploadImage, validateImageFile, getImagePreviewUrl } from '../lib/storage';

interface CreateCallSlotFormProps {
  influencerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateCallSlotForm({
  influencerId,
  onSuccess,
  onCancel,
}: CreateCallSlotFormProps) {
  const [formData, setFormData] = useState<CreateCallSlotInput>({
    title: '',
    description: '',
    scheduled_start_time: '',
    duration_minutes: 15,
    starting_price: 1000,
    minimum_bid_increment: 100,
    thumbnail_url: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 日時のバリデーション
      const scheduledTime = new Date(formData.scheduled_start_time);
      const now = new Date();
      const minTime = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 現在時刻 + 25時間

      if (scheduledTime <= minTime) {
        setError('開始時刻は現在から25時間以上先に設定してください（オークション期間を確保するため）');
        setLoading(false);
        return;
      }

      // 画像をアップロード（設定されている場合）
      let thumbnailUrl: string | undefined = formData.thumbnail_url;
      if (imageFile) {
        setUploadingImage(true);
        try {
          thumbnailUrl = await uploadImage(imageFile, 'talk-images', 'thumbnails');
          console.log('✅ 画像アップロード成功:', thumbnailUrl);
        } catch (uploadError: any) {
          console.error('画像アップロードエラー:', uploadError);
          setError(`画像のアップロードに失敗しました: ${uploadError.message}`);
          setLoading(false);
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      // Talk枠を作成
      const callSlotData: CreateCallSlotInput = {
        title: formData.title,
        description: formData.description,
        scheduled_start_time: formData.scheduled_start_time,
        duration_minutes: formData.duration_minutes,
        starting_price: formData.starting_price,
        minimum_bid_increment: formData.minimum_bid_increment,
      };
      
      // 画像URLがある場合のみ追加
      if (thumbnailUrl) {
        callSlotData.thumbnail_url = thumbnailUrl;
      }

      await createCallSlot(influencerId, callSlotData);
      
      onSuccess();
    } catch (err: any) {
      console.error('Talk枠作成エラー:', err);
      setError(err.message || 'Talk枠の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('_minutes') || name.includes('price') || name.includes('increment')
        ? Number(value)
        : value,
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // バリデーション
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || '画像ファイルが無効です');
      return;
    }

    setImageFile(file);
    
    // プレビューを生成
    try {
      const preview = await getImagePreviewUrl(file);
      setImagePreview(preview);
      setError('');
    } catch (err) {
      console.error('プレビュー生成エラー:', err);
    }
  };

  // 現在時刻から25時間後の日時を計算（デフォルト値用）
  const getMinDateTime = () => {
    const date = new Date();
    date.setHours(date.getHours() + 25);
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 relative shadow-2xl my-8">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          新しいTalk枠を作成
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* タイトル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="例: 推しとの特別トーク"
              required
              maxLength={200}
            />
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              説明
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="このTalkセッションについて詳しく説明してください"
            />
          </div>

          {/* 開始日時 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              開始日時 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="scheduled_start_time"
              value={formData.scheduled_start_time}
              onChange={handleChange}
              min={getMinDateTime()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              ※ 現在から25時間以上先の日時を設定してください（オークション期間24時間を確保）
            </p>
          </div>

          {/* 通話時間 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              通話時間 <span className="text-red-500">*</span>
            </label>
            <select
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            >
              <option value={10}>10分</option>
              <option value={15}>15分</option>
              <option value={20}>20分</option>
              <option value={30}>30分</option>
              <option value={45}>45分</option>
              <option value={60}>60分</option>
            </select>
          </div>

          {/* 開始価格 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="inline h-4 w-4 mr-1" />
              開始価格（円） <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="starting_price"
              value={formData.starting_price}
              onChange={handleChange}
              min={100}
              step={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          {/* 最小入札単位 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TrendingUp className="inline h-4 w-4 mr-1" />
              最小入札単位（円） <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="minimum_bid_increment"
              value={formData.minimum_bid_increment}
              onChange={handleChange}
              min={10}
              step={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          {/* サムネイル画像 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ImageIcon className="inline h-4 w-4 mr-1" />
              サムネイル画像
            </label>
            
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="プレビュー"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">クリックして画像を選択</span>
                <span className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP, GIF (最大5MB)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ボタン */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingImage ? '画像アップロード中...' : loading ? '作成中...' : 'Talk枠を作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

