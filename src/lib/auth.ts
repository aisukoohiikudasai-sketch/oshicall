import { User as AuthUser } from '@supabase/supabase-js';
import { supabase, type User } from './supabase';

// ユーザータイプを判定
export const getUserType = async (authUserId: string): Promise<'influencer' | 'fan' | null> => {
  const { data: user } = await supabase
    .from('users')
    .select('is_fan, is_influencer')
    .eq('auth_user_id', authUserId)
    .single();
  
  if (!user) return null;
  
  // インフルエンサー優先（両方trueの場合）
  if (user.is_influencer) return 'influencer';
  if (user.is_fan) return 'fan';
  
  return null;
};

// ユーザーをインフルエンサーに更新
export const updateToInfluencer = async (
  authUser: AuthUser
): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update({
      is_influencer: true,
    })
    .eq('auth_user_id', authUser.id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// 新規ユーザーを登録（デフォルトはファン）
export const registerUser = async (
  authUser: AuthUser
): Promise<User> => {
  console.log('🆕 ユーザー登録開始:', {
    authUserId: authUser.id,
    email: authUser.email,
    metadata: authUser.user_metadata
  });
  
  const displayName = authUser.user_metadata?.display_name || 
                     authUser.user_metadata?.full_name ||
                     authUser.email?.split('@')[0] || 
                     'Unnamed User';
  
  const profileImageUrl = authUser.user_metadata?.avatar_url || 
                        authUser.user_metadata?.picture || 
                        null;
  
  console.log('📝 登録データ:', {
    displayName,
    profileImageUrl,
    email: authUser.email
  });
  
  const insertData = {
    auth_user_id: authUser.id,
    display_name: displayName,
    profile_image_url: profileImageUrl,
    is_fan: true,
    is_influencer: false,
  };
  
  console.log('📝 データベースに挿入するデータ:', insertData);
  
  const { data, error } = await supabase
    .from('users')
    .insert(insertData)
    .select()
    .single();
  
  if (error) {
    console.error('❌ ユーザー登録エラー:', error);
    throw error;
  }
  
  console.log('✅ ユーザー登録成功:', {
    id: data.id,
    is_fan: data.is_fan,
    is_influencer: data.is_influencer,
    display_name: data.display_name,
    auth_user_id: data.auth_user_id
  });
  return data;
};

// Supabaseユーザー情報を取得
export const getSupabaseUser = async (
  authUserId: string
): Promise<User | null> => {
  console.log('🔍 既存ユーザー検索:', { authUserId });
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();
  
  if (error) {
    console.log('🔍 既存ユーザーが見つかりません:', error.message);
    return null;
  }
  
  console.log('🔍 既存ユーザー見つかりました:', {
    id: data.id,
    is_fan: data.is_fan,
    is_influencer: data.is_influencer,
    display_name: data.display_name,
    auth_user_id: data.auth_user_id,
    created_at: data.created_at
  });
  
  return data;
};

// ファンからインフルエンサーに切り替え
export const switchToInfluencer = async (
  authUser: AuthUser
): Promise<User> => {
  // 現在のユーザー情報を取得
  const user = await getSupabaseUser(authUser.id);
  
  if (!user) {
    throw new Error('ユーザー情報が見つかりません');
  }
  
  // 既にインフルエンサーの場合はそのまま返す
  if (user.is_influencer) {
    return user;
  }
  
  // 承認チェック（is_influencerフラグが運営によって立てられている必要がある）
  // 注: 運営がSQLで is_influencer = TRUE を設定済みであること
  throw new Error('インフルエンサー権限がありません。運営の承認が必要です。');
};


