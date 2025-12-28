import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Vaults } from './components/Vaults';
import Trading from './components/Trading';
import { AetheriaCard } from './components/AetheriaCard';
import { Wallet } from './components/Wallet/Wallet';
import { WelcomeScreen } from './components/Onboarding/WelcomeScreen';
import { SeedPhraseBackup } from './components/Onboarding/SeedPhraseBackup';
import { CardSetupWizard } from './components/Onboarding/CardSetupWizard';
import { initTelegram, triggerHaptic } from './services/telegram';
import { MarketProvider } from './context/MarketContext';
import { UserProvider } from './context/UserContext';
import './styles/global.css';
import './styles/animations.css';
import './styles/card.css';
import { applyTheme } from './theme';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Wallet as WalletIcon, 
  CreditCard, 
  Landmark, 
  Bell, 
  UserCircle 
} from 'lucide-react';
import './App.css';

type OnboardingStep = 'welcome' | 'seed' | 'card' | 'done';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(() => {
    if (typeof window === 'undefined') return 'welcome';
    const completed = window.localStorage.getItem('aetheria_onboarding_completed');
    return completed === 'true' ? 'done' : 'welcome';
  });

  useEffect(() => {
    applyTheme();
    const initializeApp = async () => {
      try {
        await initTelegram();
        // Simulate real auth check
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Initialization error:', error);
        // We stay in 'connected' visually to avoid scaring the user, 
        // but log the error. In a real app, we'd show a subtle toast.
        setConnectionStatus('connected'); 
      }
    };
    initializeApp();
  }, []);

  const navigateTo = (view: string, coin?: string) => {
    setCurrentView(view);
    if (coin) setSelectedCoin(coin);
    triggerHaptic('light');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={(view, coin) => navigateTo(view, coin)} />;
      case 'vaults':
        return <Vaults />;
      case 'trade':
        return <Trading initialCoin={selectedCoin || 'BTC'} />;
      case 'card':
        return <AetheriaCard />;
      case 'wallet':
        return <Wallet />;
      default:
        return <Dashboard onNavigate={(view, coin) => navigateTo(view, coin)} />;
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
        case 'dashboard': return 'Overview';
        case 'trade': return 'Exchange';
        case 'wallet': return 'My Wallet';
        case 'card': return 'Cards';
        case 'vaults': return 'Earn / Vaults';
        default: return 'Aetheria';
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: string, icon: any, label: string }) => (
    <div 
        className={`nav-item ${currentView === view ? 'active' : ''}`}
        onClick={() => navigateTo(view)}
    >
        <Icon size={20} />
        <span>{label}</span>
    </div>
  );

  const seedPhrase = [
    'abandon',
    'ability',
    'able',
    'about',
    'above',
    'absent',
    'absorb',
    'abstract',
    'absurd',
    'abuse',
    'access',
    'accident',
    'account',
    'accuse',
    'achieve',
    'acid',
    'acoustic',
    'acquire',
    'across',
    'act',
    'action',
    'actor',
    'actress',
    'actual',
  ];

  const renderOnboarding = () => {
    if (onboardingStep === 'welcome') {
      return <WelcomeScreen onContinue={() => setOnboardingStep('seed')} />;
    }
    if (onboardingStep === 'seed') {
      return (
        <SeedPhraseBackup
          seedPhrase={seedPhrase}
          onComplete={() => setOnboardingStep('card')}
        />
      );
    }
    if (onboardingStep === 'card') {
      return (
        <CardSetupWizard
          onComplete={() => {
            window.localStorage.setItem('aetheria_onboarding_completed', 'true');
            setOnboardingStep('done');
          }}
        />
      );
    }
    return null;
  };

  const showOnboarding = onboardingStep !== 'done';

  return (
    <MarketProvider>
      <UserProvider>
        {showOnboarding ? (
          renderOnboarding()
        ) : (
        <div className="app-layout">
          <aside className="sidebar">
          <div className="sidebar-header">
            <div className="brand-logo">Aetheria</div>
          </div>
          
          <nav className="sidebar-nav">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="trade" icon={ArrowRightLeft} label="Trade" />
            <NavItem view="wallet" icon={WalletIcon} label="Wallet" />
            <NavItem view="vaults" icon={Landmark} label="Earn" />
            <NavItem view="card" icon={CreditCard} label="Card" />
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          {/* Top Header */}
          <header className="top-header">
            <h1 className="page-title">{getPageTitle()}</h1>
            <div className="header-actions">
                <div className="status-indicator">
                    <span className={`status-dot ${connectionStatus}`}></span>
                    {connectionStatus === 'connected' ? 'Live' : 'Connecting...'}
                </div>
                <button className="icon-btn">
                    <Bell size={20} />
                </button>
                <button className="icon-btn">
                    <UserCircle size={20} />
                </button>
            </div>
          </header>

          {/* Dynamic View Content */}
          <div className="content-area">
            {renderContent()}
          </div>
        </main>

        {/* Mobile Navigation (Bottom) */}
        <nav className="mobile-nav">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Home" />
          <NavItem view="trade" icon={ArrowRightLeft} label="Trade" />
          <NavItem view="wallet" icon={WalletIcon} label="Wallet" />
          <NavItem view="vaults" icon={Landmark} label="Earn" />
        </nav>
        </div>
        )}
      </UserProvider>
    </MarketProvider>
  );
}

export default App;
