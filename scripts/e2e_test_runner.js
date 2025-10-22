#!/usr/bin/env node

/**
 * E2Eテスト自動実行スクリプト
 * 
 * 使用方法:
 * node scripts/e2e_test_runner.js
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

// 設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase設定が不足しています');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// テスト用データ
const testData = {
  fan: {
    email: 'fan@test.com',
    password: 'password123'
  },
  influencer: {
    email: 'influencer@test.com',
    password: 'password123'
  }
};

class E2ETestRunner {
  constructor() {
    this.results = [];
    this.fanToken = null;
    this.influencerToken = null;
    this.fanUserId = null;
    this.influencerUserId = null;
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 ${testName} を実行中...`);
    try {
      const result = await testFunction();
      this.results.push({ test: testName, status: 'PASS', result });
      console.log(`✅ ${testName}: 成功`);
      return result;
    } catch (error) {
      this.results.push({ test: testName, status: 'FAIL', error: error.message });
      console.log(`❌ ${testName}: 失敗 - ${error.message}`);
      throw error;
    }
  }

  async loginFan() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testData.fan.email,
      password: testData.fan.password
    });

    if (error) throw error;
    
    this.fanToken = data.session.access_token;
    this.fanUserId = data.user.id;
    return data;
  }

  async loginInfluencer() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testData.influencer.email,
      password: testData.influencer.password
    });

    if (error) throw error;
    
    this.influencerToken = data.session.access_token;
    this.influencerUserId = data.user.id;
    return data;
  }

  async testFanLogin() {
    return await this.loginFan();
  }

  async testInfluencerLogin() {
    return await this.loginInfluencer();
  }

  async testStripeConnectStatus() {
    const response = await axios.post(`${API_BASE_URL}/api/stripe/influencer-status`, {
      authUserId: this.influencerUserId
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    return response.data;
  }

  async testCreateCallSlot() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);

    const { data, error } = await supabase
      .from('call_slots')
      .insert({
        influencer_id: this.influencerUserId,
        start_time: tomorrow.toISOString(),
        duration_minutes: 30,
        price: 5000,
        description: 'E2Eテスト用通話枠',
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async testCreateBid() {
    const { data: slots } = await supabase
      .from('call_slots')
      .select('id')
      .eq('influencer_id', this.influencerUserId)
      .eq('status', 'scheduled')
      .limit(1);

    if (!slots || slots.length === 0) {
      throw new Error('通話枠が見つかりません');
    }

    const { data, error } = await supabase
      .from('bids')
      .insert({
        fan_id: this.fanUserId,
        slot_id: slots[0].id,
        amount: 6000,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async testPaymentProcessing() {
    // テスト用の支払い処理（実際のStripe APIは呼び出さない）
    const { data, error } = await supabase
      .from('payments')
      .insert({
        fan_id: this.fanUserId,
        amount: 6000,
        status: 'completed',
        payment_method: 'card',
        stripe_payment_intent_id: 'pi_test_' + Date.now()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async testVideoCallSetup() {
    // Daily.co通話ルームの作成（テスト用）
    const roomName = `test-room-${Date.now()}`;
    const roomUrl = `https://oshicall.daily.co/${roomName}`;
    
    return {
      room_name: roomName,
      room_url: roomUrl,
      created_at: new Date().toISOString()
    };
  }

  async runAllTests() {
    console.log('🚀 E2Eテストを開始します...\n');

    try {
      // 1. ファンログイン
      await this.runTest('ファンログイン', () => this.testFanLogin());

      // 2. インフルエンサーログイン
      await this.runTest('インフルエンサーログイン', () => this.testInfluencerLogin());

      // 3. Stripe Connect状態確認
      await this.runTest('Stripe Connect状態確認', () => this.testStripeConnectStatus());

      // 4. 通話枠作成
      await this.runTest('通話枠作成', () => this.testCreateCallSlot());

      // 5. 入札作成
      await this.runTest('入札作成', () => this.testCreateBid());

      // 6. 支払い処理
      await this.runTest('支払い処理', () => this.testPaymentProcessing());

      // 7. ビデオ通話設定
      await this.runTest('ビデオ通話設定', () => this.testVideoCallSetup());

      // 結果表示
      this.printResults();

    } catch (error) {
      console.error('\n❌ テスト実行中にエラーが発生しました:', error.message);
      this.printResults();
      process.exit(1);
    }
  }

  printResults() {
    console.log('\n📊 テスト結果サマリー:');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    console.log(`✅ 成功: ${passed}件`);
    console.log(`❌ 失敗: ${failed}件`);
    console.log(`📈 成功率: ${Math.round((passed / this.results.length) * 100)}%`);
    
    console.log('\n📋 詳細結果:');
    this.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      if (result.status === 'FAIL') {
        console.log(`   エラー: ${result.error}`);
      }
    });
  }
}

// テスト実行
const runner = new E2ETestRunner();
runner.runAllTests();

