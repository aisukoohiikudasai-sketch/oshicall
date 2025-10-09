import { supabase } from './supabase';

/**
 * 画像をSupabase Storageにアップロード
 */
export const uploadImage = async (
  file: File,
  bucket: 'talk-images' | 'profile-images',
  folder?: string
): Promise<string> => {
  // ファイル名を生成（タイムスタンプ + ランダム文字列）
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split('.').pop();
  const fileName = `${folder ? folder + '/' : ''}${timestamp}-${randomString}.${extension}`;

  // アップロード
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
  }

  // 公開URLを取得
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

/**
 * 画像を削除
 */
export const deleteImage = async (
  url: string,
  bucket: 'talk-images' | 'profile-images'
): Promise<void> => {
  // URLからファイルパスを抽出
  const path = url.split(`/storage/v1/object/public/${bucket}/`)[1];
  
  if (!path) {
    console.warn('画像パスの抽出に失敗しました:', url);
    return;
  }

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('画像の削除に失敗しました:', error);
  }
};

/**
 * 画像のプレビューURLを生成
 */
export const getImagePreviewUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 画像ファイルのバリデーション
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // ファイルサイズチェック（5MB）
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'ファイルサイズは5MB以下にしてください' };
  }

  // ファイル形式チェック
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '対応している形式: JPEG, PNG, WebP, GIF' };
  }

  return { valid: true };
};

