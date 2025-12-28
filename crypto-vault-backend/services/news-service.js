const axios = require('axios');

class NewsService {
  constructor() {
    this.newsCache = new Map();
    this.impactScores = new Map();
    this.lastUpdate = 0;
    
    // Top coins to track
    this.trackedCoins = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'MATIC', 'LTC', 'TON', 'BNB'];
    
    // Sentiment keywords
    this.bullishKeywords = ['bullish', 'pump', 'moon', 'buy', 'green', 'up', 'surge', 'rally', 'breakout', 'bull run'];
    this.bearishKeywords = ['bearish', 'dump', 'crash', 'sell', 'red', 'down', 'drop', 'decline', 'correction', 'bear market'];
    
    this.startNewsFetching();
  }

  startNewsFetching() {
    // Fetch news every 5 minutes
    this.fetchNews();
    setInterval(() => this.fetchNews(), 5 * 60 * 1000);
  }

  async fetchNews() {
    try {
      // CryptoPanic API (free tier: 5 req/min)
      const cryptoPanicNews = await this.fetchCryptoPanicNews();
      
      // Twitter sentiment (simplified - in production use Twitter API v2)
      const twitterNews = await this.fetchTwitterSentiment();
      
      // Telegram channels (mock data for now)
      const telegramNews = await this.fetchTelegramNews();
      
      // Combine and process news
      const allNews = [...cryptoPanicNews, ...twitterNews, ...telegramNews];
      this.processNews(allNews);
      
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  }

  async fetchCryptoPanicNews() {
    try {
      const response = await axios.get('https://cryptopanic.com/api/posts/', {
        params: {
          auth_token: process.env.CRYPTOPANIC_API_KEY || 'demo',
          public: 'true',
          currencies: this.trackedCoins.join(',')
        },
        timeout: 10000
      });

      return response.data.results.map(post => ({
        id: post.id,
        headline: post.title,
        url: post.url,
        source: 'cryptopanic',
        timestamp: new Date(post.published_at).getTime(),
        coins: post.currencies?.map(c => c.code) || [],
        likes: post.votes?.positive || 0,
        retweets: 0
      }));
    } catch (error) {
      console.warn('CryptoPanic API error, using mock data');
      return this.generateMockCryptoPanicNews();
    }
  }

  generateMockCryptoPanicNews() {
    const mockHeadlines = [
      { text: 'Bitcoin breaks $95k resistance level', coins: ['BTC'], sentiment: 'bullish' },
      { text: 'Ethereum 2.0 staking rewards reach new highs', coins: ['ETH'], sentiment: 'bullish' },
      { text: 'Solana network experiences temporary congestion', coins: ['SOL'], sentiment: 'bearish' },
      { text: 'XRP wins regulatory clarity in major market', coins: ['XRP'], sentiment: 'bullish' },
      { text: 'Dogecoin whale activity increases 300%', coins: ['DOGE'], sentiment: 'bullish' }
    ];

    return mockHeadlines.map((item, index) => ({
      id: `mock-${index}`,
      headline: item.text,
      url: '#',
      source: 'cryptopanic',
      timestamp: Date.now() - Math.random() * 300000, // Within last 5 minutes
      coins: item.coins,
      likes: Math.floor(Math.random() * 100) + 10,
      retweets: Math.floor(Math.random() * 50)
    }));
  }

  async fetchTwitterSentiment() {
    // Mock Twitter data - in production, use Twitter API v2
    const mockTweets = [
      { text: 'BTC to the moon! 🚀 #Bitcoin #BTC', coins: ['BTC'], likes: 150, retweets: 45 },
      { text: 'ETH looking strong, next target $4k #Ethereum', coins: ['ETH'], likes: 89, retweets: 23 },
      { text: 'SOL correction incoming, be careful #Solana', coins: ['SOL'], likes: 67, retweets: 34 }
    ];

    return mockTweets.map((tweet, index) => ({
      id: `twitter-${index}`,
      headline: tweet.text,
      url: '#',
      source: 'twitter',
      timestamp: Date.now() - Math.random() * 180000, // Within last 3 minutes
      coins: tweet.coins,
      likes: tweet.likes,
      retweets: tweet.retweets
    }));
  }

  async fetchTelegramNews() {
    // Mock Telegram channel data
    const mockTelegram = [
      { text: '📢 Cointelegraph: Bitcoin ETF sees record inflows', coins: ['BTC'], likes: 200 },
      { text: '📢 CoinDesk: Ethereum gas fees drop to yearly lows', coins: ['ETH'], likes: 120 }
    ];

    return mockTelegram.map((item, index) => ({
      id: `telegram-${index}`,
      headline: item.text,
      url: '#',
      source: 'telegram',
      timestamp: Date.now() - Math.random() * 60000, // Within last minute
      coins: item.coins,
      likes: item.likes,
      retweets: 0
    }));
  }

  processNews(newsItems) {
    const now = Date.now();
    const recentNews = newsItems.filter(item => now - item.timestamp < 30 * 60 * 1000); // Last 30 minutes

    recentNews.forEach(item => {
      const impactScore = this.calculateImpactScore(item);
      
      item.coins.forEach(coin => {
        if (this.trackedCoins.includes(coin)) {
          const key = `${coin}-${item.id}`;
          this.newsCache.set(key, {
            ...item,
            coin,
            impactScore,
            age: Math.floor((now - item.timestamp) / 60000) // Age in minutes
          });
        }
      });
    });

    // Clean up old news
    this.cleanupOldNews();
  }

  calculateImpactScore(item) {
    // Simple impact algorithm
    let impact = 0;

    // Social engagement
    impact += item.likes * 0.3;
    impact += item.retweets * 0.5;

    // Sentiment analysis
    const text = item.headline.toLowerCase();
    const bullishCount = this.bullishKeywords.filter(keyword => text.includes(keyword)).length;
    const bearishCount = this.bearishKeywords.filter(keyword => text.includes(keyword)).length;
    
    impact += bullishCount * 2;
    impact -= bearishCount * 2;

    // Source weight
    const sourceWeights = { cryptopanic: 1.5, twitter: 1.2, telegram: 1.0 };
    impact *= sourceWeights[item.source] || 1.0;

    // Age penalty (older news has less impact)
    const ageMinutes = (Date.now() - item.timestamp) / 60000;
    if (ageMinutes > 15) {
      impact *= 0.8; // Reduce impact by 20% after 15 minutes
    }

    return Math.round(impact * 10) / 10; // Round to 1 decimal
  }

  cleanupOldNews() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [key, news] of this.newsCache.entries()) {
      if (now - news.timestamp > maxAge) {
        this.newsCache.delete(key);
      }
    }
  }

  // Get news for specific coins
  getNewsForCoins(coins, limit = 10) {
    const results = [];
    const targetCoins = coins || this.trackedCoins;

    for (const coin of targetCoins) {
      const coinNews = [];
      
      for (const [key, news] of this.newsCache.entries()) {
        if (news.coin === coin) {
          coinNews.push(news);
        }
      }

      // Sort by impact score and get top news
      coinNews.sort((a, b) => b.impactScore - a.impactScore);
      results.push(...coinNews.slice(0, limit));
    }

    // Sort all results by impact and timestamp
    results.sort((a, b) => {
      if (b.impactScore !== a.impactScore) {
        return b.impactScore - a.impactScore;
      }
      return b.timestamp - a.timestamp;
    });

    return results.slice(0, limit);
  }

  // Get high impact news (impact > 20)
  getHighImpactNews(limit = 5) {
    const highImpact = [];
    
    for (const [key, news] of this.newsCache.entries()) {
      if (news.impactScore > 20) {
        highImpact.push(news);
      }
    }

    return highImpact
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, limit);
  }

  // Get news impact summary for a coin
  getCoinImpactSummary(coin) {
    const coinNews = [];
    
    for (const [key, news] of this.newsCache.entries()) {
      if (news.coin === coin) {
        coinNews.push(news);
      }
    }

    if (coinNews.length === 0) {
      return { 
        totalImpact: 0, 
        newsCount: 0, 
        sentiment: 'neutral',
        latestNews: null 
      };
    }

    const totalImpact = coinNews.reduce((sum, news) => sum + news.impactScore, 0);
    const avgImpact = totalImpact / coinNews.length;
    
    let sentiment = 'neutral';
    if (avgImpact > 10) sentiment = 'bullish';
    else if (avgImpact < -10) sentiment = 'bearish';

    return {
      totalImpact,
      newsCount: coinNews.length,
      avgImpact,
      sentiment,
      latestNews: coinNews.sort((a, b) => b.timestamp - a.timestamp)[0]
    };
  }
}

module.exports = NewsService;