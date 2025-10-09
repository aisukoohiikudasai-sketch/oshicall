import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Talk from './pages/Talk';
import LiveTalk from './pages/LiveTalk';
import TalkDetail from './pages/TalkDetail';
import BidHistory from './pages/BidHistory';
import MyPage from './pages/MyPage';
import Rankings from './pages/Rankings';
import HowItWorks from './pages/HowItWorks';
import InfluencerDashboard from './pages/InfluencerDashboard';
import { AuthProvider } from './contexts/AuthContext';

type Page = 'home' | 'talk' | 'live-talk' | 'talk-detail' | 'bid-history' | 'mypage' | 'rankings' | 'how-it-works' | 'influencer-dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedTalkId, setSelectedTalkId] = useState<string | null>(null);

  // ページ遷移時にスクロール位置をリセット
  useEffect(() => {
    // ウィンドウのスクロール位置をリセット
    window.scrollTo(0, 0);
    
    // ルート要素のスクロール位置もリセット
    const rootElement = document.documentElement;
    rootElement.scrollTop = 0;
    
    // body要素のスクロール位置もリセット
    document.body.scrollTop = 0;
  }, [currentPage]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const handleTalkSelect = (talkId: string) => {
    setSelectedTalkId(talkId);
    setCurrentPage('talk-detail');
  };

  const handleTalkStart = (talkId: string) => {
    setSelectedTalkId(talkId);
    setCurrentPage('live-talk');
  };

  const handleNavigateToBidHistory = (talkId: string) => {
    setSelectedTalkId(talkId);
    setCurrentPage('bid-history');
  };
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onTalkSelect={handleTalkSelect} />;
      case 'talk':
        return <Talk onTalkStart={handleTalkStart} />;
      case 'live-talk':
        return selectedTalkId ? (
          <LiveTalk 
            talkId={selectedTalkId}
            onBack={() => setCurrentPage('talk')}
          />
        ) : null;
      case 'talk-detail':
        return selectedTalkId ? (
          <TalkDetail 
            talkId={selectedTalkId}
            onBack={() => setCurrentPage('home')}
            onNavigateToBidHistory={handleNavigateToBidHistory}
          />
        ) : null;
      case 'bid-history':
        return selectedTalkId ? (
          <BidHistory 
            talkId={selectedTalkId}
            onBack={() => setCurrentPage('talk-detail')}
          />
        ) : null;
      case 'mypage':
        return <MyPage />;
      case 'rankings':
        return <Rankings />;
      case 'how-it-works':
        return <HowItWorks />;
      case 'influencer-dashboard':
        return <InfluencerDashboard />;
      default:
        return <Home onTalkSelect={handleTalkSelect} />;
    }
  };

  return (
    <AuthProvider>
      <Layout onNavigate={handleNavigate}>
        {renderPage()}
      </Layout>
    </AuthProvider>
  );
}

export default App;