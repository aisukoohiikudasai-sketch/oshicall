import { supabase } from '../lib/supabase';

export interface InfluencerRanking {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  follower_count: number;
  rating: number;
  total_earned: number;
  total_talks: number;
}

export interface BidderRanking {
  id: string;
  username: string;
  avatar_url: string;
  total_spent: number;
  successful_bids: number;
}

export interface RankingStats {
  total_transaction_amount: number;
  total_talks_completed: number;
  average_rating: number;
}

// インフルエンサーランキングを取得（総獲得金額順）
export const getInfluencerRankings = async (limit: number = 10): Promise<InfluencerRanking[]> => {
  try {
    // 1. 全インフルエンサーを取得
    const { data: influencers, error: influencersError } = await supabase
      .from('influencers')
      .select('id, name, username, avatar_url, follower_count, rating');

    if (influencersError) throw influencersError;

    if (!influencers || influencers.length === 0) {
      return [];
    }

    // 2. 各インフルエンサーの総獲得金額とTalk数を計算
    const rankingsWithStats = await Promise.all(
      influencers.map(async (influencer) => {
        // インフルエンサーのcall_slotsを取得
        const { data: callSlots, error: callSlotsError } = await supabase
          .from('call_slots')
          .select('id')
          .eq('user_id', influencer.id);

        if (callSlotsError || !callSlots || callSlots.length === 0) {
          return {
            ...influencer,
            total_earned: 0,
            total_talks: 0,
          };
        }

        const callSlotIds = callSlots.map(slot => slot.id);

        // purchased_slotsから総獲得金額を計算
        const { data: purchasedSlots, error: purchasedError } = await supabase
          .from('purchased_slots')
          .select('price')
          .in('call_slot_id', callSlotIds);

        if (purchasedError) {
          console.error('Error fetching purchased slots:', purchasedError);
          return {
            ...influencer,
            total_earned: 0,
            total_talks: 0,
          };
        }

        const totalEarned = purchasedSlots?.reduce((sum, slot) => sum + (slot.price || 0), 0) || 0;
        const totalTalks = purchasedSlots?.length || 0;

        return {
          ...influencer,
          total_earned: totalEarned,
          total_talks: totalTalks,
        };
      })
    );

    // 3. 総獲得金額でソートしてlimit数だけ返す
    return rankingsWithStats
      .sort((a, b) => b.total_earned - a.total_earned)
      .slice(0, limit);

  } catch (error: any) {
    console.error('Error fetching influencer rankings:', error);
    throw error;
  }
};

// ビッダーランキングを取得（総支払額順）
export const getBidderRankings = async (limit: number = 10): Promise<BidderRanking[]> => {
  try {
    // 1. purchased_slotsから支払いデータを取得
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchased_slots')
      .select('user_id, price');

    if (purchasesError) throw purchasesError;

    if (!purchases || purchases.length === 0) {
      return [];
    }

    // 2. ユーザーごとに集計
    const userStats = purchases.reduce((acc, purchase) => {
      const userId = purchase.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          total_spent: 0,
          successful_bids: 0,
        };
      }
      acc[userId].total_spent += purchase.price || 0;
      acc[userId].successful_bids += 1;
      return acc;
    }, {} as Record<string, { total_spent: number; successful_bids: number }>);

    // 3. ユーザー情報を取得
    const userIds = Object.keys(userStats);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', userIds);

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return [];
    }

    // 4. ランキングデータを構築
    const rankings: BidderRanking[] = users.map(user => ({
      id: user.id,
      username: user.username || 'Unknown',
      avatar_url: user.avatar_url || '',
      total_spent: userStats[user.id].total_spent,
      successful_bids: userStats[user.id].successful_bids,
    }));

    // 5. 総支払額でソートしてlimit数だけ返す
    return rankings
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, limit);

  } catch (error: any) {
    console.error('Error fetching bidder rankings:', error);
    throw error;
  }
};

// プラットフォーム全体の統計を取得
export const getRankingStats = async (): Promise<RankingStats> => {
  try {
    // 総取引額と完了したTalk数を取得
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchased_slots')
      .select('price');

    if (purchasesError) throw purchasesError;

    const totalTransactionAmount = purchases?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
    const totalTalksCompleted = purchases?.length || 0;

    // 平均評価を取得（全インフルエンサーの平均）
    const { data: influencers, error: influencersError } = await supabase
      .from('influencers')
      .select('rating');

    if (influencersError) throw influencersError;

    const averageRating = influencers && influencers.length > 0
      ? influencers.reduce((sum, i) => sum + (i.rating || 0), 0) / influencers.length
      : 0;

    return {
      total_transaction_amount: totalTransactionAmount,
      total_talks_completed: totalTalksCompleted,
      average_rating: Number(averageRating.toFixed(1)),
    };

  } catch (error: any) {
    console.error('Error fetching ranking stats:', error);
    throw error;
  }
};
