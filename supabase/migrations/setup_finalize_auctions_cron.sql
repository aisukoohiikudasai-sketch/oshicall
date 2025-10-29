-- pg_cron拡張を有効化（既に有効な場合はスキップ）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 既存のCron jobを削除（存在する場合）
SELECT cron.unschedule('finalize-auctions-job') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'finalize-auctions-job'
);

-- finalize-auctions Edge Functionを毎分実行するCron jobを作成
-- Edge Functionは--no-verify-jwtでデプロイされているため認証不要
SELECT cron.schedule(
  'finalize-auctions-job',
  '* * * * *', -- 毎分実行
  $$
  SELECT
    net.http_post(
      url:='https://wioealhsienyubwegvdu.supabase.co/functions/v1/finalize-auctions',
      headers:=jsonb_build_object('Content-Type', 'application/json'),
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Cron jobの確認
SELECT jobid, jobname, schedule, command FROM cron.job WHERE jobname = 'finalize-auctions-job';
