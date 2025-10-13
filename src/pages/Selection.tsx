import React, { useState } from 'react';
import { Calendar, Grid, Filter } from 'lucide-react';
import { mockTalkSessions } from '../data/mockData';
import { TalkSession } from '../types';
import TalkCard from '../components/TalkCard';

interface SelectionProps {
  onTalkSelect?: (talkId: string) => void;
}

export default function Selection({ onTalkSelect }: SelectionProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [selectedTalk, setSelectedTalk] = useState<TalkSession | null>(null);
  const [sortBy, setSortBy] = useState<'time' | 'price' | 'popularity'>('time');

  const handleTalkSelect = (talk: TalkSession) => {
    setSelectedTalk(talk);
    onTalkSelect?.(talk.id);
  };

  const sortedTalks = [...mockTalkSessions].sort((a, b) => {
    switch (sortBy) {
      case 'time':
        return new Date(a.auction_end_time).getTime() - new Date(b.auction_end_time).getTime();
      case 'price':
        return b.current_highest_bid - a.current_highest_bid;
      case 'popularity':
        return b.influencer.follower_count - a.influencer.follower_count;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Talk枠を選択</h1>
          <p className="text-gray-600">お気に入りのインフルエンサーのTalk枠を見つけて入札しましょう</p>
        </div>

        <div className="flex space-x-4">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-pink-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Grid className="h-4 w-4" />
              <span className="text-sm font-medium">グリッド</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                viewMode === 'calendar'
                  ? 'bg-white shadow-sm text-pink-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">カレンダー</span>
            </button>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="time">終了時間順</option>
              <option value="price">価格順</option>
              <option value="popularity">人気順</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Talks Count */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-100">
        <p className="text-sm text-gray-700">
          現在 <span className="font-bold text-pink-600">{mockTalkSessions.length}</span> 件のTalk枠が開催中です
        </p>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTalks.map((talk) => (
            <TalkCard key={talk.id} talk={talk} onSelect={handleTalkSelect} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">カレンダー表示</h3>
          <div className="text-center text-gray-500 py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>カレンダー表示機能は開発中です</p>
            <p className="text-sm">近日公開予定！</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {sortedTalks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">現在開催中のTalk枠がありません</h3>
          <p className="text-gray-500">新しいTalk枠が追加されるまでお待ちください</p>
        </div>
      )}
    </div>
  );
}