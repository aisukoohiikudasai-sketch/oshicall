import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, History, Edit3 } from 'lucide-react';
import { mockTalkSessions, mockBids } from '../data/mockData';
import { TalkSession } from '../types';
import CountdownTimer from '../components/CountdownTimer';
import { useAuth } from '../contexts/AuthContext';

interface TalkDetailProps {
  talkId: string;
  onBack: () => void;
  onNavigateToBidHistory?: (talkId: string) => void;
}

export default function TalkDetail({ talkId, onBack, onNavigateToBidHistory }: TalkDetailProps) {
  const { user } = useAuth();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isMyBid, setIsMyBid] = useState<boolean>(false);
  
  const talk = mockTalkSessions.find(t => t.id === talkId);

  if (!talk) {
    return <div>Talk not found</div>;
  }

  // 現在の最高価格を状態として管理
  const [currentHighestBid, setCurrentHighestBid] = useState<number>(talk.current_highest_bid);

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

  const handleBid = (increment: number) => {
    const newBidAmount = currentHighestBid + increment;
    setCurrentHighestBid(newBidAmount);
    setIsMyBid(true);
    alert(`¥${formatPrice(newBidAmount)} で入札しました！`);
  };

  const handleCustomBid = () => {
    const amount = parseInt(customAmount);
    if (amount > currentHighestBid) {
      setCurrentHighestBid(amount);
      setIsMyBid(true);
      alert(`¥${formatPrice(amount)} で入札しました！`);
      setShowCustomInput(false);
      setCustomAmount('');
    } else {
      alert('現在の最高価格より高い金額を入力してください');
    }
  };

  const quickBidOptions = [10, 100, 1000];

  return (
    <div className="min-h-screen flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -mt-12">
      {/* Hero Section with Host Photo */}
      <div className="relative flex-1 min-h-[calc(100vh-48px-48px)] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover"
          style={{ 
            backgroundImage: `url(${talk.influencer.avatar_url})`,
            backgroundPosition: 'center top',
            backgroundAttachment: 'scroll'
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        
        {/* Top Bar with Back Button and Host Name */}
        <div className="absolute top-16 left-4 right-4 z-10 flex items-center space-x-4">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/70 transition-all duration-200 flex-shrink-0"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>

          {/* Host Name */}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg truncate">
              {talk.influencer.name}
              <span className="text-lg md:text-xl lg:text-2xl text-white/90 drop-shadow-md ml-2 md:ml-3">
                @{talk.influencer.username}
              </span>
            </h1>
          </div>
        </div>

        {/* Host Message and Bidding Section - Bottom */}
        <div className="absolute bottom-4 left-4 right-4 z-10 space-y-3">
          {/* Host Message */}
          <div className="text-center">
            <p className="text-sm md:text-base text-white drop-shadow-md bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 inline-block">
              {talk.host_message}
            </p>
          </div>

          {/* Quick Bid Buttons */}
          <div className="flex space-x-2 justify-center">
            {quickBidOptions.map((increment) => (
              <button
                key={increment}
                onClick={() => handleBid(increment)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-5 py-3 rounded-full font-bold hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg text-base"
              >
                +¥{increment}
              </button>
            ))}
            <button
              onClick={() => setShowCustomInput(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-full hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              <Edit3 className="h-6 w-6" />
            </button>
          </div>

          {/* Current Highest Price */}
          <div className={`backdrop-blur-sm rounded-xl p-3 shadow-lg transition-colors duration-300 ${
            isMyBid ? 'bg-green-100 border-2 border-green-300' : 'bg-white/90'
          }`}>
            <div className="flex items-center">
              <div className="text-center flex-1">
                <p className="text-xs text-gray-600 mb-1">現在の最高価格</p>
                <p className={`text-xl font-bold flex items-center justify-center ${
                  isMyBid ? 'text-green-600' : 'text-pink-600'
                }`}>
                  ¥{formatPrice(currentHighestBid)}
                  {isMyBid && <span className="ml-2 text-sm bg-green-200 text-green-800 px-2 py-1 rounded-full">You</span>}
                </p>
              </div>
              <button
                onClick={() => onNavigateToBidHistory?.(talkId)}
                className="p-2 text-gray-600 hover:text-pink-600 transition-colors flex-shrink-0"
                title="入札履歴を見る"
              >
                <History className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Talk Schedule - Below Photo */}
      <div className="bg-white p-4 md:p-6 flex-shrink-0 mb-12 md:mb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-pink-500" />
            <span className="font-medium text-gray-700">Talk予定時間</span>
          </div>
          <CountdownTimer targetTime={talk.auction_end_time} className="text-sm" />
        </div>
        <p className="text-lg font-medium text-gray-800 mt-2">
          {formatDate(talk.start_time)} - {formatDate(talk.end_time)}
        </p>
      </div>

      {/* Custom Bid Input Modal */}
      {showCustomInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-4">カスタム入札</h3>
            <p className="text-sm text-gray-600 mb-4">
              現在の最高価格: ¥{formatPrice(currentHighestBid)}
            </p>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="入札金額を入力"
              className="w-full p-3 border border-gray-200 rounded-lg mb-4 text-lg"
              min={currentHighestBid + 1}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomAmount('');
                }}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleCustomBid}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
              >
                入札する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}