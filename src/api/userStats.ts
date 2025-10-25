import { supabase } from '../lib/supabase';

export interface UserStats {
  total_spent: number;
  total_calls_purchased: number;
  total_bids: number;
  total_earnings: number;
  total_calls_completed: number;
  average_rating: number;
  oshi_tags: string[];
  fan_tags: string[];
}

/**
 * ユーザーの統計情報を取得
 */
export const getUserStats = async (userId: string): Promise<UserStats> => {
  try {
    // ユーザー基本情報を取得
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_spent, total_calls_purchased, total_earnings, total_calls_completed, average_rating, oshi_tags, fan_tags')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // 入札数を取得
    const { count: bidCount, error: bidError } = await supabase
      .from('bids')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (bidError) throw bidError;

    return {
      total_spent: user.total_spent || 0,
      total_calls_purchased: user.total_calls_purchased || 0,
      total_bids: bidCount || 0,
      total_earnings: user.total_earnings || 0,
      total_calls_completed: user.total_calls_completed || 0,
      average_rating: user.average_rating || 0,
      oshi_tags: user.oshi_tags || [],
      fan_tags: user.fan_tags || [],
    };
  } catch (error) {
    console.error('ユーザー統計取得エラー:', error);
    // エラーの場合は空のデータを返す
    return {
      total_spent: 0,
      total_calls_purchased: 0,
      total_bids: 0,
      total_earnings: 0,
      total_calls_completed: 0,
      average_rating: 0,
      oshi_tags: [],
      fan_tags: [],
    };
  }
};

/**
 * ファンの購入履歴を取得
 */
export const getFanPurchasedCalls = async (userId: string) => {
  const { data, error } = await supabase
    .from('purchased_slots')
    .select(`
      *,
      call_slots (
        title,
        scheduled_start_time,
        duration_minutes,
        thumbnail_url
      ),
      users!purchased_slots_influencer_user_id_fkey (
        display_name,
        profile_image_url
      )
    `)
    .eq('fan_user_id', userId)
    .order('purchased_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * ファンの入札履歴を取得
 */
export const getFanBidHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('bids')
    .select(`
      *,
      auctions (
        *,
        call_slots (
          title,
          scheduled_start_time,
          users!call_slots_user_id_fkey (
            display_name,
            profile_image_url
          )
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data;
};

/**
 * インフルエンサーの収益統計を取得
 */
export const getInfluencerEarnings = async (userId: string) => {
  const { data, error } = await supabase
    .from('purchased_slots')
    .select('influencer_payout, purchased_at, call_status')
    .eq('influencer_user_id', userId)
    .eq('call_status', 'completed');
  
  if (error) throw error;
  
  // 統計を計算
  const totalEarnings = data.reduce((sum, slot) => sum + slot.influencer_payout, 0);
  const completedCalls = data.length;
  
  return {
    totalEarnings,
    completedCalls,
    earnings: data,
  };
};

/**
 * ユーザーのプロフィール情報を取得
 */
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};
