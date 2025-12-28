import { useEffect, useState } from 'react'
import { initTelegramWebApp, getTelegramUser, triggerHaptic } from './telegram'
import GrowthVaults from './components/GrowthVaults'
import IntelFeed from './components/IntelFeed'
import Wallet from './components/Wallet'
import './App.css'

interface UserData {
  id?: number;
  firstName?: string;
  lastName?: string;
  username?: string;
}

type Tab = 'vaults' | 'feed' | 'wallet';

function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('vaults');
  const [isLoading, setIsLoading] = useState(true);
  const [startParam, setStartParam] = useState<string>('');

  useEffect(() => {
    // Initialize Telegram Web App
    initTelegramWebApp();

    // Get user information
    const telegramUser = getTelegramUser();
    if (telegramUser) {
      setUser({
        id: telegramUser.id,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
      });
    }

    // Handle startapp parameter for deep linking
    try {
      // @ts-ignore - Telegram WebApp types
      const initData = window.Telegram?.WebApp?.initDataUnsafe;
      if (initData?.start_param) {
        setStartParam(initData.start_param);
        console.log('Start parameter detected:', initData.start_param);
        
        // Handle specific vault deep links
        if (initData.start_param.includes('foundation')) {
          setActiveTab('vaults');
          triggerHaptic('medium');
        } else if (initData.start_param.includes('momentum')) {
          setActiveTab('vaults');
          triggerHaptic('medium');
        } else if (initData.start_param.includes('wallet')) {
          setActiveTab('wallet');
          triggerHaptic('light');
        }
      }
    } catch (error) {
      console.log('No start parameter found or error accessing Telegram API');
    }

    setIsLoading(false);
  }, []);

  const handleTabChange = (tab: Tab) => {
    triggerHaptic('light');
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="app loading">
        <div className="loader"></div>
        <p>Loading your vault...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'vaults':
        return <GrowthVaults startParam={startParam} />;
      case 'feed':
        return <IntelFeed />;
      case 'wallet':
        return <Wallet />;
      default:
        return <GrowthVaults startParam={startParam} />;
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="title">
            <span className="vault-icon">🏦</span>
            Aetheria Vault
          </h1>
          {user && (
            <div className="user-info">
              <span className="user-greeting">{user.firstName || 'Trader'}</span>
              {startParam && (
                <span className="start-param-badge">
                  🔗 {startParam}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        {renderContent()}
      </main>

      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'vaults' ? 'active' : ''}`}
          onClick={() => handleTabChange('vaults')}
        >
          <span className="nav-icon">💎</span>
          <span className="nav-label">Vaults</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => handleTabChange('feed')}
        >
          <span className="nav-icon">📰</span>
          <span className="nav-label">Intel</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => handleTabChange('wallet')}
        >
          <span className="nav-icon">👛</span>
          <span className="nav-label">Wallet</span>
        </button>
      </nav>
    </div>
  )
}

export default App
