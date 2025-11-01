-- Supabase Realtimeを有効にするための設定

-- 1. bidsテーブルのREPLICA IDENTITYを設定（Realtimeに必要）
ALTER TABLE bids REPLICA IDENTITY FULL;

-- 2. Realtimeパブリケーションにbidsテーブルを追加
-- Supabaseの場合、デフォルトで "supabase_realtime" パブリケーションが存在します
ALTER PUBLICATION supabase_realtime ADD TABLE bids;

-- 3. 確認クエリ
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'bids';

-- 4. REPLICA IDENTITY確認
SELECT relname, relreplident
FROM pg_class
WHERE relname = 'bids';
-- relreplident が 'f' (FULL) であることを確認
