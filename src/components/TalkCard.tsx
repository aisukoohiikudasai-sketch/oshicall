import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { Clock } from 'lucide-react';
import { TalkSession } from '../types';
import CountdownTimer from './CountdownTimer';

interface TalkCardProps {
  talk: TalkSession;
  onSelect: (talk: TalkSession) => void;
}

export default function TalkCard({ talk, onSelect }: TalkCardProps) {
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

  return (
    <div
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105 border border-pink-100"
      onClick={() => onSelect(talk)}
    >
      {/* Background Image with Host Info */}
      <div 
        className="h-64 bg-cover bg-top relative"
        style={{ backgroundImage: `url(${talk.detail_image_url || talk.influencer.avatar_url})` }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40"></div>
        
        {/* Host Name - Top */}
        <div className="absolute top-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white drop-shadow-lg">
            {talk.influencer.name}
          </h3>
        </div>

        {/* Host Message - Bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-sm leading-relaxed text-white drop-shadow-md opacity-95 line-clamp-2">
            {talk.host_message || talk.influencer.description || talk.description}
          </p>
        </div>
      </div>

      {/* Talk Details Section */}
      <div className="p-4 space-y-3">
        {/* 通話枠開始時間 */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="font-medium">
              通話開始: {formatDate(talk.start_time)}
            </span>
          </div>
          {talk.is_female_only && (
            <span className="bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full text-[10px] font-medium">
              女性限定
            </span>
          )}
        </div>
        
        {/* オークション終了時間とカウントダウン */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-gray-500">オークション終了: {formatDate(talk.auction_end_time)}</span>
            </div>
            <CountdownTimer
              targetTime={talk.auction_end_time}
              className="text-xs text-orange-600 font-medium"
              showSeconds={false}
            />
          </div>
          <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-full hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg">
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}