import { supabase, type Follow, type FollowCounts } from '../lib/supabase';

/**
 * インフルエンサーをフォローする
 */
export const followInfluencer = async (followerId: string, influencerId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .insert({
      follower_id: followerId,
      following_id: influencerId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Follow;
};

/**
 * インフルエンサーをアンフォローする
 */
export const unfollowInfluencer = async (followerId: string, influencerId: string) => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', influencerId);

  if (error) throw error;
};

/**
 * フォロー状態を確認する
 */
export const checkFollowStatus = async (followerId: string, influencerId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', influencerId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
};

/**
 * フォロー・フォロワー数を取得する
 */
export const getFollowCounts = async (userId: string): Promise<FollowCounts> => {
  const { data, error } = await supabase.rpc('get_follow_counts', {
    user_id: userId,
  });

  if (error) throw error;
  return data[0] || { followers_count: 0, following_count: 0 };
};

/**
 * ユーザーのフォロワーリストを取得する
 */
export const getFollowers = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_followers')
    .select('*')
    .eq('user_id', userId)
    .order('followed_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * ユーザーがフォロー中のリストを取得する
 */
export const getFollowing = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_following')
    .select('*')
    .eq('user_id', userId)
    .order('followed_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * フォロー中のインフルエンサーIDリストを取得
 */
export const getFollowingInfluencerIds = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (error) throw error;
  return data.map((follow) => follow.following_id);
};

/**
 * 複数のインフルエンサーに対するフォロー状態を一括取得
 */
export const checkMultipleFollowStatus = async (
  followerId: string,
  influencerIds: string[]
): Promise<Record<string, boolean>> => {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', followerId)
    .in('following_id', influencerIds);

  if (error) throw error;

  const followedIds = new Set(data.map((follow) => follow.following_id));
  const result: Record<string, boolean> = {};
  influencerIds.forEach((id) => {
    result[id] = followedIds.has(id);
  });

  return result;
};
