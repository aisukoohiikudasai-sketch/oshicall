import React from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetTime: string;
  onComplete?: () => void;
  className?: string;
}

export default function CountdownTimer({ targetTime, onComplete, className = '' }: CountdownTimerProps) {
  // 固定の残り時間を表示（targetTimeに基づいて適当な時間を生成）
  const getFixedTimeLeft = (targetTime: string) => {
    const hash = targetTime.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const days = Math.abs(hash % 4); // 0-3日
    const hours = Math.abs((hash >> 8) % 24); // 0-23時間
    const minutes = Math.abs((hash >> 16) % 60); // 0-59分
    const seconds = Math.abs((hash >> 24) % 60); // 0-59秒
    
    return { days, hours, minutes, seconds };
  };
  
  const timeLeft = getFixedTimeLeft(targetTime);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className={`h-5 w-5 ${className.includes('text-white') ? 'text-white' : 'text-orange-500'}`} />
      <div className="flex space-x-1">
        {timeLeft.days > 0 && (
          <span className={`px-2 py-1 rounded text-sm font-bold ${className.includes('text-white') ? 'bg-white/20 text-white' : 'bg-gradient-to-r from-orange-400 to-red-500 text-white'}`}>
            {timeLeft.days}d
          </span>
        )}
        <span className={`px-2 py-1 rounded text-sm font-bold ${className.includes('text-white') ? 'bg-white/20 text-white' : 'bg-gradient-to-r from-orange-400 to-red-500 text-white'}`}>
          {String(timeLeft.hours).padStart(2, '0')}h
        </span>
        <span className={`px-2 py-1 rounded text-sm font-bold ${className.includes('text-white') ? 'bg-white/20 text-white' : 'bg-gradient-to-r from-orange-400 to-red-500 text-white'}`}>
          {String(timeLeft.minutes).padStart(2, '0')}m
        </span>
        <span className={`px-2 py-1 rounded text-sm font-bold ${className.includes('text-white') ? 'bg-white/20 text-white' : 'bg-gradient-to-r from-orange-400 to-red-500 text-white'}`}>
          {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
}