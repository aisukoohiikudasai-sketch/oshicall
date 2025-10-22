#!/usr/bin/env node

/**
 * E2Eテスト用データクリーンアップスクリプト
 * 
 * 使用方法:
 * node scripts/e2e_test_cleanup.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

// Supabase設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase設定が不足しています');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// テスト用メールアドレス
const testEmails = ['fan@test.com', 'influencer@test.com'];

async function cleanupTestData() {
  console.log('🧹 E2Eテスト用データクリーンアップを開始します...\n');

  try {
    // 1. テストユーザーの取得
    console.log('🔍 テストユーザーを検索中...');
    const { data: testUsers, error: usersError } = await supabase
      .from('users')
      .select('auth_user_id, email')
      .in('email', testEmails);

    if (usersError) {
      console.error('❌ ユーザー検索エラー:', usersError.message);
      return;
    }

    if (!testUsers || testUsers.length === 0) {
      console.log('✅ クリーンアップ対象のテストユーザーが見つかりません');
      return;
    }

    console.log(`📋 見つかったテストユーザー: ${testUsers.length}件`);

    // 2. 関連データの削除
    const authUserIds = testUsers.map(user => user.auth_user_id);

    // 通話枠の削除
    console.log('🗑️  通話枠を削除中...');
    const { error: slotsError } = await supabase
      .from('call_slots')
      .delete()
      .in('influencer_id', authUserIds);

    if (slotsError) {
      console.log('⚠️  通話枠削除エラー（無視可能）:', slotsError.message);
    } else {
      console.log('✅ 通話枠削除完了');
    }

    // 入札の削除
    console.log('🗑️  入札を削除中...');
    const { error: bidsError } = await supabase
      .from('bids')
      .delete()
      .in('fan_id', authUserIds);

    if (bidsError) {
      console.log('⚠️  入札削除エラー（無視可能）:', bidsError.message);
    } else {
      console.log('✅ 入札削除完了');
    }

    // 支払いの削除
    console.log('🗑️  支払い情報を削除中...');
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .in('fan_id', authUserIds);

    if (paymentsError) {
      console.log('⚠️  支払い削除エラー（無視可能）:', paymentsError.message);
    } else {
      console.log('✅ 支払い削除完了');
    }

    // 3. ユーザープロフィールの削除
    console.log('🗑️  ユーザープロフィールを削除中...');
    const { error: profilesError } = await supabase
      .from('users')
      .delete()
      .in('auth_user_id', authUserIds);

    if (profilesError) {
      console.error('❌ プロフィール削除エラー:', profilesError.message);
      return;
    }

    console.log('✅ ユーザープロフィール削除完了');

    // 4. Authユーザーの削除
    console.log('🗑️  Authユーザーを削除中...');
    for (const authUserId of authUserIds) {
      const { error: authError } = await supabase.auth.admin.deleteUser(authUserId);
      if (authError) {
        console.log(`⚠️  Authユーザー削除エラー（無視可能）: ${authUserId}`, authError.message);
      }
    }

    console.log('✅ Authユーザー削除完了');

    // 5. 結果表示
    console.log('\n🎉 E2Eテスト用データクリーンアップ完了！\n');
    console.log('削除されたデータ:');
    console.log('- テストユーザーアカウント');
    console.log('- 通話枠');
    console.log('- 入札情報');
    console.log('- 支払い情報');
    console.log('- ユーザープロフィール');

  } catch (error) {
    console.error('❌ クリーンアップエラー:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
cleanupTestData();

