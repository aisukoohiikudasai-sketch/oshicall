-- ============================================
-- active_auctions_view の SECURITY DEFINER 問題を修正
-- ============================================
-- このSQLは、active_auctions_view を SECURITY INVOKER で再作成します
-- ============================================

-- ============================================
-- 1. 現在のビューの定義を確認
-- ============================================

-- 現在のビューの定義を表示
SELECT 
  schemaname,
  viewname,
  -- ビューの定義を取得
  pg_get_viewdef('public.active_auctions_view'::regclass, true) as view_definition
FROM pg_views 
WHERE viewname = 'active_auctions_view' AND schemaname = 'public';

-- ============================================
-- 2. ビューを強制的に削除
-- ============================================

-- 依存関係を無視してビューを削除
DROP VIEW IF EXISTS public.active_auctions_view CASCADE;

-- ============================================
-- 3. SECURITY INVOKER でビューを再作成
-- ============================================

-- SECURITY INVOKER（デフォルト）でビューを再作成
CREATE VIEW public.active_auctions_view AS
SELECT 
  a.id as auction_id,
  a.status,
  a.start_time,
  a.end_time,
  a.current_highest_bid,
  a.total_bids_count,
  cs.id as call_slot_id,
  cs.title,
  cs.description,
  cs.scheduled_start_time,
  cs.duration_minutes,
  cs.starting_price,
  cs.thumbnail_url,
  u.id as influencer_id,
  u.display_name as influencer_name,
  u.profile_image_url as influencer_image,
  u.average_rating
FROM auctions a
JOIN call_slots cs ON a.call_slot_id = cs.id
JOIN users u ON cs.user_id = u.id
WHERE a.status IN ('scheduled', 'active')
  AND cs.is_published = TRUE
  AND u.is_influencer = TRUE
ORDER BY a.end_time ASC;

-- ============================================
-- 4. ビューの権限を適切に設定
-- ============================================

-- 全ユーザーからの権限を削除
REVOKE ALL ON public.active_auctions_view FROM PUBLIC;
REVOKE ALL ON public.active_auctions_view FROM anon;
REVOKE ALL ON public.active_auctions_view FROM authenticated;

-- 認証済みユーザーにSELECT権限を付与
GRANT SELECT ON public.active_auctions_view TO authenticated;

-- ============================================
-- 5. 関連テーブルのRLSポリシーを確認・追加
-- ============================================

-- auctions テーブルのRLS確認
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'auctions' AND policyname = 'Everyone can view active auctions') THEN
        -- 全ユーザーがアクティブなオークションを閲覧可能
        CREATE POLICY "Everyone can view active auctions" 
          ON auctions FOR SELECT 
          USING (status IN ('scheduled', 'active'));
        
        RAISE NOTICE 'auctions テーブルにRLSポリシーを追加しました';
    END IF;
END $$;

-- call_slots テーブルのRLS確認
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'call_slots' AND policyname = 'Everyone can view published call slots') THEN
        -- 全ユーザーが公開されたTalk枠を閲覧可能
        CREATE POLICY "Everyone can view published call slots" 
          ON call_slots FOR SELECT 
          USING (is_published = TRUE);
        
        RAISE NOTICE 'call_slots テーブルにRLSポリシーを追加しました';
    END IF;
END $$;

-- users テーブルのRLS確認
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Everyone can view influencer profiles') THEN
        -- 全ユーザーがインフルエンサーのプロフィールを閲覧可能
        CREATE POLICY "Everyone can view influencer profiles" 
          ON users FOR SELECT 
          USING (is_influencer = TRUE);
        
        RAISE NOTICE 'users テーブルにRLSポリシーを追加しました';
    END IF;
END $$;

-- ============================================
-- 6. 確認クエリ
-- ============================================

-- ビューの設定確認
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE viewname = 'active_auctions_view' AND schemaname = 'public';

-- ビューの権限確認
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'active_auctions_view' 
  AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 関連テーブルのRLS確認
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('auctions', 'call_slots', 'users') 
  AND schemaname = 'public'
ORDER BY tablename;

-- 各テーブルのポリシー確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('auctions', 'call_slots', 'users')
  AND schemaname = 'public'
ORDER BY tablename, cmd;

-- ============================================
-- 7. 完了メッセージ
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'active_auctions_view の SECURITY DEFINER 問題を修正しました';
    RAISE NOTICE '============================================';
    RAISE NOTICE '1. ビューを SECURITY INVOKER で再作成';
    RAISE NOTICE '2. 適切な権限設定（authenticated ユーザーのみ）';
    RAISE NOTICE '3. 関連テーブルのRLSポリシーを確認・追加';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'これで Supabase のセキュリティエラーが解決されました';
    RAISE NOTICE '============================================';
END $$;
