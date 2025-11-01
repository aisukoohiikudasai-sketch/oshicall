import { supabase } from '../lib/supabase';
import type { CallSlot, Auction } from '../lib/supabase';

export interface CreateCallSlotInput {
  title: string;
  description: string;
  scheduled_start_time: string;
  duration_minutes: number;
  starting_price: number;
  minimum_bid_increment: number;
  buy_now_price?: number | null; // 即決価格
  thumbnail_url?: string;
  auction_end_time: string; // オークション終了時間
}

// インフルエンサーのCall Slotsを作成
export const createCallSlot = async (
  userId: string,
  input: CreateCallSlotInput
): Promise<{ callSlot: CallSlot; auction: Auction }> => {
  // datetime-local形式の値をJST (UTC+9)として明示的に扱う
  // 例: "2025-01-15T14:30" → "2025-01-15T14:30:00+09:00"
  const scheduledTimeLocal = input.scheduled_start_time;

  // datetime-local形式にタイムゾーンオフセットを追加
  // ブラウザの入力は常にJSTとして扱う
  const scheduledTimeWithTZ = `${scheduledTimeLocal}:00+09:00`;

  console.log('📅 Talk開始時間変換:', {
    input: scheduledTimeLocal,
    withTimezone: scheduledTimeWithTZ
  });

  // 1. Call Slotを作成
  const { data: callSlot, error: callSlotError } = await supabase
    .from('call_slots')
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description,
      scheduled_start_time: scheduledTimeWithTZ, // タイムゾーン付きで保存
      duration_minutes: input.duration_minutes,
      starting_price: input.starting_price,
      minimum_bid_increment: input.minimum_bid_increment,
      buy_now_price: input.buy_now_price || null,
      thumbnail_url: input.thumbnail_url || null,
      is_published: true,
    })
    .select()
    .single();

  if (callSlotError) throw callSlotError;

  // 2. オークションを自動作成
  // フロントエンドから送信されたオークション終了時間を使用
  const auctionEndTimeWithTZ = `${input.auction_end_time}:00+09:00`;
  const auctionStartTime = new Date(); // 今すぐ開始

  console.log('🕐 オークション時間設定:', {
    scheduledTime: scheduledTimeWithTZ,
    auctionStartTime: auctionStartTime.toISOString(),
    auctionEndTime: auctionEndTimeWithTZ
  });

  const { data: auction, error: auctionError } = await supabase
    .from('auctions')
    .insert({
      call_slot_id: callSlot.id,
      status: 'active',
      start_time: auctionStartTime.toISOString(),
      end_time: auctionEndTimeWithTZ, // タイムゾーン付きで保存
      auction_end_time: auctionEndTimeWithTZ, // auction_end_timeも同じ値
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

