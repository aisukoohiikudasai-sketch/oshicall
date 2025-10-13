import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Heart, ThumbsUp, Star, Gift, Smile, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mockTalkSessions } from '../data/mockData';
import CountdownTimer from '../components/CountdownTimer';

export default function LiveTalk() {
  const { talkId } = useParams<{ talkId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reactions, setReactions] = useState<{ [key: string]: number }>({
    heart: 0,
    thumbsUp: 0,
    star: 0,
    gift: 0,
    smile: 0,
  });

  // Find the specific talk or use the first one as default
  const activeTalk = talkId 
    ? mockTalkSessions.find(talk => talk.id === talkId) || mockTalkSessions[0]
    : mockTalkSessions[0];

  const reactionButtons = [
    { id: 'heart', icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-100 hover:bg-pink-200' },
    { id: 'thumbsUp', icon: ThumbsUp, color: 'text-blue-500', bgColor: 'bg-blue-100 hover:bg-blue-200' },
    { id: 'star', icon: Star, color: 'text-yellow-500', bgColor: 'bg-yellow-100 hover:bg-yellow-200' },
    { id: 'gift', icon: Gift, color: 'text-purple-500', bgColor: 'bg-purple-100 hover:bg-purple-200' },
    { id: 'smile', icon: Smile, color: 'text-green-500', bgColor: 'bg-green-100 hover:bg-green-200' },
  ];

  const handleReaction = (reactionId: string) => {
    setReactions(prev => ({
      ...prev,
      [reactionId]: prev[reactionId] + 1
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-black min-h-screen -mx-4 sm:-mx-6 lg:-mx-8 -mt-12 pb-12 md:pb-0">
      {/* Main Video Area */}
      <div className="relative min-h-[calc(100vh-48px-48px)]">
        {/* Background Video/Image */}
        <div 
          className="absolute inset-0 bg-cover"
          style={{ 
            backgroundImage: `url(${activeTalk.detail_image_url})`,
            backgroundPosition: 'center top',
            backgroundAttachment: 'scroll'
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Top Bar */}
        <div className="absolute top-12 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate(`/talk/${talkId}`)}
                className="text-white p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <img
                  src={activeTalk.influencer.avatar_url}
                  alt={activeTalk.influencer.name}
                  className="h-10 w-10 rounded-full object-cover border-2 border-white"
                />
                <div>
                  <h2 className="text-white font-bold text-lg">
                    {activeTalk.influencer.name}
                  </h2>
                  {activeTalk.is_female_only && (
                    <span className="bg-pink-500/80 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                      女性限定
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Live Indicator */}
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          </div>
        </div>

        {/* Right Side - Reactions */}
        <div className="absolute right-4 bottom-24 z-20 flex flex-col space-y-3">
          {reactionButtons.map((reaction) => (
            <button
              key={reaction.id}
              onClick={() => handleReaction(reaction.id)}
              className={`relative ${reaction.bgColor} p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110`}
            >
              <reaction.icon className={`h-5 w-5 ${reaction.color}`} />
              {reactions[reaction.id] > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {reactions[reaction.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bottom Bar - Time Remaining */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4 pb-6 md:pb-4">
          {/* Host Message */}
          <div className="text-left mb-4">
            <p className="text-white/90 text-sm drop-shadow-md">
              {activeTalk.host_message}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-white">
              <p className="text-sm opacity-80 mb-1">Talk終了まで</p>
              <CountdownTimer 
                targetTime={activeTalk.end_time} 
                className="text-white"
              />
            </div>
            
            <div className="text-white text-right">
              <p className="text-sm opacity-80 mb-1">開始時間</p>
              <p className="font-medium">
                {formatDate(activeTalk.start_time)} - {formatDate(activeTalk.end_time)}
              </p>
            </div>
          </div>
        </div>

        {/* Floating Reactions Animation Area */}
        <div className="absolute inset-0 pointer-events-none z-15">
          {/* This would be where animated reactions float up */}
        </div>
      </div>
    </div>
  );
}