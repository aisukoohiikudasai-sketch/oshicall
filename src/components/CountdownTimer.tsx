import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetTime: string;
  onComplete?: () => void;
  className?: string;
  showSeconds?: boolean; // 秒を表示するかどうか
}

export default function CountdownTimer({ 
  targetTime, 
  onComplete, 
  className = '', 
  showSeconds = true 
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetTime).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onComplete) onComplete();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    // 初回計算
    calculateTimeLeft();

    // 1秒ごとに更新
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetTime, onComplete]);

  if (timeLeft.isExpired) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Clock className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-gray-500 font-medium">終了</span>
      </div>
    );
  }

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
        {showSeconds && (
          <span className={`px-2 py-1 rounded text-sm font-bold ${className.includes('text-white') ? 'bg-white/20 text-white' : 'bg-gradient-to-r from-orange-400 to-red-500 text-white'}`}>
            {String(timeLeft.seconds).padStart(2, '0')}s
          </span>
        )}
      </div>
    </div>
  );
}