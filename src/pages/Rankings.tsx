import React, { useState } from 'react';
import { Trophy, Crown, TrendingUp, Users } from 'lucide-react';
import { mockInfluencers } from '../data/mockData';

export default function Rankings() {
  const [activeTab, setActiveTab] = useState<'influencers' | 'bidders'>('influencers');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP').format(price);
  };

  const sortedInfluencers = [...mockInfluencers].sort((a, b) => b.total_earned - a.total_earned);

  const mockBidders = [
    {
      id: '1',
      username: 'user123',
      avatar_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
      total_spent: 150000,
      successful_bids: 8,
      rank: 1,
    },
    {
      id: '2',
      username: 'otaku_fan',
      avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
      total_spent: 120000,
      successful_bids: 6,
      rank: 2,
    },
    {
      id: '3',
      username: 'anime_lover',
      avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100',
      total_spent: 95000,
      successful_bids: 5,
      rank: 3,
    },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Trophy className="h-6 w-6 text-amber-600" />;
      default:
        return <div className="h-6 w-6 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full text-sm font-bold">{rank}</div>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-4 rounded-full">
            <Trophy className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">ランキング</h1>
        <p className="text-lg text-gray-600">OshiCallのトップパフォーマーをチェック</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="border-b border-gray-200">
          <div className="flex justify-center space-x-8 px-6">
            <button
              onClick={() => setActiveTab('influencers')}
              className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                activeTab === 'influencers'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">インフルエンサーランキング</span>
            </button>
            <button
              onClick={() => setActiveTab('bidders')}
              className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                activeTab === 'bidders'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">ビッダーランキング</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'influencers' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-6">総獲得金額ランキング</h2>
              
              {sortedInfluencers.map((influencer, index) => (
                <div
                  key={influencer.id}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                    index < 3 ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full text-white ${getRankBadge(index + 1)}`}>
                        {getRankIcon(index + 1)}
                      </div>
                      <img
                        src={influencer.avatar_url}
                        alt={influencer.name}
                        className="h-16 w-16 rounded-full object-cover border-4 border-pink-200"
                      />
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{influencer.name}</h3>
                        <p className="text-gray-600">@{influencer.username}</p>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span>{influencer.follower_count.toLocaleString()} followers</span>
                          <span>⭐ {influencer.rating}/5.0</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-auto text-right space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        ¥{formatPrice(influencer.total_earned)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {influencer.total_talks}回のTalk実施
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-6">総支払い額ランキング</h2>
              
              {mockBidders.map((bidder) => (
                <div
                  key={bidder.id}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                    bidder.rank <= 3 ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full text-white ${getRankBadge(bidder.rank)}`}>
                        {getRankIcon(bidder.rank)}
                      </div>
                      <img
                        src={bidder.avatar_url}
                        alt={bidder.username}
                        className="h-16 w-16 rounded-full object-cover border-4 border-purple-200"
                      />
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{bidder.username}</h3>
                        <p className="text-gray-600">アクティブユーザー</p>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span>{bidder.successful_bids}回落札成功</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-auto text-right space-y-2">
                      <div className="text-2xl font-bold text-purple-600">
                        ¥{formatPrice(bidder.total_spent)}
                      </div>
                      <div className="text-sm text-gray-600">
                        総支払い額
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fun Facts */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">📊 OshiCall統計</h3>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-pink-600">¥2,450,000</div>
            <div className="text-sm text-gray-600">総取引額</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-purple-600">127</div>
            <div className="text-sm text-gray-600">成立したTalk数</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-indigo-600">4.9</div>
            <div className="text-sm text-gray-600">平均満足度</div>
          </div>
        </div>
      </div>
    </div>
  );
}