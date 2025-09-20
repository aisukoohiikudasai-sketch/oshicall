import React, { useState } from 'react';
import { 
  User, 
  Trophy, 
  Calendar, 
  Pen as EditIcon, 
  Video, 
  MessageSquare, 
  Star,
  Crown,
  Award,
  Camera,
  Plus,
  X,
  Settings,
  Eye,
  EyeOff,
  Filter,
  Search,
  Heart,
  Clock,
  DollarSign,
  Users,
  Target,
  Sparkles,
  Badge,
  Shield,
  Lock,
  Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  mockUserProfile, 
  mockBadges, 
  mockActivityLogs, 
  mockCollections,
  calculateOshiRank,
  calculatePoints
} from '../data/mockData';
import { UserProfile, Badge as BadgeType, ActivityLog, Collection } from '../types';

export default function MyPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'rank' | 'badges' | 'activity' | 'collection' | 'privacy'>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [newTag, setNewTag] = useState('');
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const [activityFilter, setActivityFilter] = useState<'all' | 'call' | 'bid' | 'event'>('all');
  const [activitySort, setActivitySort] = useState<'date' | 'type'>('date');

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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP').format(price);
  };

  const getRankColor = (color: string) => {
    switch (color) {
      case 'yellow': return 'from-yellow-400 to-amber-500';
      case 'purple': return 'from-purple-500 to-indigo-600';
      case 'blue': return 'from-blue-500 to-cyan-600';
      case 'green': return 'from-green-500 to-emerald-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getBadgeRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50';
      case 'epic': return 'border-purple-400 bg-gradient-to-r from-purple-50 to-indigo-50';
      case 'rare': return 'border-blue-400 bg-gradient-to-r from-blue-50 to-cyan-50';
      case 'common': return 'border-gray-400 bg-gradient-to-r from-gray-50 to-gray-100';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const addTag = (type: 'oshi' | 'fan') => {
    if (newTag.trim() && !profile[`${type}_tags`].includes(newTag.trim())) {
      setProfile({
        ...profile,
        [`${type}_tags`]: [...profile[`${type}_tags`], newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (type: 'oshi' | 'fan', index: number) => {
    setProfile({
      ...profile,
      [`${type}_tags`]: profile[`${type}_tags`].filter((_, i) => i !== index)
    });
  };

  const filteredActivities = mockActivityLogs
    .filter(activity => activityFilter === 'all' || activity.type === activityFilter)
    .sort((a, b) => activitySort === 'date' 
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : a.type.localeCompare(b.type)
    );

  const tabs = [
    { id: 'profile', label: 'プロフィール', icon: User },
    { id: 'rank', label: 'ランク・ステータス', icon: Crown },
    { id: 'badges', label: '実績バッジ', icon: Award },
    { id: 'activity', label: '活動ログ', icon: Calendar },
    { id: 'collection', label: 'コレクション', icon: Heart },
    { id: 'privacy', label: 'プライバシー', icon: Shield },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 md:px-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 rounded-3xl shadow-2xl border-2 border-pink-200 p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <div className="relative">
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden border-4 border-pink-300 shadow-xl">
              <img
                src={profile.avatar_url}
                alt={profile.nickname || profile.username}
                className="h-full w-full object-cover"
              />
            </div>
            {isEditingProfile && (
              <button className="absolute bottom-0 right-0 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full p-2 shadow-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200">
                <Camera className="h-4 w-4" />
              </button>
            )}
            <div className={`absolute -top-2 -right-2 bg-gradient-to-r ${getRankColor(profile.oshi_rank.color)} text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg`}>
              {profile.oshi_rank.level}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-4 mb-4">
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                {profile.nickname || profile.username}
              </h1>
              {isEditingProfile ? (
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  保存
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
                >
                  <EditIcon className="h-4 w-4 inline mr-2" />
                  編集
                </button>
              )}
            </div>
            
            <p className="text-gray-600 mb-4">@{profile.username}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-lg">
                <div className="text-2xl font-bold text-pink-600">¥{formatPrice(profile.total_spent)}</div>
                <div className="text-sm text-gray-600">総支払い額</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-lg">
                <div className="text-2xl font-bold text-green-600">{profile.call_count}</div>
                <div className="text-sm text-gray-600">通話回数</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-lg">
                <div className="text-2xl font-bold text-blue-600">{profile.bid_count}</div>
                <div className="text-sm text-gray-600">入札回数</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-lg">
                <div className="text-2xl font-bold text-purple-600">{profile.total_points}</div>
                <div className="text-sm text-gray-600">総ポイント</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap justify-center space-x-2 md:space-x-8 px-4 md:px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-4 transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-pink-600 bg-gradient-to-r from-pink-50 to-purple-50'
                    : 'border-transparent text-gray-600 hover:text-pink-600 hover:border-pink-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium text-sm md:text-base">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">プロフィール設定</h2>
              
              {isEditingProfile ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ニックネーム</label>
                    <input
                      type="text"
                      value={profile.nickname || ''}
                      onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="ニックネームを入力"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">自己紹介 (最大200文字)</label>
                    <textarea
                      value={profile.bio || ''}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value.slice(0, 200) })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="自己紹介を入力してください"
                    />
                    <div className="text-right text-sm text-gray-500 mt-1">
                      {(profile.bio || '').length}/200
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">推しタグ</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profile.oshi_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => removeTag('oshi', index)}
                            className="text-pink-500 hover:text-pink-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag('oshi')}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="推しタグを追加 (#乃木坂46)"
                      />
                      <button
                        onClick={() => addTag('oshi')}
                        className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ファンタグ</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profile.fan_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => removeTag('fan', index)}
                            className="text-purple-500 hover:text-purple-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag('fan')}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="ファンタグを追加 (#古参)"
                      />
                      <button
                        onClick={() => addTag('fan')}
                        className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">自己紹介</h3>
                    <p className="text-gray-600 bg-gray-50 rounded-lg p-4">
                      {profile.bio || '自己紹介が設定されていません'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">推しタグ</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.oshi_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">ファンタグ</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.fan_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rank Tab */}
          {activeTab === 'rank' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Oshiランク & ステータス</h2>
              
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border-2 border-pink-200">
                <div className="text-center">
                  <div className={`inline-flex items-center space-x-3 bg-gradient-to-r ${getRankColor(profile.oshi_rank.color)} text-white px-6 py-3 rounded-full text-xl font-bold mb-4 shadow-lg`}>
                    <Crown className="h-6 w-6" />
                    <span>{profile.oshi_rank.title}</span>
                    <Sparkles className="h-6 w-6 animate-pulse" />
                  </div>
                  <p className="text-gray-600 mb-4">{profile.oshi_rank.description}</p>
                  <div className="text-3xl font-bold text-gray-800 mb-2">{profile.oshi_rank.points}pt</div>
                  <div className="text-sm text-gray-600">総ポイント</div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">ポイント内訳</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">通話回数</span>
                      <span className="font-semibold">{profile.call_count}回 × 3pt = {profile.call_count * 3}pt</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">通話分数</span>
                      <span className="font-semibold">{profile.call_minutes}分 × 0.5pt = {profile.call_minutes * 0.5}pt</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">入札回数</span>
                      <span className="font-semibold">{profile.bid_count}回 × 1pt = {profile.bid_count}pt</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">イベント参加</span>
                      <span className="font-semibold">{profile.event_count}回 × 2pt = {profile.event_count * 2}pt</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">ランク一覧</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-green-50">
                      <span className="text-sm">Newbie</span>
                      <span className="text-xs text-gray-500">0-19pt</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-blue-50">
                      <span className="text-sm">Regular</span>
                      <span className="text-xs text-gray-500">20-69pt</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-purple-50">
                      <span className="text-sm">Devoted</span>
                      <span className="text-xs text-gray-500">70-149pt</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-yellow-50">
                      <span className="text-sm">Top Fan</span>
                      <span className="text-xs text-gray-500">150pt+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">実績バッジ</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`border-2 rounded-xl p-6 text-center cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${getBadgeRarityColor(badge.rarity)}`}
                    onClick={() => setSelectedBadge(badge)}
                  >
                    <div className="text-4xl mb-3">{badge.icon}</div>
                    <h3 className="font-bold text-gray-800 mb-2">{badge.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                    <div className="text-xs text-gray-500">
                      獲得日: {formatDate(badge.earned_at)}
                    </div>
                    <div className={`mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                      badge.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                      badge.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                      badge.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {badge.rarity.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <h2 className="text-2xl font-bold text-gray-800">活動ログ</h2>
                
                <div className="flex space-x-4">
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="all">すべて</option>
                    <option value="call">通話</option>
                    <option value="bid">入札</option>
                    <option value="event">イベント</option>
                  </select>
                  
                  <select
                    value={activitySort}
                    onChange={(e) => setActivitySort(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="date">日付順</option>
                    <option value="type">種類順</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-pink-400 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {activity.type === 'call' && <Video className="h-5 w-5 text-green-500" />}
                          {activity.type === 'bid' && <DollarSign className="h-5 w-5 text-blue-500" />}
                          {activity.type === 'event' && <Users className="h-5 w-5 text-purple-500" />}
                          <h3 className="font-semibold text-gray-800">{activity.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            activity.result === 'success' ? 'bg-green-100 text-green-800' :
                            activity.result === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {activity.result === 'success' ? '成功' :
                             activity.result === 'failed' ? '失敗' : '保留中'}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{activity.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span>{formatDate(activity.date)}</span>
                          {activity.influencer_name && (
                            <span className="flex items-center space-x-1">
                              <Heart className="h-4 w-4" />
                              <span>{activity.influencer_name}</span>
                            </span>
                          )}
                          {activity.duration && (
                            <span className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{activity.duration}分</span>
                            </span>
                          )}
                          {activity.amount && (
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span>¥{formatPrice(activity.amount)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collection Tab */}
          {activeTab === 'collection' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">コレクション</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockCollections.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={item.thumbnail}
                        alt={item.influencer_name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        {item.duration}分
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">{item.influencer_name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{formatDate(item.date)}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">ID: {item.session_id}</span>
                        <button className="text-pink-500 hover:text-pink-700 text-sm font-medium">
                          詳細を見る
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">プライバシー設定</h2>
              
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">マイページ公開範囲</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="profile_visibility"
                        value="public"
                        checked={profile.privacy_settings.profile_visibility === 'public'}
                        onChange={(e) => setProfile({
                          ...profile,
                          privacy_settings: {
                            ...profile.privacy_settings,
                            profile_visibility: e.target.value as any
                          }
                        })}
                        className="text-pink-500"
                      />
                      <Globe className="h-5 w-5 text-green-500" />
                      <span>公開</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="profile_visibility"
                        value="link_only"
                        checked={profile.privacy_settings.profile_visibility === 'link_only'}
                        onChange={(e) => setProfile({
                          ...profile,
                          privacy_settings: {
                            ...profile.privacy_settings,
                            profile_visibility: e.target.value as any
                          }
                        })}
                        className="text-pink-500"
                      />
                      <Eye className="h-5 w-5 text-yellow-500" />
                      <span>リンクのみ</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="profile_visibility"
                        value="private"
                        checked={profile.privacy_settings.profile_visibility === 'private'}
                        onChange={(e) => setProfile({
                          ...profile,
                          privacy_settings: {
                            ...profile.privacy_settings,
                            profile_visibility: e.target.value as any
                          }
                        })}
                        className="text-pink-500"
                      />
                      <Lock className="h-5 w-5 text-red-500" />
                      <span>非公開</span>
                    </label>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">通話履歴の公開</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="call_history_visibility"
                        value="public"
                        checked={profile.privacy_settings.call_history_visibility === 'public'}
                        onChange={(e) => setProfile({
                          ...profile,
                          privacy_settings: {
                            ...profile.privacy_settings,
                            call_history_visibility: e.target.value as any
                          }
                        })}
                        className="text-pink-500"
                      />
                      <Eye className="h-5 w-5 text-green-500" />
                      <span>公開</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="call_history_visibility"
                        value="private"
                        checked={profile.privacy_settings.call_history_visibility === 'private'}
                        onChange={(e) => setProfile({
                          ...profile,
                          privacy_settings: {
                            ...profile.privacy_settings,
                            call_history_visibility: e.target.value as any
                          }
                        })}
                        className="text-pink-500"
                      />
                      <EyeOff className="h-5 w-5 text-red-500" />
                      <span>非公開</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">{selectedBadge.icon}</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedBadge.name}</h3>
              <p className="text-gray-600 mb-4">{selectedBadge.description}</p>
              <div className="text-sm text-gray-500 mb-6">
                獲得日: {formatDate(selectedBadge.earned_at)}
              </div>
              <button
                onClick={() => setSelectedBadge(null)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
