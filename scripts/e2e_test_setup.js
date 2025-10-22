#!/usr/bin/env node

/**
 * E2Eテスト用データセットアップスクリプト
 * 
 * 使用方法:
 * node scripts/e2e_test_setup.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

// Supabase設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase設定が不足しています');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// テスト用データ
const testData = {
  fan: {
    email: 'fan@test.com',
    password: 'password123',
    name: 'テストファン',
    is_influencer: false
  },
  influencer: {
    email: 'influencer@test.com',
    password: 'password123',
    name: 'テストインフルエンサー',
    is_influencer: true
  }
};

async function setupTestData() {
  console.log('🧪 E2Eテスト用データセットアップを開始します...\n');

  try {
    // 1. 既存のテストデータをクリーンアップ
    console.log('🧹 既存のテストデータをクリーンアップ中...');
    
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .in('email', [testData.fan.email, testData.influencer.email]);
    
    if (deleteError) {
      console.log('⚠️  クリーンアップエラー（無視可能）:', deleteError.message);
    } else {
      console.log('✅ クリーンアップ完了');
    }

    // 2. ファンアカウント作成
    console.log('\n👤 ファンアカウントを作成中...');
    const { data: fanUser, error: fanError } = await supabase.auth.admin.createUser({
      email: testData.fan.email,
      password: testData.fan.password,
      email_confirm: true
    });

    if (fanError) {
      console.error('❌ ファンアカウント作成エラー:', fanError.message);
      return;
    }

    const { error: fanProfileError } = await supabase
      .from('users')
      .insert({
        auth_user_id: fanUser.user.id,
        email: testData.fan.email,
        name: testData.fan.name,
        is_influencer: testData.fan.is_influencer,
        total_spent: 0,
        total_calls_purchased: 0
      });

    if (fanProfileError) {
      console.error('❌ ファンプロフィール作成エラー:', fanProfileError.message);
      return;
    }

    console.log('✅ ファンアカウント作成完了:', fanUser.user.email);

    // 3. インフルエンサーアカウント作成
    console.log('\n🌟 インフルエンサーアカウントを作成中...');
    const { data: influencerUser, error: influencerError } = await supabase.auth.admin.createUser({
      email: testData.influencer.email,
      password: testData.influencer.password,
      email_confirm: true
    });

    if (influencerError) {
      console.error('❌ インフルエンサーアカウント作成エラー:', influencerError.message);
      return;
    }

    const { error: influencerProfileError } = await supabase
      .from('users')
      .insert({
        auth_user_id: influencerUser.user.id,
        email: testData.influencer.email,
        name: testData.influencer.name,
        is_influencer: testData.influencer.is_influencer,
        total_earnings: 0,
        total_calls_completed: 0,
        average_rating: 0,
        is_verified: false
      });

    if (influencerProfileError) {
      console.error('❌ インフルエンサープロフィール作成エラー:', influencerProfileError.message);
      return;
    }

    console.log('✅ インフルエンサーアカウント作成完了:', influencerUser.user.email);

    // 4. テスト用通話枠を作成
    console.log('\n📅 テスト用通話枠を作成中...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);

    const { error: slotError } = await supabase
      .from('call_slots')
      .insert({
        influencer_id: influencerUser.user.id,
        start_time: tomorrow.toISOString(),
        duration_minutes: 30,
        price: 5000,
        description: 'E2Eテスト用通話枠',
        status: 'scheduled'
      });

    if (slotError) {
      console.error('❌ 通話枠作成エラー:', slotError.message);
      return;
    }

    console.log('✅ テスト用通話枠作成完了');

    // 5. 結果表示
    console.log('\n🎉 E2Eテスト用データセットアップ完了！\n');
    console.log('📋 テストアカウント情報:');
    console.log(`👤 ファン: ${testData.fan.email} / ${testData.fan.password}`);
    console.log(`🌟 インフルエンサー: ${testData.influencer.email} / ${testData.influencer.password}`);
    console.log('\n次のステップ:');
    console.log('1. ブラウザで http://localhost:5173 にアクセス');
    console.log('2. 上記のアカウントでログイン');
    console.log('3. E2Eテスト手順書に従ってテストを実行');

  } catch (error) {
    console.error('❌ セットアップエラー:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
setupTestData();