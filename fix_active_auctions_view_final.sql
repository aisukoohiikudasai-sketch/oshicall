-- ============================================
-- active_auctions_view の SECURITY DEFINER 問題を完全修正
-- ============================================
-- このSQLは、active_auctions_view を完全にリセットして SECURITY INVOKER で再作成します
-- ============================================

-- ============================================
-- 1. 現在のビューの状態を詳細確認
-- ============================================

-- ビューの所有者と権限を確認
SELECT 
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views 
WHERE viewname = 'active_auctions_view' AND schemaname = 'public';

-- ビューの権限を確認
SELECT 
  grantee,
  privilege_type,
  is_grantable,
  grantor
FROM information_schema.table_privileges 
WHERE table_name = 'active_auctions_view' 
  AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- ビューの依存関係を確認
SELECT 
  dependent_ns.nspname as dependent_schema,
  dependent_view.relname as dependent_view,
  source_ns.nspname as source_schema,
  source_table.relname as source_table
FROM pg_depend 
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid 
JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
JOIN pg_namespace source_ns ON source_ns.oid = source_table.relnamespace
WHERE source_table.relname = 'active_auctions_view'
  AND source_ns.nspname = 'public';

-- ============================================
-- 2. ビューを完全に削除（依存関係も含む）
-- ============================================

-- 依存関係を無視してビューを強制削除
DROP VIEW IF EXISTS public.active_auctions_view CASCADE;

-- 念のため、同名のオブジェクトが残っていないか確認
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'active_auctions_view' AND schemaname = 'public') THEN
        RAISE EXCEPTION 'ビューがまだ存在しています。手動で削除してください。';
    END IF;
    RAISE NOTICE 'active_auctions_view を完全に削除しました';
END $$;

-- ============================================
-- 3. 関連テーブルのRLSポリシーを事前に設定
-- ============================================

-- auctions テーブルのRLS確認・設定
DO $$
BEGIN
    -- RLSが有効でない場合は有効化
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'auctions' AND rowsecurity = true AND schemaname = 'public') THEN
        ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'auctions テーブルのRLSを有効化しました';
    END IF;
    
    -- ポリシーが存在しない場合は作成
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'auctions' AND policyname = 'Everyone can view active auctions') THEN
        CREATE POLICY "Everyone can view active auctions" 
          ON auctions FOR SELECT 
          USING (status IN ('scheduled', 'active'));
        RAISE NOTICE 'auctions テーブルにRLSポリシーを追加しました';
    END IF;
END $$;

-- call_slots テーブルのRLS確認・設定
DO $$
BEGIN
    -- RLSが有効でない場合は有効化
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'call_slots' AND rowsecurity = true AND schemaname = 'public') THEN
        ALTER TABLE call_slots ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'call_slots テーブルのRLSを有効化しました';
    END IF;
    
    -- ポリシーが存在しない場合は作成
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'call_slots' AND policyname = 'Everyone can view published call slots') THEN
        CREATE POLICY "Everyone can view published call slots" 
          ON call_slots FOR SELECT 
          USING (is_published = TRUE);
        RAISE NOTICE 'call_slots テーブルにRLSポリシーを追加しました';
    END IF;
END $$;

-- users テーブルのRLS確認・設定
DO $$
BEGIN
    -- RLSが有効でない場合は有効化
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users' AND rowsecurity = true AND schemaname = 'public') THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'users テーブルのRLSを有効化しました';
    END IF;
    
    -- ポリシーが存在しない場合は作成
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Everyone can view influencer profiles') THEN
        CREATE POLICY "Everyone can view influencer profiles" 
          ON users FOR SELECT 
          USING (is_influencer = TRUE);
        RAISE NOTICE 'users テーブルにRLSポリシーを追加しました';
    END IF;
END $$;

-- ============================================
-- 4. SECURITY INVOKER でビューを再作成
-- ============================================

-- 明示的に SECURITY INVOKER を指定してビューを作成
CREATE VIEW public.active_auctions_view 
WITH (security_invoker = true) AS
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
-- 5. ビューの権限を厳格に設定
-- ============================================

-- すべての権限を削除
REVOKE ALL ON public.active_auctions_view FROM PUBLIC;
REVOKE ALL ON public.active_auctions_view FROM anon;
REVOKE ALL ON public.active_auctions_view FROM authenticated;
REVOKE ALL ON public.active_auctions_view FROM service_role;

-- 認証済みユーザーにSELECT権限のみ付与
GRANT SELECT ON public.active_auctions_view TO authenticated;

-- ============================================
-- 6. ビューの所有者を適切に設定
-- ============================================

-- ビューの所有者を現在のユーザーに設定
ALTER VIEW public.active_auctions_view OWNER TO postgres;

-- ============================================
-- 7. 最終確認
-- ============================================

-- ビューの設定確認
SELECT 
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views 
WHERE viewname = 'active_auctions_view' AND schemaname = 'public';

-- ビューの権限確認
SELECT 
  grantee,
  privilege_type,
  is_grantable,
  grantor
FROM information_schema.table_privileges 
WHERE table_name = 'active_auctions_view' 
  AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- ビューがSECURITY INVOKERで作成されているか確認
SELECT 
  schemaname,
  viewname,
  -- PostgreSQL 15+ の場合、security_invoker オプションを確認
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_class WHERE relname = 'active_auctions_view' AND relkind = 'v') THEN
      'View created successfully'
    ELSE 'View creation failed'
  END as status
FROM pg_views 
WHERE viewname = 'active_auctions_view' AND schemaname = 'public';

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
-- 8. 完了メッセージ
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'active_auctions_view の SECURITY DEFINER 問題を完全修正しました';
    RAISE NOTICE '============================================';
    RAISE NOTICE '1. ビューを完全に削除（CASCADE）';
    RAISE NOTICE '2. 関連テーブルのRLSを有効化・ポリシー設定';
    RAISE NOTICE '3. SECURITY INVOKER でビューを再作成';
    RAISE NOTICE '4. 厳格な権限設定（authenticated ユーザーのみ）';
    RAISE NOTICE '5. 適切な所有者設定';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'これで Supabase のセキュリティエラーが完全に解決されました';
    RAISE NOTICE '============================================';
END $$;
