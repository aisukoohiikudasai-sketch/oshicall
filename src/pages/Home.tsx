import React, { useState } from 'react';
import { Calendar, Grid } from 'lucide-react';
import { mockTalkSessions } from '../data/mockData';
import { TalkSession } from '../types';
import TalkCard from '../components/TalkCard';

interface HomeProps {
  onTalkSelect?: (talkId: string) => void;
}

export default function Home({ onTalkSelect }: HomeProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [selectedTalk, setSelectedTalk] = useState<TalkSession | null>(null);

  const handleTalkSelect = (talk: TalkSession) => {
    setSelectedTalk(talk);
    onTalkSelect?.(talk.id);
  };

  const sortedTalks = [...mockTalkSessions];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 pt-6">
        <div className="text-center md:text-left w-full md:w-auto">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-3 whitespace-nowrap">
            推しとの特別な時間を
          </h1>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden w-full">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-pink-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Grid className="h-3 w-3" />
              <span className="text-xs font-medium">グリッド</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-md transition-all duration-200 ${
                viewMode === 'calendar'
                  ? 'bg-white shadow-sm text-pink-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar className="h-3 w-3" />
              <span className="text-xs font-medium">カレンダー</span>
            </button>
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="hidden md:flex space-x-4">
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
        </div>
      </div>

      {/* Active Talks Count */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-xl border border-pink-100">
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
          <h3 className="text-xl font-bold text-gray-800 mb-6">カレンダー表示</h3>
          
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-700">
              {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
            </h4>
            <div className="flex space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="text-gray-600">‹</span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="text-gray-600">›</span>
              </button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {Array.from({ length: 35 }, (_, i) => {
              const date = new Date();
              const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
              const startDate = new Date(firstDay);
              startDate.setDate(startDate.getDate() - firstDay.getDay());
              const currentDate = new Date(startDate);
              currentDate.setDate(currentDate.getDate() + i);
              
              const isCurrentMonth = currentDate.getMonth() === date.getMonth();
              const isToday = currentDate.toDateString() === date.toDateString();
              
              // Check if there are talks on this date
              const talksOnDate = sortedTalks.filter(talk => {
                const talkDate = new Date(talk.start_time);
                return talkDate.toDateString() === currentDate.toDateString();
              });
              
              return (
                <div
                  key={i}
                  className={`relative p-2 text-center text-sm cursor-pointer rounded-lg transition-all duration-200 ${
                    isCurrentMonth
                      ? isToday
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold'
                        : 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-300'
                  }`}
                >
                  {currentDate.getDate()}
                  {talksOnDate.length > 0 && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-1">
                      {talksOnDate.slice(0, 3).map((_, index) => (
                        <div
                          key={index}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isToday ? 'bg-white' : 'bg-pink-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Today's Talks */}
          <div className="border-t pt-4">
            <h5 className="font-semibold text-gray-700 mb-3">今日のTalk枠</h5>
            {sortedTalks
              .filter(talk => {
                const talkDate = new Date(talk.start_time);
                const today = new Date();
                return talkDate.toDateString() === today.toDateString();
              })
              .slice(0, 3)
              .map(talk => (
                <div
                  key={talk.id}
                  onClick={() => handleTalkSelect(talk)}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <img
                    src={talk.influencer.avatar_url}
                    alt={talk.influencer.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{talk.influencer.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(talk.start_time).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - {new Date(talk.end_time).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">¥{formatPrice(talk.current_highest_bid)}</p>
                  </div>
                </div>
              ))}
            
            {sortedTalks.filter(talk => {
              const talkDate = new Date(talk.start_time);
              const today = new Date();
              return talkDate.toDateString() === today.toDateString();
            }).length === 0 && (
              <p className="text-gray-500 text-center py-4">今日のTalk枠はありません</p>
            )}
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
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ja-JP').format(price);
};