import React, { useEffect, useState } from 'react';
import { triggerHaptic } from '../telegram';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  type: 'market_mover' | 'narrative';
  relatedAssets: string[];
  theme?: string;
}

const IntelFeed: React.FC = () => {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/news')
      .then(res => res.json())
      .then(data => {
        setNewsData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch news:', err);
        setLoading(false);
      });
  }, []);

  const handleAssetClick = (asset: string) => {
    triggerHaptic('light');
    console.log(`Trade asset clicked: ${asset}`);
  };

  if (loading) {
    return <div className="loading-state">Loading Intel Feed...</div>;
  }

  return (
    <section className="intel-section">
      <div className="section-header">
        <h2>Intel Feed</h2>
        <div className="feed-tabs">
          <span className="feed-tab active">All</span>
          <span className="feed-tab">Movers</span>
          <span className="feed-tab">Narratives</span>
        </div>
      </div>
      <div className="news-list">
        {newsData.map((item) => (
          <div key={item.id} className="news-card">
            <div className="news-meta">
              <span className={`news-type ${item.type}`}>
                {item.type === 'market_mover' ? '🚀 Mover' : `📚 ${item.theme}`}
              </span>
              <span className="news-time">{item.time}</span>
            </div>
            <h3 className="news-title">{item.title}</h3>
            <div className="news-footer">
              <span className="news-source">{item.source}</span>
              <div className="related-assets">
                {item.relatedAssets.map(asset => (
                  <button 
                    key={asset} 
                    className="asset-action-btn"
                    onClick={() => handleAssetClick(asset)}
                  >
                    Trade {asset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default IntelFeed;
