import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search } from 'lucide-react';
import { mockTalkSessions } from '../data/mockData';
import { TalkSession } from '../types';
import TalkCard from '../components/TalkCard';
import { supabase } from '../lib/supabase';

export default function ExplorePage() {
  const navigate = useNavigate();
  const [talks, setTalks] = useState<TalkSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTalks = async () => {
      try {
        setIsLoading(true);

        // active_auctions_view から取得
        const { data: auctionData, error: auctionError } = await supabase
          .from('active_auctions_view')
          .select('*')
          .order('end_time', { ascending: true });

        if (auctionError) {
          console.error('オークションデータ取得エラー:', auctionError);
          throw auctionError;
        }

        console.log('📊 探すページ - Supabaseから取得したデータ:', auctionData);
        console.log(`📊 取得件数: ${auctionData?.length || 0}件`);

        // ビューデータをTalkSession形式に変換
        const talkSessions: TalkSession[] = (auctionData || []).map((item: any) => ({
          id: item.call_slot_id,
          influencer_id: item.influencer_id,
          influencer: {
            id: item.influencer_id,
            name: item.influencer_name,
            username: item.influencer_name,
            avatar_url: item.influencer_image || '/images/talks/default.jpg',
            description: item.influencer_bio || '',
            follower_count: 0,
            total_earned: 0,
            total_talks: item.total_calls_completed || 0,
            rating: item.average_rating || 0,
            created_at: new Date().toISOString(),
          },
          title: item.title || `${item.influencer_name}とのTalk`,
          description: item.description || '',
          host_message: item.influencer_bio || item.description || `${item.influencer_name}とお話ししましょう！`,
          start_time: item.scheduled_start_time,
          end_time: new Date(new Date(item.scheduled_start_time).getTime() + item.duration_minutes * 60000).toISOString(),
          auction_end_time: item.auction_end_time || item.end_time,
          starting_price: item.starting_price,
          current_highest_bid: item.current_highest_bid || item.starting_price,
          status: item.status === 'active' ? 'upcoming' : 'ended',
          created_at: new Date().toISOString(),
          detail_image_url: item.thumbnail_url || item.influencer_image || '/images/talks/default.jpg',
          is_female_only: false,
        }));

        console.log(`✅ ${talkSessions.length}件のTalk枠に変換しました`);
        setTalks(talkSessions);

      } catch (err) {
        console.error('❌ データ取得エラー:', err);
        setError('データの取得に失敗しました');
        setTalks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTalks();
  }, []);

  const handleTalkSelect = (talk: TalkSession) => {
    navigate(`/talk/${talk.id}`);
  };

  // 検索フィルター
  const filteredTalks = talks.filter((talk) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      talk.title.toLowerCase().includes(query) ||
      talk.influencer.name.toLowerCase().includes(query) ||
      talk.description.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            すべてのTalk枠を探す
          </h1>
          <p className="text-gray-600">気になるインフルエンサーのTalk枠を見つけよう</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="インフルエンサー名やTalk枠のタイトルで検索..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
          <p className="text-sm text-yellow-700">{error}</p>
        </div>
      )}

      {/* Active Talks Count */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-100">
        <p className="text-sm text-gray-700">
          {isLoading ? (
            <span>読み込み中...</span>
          ) : (
            <>
              {searchQuery ? (
                <>
                  「<span className="font-bold text-pink-600">{searchQuery}</span>」の検索結果: {' '}
                  <span className="font-bold text-pink-600">{filteredTalks.length}</span> 件
                </>
              ) : (
                <>
                  現在 <span className="font-bold text-pink-600">{filteredTalks.length}</span> 件のTalk枠が開催中です
                </>
              )}
            </>
          )}
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTalks.map((talk) => (
            <TalkCard key={talk.id} talk={talk} onSelect={handleTalkSelect} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTalks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar className="h-16 w-16 mx-auto" />
          </div>
          {searchQuery ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">検索結果が見つかりません</h3>
              <p className="text-gray-500">別のキーワードで検索してみてください</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">現在開催中のTalk枠がありません</h3>
              <p className="text-gray-500">新しいTalk枠が追加されるまでお待ちください</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
