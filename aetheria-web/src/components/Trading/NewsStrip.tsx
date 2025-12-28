import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface NewsItem {
  id: string;
  headline: string;
  url: string;
  source: string;
  timestamp: number;
  coins: string[];
  impactScore: number;
  age: number;
}

const NewsStrip: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (news.length > 0) {
      const rotationInterval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % news.length);
      }, 5000); // Rotate every 5 seconds
      return () => clearInterval(rotationInterval);
    }
  }, [news.length]);

  const fetchNews = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/news/high-impact');
      setNews(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching news:', error);
      setLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'twitter': return '🐦';
      case 'telegram': return '✈️';
      case 'cryptopanic': return '📰';
      default: return '📊';
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 70) return 'text-red-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="bg-gray-800 p-3 rounded-lg mx-4 mb-4">
        <div className="animate-pulse flex items-center space-x-4">
          <div className="h-4 bg-gray-600 rounded w-1/4"></div>
          <div className="h-4 bg-gray-600 rounded w-1/2"></div>
          <div className="h-4 bg-gray-600 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="bg-gray-800 p-3 rounded-lg mx-4 mb-4 text-center text-gray-400">
        No news available
      </div>
    );
  }

  const currentNews = news[currentIndex];

  return (
    <div className="bg-gray-800 p-3 rounded-lg mx-4 mb-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getSourceIcon(currentNews.source)}</span>
          <span className={`font-bold ${getImpactColor(currentNews.impactScore)}`}>
            {currentNews.impactScore.toFixed(1)}
          </span>
        </div>
        
        <div className="flex-1 mx-4 text-center">
          <div className="text-sm font-medium text-white truncate">
            {currentNews.headline}
          </div>
          <div className="text-xs text-gray-400">
            {currentNews.age} min ago • {currentNews.coins.join(', ')}
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          {currentIndex + 1}/{news.length}
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 rounded-full transition-all duration-1000"
          style={{ width: `${((currentIndex + 1) / news.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default NewsStrip;