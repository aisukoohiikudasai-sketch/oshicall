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
    // 1. purchased_slotsからcall_slotsを結合してuser_idと価格を取得
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchased_slots')
      .select(`
        price,
        call_slots!inner (
          user_id
        )
      `);

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      throw purchasesError;
    }

    if (!purchases || purchases.length === 0) {
      console.log('No purchases found');
      return [];
    }

    // 2. user_idごとに集計
    const userStats = purchases.reduce((acc, purchase: any) => {
      const userId = purchase.call_slots?.user_id;
      if (!userId) return acc;

      if (!acc[userId]) {
        acc[userId] = {
          total_earned: 0,
          total_talks: 0,
        };
      }
      acc[userId].total_earned += purchase.price || 0;
      acc[userId].total_talks += 1;
      return acc;
    }, {} as Record<string, { total_earned: number; total_talks: number }>);

    console.log('User stats:', userStats);

    // 3. ユーザー情報を取得（usersテーブルから）
    const userIds = Object.keys(userStats);
    if (userIds.length === 0) {
      return [];
    }

    console.log('Looking up users:', userIds);

    // usersテーブルとinfluencersテーブルを結合して取得
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        username,
        avatar_url,
        influencers!inner (
          name,
          follower_count,
          rating
        )
      `)
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users with influencer data:', usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      console.log('No users/influencers found for user IDs:', userIds);
      return [];
    }

    console.log('Found users:', users);

    // 4. ランキングデータを構築
    const rankings: InfluencerRanking[] = users.map((user: any) => ({
      id: user.id,
      name: user.influencers?.name || user.username || 'Unknown',
      username: user.username || 'unknown',
      avatar_url: user.avatar_url || '',
      follower_count: user.influencers?.follower_count || 0,
      rating: user.influencers?.rating || 0,
      total_earned: userStats[user.id].total_earned,
      total_talks: userStats[user.id].total_talks,
    }));

    // 5. 総獲得金額でソートしてlimit数だけ返す
    return rankings
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

    if (purchasesError) {
      console.error('Error fetching purchases for bidders:', purchasesError);
      throw purchasesError;
    }

    if (!purchases || purchases.length === 0) {
      console.log('No purchases found for bidders');
      return [];
    }

    console.log(`Found ${purchases.length} purchases for bidder rankings`);

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

    if (purchasesError) {
      console.error('Error fetching purchases for stats:', purchasesError);
      throw purchasesError;
    }

    const totalTransactionAmount = purchases?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
    const totalTalksCompleted = purchases?.length || 0;

    console.log('Stats:', { totalTransactionAmount, totalTalksCompleted, purchaseCount: purchases?.length || 0 });

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
