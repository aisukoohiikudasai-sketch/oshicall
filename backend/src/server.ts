import express, { Request, Response } from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Stripe初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Supabase初期化（Service Role Key使用）
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
app.use(express.json());

// ============================================
// Stripe Customer作成
// ============================================
app.post('/api/stripe/create-customer', async (req: Request, res: Response) => {
  try {
    const { email, name, clerkUserId } = req.body;
    
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { clerk_user_id: clerkUserId },
    });
    
    // SupabaseのFansテーブルを更新
    await supabase
      .from('fans')
      .update({ stripe_customer_id: customer.id })
      .eq('clerk_user_id', clerkUserId);
    
    res.json({ customerId: customer.id });
  } catch (error: any) {
    console.error('Customer作成エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SetupIntent作成（カード登録用）
// ============================================
app.post('/api/stripe/create-setup-intent', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;
    
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // オフセッション決済を許可
    });
    
    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error: any) {
    console.error('SetupIntent作成エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// カード登録完了後の処理
// ============================================
app.post('/api/stripe/confirm-payment-method', async (req: Request, res: Response) => {
  try {
    const { fanClerkUserId } = req.body;
    
    // Fansテーブルを更新
    await supabase
      .from('fans')
      .update({ has_payment_method: true })
      .eq('clerk_user_id', fanClerkUserId);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('カード登録確認エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 与信確保（入札時）
// ============================================
app.post('/api/stripe/authorize-payment', async (req: Request, res: Response) => {
  try {
    const { amount, customerId, auctionId } = req.body;
    
    // 顧客のデフォルト支払い方法を取得
    const customer = await stripe.customers.retrieve(customerId);
    
    if (!customer || customer.deleted) {
      throw new Error('顧客が見つかりません');
    }
    
    const defaultPaymentMethod = (customer as Stripe.Customer).invoice_settings?.default_payment_method;
    
    if (!defaultPaymentMethod) {
      throw new Error('支払い方法が登録されていません');
    }
    
    // PaymentIntentを作成（手動キャプチャ）
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // 円単位で送られてくる想定
      currency: 'jpy',
      customer: customerId,
      payment_method: defaultPaymentMethod as string,
      capture_method: 'manual', // 手動キャプチャ（与信のみ）
      confirm: true, // 即座に確認
      off_session: true, // オフセッション決済
      metadata: {
        auction_id: auctionId,
      },
    });
    
    res.json({ 
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });
  } catch (error: any) {
    console.error('与信確保エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 以前の与信をキャンセル
// ============================================
app.post('/api/stripe/cancel-authorization', async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    
    res.json({ success: true, status: paymentIntent.status });
  } catch (error: any) {
    console.error('与信キャンセルエラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 決済確定（落札時）
// ============================================
app.post('/api/stripe/capture-payment', async (req: Request, res: Response) => {
  try {
    const { paymentIntentId, auctionId } = req.body;
    
    // オークション終了処理
    const { data: auctionResult, error: auctionError } = await supabase.rpc(
      'finalize_auction',
      { p_auction_id: auctionId }
    );
    
    if (auctionError) throw auctionError;
    
    if (!auctionResult || auctionResult.length === 0) {
      throw new Error('落札者がいません');
    }
    
    const { winner_fan_id, winning_amount } = auctionResult[0];
    
    // PaymentIntentをキャプチャ
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    
    // purchased_slotsを取得
    const { data: purchasedSlot } = await supabase
      .from('purchased_slots')
      .select('*')
      .eq('auction_id', auctionId)
      .single();
    
    if (!purchasedSlot) throw new Error('購入レコードが見つかりません');
    
    // payment_transactionsに記録
    await supabase.from('payment_transactions').insert({
      purchased_slot_id: purchasedSlot.id,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: paymentIntent.charges.data[0]?.id,
      amount: winning_amount,
      platform_fee: purchasedSlot.platform_fee,
      influencer_payout: purchasedSlot.influencer_payout,
      status: 'captured',
    });
    
    // インフルエンサーへの送金（Stripe Connect使用）
    const { data: influencer } = await supabase
      .from('influencers')
      .select('stripe_account_id')
      .eq('id', purchasedSlot.influencer_id)
      .single();
    
    if (influencer?.stripe_account_id) {
      const transfer = await stripe.transfers.create({
        amount: Math.round(purchasedSlot.influencer_payout),
        currency: 'jpy',
        destination: influencer.stripe_account_id,
        transfer_group: auctionId,
      });
      
      // Transferを記録
      await supabase
        .from('payment_transactions')
        .update({ stripe_transfer_id: transfer.id })
        .eq('stripe_payment_intent_id', paymentIntent.id);
    }
    
    // 統計情報更新
    await supabase.rpc('update_user_statistics', {
      p_fan_id: winner_fan_id,
      p_influencer_id: purchasedSlot.influencer_id,
      p_amount: winning_amount,
    });
    
    res.json({ 
      success: true, 
      paymentIntent,
      purchasedSlotId: purchasedSlot.id,
    });
  } catch (error: any) {
    console.error('決済確定エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Stripe Connect Account作成（インフルエンサー用）
// ============================================
app.post('/api/stripe/create-connect-account', async (req: Request, res: Response) => {
  try {
    const { email, clerkUserId } = req.body;
    
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        clerk_user_id: clerkUserId,
      },
    });
    
    // Supabaseを更新
    await supabase
      .from('influencers')
      .update({ stripe_account_id: account.id })
      .eq('clerk_user_id', clerkUserId);
    
    // オンボーディングリンクを作成
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/influencer/settings`,
      return_url: `${process.env.FRONTEND_URL}/influencer/dashboard`,
      type: 'account_onboarding',
    });
    
    res.json({ 
      accountId: account.id,
      onboardingUrl: accountLink.url,
    });
  } catch (error: any) {
    console.error('Connect Account作成エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Webhook受信（Stripeイベント処理）
// ============================================
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        // 決済成功時の処理
        console.log('PaymentIntent成功:', event.data.object.id);
        break;
        
      case 'payment_intent.payment_failed':
        // 決済失敗時の処理
        console.log('PaymentIntent失敗:', event.data.object.id);
        await supabase
          .from('payment_transactions')
          .update({ 
            status: 'failed',
            error_message: (event.data.object as any).last_payment_error?.message,
          })
          .eq('stripe_payment_intent_id', event.data.object.id);
        break;
        
      case 'account.updated':
        // Connectアカウント更新時
        const account = event.data.object as Stripe.Account;
        if (account.charges_enabled && account.payouts_enabled) {
          await supabase
            .from('influencers')
            .update({ is_verified: true })
            .eq('stripe_account_id', account.id);
        }
        break;
    }
    
    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook処理エラー:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// ============================================
// ヘルスチェック
// ============================================
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


