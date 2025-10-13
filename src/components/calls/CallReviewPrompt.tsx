import React, { useState } from 'react';
import { Star, CheckCircle } from 'lucide-react';

interface CallReviewPromptProps {
  influencerName: string;
  influencerImage: string;
  actualDuration: number;
  onReviewSubmit: (rating: number, comment: string) => void;
  onSkip: () => void;
}

export default function CallReviewPrompt({
  influencerName,
  influencerImage,
  actualDuration,
  onReviewSubmit,
  onSkip,
}: CallReviewPromptProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatDuration = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins}分${secs}秒`;
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('評価を選択してください');
      return;
    }

    setSubmitting(true);
    try {
      await onReviewSubmit(rating, comment);
    } catch (error) {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* 完了アイコン */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            通話が終了しました
          </h2>
          <p className="text-gray-600">
            通話時間: {formatDuration(actualDuration)}
          </p>
        </div>

        {/* インフルエンサー情報 */}
        <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <img
            src={influencerImage}
            alt={influencerName}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <p className="text-sm text-gray-600">通話相手</p>
            <p className="font-bold text-gray-900">{influencerName}</p>
          </div>
        </div>

        {/* 星評価 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            通話はいかがでしたか？
          </label>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-12 w-12 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center mt-2 text-sm text-gray-600">
              {rating === 5 && '最高でした！'}
              {rating === 4 && 'とても良かったです'}
              {rating === 3 && '良かったです'}
              {rating === 2 && 'まあまあでした'}
              {rating === 1 && 'もう少しでした'}
            </p>
          )}
        </div>

        {/* コメント */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            コメント（任意）
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="感想やフィードバックをお聞かせください..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
          />
        </div>

        {/* ボタン */}
        <div className="space-y-3">
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '送信中...' : 'レビューを投稿'}
          </button>

          <button
            onClick={onSkip}
            className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            後で投稿する
          </button>
        </div>
      </div>
    </div>
  );
}

