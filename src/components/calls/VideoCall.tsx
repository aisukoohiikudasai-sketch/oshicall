import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { Clock, PhoneOff, Users } from 'lucide-react';
import { endCall } from '../../api/calls';

interface VideoCallProps {
  roomUrl: string;
  token: string;
  purchasedSlotId: string;
  durationMinutes: number;
  userId: string;
  onCallEnd: (duration: number) => void;
}

export default function VideoCall({
  roomUrl,
  token,
  purchasedSlotId,
  durationMinutes,
  userId,
  onCallEnd,
}: VideoCallProps) {
  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializingRef = useRef(false); // 初期化中フラグ
  const [isJoined, setIsJoined] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [remainingTime, setRemainingTime] = useState(durationMinutes);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // 既存のフレームまたは初期化中の場合は何もしない
    if (callFrameRef.current || initializingRef.current) {
      return;
    }

    initializingRef.current = true;

    const initializeCall = async () => {
      try {
        console.log('🔵 Daily.co通話開始:', { roomUrl, durationMinutes });

        // Daily.coフレーム作成
        const callFrame = DailyIframe.createFrame(containerRef.current!, {
          iframeStyle: {
            width: '100%',
            height: '600px',
            border: 'none',
            borderRadius: '12px',
          },
          showLeaveButton: true,
          showFullscreenButton: true,
          showLocalVideo: true,
          showParticipantsBar: true,
        });

        callFrameRef.current = callFrame;

        // イベントリスナー
        callFrame.on('joined-meeting', (event: any) => {
          console.log('✅ 通話に参加しました:', event);
          setIsJoined(true);
        });

        callFrame.on('participant-joined', (event: any) => {
          console.log('✅ 参加者が入室:', event.participant);
          setParticipantCount(prev => prev + 1);
        });

        callFrame.on('participant-left', (event: any) => {
          console.log('⚠️ 参加者が退出:', event.participant);
          setParticipantCount(prev => Math.max(0, prev - 1));
        });

        callFrame.on('left-meeting', async (event: any) => {
          console.log('⚠️ 通話を退出しました');
          await handleEndCall();
        });

        callFrame.on('error', (event: any) => {
          console.error('❌ 通話エラー:', event);
        });

        // 通話に参加
        await callFrame.join({ url: roomUrl, token: token });

      } catch (error) {
        console.error('❌ 通話初期化エラー:', error);
        initializingRef.current = false;
      }
    };

    initializeCall();

    // クリーンアップ
    return () => {
      if (callFrameRef.current) {
        console.log('🔵 Daily.coフレームをクリーンアップ');
        try {
          callFrameRef.current.destroy();
        } catch (err) {
          console.warn('フレーム破棄エラー:', err);
        }
        callFrameRef.current = null;
      }
      initializingRef.current = false;
    };
  }, []); // 依存配列を空にして初回のみ実行

  // 残り時間カウントダウン
  useEffect(() => {
    if (!isJoined) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = Math.max(0, prev - 1/60); // 1秒ずつ減少
        
        // 時間切れで自動終了
        if (newTime <= 0) {
          handleEndCall();
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isJoined]);

  const handleEndCall = async () => {
    if (isEnding) return;
    setIsEnding(true);

    try {
      console.log('🔵 通話終了処理開始');
      
      // Daily.coから退出
      if (callFrameRef.current) {
        await callFrameRef.current.leave();
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }

      // バックエンドに通話終了を通知
      const result = await endCall(purchasedSlotId, userId);
      console.log('✅ 通話終了:', result);
      
      onCallEnd(result.duration);
    } catch (error) {
      console.error('❌ 通話終了エラー:', error);
      onCallEnd(0);
    }
  };

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* ヘッダー */}
      <div className="max-w-6xl mx-auto mb-4">
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700">
                {participantCount === 2 ? '2人参加中' : participantCount === 1 ? '1人参加中' : '待機中'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-lg font-bold text-gray-900">
                残り {formatTime(remainingTime)}
              </span>
            </div>
          </div>

          <button
            onClick={handleEndCall}
            disabled={isEnding}
            className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PhoneOff className="h-5 w-5" />
            <span>{isEnding ? '終了中...' : '通話を終了'}</span>
          </button>
        </div>
      </div>

      {/* ビデオ通話エリア */}
      <div className="max-w-6xl mx-auto">
        <div 
          ref={containerRef} 
          className="bg-black rounded-lg overflow-hidden shadow-2xl"
          style={{ minHeight: '600px' }}
        />
      </div>

      {/* 注意事項 */}
      <div className="max-w-6xl mx-auto mt-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>ヒント:</strong> カメラやマイクのボタンは画面下部にあります。
            残り時間が0になると自動的に通話が終了します。
          </p>
        </div>
      </div>
    </div>
  );
}

