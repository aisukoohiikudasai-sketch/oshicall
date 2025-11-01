// Supabase Edge Function: 即決購入時のオークション終了処理
// 即決購入が発生した際に即座にオークションを終了させる
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia' as any,
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  try {
    const { auctionId, winnerId } = await req.json();

    console.log('🔵 即決購入オークション終了処理開始:', { auctionId, winnerId });

    // 1. オークション情報を取得
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('id, status, current_winner_id')
      .eq('id', auctionId)
      .single();

    if (auctionError || !auction) {
      throw new Error('オークションが見つかりません');
    }

    if (auction.status === 'ended') {
      console.log('⚠️ オークションは既に終了しています');
      return new Response(JSON.stringify({ message: '既に終了しています' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. オークションステータスを終了に更新
    console.log('🔵 オークションステータスを終了に更新:', { auctionId, winnerId });
    const { error: updateError } = await supabase
      .from('auctions')
      .update({ status: 'ended' })
      .eq('id', auctionId);

    if (updateError) {
      console.error('❌ オークションステータス更新エラー:', updateError);
      throw updateError;
    }

    console.log('✅ オークションステータスを終了に更新しました');

    // 3. 即決購入者以外の入札を取得してPaymentIntentをキャンセル
    // winnerIdが渡されている場合はそれを使用、なければcurrent_winner_idを使用
    const actualWinnerId = winnerId || auction.current_winner_id;

    if (!actualWinnerId) {
      console.warn('⚠️ 落札者IDが特定できません');
    }

    const { data: otherBids } = await supabase
      .from('bids')
      .select('stripe_payment_intent_id, user_id')
      .eq('auction_id', auctionId)
      .neq('user_id', actualWinnerId || '');

    if (otherBids && otherBids.length > 0) {
      console.log(`🔵 ${otherBids.length}件の他の入札をキャンセルします`);

      for (const bid of otherBids) {
        if (bid.stripe_payment_intent_id) {
          try {
            await stripe.paymentIntents.cancel(bid.stripe_payment_intent_id);
            console.log(`✅ PaymentIntentキャンセル成功: ${bid.stripe_payment_intent_id}`);
          } catch (err: any) {
            // already_canceled等のエラーは無視
            if (err.code !== 'payment_intent_unexpected_state') {
              console.error(`⚠️ PaymentIntentキャンセルエラー:`, err.message);
            }
          }
        }
      }
    }

    console.log('✅ 即決購入オークション終了処理完了');

    return new Response(
      JSON.stringify({
        message: 'オークションを終了しました',
        auctionId,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ 即決購入オークション終了処理エラー:', error);
    return new Response(
      JSON.stringify({
        error: error.message || '処理中にエラーが発生しました',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
