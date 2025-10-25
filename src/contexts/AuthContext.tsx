import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AuthUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getUserType, registerUser, getSupabaseUser, switchToInfluencer } from '../lib/auth';
import type { User } from '../lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: User | null;
  userType: 'fan' | 'influencer' | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  switchToInfluencerMode: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'fan' | 'influencer' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 初回セッションチェック
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 初回セッションチェック:', session);
      setUser(session?.user ?? null);
      if (session?.user) {
        syncUser(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // 認証状態の変化を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 認証状態変化:', { event, session });
      setUser(session?.user ?? null);
      if (session?.user) {
        syncUser(session.user);
      } else {
        setSupabaseUser(null);
        setUserType(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUser = async (authUser: AuthUser) => {
    try {
      setIsLoading(true);
      console.log('🔄 ユーザー同期開始:', {
        authUserId: authUser.id,
        email: authUser.email,
        metadata: authUser.user_metadata
      });
      
      // Supabaseでユーザー情報を取得
      let user = await getSupabaseUser(authUser.id);
      console.log('🔍 既存ユーザー検索結果:', user);
      
      if (!user) {
        // 初回ログイン - デフォルトでファンとして登録
        console.log('🆕 新規ユーザー - ファンとして登録します');
        try {
          user = await registerUser(authUser);
          console.log('✅ ユーザー登録成功:', user);
        } catch (registerError) {
          console.error('❌ ユーザー登録エラー:', registerError);
          throw registerError;
        }
      } else {
        console.log('✅ 既存ユーザー見つかりました:', user);
      }
      
      setSupabaseUser(user);
      
      // ユーザータイプを判定（インフルエンサー優先）
      if (user.is_influencer) {
        setUserType('influencer');
        console.log('👑 インフルエンサーとして設定');
      } else if (user.is_fan) {
        setUserType('fan');
        console.log('👤 ファンとして設定');
      } else {
        setUserType(null);
        console.log('⚠️ ユーザータイプが未設定');
      }
    } catch (error) {
      console.error('❌ ユーザー同期エラー:', error);
      // エラー時はユーザー情報をクリア
      setSupabaseUser(null);
      setUserType(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    try {
      // 環境に応じたリダイレクトURLを取得
      const getRedirectUrl = () => {
        // 本番環境の場合
        if (window.location.hostname.includes('herokuapp.com')) {
          return `${window.location.origin}/`;
        }
        // ローカル開発環境
        return window.location.origin;
      };
      
      const redirectUrl = getRedirectUrl();
      console.log('🔐 Google認証開始:', {
        redirectUrl,
        hostname: window.location.hostname,
        origin: window.location.origin
      });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('❌ Google認証エラー:', error);
        throw error;
      }
      
      console.log('✅ Google認証リダイレクト開始:', data);
    } catch (error) {
      console.error('❌ Google認証処理エラー:', error);
      throw error;
    }
  };

  const switchToInfluencerMode = async () => {
    if (!user) throw new Error('ログインが必要です');
    
    try {
      const influencer = await switchToInfluencer(user);
      setSupabaseUser(influencer);
      setUserType('influencer');
    } catch (error) {
      console.error('インフルエンサー切り替えエラー:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    await syncUser(user);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user,
        supabaseUser, 
        userType, 
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        switchToInfluencerMode,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}