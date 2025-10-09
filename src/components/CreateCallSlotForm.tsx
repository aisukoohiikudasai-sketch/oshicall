import React, { useState } from 'react';
import { Calendar, Clock, DollarSign, TrendingUp, X } from 'lucide-react';
import { createCallSlot, CreateCallSlotInput } from '../api/callSlots';

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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      await createCallSlot(influencerId, formData);
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
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '作成中...' : 'Talk枠を作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

