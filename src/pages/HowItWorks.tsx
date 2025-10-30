import React from 'react';
import { Heart, Users, Trophy, Shield, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const features = [
    {
      icon: Heart,
      title: '推しと直接話せる',
      description: 'あなたの大好きなアイドルと1対1のビデオ通話が楽しめます',
    },
    {
      icon: Users,
      title: 'オークション形式',
      description: 'フェアな入札システムで、みんなにチャンスがあります',
    },
    {
      icon: Trophy,
      title: '限定体験',
      description: '他では体験できない特別な時間をお楽しみいただけます',
    },
    {
      icon: Shield,
      title: '安心・安全',
      description: 'セキュアな環境で、プライバシーを守りながら楽しめます',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'アカウント作成',
      description: '無料でアカウントを作成して、推しトークの世界へようこそ！',
    },
    {
      step: 2,
      title: 'Talk枠を選択',
      description: 'お気に入りのアイドルのTalk枠を選んで入札しましょう',
    },
    {
      step: 3,
      title: '入札参加',
      description: 'オークション形式で入札。最高入札者が通話権を獲得！',
    },
    {
      step: 4,
      title: 'ビデオ通話',
      description: '落札した時間になったらビデオ通話で推しと楽しい時間を過ごそう',
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 rounded-full">
              <Heart className="h-16 w-16 text-white fill-current" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              推しと繋がる
            </span>
            <br />
            <span className="text-gray-800">新しい体験</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            推しトークは、あなたの大好きなアイドルとビデオ通話できる権利をオークション形式で競える
            革新的なマーケットプレイスです。特別な時間を手に入れて、推しとの距離を縮めましょう。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg transform hover:scale-105 flex items-center space-x-2">
              <span>今すぐ始める</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button className="border-2 border-pink-500 text-pink-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-pink-50 transition-all duration-200">
              Talk枠を見る
            </button>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 opacity-20">
          <Heart className="h-8 w-8 text-pink-400 fill-current animate-bounce" />
        </div>
        <div className="absolute top-32 right-16 opacity-20">
          <Heart className="h-6 w-6 text-purple-400 fill-current animate-pulse" />
        </div>
        <div className="absolute top-48 left-1/4 opacity-20">
          <Heart className="h-4 w-4 text-indigo-400 fill-current animate-bounce" style={{ animationDelay: '0.5s' }} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">推しトークの特徴</h2>
          <p className="text-xl text-gray-600">推しとの特別な時間を実現する4つの理由</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group hover:scale-105"
            >
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-full inline-block mb-6 group-hover:from-pink-600 group-hover:to-purple-700 transition-all duration-300">
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">使い方</h2>
          <p className="text-xl text-gray-600">4つの簡単なステップで推しとの通話を実現</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {howItWorks.map((step, index) => (
            <div key={index} className="text-center relative">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-2xl font-bold w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                {step.step}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
              
              {index < howItWorks.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-8">
                  <ArrowRight className="h-6 w-6 text-pink-400 mx-auto" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              500+
            </div>
            <div className="text-gray-600">登録アイドル</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              10,000+
            </div>
            <div className="text-gray-600">成立した通話</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              98%
            </div>
            <div className="text-gray-600">ユーザー満足度</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl text-white">
        <h2 className="text-4xl font-bold mb-6">今すぐ推しとの特別な時間を始めよう</h2>
        <p className="text-xl mb-8 opacity-90">
          アカウント作成は無料。あなたの推しが待っています。
        </p>
        <button className="bg-white text-pink-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-100 transition-all duration-200 shadow-lg transform hover:scale-105">
          無料で始める
        </button>
      </section>
    </div>
  );
}