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
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
      // Supabaseでユーザー情報を取得
      let user = await getSupabaseUser(authUser.id);
      
      if (!user) {
        // 初回ログイン - デフォルトでファンとして登録
        console.log('新規ユーザー - ファンとして登録します');
        user = await registerUser(authUser);
      }
      
      setSupabaseUser(user);
      
      // ユーザータイプを判定（インフルエンサー優先）
      if (user.is_influencer) {
        setUserType('influencer');
      } else if (user.is_fan) {
        setUserType('fan');
      } else {
        setUserType(null);
      }
    } catch (error) {
      console.error('ユーザー同期エラー:', error);
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
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