import { supabase } from '../lib/supabase';

export interface UserCollection {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  influencer_name: string;
  influencer_image: string;
  purchased_at: string;
  call_status: string;
  rating?: number;
  review?: string;
}

/**
 * ユーザーのコレクション（購入済み通話）を取得
 */
export const getUserCollection = async (userId: string): Promise<UserCollection[]> => {
  try {
    const { data, error } = await supabase
      .from('purchased_slots')
      .select(`
        id,
        purchased_at,
        call_status,
        call_slots (
          title,
          description,
          thumbnail_url,
          duration_minutes,
          scheduled_start_time
        ),
        users!purchased_slots_influencer_user_id_fkey (
          display_name,
          profile_image_url
        ),
        reviews (
          rating,
          review_text
        )
      `)
      .eq('fan_user_id', userId)
      .order('purchased_at', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      title: item.call_slots.title,
      description: item.call_slots.description,
      thumbnail: item.call_slots.thumbnail_url,
      duration: item.call_slots.duration_minutes,
      influencer_name: item.users.display_name,
      influencer_image: item.users.profile_image_url,
      purchased_at: item.purchased_at,
      call_status: item.call_status,
      rating: item.reviews?.[0]?.rating,
      review: item.reviews?.[0]?.review_text,
    }));
  } catch (error) {
    console.error('ユーザーコレクション取得エラー:', error);
    return [];
  }
};

/**
 * インフルエンサーのコレクション（提供した通話）を取得
 */
export const getInfluencerCollection = async (userId: string): Promise<UserCollection[]> => {
  try {
    const { data, error } = await supabase
      .from('purchased_slots')
      .select(`
        id,
        purchased_at,
        call_status,
        call_slots (
          title,
          description,
          thumbnail_url,
          duration_minutes,
          scheduled_start_time
        ),
        users!purchased_slots_fan_user_id_fkey (
          display_name,
          profile_image_url
        ),
        reviews (
          rating,
          review_text
        )
      `)
      .eq('influencer_user_id', userId)
      .order('purchased_at', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      title: item.call_slots.title,
      description: item.call_slots.description,
      thumbnail: item.call_slots.thumbnail_url,
      duration: item.call_slots.duration_minutes,
      influencer_name: item.users.display_name,
      influencer_image: item.users.profile_image_url,
      purchased_at: item.purchased_at,
      call_status: item.call_status,
      rating: item.reviews?.[0]?.rating,
      review: item.reviews?.[0]?.review_text,
    }));
  } catch (error) {
    console.error('インフルエンサーコレクション取得エラー:', error);
    return [];
  }
};
