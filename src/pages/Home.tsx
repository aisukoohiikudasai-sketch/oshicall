import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { mockTalkSessions } from '../data/mockData';
import { TalkSession } from '../types';
import TalkCard from '../components/TalkCard';

interface HomeProps {
  onTalkSelect?: (talkId: string) => void;
}

export default function Home({ onTalkSelect }: HomeProps) {
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
          <h1 className="text-xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-3">
            推しとつながる、あなただけの時間
          </h1>
        </div>
      </div>

      {/* Active Talks Count */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-xl border border-pink-100">
        <p className="text-sm text-gray-700">
          現在 <span className="font-bold text-pink-600">{mockTalkSessions.length}</span> 件のTalk枠が開催中です
        </p>
      </div>

      {/* Content */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTalks.map((talk) => (
          <TalkCard key={talk.id} talk={talk} onSelect={handleTalkSelect} />
        ))}
      </div>

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