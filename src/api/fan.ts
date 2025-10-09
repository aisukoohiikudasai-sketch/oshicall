import { supabase, type PurchasedSlot } from '../lib/supabase';

// ファンの購入済み通話一覧を取得
export const getFanPurchasedCalls = async (fanId: string) => {
  const { data, error } = await supabase
    .from('user_purchased_calls_view')
    .select('*')
    .eq('fan_id', fanId)
    .order('scheduled_start_time', { ascending: true });
  
  if (error) throw error;
  return data;
};

// ファンの入札履歴を取得
export const getFanBidHistory = async (fanId: string) => {
  const { data, error } = await supabase
    .from('bids')
    .select(`
      *,
      auctions (
        *,
        call_slots (
          title,
          scheduled_start_time,
          influencers (display_name, profile_image_url)
        )
      )
    `)
    .eq('fan_id', fanId)
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (error) throw error;
  return data;
};

// ファンが参加中のオークション一覧を取得
export const getFanActiveAuctions = async (fanId: string) => {
  // ファンが入札しているアクティブなオークションを取得
  const { data, error } = await supabase
    .from('bids')
    .select(`
      auction_id,
      auctions!inner (
        *,
        call_slots (
          *,
          influencers (display_name, profile_image_url)
        )
      )
    `)
    .eq('fan_id', fanId)
    .in('auctions.status', ['scheduled', 'active'])
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // 重複を除去（同じオークションに複数回入札している場合）
  const uniqueAuctions = Array.from(
    new Map(data.map(item => [item.auction_id, item.auctions])).values()
  );
  
  return uniqueAuctions;
};

// 特定オークションでのファンの最高入札額を取得
export const getFanHighestBid = async (auctionId: string, fanId: string) => {
  const { data, error } = await supabase
    .from('bids')
    .select('bid_amount')
    .eq('auction_id', auctionId)
    .eq('fan_id', fanId)
    .order('bid_amount', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data?.bid_amount || null;
};

// ファンがオークションに勝っているか確認
export const isFanWinning = async (auctionId: string, fanId: string) => {
  const { data, error } = await supabase
    .from('auctions')
    .select('current_winner_id')
    .eq('id', auctionId)
    .single();
  
  if (error) throw error;
  return data.current_winner_id === fanId;
};

// レビューを投稿
export const submitReview = async (
  purchasedSlotId: string,
  fanId: string,
  influencerId: string,
  rating: number,
  comment: string
) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      purchased_slot_id: purchasedSlotId,
      fan_id: fanId,
      influencer_id: influencerId,
      rating,
      comment,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// 通話ステータスを更新
export const updateCallStatus = async (
  purchasedSlotId: string,
  status: 'ready' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
) => {
  const updates: any = { call_status: status };
  
  if (status === 'in_progress') {
    updates.call_started_at = new Date().toISOString();
  } else if (status === 'completed') {
    updates.call_ended_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase
    .from('purchased_slots')
    .update(updates)
    .eq('id', purchasedSlotId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};


