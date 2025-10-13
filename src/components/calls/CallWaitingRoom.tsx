import React, { useState, useEffect } from 'react';
import { Video, Mic, Clock, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { createCallRoom, getCallStatus, type CreateRoomResponse } from '../../api/calls';

interface CallWaitingRoomProps {
  purchasedSlotId: string;
  userId: string;
  userType: 'influencer' | 'fan';
  scheduledStartTime: string;
  durationMinutes: number;
  title: string;
  onJoinCall: (roomUrl: string, token: string) => void;
}

export default function CallWaitingRoom({
  purchasedSlotId,
  userId,
  userType,
  scheduledStartTime,
  durationMinutes,
  title,
  onJoinCall,
}: CallWaitingRoomProps) {
  const [roomData, setRoomData] = useState<CreateRoomResponse | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cameraPermission, setCameraPermission] = useState<boolean>(false);
  const [micPermission, setMicPermission] = useState<boolean>(false);
  const [timeUntilStart, setTimeUntilStart] = useState<number>(0);
  const [canJoin, setCanJoin] = useState(false);

  // ルーム作成
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        const result = await createCallRoom(purchasedSlotId, userId);
        setRoomData(result);
        setTimeUntilStart(result.timeUntilStart);
        setCanJoin(result.timeUntilStart <= 15 * 60);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    initialize();
  }, [purchasedSlotId, userId]);

  // ステータスポーリング
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const statusData = await getCallStatus(purchasedSlotId);
        setStatus(statusData);
        setTimeUntilStart(statusData.time_until_start_seconds);
        setCanJoin(statusData.can_join);
      } catch (err) {
        console.error('ステータス取得エラー:', err);
      }
    };

    const interval = setInterval(pollStatus, 5000);
    pollStatus(); // 初回実行

    return () => clearInterval(interval);
  }, [purchasedSlotId]);

  // カメラ・マイク許可チェック
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setCameraPermission(true);
        setMicPermission(true);
        stream.getTracks().forEach(track => track.stop()); // 停止
      } catch (err) {
        console.warn('カメラ・マイク許可が必要です');
      }
    };

    checkPermissions();
  }, []);

  // カウントダウンタイマー
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilStart(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds: number) => {
    if (seconds < 0) return '通話時間になりました';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}時間${minutes}分${secs}秒`;
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  const handleJoinClick = () => {
    if (roomData) {
      onJoinCall(roomData.roomUrl, roomData.token);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">通話ルームを準備中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">エラー</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* タイトル */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            {title || '通話待機中'}
          </h1>
          <p className="text-gray-600">
            {userType === 'influencer' ? 'インフルエンサー' : 'ファン'}として参加
          </p>
        </div>

        {/* カウントダウン */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
          <Clock className="h-16 w-16 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            通話まで
          </h2>
          <div className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            {formatCountdown(timeUntilStart)}
          </div>
          <p className="text-gray-600">
            {new Date(scheduledStartTime).toLocaleString('ja-JP', {
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })} から {durationMinutes}分間
          </p>
        </div>

        {/* デバイスチェック */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">接続チェック</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Video className={`h-5 w-5 ${cameraPermission ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="flex-1 text-gray-700">カメラ</span>
              {cameraPermission ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Mic className={`h-5 w-5 ${micPermission ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="flex-1 text-gray-700">マイク</span>
              {micPermission ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Users className={`h-5 w-5 ${status?.room_created ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="flex-1 text-gray-700">通話ルーム</span>
              {status?.room_created ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
              )}
            </div>
          </div>

          {!cameraPermission || !micPermission && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 カメラとマイクの許可が必要です。ブラウザの設定を確認してください。
              </p>
            </div>
          )}
        </div>

        {/* 参加者状況 */}
        {status && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">参加状況</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border-2 ${status.participants.influencer_joined ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <p className="text-sm text-gray-600 mb-1">インフルエンサー</p>
                <p className="font-bold text-gray-900">
                  {status.participants.influencer_joined ? '✅ 参加済み' : '⏳ 待機中'}
                </p>
              </div>

              <div className={`p-4 rounded-lg border-2 ${status.participants.fan_joined ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <p className="text-sm text-gray-600 mb-1">ファン</p>
                <p className="font-bold text-gray-900">
                  {status.participants.fan_joined ? '✅ 参加済み' : '⏳ 待機中'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 入室ボタン */}
        <button
          onClick={handleJoinClick}
          disabled={!canJoin || !cameraPermission || !micPermission}
          className="w-full py-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-bold text-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
        >
          {!canJoin ? `${formatCountdown(timeUntilStart)}後に入室可能` : '🎥 通話ルームに入る'}
        </button>

        {/* 注意事項 */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-900 mb-3">📝 通話の注意事項</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• 通話開始の15分前から入室できます</li>
            <li>• カメラとマイクの許可が必要です</li>
            <li>• 通話時間は{durationMinutes}分です</li>
            <li>• 時間になると自動的に終了します</li>
            <li>• お互いを尊重し、楽しい時間をお過ごしください</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

