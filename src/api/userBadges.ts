import { supabase } from '../lib/supabase';

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned_at: string;
  category: string;
}

/**
 * ユーザーの実績バッジを取得
 */
export const getUserBadges = async (userId: string): Promise<UserBadge[]> => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badges (
          name,
          description,
          icon,
          color,
          category
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      name: item.badges.name,
      description: item.badges.description,
      icon: item.badges.icon,
      color: item.badges.color,
      earned_at: item.earned_at,
      category: item.badges.category,
    }));
  } catch (error) {
    console.error('ユーザーバッジ取得エラー:', error);
    return [];
  }
};

/**
 * 利用可能なバッジ一覧を取得
 */
export const getAvailableBadges = async (): Promise<UserBadge[]> => {
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;

    return data.map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      color: badge.color,
      earned_at: '',
      category: badge.category,
    }));
  } catch (error) {
    console.error('利用可能バッジ取得エラー:', error);
    return [];
  }
};
