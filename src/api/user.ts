import { supabase } from '../lib/supabase';
import type { User } from '../lib/supabase';

export interface UpdateUserProfileInput {
  display_name?: string;
  bio?: string;
  profile_image_url?: string;
}

/**
 * ユーザープロフィールを更新
 */
export const updateUserProfile = async (
  userId: string,
  updates: UpdateUserProfileInput
): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * プロフィール画像をアップロード
 */
export const updateProfileImage = async (
  userId: string,
  file: File
): Promise<string> => {
  const { uploadImage } = await import('../lib/storage');
  
  // 画像をアップロード
  const imageUrl = await uploadImage(file, 'profile-images', 'avatars');
  
  // DBを更新
  await updateUserProfile(userId, { profile_image_url: imageUrl });
  
  return imageUrl;
};

/**
 * 現在のユーザー情報を取得
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) return null;
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .single();
  
  if (error) {
    console.error('ユーザー情報取得エラー:', error);
    return null;
  }
  
  return data;
};

