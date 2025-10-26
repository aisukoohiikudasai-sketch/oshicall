import { supabase } from '../lib/supabase';
import type { CallSlot, Auction } from '../lib/supabase';

export interface CreateCallSlotInput {
  title: string;
  description: string;
  scheduled_start_time: string;
  duration_minutes: number;
  starting_price: number;
  minimum_bid_increment: number;
  thumbnail_url?: string;
}

// インフルエンサーのCall Slotsを作成
export const createCallSlot = async (
  userId: string,
  input: CreateCallSlotInput
): Promise<{ callSlot: CallSlot; auction: Auction }> => {
  // 1. Call Slotを作成
  const { data: callSlot, error: callSlotError } = await supabase
    .from('call_slots')
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description,
      scheduled_start_time: input.scheduled_start_time,
      duration_minutes: input.duration_minutes,
      starting_price: input.starting_price,
      minimum_bid_increment: input.minimum_bid_increment,
      thumbnail_url: input.thumbnail_url || null,
      is_published: true,
    })
    .select()
    .single();

  if (callSlotError) throw callSlotError;

  // 2. オークションを自動作成
  // オークション期間: Call開始24時間前まで
  const scheduledTime = new Date(input.scheduled_start_time);
  const auctionEndTime = new Date(scheduledTime.getTime() - 24 * 60 * 60 * 1000);
  const auctionStartTime = new Date(); // 今すぐ開始
  
  console.log('🕐 オークション時間設定:', {
    scheduledTime: scheduledTime.toISOString(),
    auctionEndTime: auctionEndTime.toISOString(),
    hoursDifference: (scheduledTime.getTime() - auctionEndTime.getTime()) / (1000 * 60 * 60)
  });

  const { data: auction, error: auctionError } = await supabase
    .from('auctions')
    .insert({
      call_slot_id: callSlot.id,
      status: 'active',
      start_time: auctionStartTime.toISOString(),
      end_time: auctionEndTime.toISOString(),
      auction_end_time: auctionEndTime.toISOString(), // auction_end_timeを追加
    })
    .select()
    .single();

  if (auctionError) {
    // オークション作成失敗時はCall Slotを削除
    await supabase.from('call_slots').delete().eq('id', callSlot.id);
    throw auctionError;
  }

  return { callSlot, auction };
};

// インフルエンサーの全Call Slotsを取得（オークション情報も含む）
export const getInfluencerCallSlots = async (
  userId: string
): Promise<CallSlot[]> => {
  const { data, error } = await supabase
    .from('call_slots')
    .select(`
      *,
      auctions!call_slot_id (
        id,
        end_time,
        auction_end_time,
        status
      )
    `)
    .eq('user_id', userId)
    .order('scheduled_start_time', { ascending: false });

  if (error) throw error;
  
  // オークション情報をCallSlotにマッピング
  const callSlots = (data || []).map((slot: any) => {
    // auctionsが配列かオブジェクトかを判定
    const auction = Array.isArray(slot.auctions) ? slot.auctions[0] : slot.auctions;
    
    return {
      ...slot,
      auction_end_time: auction?.auction_end_time || auction?.end_time,
      auction_id: auction?.id,
    };
  });

  return callSlots;
};

// Call Slotを更新
export const updateCallSlot = async (
  callSlotId: string,
  updates: Partial<CreateCallSlotInput>
): Promise<CallSlot> => {
  const { data, error } = await supabase
    .from('call_slots')
    .update(updates)
    .eq('id', callSlotId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Call Slotを削除
export const deleteCallSlot = async (callSlotId: string): Promise<void> => {
  const { error } = await supabase
    .from('call_slots')
    .delete()
    .eq('id', callSlotId);

  if (error) throw error;
};

// Call Slotの公開/非公開を切り替え
export const toggleCallSlotPublish = async (
  callSlotId: string,
  isPublished: boolean
): Promise<CallSlot> => {
  const { data, error } = await supabase
    .from('call_slots')
    .update({ is_published: isPublished })
    .eq('id', callSlotId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

