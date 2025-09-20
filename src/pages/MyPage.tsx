import React, { useState } from 'react';
import { User, Trophy, Calendar, Pen as Yen, Video, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mockTalkSessions } from '../data/mockData';

export default function MyPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'won' | 'participating' | 'history'>('won');

  if (!user) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">ログインが必要です</h2>
        <p className="text-gray-600 mb-6">マイページを表示するにはログインしてください</p>
        <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200">
          ログイン
        </button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP').format(price);
  };

  // Mock data for user's won talks
  const wonTalks = mockTalkSessions.slice(0, 2).map(talk => ({
    ...talk,
    status: 'won' as const,
    final_price: talk.current_highest_bid + 5000,
  }));

  const tabs = [
    { id: 'won', label: '落札したTalk', icon: Trophy },
    { id: 'participating', label: '参加中', icon: Calendar },
    { id: 'history', label: '履歴', icon: Yen },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            {user.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="h-24 w-24 rounded-full object-cover border-4 border-pink-200"
              />
            )}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full p-2">
              <User className="h-4 w-4" />
            </div>
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{user.username}</h1>
            <p className="text-gray-600 mb-4">{user.email}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-pink-600">¥{formatPrice(user.total_spent)}</div>
                <div className="text-sm text-gray-600">総支払い額</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-green-600">{user.successful_bids}</div>
                <div className="text-sm text-gray-600">成功した入札</div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-purple-600">4.8</div>
                <div className="text-sm text-gray-600">平均評価</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'won' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">落札したTalk枠</h2>
              
              {wonTalks.length > 0 ? (
                <div className="grid gap-4">
                  {wonTalks.map((talk) => (
                    <div key={talk.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <img
                            src={talk.influencer.avatar_url}
                            alt={talk.influencer.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="font-bold text-gray-800">{talk.title}</h3>
                            <p className="text-sm text-gray-600">{talk.influencer.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">¥{formatPrice(talk.final_price)}</div>
                          <div className="text-sm text-gray-600">落札価格</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(talk.start_time)} - {formatDate(talk.end_time)}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200">
                          <Video className="h-4 w-4" />
                          <span>通話開始</span>
                        </button>
                        <button className="flex items-center space-x-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <MessageSquare className="h-4 w-4" />
                          <span>メッセージ</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">落札したTalk枠がありません</h3>
                  <p className="text-gray-500 mb-4">気になるTalk枠を見つけて入札してみましょう！</p>
                  <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200">
                    Talk枠を探す
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'participating' && (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">参加中のオークションがありません</h3>
              <p className="text-gray-500">現在入札中のTalk枠がここに表示されます</p>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="text-center py-12">
              <Yen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">取引履歴がありません</h3>
              <p className="text-gray-500">過去の入札履歴がここに表示されます</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}