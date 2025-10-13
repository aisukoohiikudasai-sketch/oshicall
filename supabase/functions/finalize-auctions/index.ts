// Supabase Edge Function: オークション終了処理
// Cron: 毎分実行

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia' as any,
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AuctionToFinalize {
  auction_id: string;
  call_slot_id: string;
  influencer_user_id: string;
  end_time: string;
  current_highest_bid: number;
  highest_bidder_id: string;
}

serve(async (req) => {
  try {
    console.log('🔵 オークション終了処理開始');

    // 1. 終了したオークションを取得
    const now = new Date().toISOString();
    const { data: endedAuctions, error: auctionsError } = await supabase
      .from('active_auctions_view')
      .select('auction_id, call_slot_id, influencer_user_id, end_time, current_highest_bid, highest_bidder_id')
      .eq('status', 'active')
      .lte('end_time', now);

    if (auctionsError) {
      throw auctionsError;
    }

    if (!endedAuctions || endedAuctions.length === 0) {
      console.log('✅ 終了したオークションはありません');
      return new Response(JSON.stringify({ message: '終了したオークションはありません' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔵 ${endedAuctions.length}件のオークションを処理します`);

    const results = [];

    for (const auction of endedAuctions) {
      try {
        console.log(`🔵 オークション処理: ${auction.auction_id}`);

        // 2. 最高入札を取得
        const { data: highestBid, error: bidError } = await supabase
          .from('bids')
          .select('*')
          .eq('auction_id', auction.auction_id)
          .order('bid_amount', { ascending: false })
          .limit(1)
          .single();

        if (bidError || !highestBid) {
          console.log(`⚠️ 入札なし: ${auction.auction_id}`);
          // オークションを終了状態に更新
          await supabase
            .from('auctions')
            .update({ status: 'ended' })
            .eq('id', auction.auction_id);
          
          results.push({ auction_id: auction.auction_id, status: 'no_bids' });
          continue;
        }

        console.log(`🔵 最高入札: ¥${highestBid.bid_amount} by ${highestBid.user_id}`);

        // 3. 落札者の与信を決済確定（capture）
        if (highestBid.stripe_payment_intent_id) {
          try {
            console.log(`🔵 Payment Intent Capture: ${highestBid.stripe_payment_intent_id}`);
            const capturedPayment = await stripe.paymentIntents.capture(
              highestBid.stripe_payment_intent_id
            );
            console.log(`✅ 決済確定成功: ¥${capturedPayment.amount}`);

            // 4. プラットフォーム手数料計算（20%）
            const platformFee = Math.round(highestBid.bid_amount * 0.2);
            const influencerPayout = highestBid.bid_amount - platformFee;

            // 5. purchased_slotsテーブルに記録
            const { data: purchasedSlot, error: purchaseError } = await supabase
              .from('purchased_slots')
              .insert({
                call_slot_id: auction.call_slot_id,
                buyer_user_id: highestBid.user_id,
                influencer_user_id: auction.influencer_user_id,
                auction_id: auction.auction_id,
                purchased_price: highestBid.bid_amount,
                platform_fee: platformFee,
                influencer_payout: influencerPayout,
              })
              .select()
              .single();

            if (purchaseError) {
              throw purchaseError;
            }

            console.log(`✅ purchased_slots記録成功: ${purchasedSlot.id}`);

            // 6. payment_transactionsテーブルに記録
            const chargeId = capturedPayment.latest_charge 
              ? (typeof capturedPayment.latest_charge === 'string' 
                  ? capturedPayment.latest_charge 
                  : capturedPayment.latest_charge.id)
              : null;

            await supabase.from('payment_transactions').insert({
              purchased_slot_id: purchasedSlot.id,
              stripe_payment_intent_id: capturedPayment.id,
              stripe_charge_id: chargeId,
              amount: highestBid.bid_amount,
              platform_fee: platformFee,
              influencer_payout: influencerPayout,
              status: 'captured',
            });

            console.log(`✅ payment_transactions記録成功`);

            // 7. オークションを終了状態に更新
            await supabase
              .from('auctions')
              .update({ status: 'ended', winner_user_id: highestBid.user_id })
              .eq('id', auction.auction_id);

            // 8. 他の入札者の与信をキャンセル
            const { data: otherBids } = await supabase
              .from('bids')
              .select('stripe_payment_intent_id, user_id')
              .eq('auction_id', auction.auction_id)
              .neq('user_id', highestBid.user_id);

            if (otherBids && otherBids.length > 0) {
              console.log(`🔵 他の入札者の与信をキャンセル: ${otherBids.length}件`);
              for (const bid of otherBids) {
                if (bid.stripe_payment_intent_id) {
                  try {
                    await stripe.paymentIntents.cancel(bid.stripe_payment_intent_id);
                    console.log(`✅ 与信キャンセル: ${bid.stripe_payment_intent_id}`);
                  } catch (cancelError) {
                    console.warn(`⚠️ 与信キャンセル失敗（継続）: ${cancelError}`);
                  }
                }
              }
            }

            // 9. ユーザー統計を更新
            await supabase.rpc('update_user_statistics', {
              p_fan_id: highestBid.user_id,
              p_influencer_id: auction.influencer_user_id,
              p_amount: highestBid.bid_amount,
            });

            results.push({
              auction_id: auction.auction_id,
              status: 'success',
              winner_id: highestBid.user_id,
              amount: highestBid.bid_amount,
            });

            console.log(`✅ オークション終了処理完了: ${auction.auction_id}`);

          } catch (captureError: any) {
            console.error(`❌ 決済確定エラー: ${captureError.message}`);
            results.push({
              auction_id: auction.auction_id,
              status: 'capture_failed',
              error: captureError.message,
            });
          }
        }
      } catch (error: any) {
        console.error(`❌ オークション処理エラー: ${error.message}`);
        results.push({
          auction_id: auction.auction_id,
          status: 'error',
          error: error.message,
        });
      }
    }

    console.log('✅ 全オークション処理完了');

    return new Response(JSON.stringify({ 
      processed: endedAuctions.length,
      results,
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ エラー:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

