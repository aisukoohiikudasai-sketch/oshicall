import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, History, Edit3, Share2 } from 'lucide-react';
import { mockTalkSessions, mockBids } from '../data/mockData';
import { TalkSession } from '../types';
import CountdownTimer from '../components/CountdownTimer';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AuthModal from '../components/AuthModal';
import CardRegistrationModal from '../components/CardRegistrationModal';

export default function TalkDetail() {
  const { talkId } = useParams<{ talkId: string }>();
  const navigate = useNavigate();
  const { user, supabaseUser, refreshUser } = useAuth();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isMyBid, setIsMyBid] = useState<boolean>(false);
  const [talk, setTalk] = useState<TalkSession | null>(null);
  const [auctionId, setAuctionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentHighestBid, setCurrentHighestBid] = useState<number>(0);
  
  // モーダル管理
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState<number>(0);

  // Talk詳細の初期取得
  useEffect(() => {
    const fetchTalkDetail = async () => {
      try {
        setIsLoading(true);

        // active_auctions_view から取得（buy_now_priceも含める）
        const { data, error } = await supabase
          .from('active_auctions_view')
          .select('*, call_slots!inner(buy_now_price)')
          .eq('call_slot_id', talkId)
          .single();

        if (error) {
          console.error('Talk詳細取得エラー:', error);
          // フォールバック: モックデータから取得
          const mockTalk = mockTalkSessions.find(t => t.id === talkId);
          if (mockTalk) {
            setTalk(mockTalk);
            setCurrentHighestBid(mockTalk.current_highest_bid);
          }
          return;
        }

        if (data) {
          // 実際のauction_idを保存
          setAuctionId(data.auction_id);

          // ビューデータをTalkSession形式に変換
          const talkSession: TalkSession = {
            id: data.call_slot_id,
            influencer_id: data.influencer_id,
            influencer: {
              id: data.influencer_id,
              name: data.influencer_name,
              username: data.influencer_name, // display_nameを使用
              avatar_url: data.influencer_image || '/images/talks/default.jpg',
              description: data.influencer_bio || '',
              follower_count: 0,
              total_earned: 0,
              total_talks: data.total_calls_completed || 0,
              rating: data.average_rating || 0,
              created_at: new Date().toISOString(),
            },
            title: data.title || `${data.influencer_name}とのTalk`,
            description: data.description || '',
            host_message: data.influencer_bio || data.description || `${data.influencer_name}とお話ししましょう！`,
            start_time: data.scheduled_start_time,
            end_time: new Date(new Date(data.scheduled_start_time).getTime() + data.duration_minutes * 60000).toISOString(),
            auction_end_time: data.end_time,
            starting_price: data.starting_price,
            current_highest_bid: data.current_highest_bid || data.starting_price,
            buy_now_price: data.call_slots?.buy_now_price || null,
            status: data.status === 'active' ? 'upcoming' : 'ended',
            created_at: new Date().toISOString(),
            detail_image_url: data.thumbnail_url || data.influencer_image || '/images/talks/default.jpg',
            is_female_only: false,
          };

          setTalk(talkSession);
          setCurrentHighestBid(talkSession.current_highest_bid);

          // 現在のユーザーが最高入札者かチェック
          if (supabaseUser && data.current_highest_bid) {
            checkIfUserIsHighestBidder(data.auction_id);
          }
        }
      } catch (err) {
        console.error('データ取得エラー:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (talkId) {
      fetchTalkDetail();
    }
  }, [talkId, supabaseUser]);

  // ユーザーが最高入札者かチェック
  const checkIfUserIsHighestBidder = async (auctionIdToCheck: string) => {
    if (!supabaseUser) return;

    try {
      // 最高入札を取得
      const { data: highestBid, error } = await supabase
        .from('bids')
        .select('user_id')
        .eq('auction_id', auctionIdToCheck)
        .order('bid_amount', { ascending: false })
        .limit(1)
        .single();

      if (!error && highestBid) {
        setIsMyBid(highestBid.user_id === supabaseUser.id);
      }
    } catch (err) {
      console.error('最高入札者チェックエラー:', err);
    }
  };

  // ポーリング方式で入札情報を定期的に更新（3秒ごと）
  useEffect(() => {
    if (!auctionId) {
      console.log('⚠️ auctionIdが未設定のため、ポーリングを開始できません');
      return;
    }

    console.log('🔵 ポーリング開始: オークション情報を3秒ごとに更新します', auctionId);

    const fetchAuctionUpdate = async () => {
      try {
        // オークション情報を取得
        const { data: updatedAuction, error } = await supabase
          .from('auctions')
          .select('current_highest_bid, current_winner_id')
          .eq('id', auctionId)
          .single();

        if (!error && updatedAuction) {
          // 最高入札額が変わった場合のみ更新
          if (updatedAuction.current_highest_bid !== currentHighestBid) {
            console.log('🔔 新しい入札を検知:', {
              old: currentHighestBid,
              new: updatedAuction.current_highest_bid,
              winner_id: updatedAuction.current_winner_id
            });
            setCurrentHighestBid(updatedAuction.current_highest_bid);
          }

          // 自分が最高入札者かチェック
          if (supabaseUser) {
            const isWinning = updatedAuction.current_winner_id === supabaseUser.id;
            if (isWinning !== isMyBid) {
              setIsMyBid(isWinning);
              console.log(isWinning ? '✅ あなたが最高入札者です' : '⚠️ 他のユーザーが最高入札者です');
            }
          }
        }
      } catch (err) {
        console.error('❌ ポーリングエラー:', err);
      }
    };

    // 初回実行
    fetchAuctionUpdate();

    // 3秒ごとにポーリング
    const intervalId = setInterval(fetchAuctionUpdate, 3000);

    // クリーンアップ
    return () => {
      console.log('🔵 ポーリング停止:', auctionId);
      clearInterval(intervalId);
    };
  }, [auctionId, supabaseUser, currentHighestBid, isMyBid]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!talk) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Talk枠が見つかりません</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

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

  // 与信確保と入札処理
  const processBid = async (bidAmount: number) => {
    if (!user || !supabaseUser || !talk) {
      throw new Error('ユーザー情報またはTalk情報が見つかりません');
    }

    console.log('🔵 入札処理開始:', {
      bidAmount,
      customerId: supabaseUser.stripe_customer_id,
      userId: supabaseUser.id,
      userEmail: user.email,
    });

    if (!supabaseUser.stripe_customer_id) {
      throw new Error('Stripe顧客IDが見つかりません。カード登録を再度お試しください。');
    }

    try {
      // 与信確保API呼び出し
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/stripe/authorize-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: bidAmount,
          customerId: supabaseUser.stripe_customer_id,
          auctionId: auctionId,
          userId: supabaseUser.id, // ユーザーIDを追加
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '与信確保に失敗しました');
      }

      const { paymentIntentId } = await response.json();

      // 入札データをSupabaseに保存
      console.log('🔵 入札データ保存開始:', {
        auction_id: auctionId,
        call_slot_id: talk.id,
        user_id: supabaseUser.id,
        auth_user_id: user.id,
        bid_amount: bidAmount,
      });

      const { data: bidData, error: bidError } = await supabase
        .from('bids')
        .insert({
          auction_id: auctionId, // 正しいauction_idを使用
          user_id: supabaseUser.id,
          bid_amount: bidAmount,
          stripe_payment_intent_id: paymentIntentId,
          is_autobid: false,
        })
        .select();

      if (bidError) {
        console.error('❌ 入札保存エラー詳細:', bidError);
        throw new Error(`入札データの保存に失敗しました: ${bidError.message || bidError.code}`);
      }

      console.log('✅ 入札保存成功:', bidData);

      // オークション情報を更新（最高入札額と入札者を記録）
      const { error: updateError } = await supabase.rpc(
        'update_auction_highest_bid',
        {
          p_auction_id: auctionId,
          p_bid_amount: bidAmount,
          p_user_id: supabaseUser.id,
        }
      );

      if (updateError) {
        console.error('❌ オークション更新エラー:', updateError);
        throw new Error(`オークション情報の更新に失敗しました: ${updateError.message}`);
      }

      console.log('✅ オークション情報更新成功');

      // UI更新（リアルタイムサブスクリプションでも更新されるが、即座に反映）
      setCurrentHighestBid(bidAmount);
      setIsMyBid(true);
      alert(`✅ ¥${formatPrice(bidAmount)} で入札しました！`);
    } catch (error: any) {
      console.error('入札処理エラー:', error);
      throw error;
    }
  };

  const processBuyNow = async (buyNowPrice: number) => {
    if (!user || !supabaseUser) {
      throw new Error('ログインが必要です');
    }

    try {
      console.log('🔵 即決購入処理開始:', { buyNowPrice, auctionId });

      // Stripe PaymentIntentを作成して与信確保
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: buyNowPrice,
          authUserId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '与信確保に失敗しました');
      }

      const { paymentIntentId } = await response.json();

      // 即決購入APIを呼び出し
      const buyNowResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/buy-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auctionId,
          userId: supabaseUser.id,
          buyNowPrice,
          paymentIntentId,
        }),
      });

      if (!buyNowResponse.ok) {
        const error = await buyNowResponse.json();
        throw new Error(error.error || '即決購入に失敗しました');
      }

      console.log('✅ 即決購入成功');
    } catch (error: any) {
      console.error('即決購入エラー:', error);
      throw error;
    }
  };

  const handleBid = async (increment: number) => {
    const newBidAmount = currentHighestBid + increment;
    
    console.log('🔵 入札ボタンクリック:', {
      newBidAmount,
      hasUser: !!user,
      hasSupabaseUser: !!supabaseUser,
      hasPaymentMethod: supabaseUser?.has_payment_method,
    });
    
    // ステップ1: ログインチェック
    if (!user || !supabaseUser) {
      setPendingBidAmount(newBidAmount);
      setShowAuthModal(true);
      return;
    }
    
    // ステップ2: カード登録チェック
    if (!supabaseUser.has_payment_method) {
      console.log('⚠️ カード未登録のため、モーダルを表示');
      setPendingBidAmount(newBidAmount);
      setShowCardModal(true);
      return;
    }
    
    // ステップ3: 与信確保を試行
    try {
      await processBid(newBidAmount);
    } catch (error: any) {
      alert(`入札に失敗しました: ${error.message}`);
    }
  };

  const handleCustomBid = async () => {
    const amount = parseInt(customAmount);

    if (amount <= currentHighestBid) {
      alert('現在の最高価格より高い金額を入力してください');
      return;
    }

    // ステップ1: ログインチェック
    if (!user || !supabaseUser) {
      setPendingBidAmount(amount);
      setShowAuthModal(true);
      return;
    }

    // ステップ2: カード登録チェック
    if (!supabaseUser.has_payment_method) {
      setPendingBidAmount(amount);
      setShowCardModal(true);
      return;
    }

    // ステップ3: 与信確保を試行
    try {
      await processBid(amount);
      setShowCustomInput(false);
      setCustomAmount('');
    } catch (error: any) {
      alert(`入札に失敗しました: ${error.message}`);
    }
  };

  const handleBuyNow = async () => {
    if (!talk.buy_now_price) return;

    const buyNowPrice = talk.buy_now_price;

    // ステップ1: ログインチェック
    if (!user || !supabaseUser) {
      setPendingBidAmount(buyNowPrice);
      setShowAuthModal(true);
      return;
    }

    // ステップ2: カード登録チェック
    if (!supabaseUser.has_payment_method) {
      setPendingBidAmount(buyNowPrice);
      setShowCardModal(true);
      return;
    }

    // 確認ダイアログ
    if (!confirm(`即決価格 ¥${formatPrice(buyNowPrice)} で落札しますか？\nこの操作は取り消せません。`)) {
      return;
    }

    // ステップ3: 即決購入を実行
    try {
      await processBuyNow(buyNowPrice);
      alert(`✅ ¥${formatPrice(buyNowPrice)} で即決落札しました！`);
      // オークション詳細ページから購入済みページへリダイレクト
      navigate('/purchased-talks');
    } catch (error: any) {
      alert(`即決落札に失敗しました: ${error.message}`);
    }
  };

  // 認証完了後のコールバック
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // 認証後、カード登録が必要
    if (pendingBidAmount > 0) {
      setShowCardModal(true);
    }
  };

  // カード登録完了後のコールバック
  const handleCardRegistrationSuccess = async () => {
    setShowCardModal(false);
    console.log('🔵 カード登録成功コールバック');
    
    // カード登録後、保留していた入札を実行
    if (pendingBidAmount > 0) {
      try {
        // ユーザー情報を再取得してから入札処理（重要！）
        console.log('🔵 ユーザー情報を再取得してhas_payment_methodを更新...');
        await refreshUser();
        
        // さらに1秒待機してSupabaseの同期を確実に
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('🔵 入札処理を開始...');
        await processBid(pendingBidAmount);
        setPendingBidAmount(0);
      } catch (error: any) {
        alert(`入札に失敗しました: ${error.message}`);
      }
    }
  };

  const quickBidOptions = [10, 100, 1000];

  return (
    <div className="min-h-screen flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -mt-12 pb-12 md:pb-0">
      {/* Hero Section with Host Photo */}
      <div className="relative flex-1 min-h-[calc(100vh-48px-48px)] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover"
          style={{ 
            backgroundImage: `url(${talk.detail_image_url || talk.influencer.avatar_url})`,
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
            onClick={() => navigate('/')}
            className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/70 transition-all duration-200 flex-shrink-0"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>

          {/* Share Button */}
          <button
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
              alert('URLをコピーしました！SNSでシェアしてください🎉');
            }}
            className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/70 transition-all duration-200 flex-shrink-0"
            title="URLをコピー"
          >
            <Share2 className="h-6 w-6" />
          </button>

          {/* Host Name */}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg truncate">
              {talk.influencer.name}
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

          {/* Buy Now Button */}
          {talk.buy_now_price && (
            <div className="flex justify-center">
              <button
                onClick={() => handleBuyNow()}
                className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-8 py-3 rounded-full font-bold hover:from-purple-700 hover:to-indigo-800 transition-all duration-200 shadow-lg text-base flex items-center space-x-2"
              >
                <span>⚡</span>
                <span>即決で落札（¥{formatPrice(talk.buy_now_price)}）</span>
              </button>
            </div>
          )}

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
                {talk.buy_now_price && (
                  <p className="text-xs text-gray-500 mt-1">
                    即決価格: <span className="font-bold text-purple-600">¥{formatPrice(talk.buy_now_price)}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate(`/bid-history/${talkId}`)}
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
      <div className="bg-white p-4 md:p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-pink-500" />
            <span className="font-medium text-gray-700">Talk予定時間</span>
            {talk.is_female_only && (
              <span className="bg-pink-100 text-pink-600 px-2 py-1 rounded-full text-xs font-medium">
                女性限定
              </span>
            )}
          </div>
          <CountdownTimer 
            targetTime={talk.auction_end_time} 
            className="text-sm" 
            showSeconds={true}
          />
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

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Card Registration Modal */}
      <CardRegistrationModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        onSuccess={handleCardRegistrationSuccess}
      />
    </div>
  );
}