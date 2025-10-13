import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { mockTalkSessions, mockBids } from '../data/mockData';

export default function BidHistory() {
  const { talkId } = useParams<{ talkId: string }>();
  const navigate = useNavigate();
  const talk = mockTalkSessions.find(t => t.id === talkId);
  const bids = mockBids.filter(b => b.talk_session_id === talkId);

  if (!talk) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Talk枠が見つかりません</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP').format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/talk/${talkId}`)}
          className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">入札履歴</h1>
          <p className="text-gray-600">{talk.influencer.name} - {talk.title}</p>
        </div>
      </div>

      {/* Current Highest Bid */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-100">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">現在の最高価格</p>
          <p className="text-3xl font-bold text-pink-600">¥{formatPrice(talk.current_highest_bid)}</p>
        </div>
      </div>

      {/* Bid History */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <span>入札履歴</span>
        </h3>
        
        {bids.length > 0 ? (
          <div className="space-y-3">
            {bids.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((bid) => (
              <div key={bid.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  {bid.user.avatar_url && (
                    <img
                      src={bid.user.avatar_url}
                      alt={bid.user.username}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{bid.user.username}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(bid.created_at).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="font-bold text-xl text-green-600">
                  ¥{formatPrice(bid.amount)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">まだ入札がありません</h3>
            <p className="text-gray-500">最初の入札者になりましょう！</p>
          </div>
        )}
      </div>
    </div>
  );
}