import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AuctionComplete() {
  const { talkId } = useParams<{ talkId: string }>();
  const navigate = useNavigate();
  const { supabaseUser } = useAuth();
  const [isWinner, setIsWinner] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [talkData, setTalkData] = useState<any>(null);

  useEffect(() => {
    const verifyWinner = async () => {
      if (!talkId || !supabaseUser) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 落札者を確認中...', { talkId, userId: supabaseUser.id });

        // オークション情報を取得
        const { data: auctionData, error: auctionError } = await supabase
          .from('auctions')
          .select(`
            id,
            status,
            winner_user_id,
            current_highest_bid,
            call_slots!inner(
              id,
              title,
              description,
              scheduled_start_time,
              duration_minutes,
              thumbnail_url,
              users!call_slots_user_id_fkey(
                id,
                display_name,
                profile_image_url
              )
            )
          `)
          .eq('call_slot_id', talkId)
          .single();

        if (auctionError) {
          console.error('オークション情報取得エラー:', auctionError);
          setIsLoading(false);
          return;
        }

        console.log('📊 オークション情報:', auctionData);

        // Talk枠の情報を保存
        setTalkData({
          title: auctionData.call_slots.title,
          description: auctionData.call_slots.description,
          scheduled_start_time: auctionData.call_slots.scheduled_start_time,
          duration_minutes: auctionData.call_slots.duration_minutes,
          thumbnail_url: auctionData.call_slots.thumbnail_url || auctionData.call_slots.users?.profile_image_url,
          influencer_name: auctionData.call_slots.users?.display_name,
          winning_bid: auctionData.current_highest_bid,
        });

        // 落札者かどうかを判定
        const userIsWinner = auctionData.winner_user_id === supabaseUser.id;
        setIsWinner(userIsWinner);

        console.log(userIsWinner ? '🏆 あなたが落札者です！' : '😢 別の方が落札されました');
      } catch (err) {
        console.error('❌ 落札者確認エラー:', err);
      } finally {
        setIsLoading(false);
      }
    };

    verifyWinner();
  }, [talkId, supabaseUser]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP').format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">落札結果を確認中...</p>
        </div>
      </div>
    );
  }

  if (isWinner === null || !talkData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">オークション情報が見つかりません</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            トップページへ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${talkData.thumbnail_url || '/images/talks/default.jpg'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 背景のオーバーレイ */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-lg"></div>

      {/* メインコンテンツ */}
      <div className="relative z-10 bg-white rounded-3xl p-8 max-w-2xl w-full text-center shadow-2xl">
        {isWinner ? (
          <>
            {/* 落札者向けメッセージ */}
            <div className="mb-8">
              <div className="text-8xl mb-6 animate-bounce">🎉</div>
              <h1 className="text-4xl md:text-5xl font-bold text-pink-600 mb-4">
                おめでとうございます！
              </h1>
              <p className="text-2xl text-gray-800 mb-6">
                オークションに落札されました
              </p>

              {/* Talk枠情報 */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {talkData.title || `${talkData.influencer_name}とのTalk`}
                </h2>
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">インフルエンサー:</span>
                    <span className="font-bold text-gray-800">{talkData.influencer_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">落札価格:</span>
                    <span className="font-bold text-pink-600 text-xl">
                      ¥{formatPrice(talkData.winning_bid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">通話予定時刻:</span>
                    <span className="font-bold text-gray-800">
                      {formatDate(talkData.scheduled_start_time)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">通話時間:</span>
                    <span className="font-bold text-gray-800">
                      {talkData.duration_minutes}分
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                マイページのTalkタブで予定を確認できます。<br />
                通話開始時刻になりましたら、通知が届きます。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/mypage?tab=talks')}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                Talkタブを確認
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-200"
              >
                トップページへ
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 落札者以外向けメッセージ */}
            <div className="mb-8">
              <div className="text-8xl mb-6">😢</div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                残念！
              </h1>
              <p className="text-xl text-gray-700 mb-6">
                このTalkは別の方が落札されました
              </p>

              {/* Talk枠情報 */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  {talkData.title || `${talkData.influencer_name}とのTalk`}
                </h2>
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">インフルエンサー:</span>
                    <span className="font-bold text-gray-800">{talkData.influencer_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">落札価格:</span>
                    <span className="font-bold text-gray-600 text-xl">
                      ¥{formatPrice(talkData.winning_bid)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                次回は落札できますように！<br />
                他にも魅力的なTalk枠がたくさんあります。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                他のTalk枠を見る
              </button>
              <button
                onClick={() => navigate('/mypage?tab=bids')}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-200"
              >
                入札履歴を見る
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
