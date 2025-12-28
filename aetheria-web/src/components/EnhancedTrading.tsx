import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTelegram } from '../hooks/useTelegram';
import './Trading.css';

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Portfolio Circle Component
const PortfolioCircle = ({ portfolio }: { portfolio: any }) => {
  const totalValue = portfolio?.totalValue || 0;
  const totalPnL = portfolio?.totalPnL || 0;
  const pnlPercent = portfolio?.pnlPercent || 0;
  
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.abs(pnlPercent) / 100, 1) * circumference;
  
  return (
    <div className="portfolio-circle">
      <svg width="200" height="200" className="portfolio-svg">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#333"
          strokeWidth="8"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={pnlPercent >= 0 ? '#00ff88' : '#ff4444'}
          strokeWidth="8"
          strokeDasharray={`${progress} ${circumference}`}
          strokeDashoffset={circumference - progress}
          transform="rotate(-90 100 100)"
          className="portfolio-progress"
        />
      </svg>
      <div className="portfolio-center">
        <div className="portfolio-value">${totalValue.toLocaleString()}</div>
        <div className={`portfolio-pnl ${pnlPercent >= 0 ? 'positive' : 'negative'}`}>
          {pnlPercent >= 0 ? '+' : ''}{totalPnL.toFixed(2)} ({pnlPercent.toFixed(2)}%)
        </div>
      </div>
    </div>
  );
};

// News Strip Component
const NewsStrip = ({ news, onTradeNews }: { news: any[], onTradeNews: (item: any) => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (news && news.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % news.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [news]);
  
  if (!news || news.length === 0) {
    return <div className="news-strip loading">Loading market news...</div>;
  }
  
  const currentNews = news[currentIndex];
  
  return (
    <div className="news-strip">
      <div className="news-content">
        <span className={`news-impact ${currentNews.impactScore > 20 ? 'high' : currentNews.impactScore > 10 ? 'medium' : 'low'}`}>
          {currentNews.impactScore > 20 ? '🔥' : currentNews.impactScore > 10 ? '⚡' : '📰'}
        </span>
        <span className="news-headline">{currentNews.headline}</span>
        <span className="news-coin">{currentNews.coin}</span>
        <span className="news-age">{currentNews.age}m ago</span>
      </div>
      <button 
        className="news-trade-btn"
        onClick={() => onTradeNews(currentNews)}
      >
        Trade
      </button>
    </div>
  );
};

// Position List Component
const PositionList = ({ positions }: { positions: any[] }) => {
  if (!positions || positions.length === 0) {
    return <div className="no-positions">No open positions</div>;
  }
  
  return (
    <div className="position-list">
      {positions.map((position: any) => (
        <div key={position.id} className="position-item">
          <div className="position-header">
            <span className="position-coin">{position.coin}</span>
            <span className={`position-side ${position.side}`}>
              {position.side.toUpperCase()}
            </span>
          </div>
          <div className="position-details">
            <div className="position-row">
              <span>Entry:</span>
              <span>${position.avgEntry.toFixed(2)}</span>
            </div>
            <div className="position-row">
              <span>Current:</span>
              <span>${position.currentPrice.toFixed(2)}</span>
            </div>
            <div className="position-row">
              <span>P&L:</span>
              <span className={position.unrealisedPnL >= 0 ? 'positive' : 'negative'}>
                ${position.unrealisedPnL.toFixed(2)} ({position.pnlPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Enhanced Trading Component
const EnhancedTrading = () => {
  const { user } = useTelegram();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');

  // WebSocket connection for real-time portfolio updates
  useEffect(() => {
    const userId = user?.id?.toString() || 'demo-user-id';
    const ws = new WebSocket(`ws://localhost:3000?userId=${userId}`);
    
    ws.onopen = () => {
      console.log('📡 WebSocket connected for portfolio updates');
      setWsConnection(ws);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'portfolio:update') {
        setPortfolio(data.data.portfolio);
      } else if (data.type === 'portfolio:initial') {
        setPortfolio(data.data);
        setLoading(false);
      }
    };
    
    ws.onclose = () => {
      console.log('📡 WebSocket disconnected');
      setWsConnection(null);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Fallback to HTTP polling
      fetchPortfolioData();
    };
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user]);

  // Fetch initial data
  const fetchPortfolioData = async () => {
    try {
      const userId = user?.id?.toString() || 'demo-user-id';
      const response = await API.get(`/portfolio/${userId}/live`);
      setPortfolio(response.data.data);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNews = async () => {
    try {
      const response = await API.get('/news/high-impact');
      setNews(response.data.data);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
    fetchNews();
  }, []);

  const handleTradeNews = (newsItem: any) => {
    // Pre-fill trade form with news coin
    setSelectedPair(`${newsItem.coin}/USDT`);
    // Scroll to trade section or open trade modal
    document.getElementById('trading-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
        <div className="loading-container">
            Loading enhanced trading platform...
            <div style={{ display: 'none' }}>
                {/* prevent unused var warning */}
                {wsConnection ? 'Connected' : 'Disconnected'}
                {selectedPair}
            </div>
        </div>
    );
  }

  return (
    <div className="enhanced-trading">
      <div style={{ display: 'none' }}>
          {/* prevent unused var warning */}
          {wsConnection ? 'Connected' : 'Disconnected'}
          {selectedPair}
      </div>
      {/* Portfolio Section */}
      <section className="portfolio-section">
        <h2>Portfolio Overview</h2>
        <PortfolioCircle portfolio={portfolio} />
        
        <div className="portfolio-stats">
          <div className="stat-item">
            <span className="stat-label">Total Invested</span>
            <span className="stat-value">${portfolio?.totalInvested.toLocaleString() || '0'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Positions</span>
            <span className="stat-value">{portfolio?.positions?.length || 0}</span>
          </div>
        </div>
        
        {portfolio?.topGainer && (
          <div className="top-movers">
            <div className="mover-item">
              <span className="mover-label">Top Gainer</span>
              <span className="mover-coin">{portfolio.topGainer.coin}</span>
              <span className="mover-change positive">+{portfolio.topGainer.pnlPercent.toFixed(2)}%</span>
            </div>
            {portfolio.topLoser && (
              <div className="mover-item">
                <span className="mover-label">Top Loser</span>
                <span className="mover-coin">{portfolio.topLoser.coin}</span>
                <span className="mover-change negative">{portfolio.topLoser.pnlPercent.toFixed(2)}%</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* News Strip */}
      <section className="news-section">
        <h3>Market News</h3>
        <NewsStrip news={news} onTradeNews={handleTradeNews} />
      </section>

      {/* Positions */}
      <section className="positions-section">
        <h3>Open Positions</h3>
        <PositionList positions={portfolio?.positions} />
      </section>

      {/* Trading Section (existing) */}
      <section id="trading-section" className="trading-section">
        {/* Include existing Trading component here */}
        <div className="trading-placeholder">
          <p>Enhanced trading interface coming soon...</p>
        </div>
      </section>
    </div>
  );
};

export default EnhancedTrading;