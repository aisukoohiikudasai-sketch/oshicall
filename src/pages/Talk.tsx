import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, History, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mockTalkSessions } from '../data/mockData';
import TalkCard from '../components/TalkCard';
import { TalkSession } from '../types';

export default function Talk() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  // Mock data for user's won talks (upcoming)
  const upcomingTalks = mockTalkSessions.slice(0, 3).map(talk => ({
    ...talk,
    status: 'won' as const,
  }));

  // Mock data for past talks
  const pastTalks = mockTalkSessions.slice(3, 6).map(talk => ({
    ...talk,
    status: 'completed' as const,
    // Set past dates
    start_time: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
  }));

  const handleTalkSelect = (talk: TalkSession) => {
    navigate(`/live-talk/${talk.id}`);
  };

  const tabs = [
    { id: 'upcoming', label: '落札したTalk', icon: Trophy },
    { id: 'history', label: '過去の実績', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">マイTalk</h1>
        <p className="text-gray-600">落札したTalkと過去の実績を確認できます</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="border-b border-gray-200">
          <div className="flex justify-center space-x-8 px-6">
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
          {activeTab === 'upcoming' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">予定されているTalk</h2>
              
              {upcomingTalks.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingTalks.map((talk) => (
                    <TalkCard 
                      key={talk.id} 
                      talk={talk} 
                      onSelect={handleTalkSelect}
                    />
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

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">過去のTalk実績</h2>
              
              {pastTalks.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastTalks.map((talk) => (
                    <div key={talk.id} className="relative">
                      <TalkCard 
                        talk={talk} 
                        onSelect={handleTalkSelect}
                      />
                      {/* Completed Badge */}
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        完了
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">過去のTalk実績がありません</h3>
                  <p className="text-gray-500">Talk枠を落札して実績を作りましょう！</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}