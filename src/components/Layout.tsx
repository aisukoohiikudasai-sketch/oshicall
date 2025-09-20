import React, { useEffect } from 'react';
import { Heart, User, Crown, Calendar, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate?: (page: string) => void;
}

export default function Layout({ children, onNavigate }: LayoutProps) {
  const { user, signOut } = useAuth();

  // ページ遷移時にスクロール位置をリセット
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTop = 0;
    }
  }, [children]);

  const navItems = [
    { id: 'home', label: 'ホーム', icon: Calendar },
    { id: 'talk', label: 'Talk', icon: Video },
    { id: 'rankings', label: 'ランキング', icon: Crown },
    { id: 'mypage', label: 'マイページ', icon: User },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 flex flex-col">
      {/* Fixed Header */}
      <header className="bg-white fixed top-0 left-0 right-0 z-50 h-12 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <button 
              onClick={() => onNavigate?.('home')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
            >
              <Heart className="h-8 w-8 text-pink-500 fill-current" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                OshiCall
              </h1>
            </button>
            
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-pink-600 transition-colors duration-200 font-medium"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {user.avatar_url && (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-700">{user.username}</span>
                  </div>
                  <button
                    onClick={signOut}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <button className="px-4 py-2 text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors">
                    ログイン
                  </button>
                  <button className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-md">
                    新規登録
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Fixed Footer (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 h-12 flex-shrink-0">
        <div className="flex justify-evenly h-full">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className="flex flex-col items-center justify-center text-gray-600 hover:text-pink-600 transition-colors duration-200 flex-1"
            >
              <item.icon className="h-4 w-4 mb-0.5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Body Content Area */}
      <main className="flex-1 overflow-y-auto pt-12 pb-12 md:pb-0">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}