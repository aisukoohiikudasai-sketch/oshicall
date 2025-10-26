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
  const [auctionEndTime, setAuctionEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // 通話枠開始時間が変更された時にオークション終了時間を自動設定
  const handleScheduledTimeChange = (value: string) => {
    setFormData(prev => ({ ...prev, scheduled_start_time: value }));
    
    if (value) {
      const scheduledTime = new Date(value);
      const defaultEndTime = new Date(scheduledTime.getTime() - 24 * 60 * 60 * 1000); // 24時間前
      const now = new Date();
      const minEndTime = new Date(now.getTime() + 60 * 60 * 1000); // 現在から1時間後
      
      // デフォルト終了時間が現在から1時間後より前の場合は1時間後に設定
      const finalEndTime = defaultEndTime < minEndTime ? minEndTime : defaultEndTime;
      
      setAuctionEndTime(finalEndTime.toISOString().slice(0, 16));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 日時のバリデーション
      const scheduledTime = new Date(formData.scheduled_start_time);
      const auctionEnd = new Date(auctionEndTime);
      const now = new Date();

      if (scheduledTime <= now) {
        setError('開始時刻は現在時刻より後に設定してください');
        setLoading(false);
        return;
      }

      if (auctionEnd <= now) {
        setError('オークション終了時間は現在時刻より後に設定してください');
        setLoading(false);
        return;
      }

      if (auctionEnd >= scheduledTime) {
        setError('オークション終了時間は通話枠開始時間より前に設定してください');
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

      const callSlot = await createCallSlot(influencerId, callSlotData);

      // オークションは既にcreateCallSlot内で作成されているため、ここでは何もしない
      console.log('✅ Talk枠とオークションの作成が完了しました');
      
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 relative shadow-2xl my-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-4 pr-8">
          新しいTalk枠を作成
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
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
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
              placeholder="このTalkセッションについて詳しく説明してください"
            />
          </div>

          {/* 日時と時間を横並びに */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onChange={(e) => handleScheduledTimeChange(e.target.value)}
                min={getMinDateTime()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                required
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
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
          </div>

          {/* オークション終了時間 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              オークション終了時間 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={auctionEndTime}
              onChange={(e) => setAuctionEndTime(e.target.value)}
              min={getMinDateTime()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              ※ 通話枠開始時間より前に設定してください（デフォルト: 開始時間の24時間前）
            </p>
          </div>
          
          <p className="text-xs text-gray-500">
            ※ 開始日時は現在から25時間以上先の日時を設定してください（オークション期間24時間を確保）
          </p>

          {/* 価格設定を横並びに */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                required
              />
            </div>
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
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 transition-colors">
                <Upload className="h-8 w-8 text-gray-400 mb-1" />
                <span className="text-xs text-gray-600">クリックして画像を選択</span>
                <span className="text-xs text-gray-500">JPEG, PNG, WebP, GIF (最大5MB)</span>
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
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* ボタン */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {uploadingImage ? '画像アップロード中...' : loading ? '作成中...' : 'Talk枠を作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

