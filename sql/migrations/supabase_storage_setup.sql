-- =========================================
-- Supabase Storage セットアップ
-- =========================================
-- 画像ストレージ用のバケットとポリシーを設定します
-- =========================================

-- ステップ1: バケット作成
-- 注意: バケット作成はSupabase DashboardのStorage UIから行う方が簡単です
-- もしくは、以下のSQLで作成できます

-- storage.bucketsテーブルに直接挿入
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('talk-images', 'talk-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]),
  ('profile-images', 'profile-images', true, 2097152, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;

-- ステップ2: Storage RLSポリシーの設定

-- talk-images バケットのポリシー
-- 1. 誰でも画像を閲覧可能
CREATE POLICY "Public Access for talk images"
ON storage.objects FOR SELECT
USING (bucket_id = 'talk-images');

-- 2. 認証済みユーザーがアップロード可能
CREATE POLICY "Authenticated users can upload talk images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'talk-images' 
  AND auth.role() = 'authenticated'
);

-- 3. 自分がアップロードした画像は削除可能
CREATE POLICY "Users can delete their own talk images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'talk-images' 
  AND auth.uid() = owner
);

-- profile-images バケットのポリシー
-- 1. 誰でも画像を閲覧可能
CREATE POLICY "Public Access for profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

-- 2. 認証済みユーザーがアップロード可能
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

-- 3. 自分がアップロードした画像は削除可能
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images' 
  AND auth.uid() = owner
);

-- =========================================
-- 完了
-- =========================================
-- Storage設定が完了しました。
-- 
-- 次のステップ:
-- 1. Supabase Dashboard → Storage で作成されたバケットを確認
-- 2. 画像をアップロード
-- 3. 画像URLを取得してデータベースに保存
-- 
-- 画像URLの形式:
-- https://[project-ref].supabase.co/storage/v1/object/public/talk-images/1.jpg
-- =========================================

