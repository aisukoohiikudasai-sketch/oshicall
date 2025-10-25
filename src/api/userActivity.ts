import { supabase } from '../lib/supabase';

export interface UserActivity {
  id: string;
  type: 'call' | 'bid' | 'event' | 'badge' | 'purchase';
  title: string;
  description: string;
  date: string;
  amount?: number;
  status?: string;
  metadata?: any;
}

/**
 * ユーザーの活動ログを取得
 */
export const getUserActivity = async (userId: string, limit: number = 50): Promise<UserActivity[]> => {
  try {
    // 通話履歴
    const { data: calls, error: callsError } = await supabase
      .from('purchased_slots')
      .select(`
        id,
        purchased_at,
        call_status,
        call_slots (
          title,
          scheduled_start_time
        ),
        users!purchased_slots_influencer_user_id_fkey (
          display_name
        )
      `)
      .eq('fan_user_id', userId)
      .order('purchased_at', { ascending: false })
      .limit(limit);

    if (callsError) throw callsError;

    // 入札履歴
    const { data: bids, error: bidsError } = await supabase
      .from('bids')
      .select(`
        id,
        amount,
        created_at,
        auctions (
          call_slots (
            title,
            users!call_slots_user_id_fkey (
              display_name
            )
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (bidsError) throw bidsError;

    // バッジ獲得履歴
    const { data: badges, error: badgesError } = await supabase
      .from('user_badges')
      .select(`
        earned_at,
        badges (
          name,
          description
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(limit);

    if (badgesError) throw badgesError;

    // 活動ログを統合
    const activities: UserActivity[] = [];

    // 通話履歴を追加
    calls.forEach(call => {
      activities.push({
        id: `call_${call.id}`,
        type: 'call',
        title: call.call_slots.title,
        description: `${call.users.display_name}さんとの通話`,
        date: call.purchased_at,
        status: call.call_status,
        metadata: {
          scheduled_time: call.call_slots.scheduled_start_time
        }
      });
    });

    // 入札履歴を追加
    bids.forEach(bid => {
      activities.push({
        id: `bid_${bid.id}`,
        type: 'bid',
        title: `${bid.auctions.call_slots.title}への入札`,
        description: `${bid.auctions.call_slots.users.display_name}さんの通話`,
        date: bid.created_at,
        amount: bid.amount,
        metadata: {
          influencer_name: bid.auctions.call_slots.users.display_name
        }
      });
    });

    // バッジ獲得履歴を追加
    badges.forEach(badge => {
      activities.push({
        id: `badge_${badge.earned_at}`,
        type: 'badge',
        title: `${badge.badges.name}を獲得`,
        description: badge.badges.description,
        date: badge.earned_at,
        metadata: {
          badge_name: badge.badges.name
        }
      });
    });

    // 日付でソート
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('ユーザー活動ログ取得エラー:', error);
    return [];
  }
};
