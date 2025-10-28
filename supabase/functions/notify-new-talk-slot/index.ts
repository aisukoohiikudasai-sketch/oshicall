// Supabase Edge Function: 新規Talk枠のフォロワー通知
// Trigger: call_slotsテーブルにINSERTされた時

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@3.0.0';
import { generateNewTalkSlotEmail, generateNewTalkSlotEmailPlainText } from '../_shared/email-templates.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const resend = new Resend(Deno.env.get('RESEND_API_KEY') || '');
const appUrl = Deno.env.get('APP_URL') || 'https://oshicall-2936440db16b.herokuapp.com';
const fromEmail = Deno.env.get('FROM_EMAIL') || 'OshiCall <noreply@oshicall.com>';

interface CallSlotPayload {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  scheduled_start_time: string;
  duration_minutes: number;
  starting_price: number;
  is_published: boolean;
}

serve(async (req) => {
  // CORSヘッダーとOPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    console.log('📧 新規Talk枠通知処理開始');
    console.log('📧 リクエストメソッド:', req.method);
    console.log('📧 リクエストURL:', req.url);

    const payload = await req.json();
    const callSlot: CallSlotPayload = payload.record;

    // 公開されていない場合はスキップ
    if (!callSlot.is_published) {
      console.log('⏭️  非公開のため通知スキップ');
      return new Response(JSON.stringify({ message: '非公開のため通知スキップ' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // インフルエンサー情報を取得
    const { data: influencer, error: influencerError } = await supabase
      .from('users')
      .select('display_name, profile_image_url')
      .eq('id', callSlot.user_id)
      .single();

    if (influencerError || !influencer) {
      throw new Error(`インフルエンサー情報取得エラー: ${influencerError?.message}`);
    }

    console.log(`📧 インフルエンサー: ${influencer.display_name}`);

    // フォロワーリストを取得
    const { data: followers, error: followersError } = await supabase
      .from('follows')
      .select(`
        follower_id,
        users!follows_follower_id_fkey(email, display_name)
      `)
      .eq('following_id', callSlot.user_id);

    if (followersError) {
      throw new Error(`フォロワー取得エラー: ${followersError.message}`);
    }

    if (!followers || followers.length === 0) {
      console.log('⏭️  フォロワーがいないため通知スキップ');
      return new Response(JSON.stringify({ message: 'フォロワーがいないため通知スキップ' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`📧 ${followers.length}人のフォロワーに通知送信`);

    // オークション情報を取得
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('end_time')
      .eq('call_slot_id', callSlot.id)
      .single();

    if (auctionError) {
      console.warn(`⚠️  オークション情報取得エラー: ${auctionError.message}`);
    }

    // 日時データの準備
    const talkDate = new Date(callSlot.scheduled_start_time);
    const auctionEndDate = auction ? new Date(auction.end_time) : new Date(talkDate.getTime() - 24 * 60 * 60 * 1000);

    const emailData = {
      influencerName: influencer.display_name || 'インフルエンサー',
      influencerImage: influencer.profile_image_url,
      talkTitle: callSlot.title,
      talkDescription: callSlot.description || undefined,
      talkDate: talkDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      }),
      talkTime: talkDate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      talkDuration: callSlot.duration_minutes,
      startingPrice: callSlot.starting_price,
      auctionEndDate: auctionEndDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      }),
      auctionEndTime: auctionEndDate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      appUrl,
      talkSlotId: callSlot.id,
    };

    // フォロワーごとにメール送信
    const results = [];
    for (const follower of followers) {
      const followerUser = follower.users as any;

      if (!followerUser?.email) {
        console.warn(`⚠️  フォロワー ${follower.follower_id} のメールアドレスが見つかりません`);
        continue;
      }

      try {
        const followerEmailData = {
          ...emailData,
          followerName: followerUser.display_name || 'お客様',
        };

        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: followerUser.email,
          subject: `✨ ${influencer.display_name}さんの新しいTalk枠が公開されました！`,
          html: generateNewTalkSlotEmail(followerEmailData),
          text: generateNewTalkSlotEmailPlainText(followerEmailData),
        });

        if (emailError) {
          console.error(`❌ メール送信エラー (${followerUser.email}):`, emailError);
          results.push({
            email: followerUser.email,
            status: 'error',
            error: emailError.message,
          });
        } else {
          console.log(`✅ メール送信成功 (${followerUser.email}): ${emailResult?.id}`);
          results.push({
            email: followerUser.email,
            status: 'success',
            messageId: emailResult?.id,
          });
        }
      } catch (error: any) {
        console.error(`❌ メール送信エラー (${followerUser.email}):`, error);
        results.push({
          email: followerUser.email,
          status: 'error',
          error: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`✅ 通知処理完了: 成功 ${successCount}件, 失敗 ${errorCount}件`);

    return new Response(JSON.stringify({
      message: `通知処理完了`,
      totalFollowers: followers.length,
      successCount,
      errorCount,
      results,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: any) {
    console.error('❌ エラー:', error);
    console.error('❌ エラースタック:', error.stack);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
