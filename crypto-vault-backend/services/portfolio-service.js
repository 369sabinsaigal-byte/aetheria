const WebSocket = require('ws');
const axios = require('axios');
const Redis = require('ioredis');

class PortfolioService {
  constructor() {
    this.priceCache = new Map();
    this.userPositions = new Map();
    this.subscribers = new Map();
    this.wsClients = new Set();
    this.redisEnabled = false;
    
    // Try to connect to Redis, but don't fail if it's not available
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'redis', // Use Docker service name in production
        port: process.env.REDIS_PORT || 6379,
        retryDelayOnFailover: 1000,
        maxRetriesPerRequest: 3
      };
      this.redis = new Redis(redisConfig);
      this.redisPub = new Redis(redisConfig);
      this.redisSub = new Redis(redisConfig);
      
      this.redis.on('connect', () => {
        console.log('✅ Redis connected');
        this.redisEnabled = true;
        this.setupRedisSubscription();
      });
      
      this.redis.on('error', (err) => {
        console.log('⚠️ Redis unavailable, using in-memory fallback');
        this.redisEnabled = false;
      });
    } catch (error) {
      console.log('⚠️ Redis connection failed, using in-memory fallback');
      this.redisEnabled = false;
    }
    
    this.startBinanceWebSocket();
  }

  setupRedisSubscription() {
    this.redisSub.subscribe('portfolio:updates');
    this.redisSub.on('message', (channel, message) => {
      if (channel === 'portfolio:updates') {
        const data = JSON.parse(message);
        this.broadcastToUser(data.userId, data);
      }
    });
  }

  startBinanceWebSocket() {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
    
    ws.on('open', () => {
      console.log('🔄 Connected to Binance WebSocket');
    });

    ws.on('message', (data) => {
      try {
        const tickers = JSON.parse(data);
        this.processBinanceTickers(tickers);
      } catch (error) {
        console.error('Error processing Binance data:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('Binance WebSocket error:', error);
      setTimeout(() => this.startBinanceWebSocket(), 5000);
    });

    ws.on('close', () => {
      console.log('Binance WebSocket disconnected, reconnecting...');
      setTimeout(() => this.startBinanceWebSocket(), 5000);
    });
  }

  processBinanceTickers(tickers) {
    tickers.forEach(ticker => {
      const symbol = ticker.s; // e.g., BTCUSDT
      const price = parseFloat(ticker.c); // current price
      
      this.priceCache.set(symbol, {
        price,
        change24h: parseFloat(ticker.P),
        volume24h: parseFloat(ticker.v),
        timestamp: Date.now()
      });
    });

    // Update all user portfolios with new prices
    this.updateAllPortfolios();
  }

  updateAllPortfolios() {
    for (const [userId, positions] of this.userPositions.entries()) {
      const portfolio = this.calculatePortfolio(userId);
      
      // Publish to Redis for real-time updates (if available)
      if (this.redisEnabled) {
        try {
          this.redisPub.publish('portfolio:updates', JSON.stringify({
            userId,
            portfolio,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.log('Redis publish failed, using direct broadcast');
          this.broadcastToUser(userId, portfolio);
        }
      } else {
        // Direct broadcast if Redis is unavailable
        this.broadcastToUser(userId, portfolio);
      }
    }
  }

  calculatePortfolio(userId) {
    const positions = this.userPositions.get(userId) || [];
    let totalInvested = 0;
    let totalPnL = 0;
    let topGainer = null;
    let topLoser = null;

    const updatedPositions = positions.map(position => {
      const symbol = position.coin + 'USDT';
      const currentPrice = this.priceCache.get(symbol)?.price || position.avgEntry;
      
      const unrealisedPnL = (currentPrice - position.avgEntry) * position.qty * position.leverage;
      const pnlPercent = ((currentPrice - position.avgEntry) / position.avgEntry) * 100;
      
      totalInvested += position.avgEntry * position.qty;
      totalPnL += unrealisedPnL;

      // Track top gainer/loser
      if (!topGainer || pnlPercent > topGainer.pnlPercent) {
        topGainer = { coin: position.coin, pnlPercent, unrealisedPnL };
      }
      if (!topLoser || pnlPercent < topLoser.pnlPercent) {
        topLoser = { coin: position.coin, pnlPercent, unrealisedPnL };
      }

      return {
        ...position,
        currentPrice,
        unrealisedPnL,
        pnlPercent
      };
    });

    // Update positions in memory
    this.userPositions.set(userId, updatedPositions);

    return {
      totalInvested,
      totalPnL,
      totalValue: totalInvested + totalPnL,
      pnlPercent: totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0,
      positions: updatedPositions,
      topGainer,
      topLoser,
      timestamp: Date.now()
    };
  }

  // WebSocket connection management
  addWebSocketClient(ws, userId) {
    this.wsClients.add({ ws, userId });
    
    ws.on('close', () => {
      this.wsClients.delete({ ws, userId });
    });

    // Send initial portfolio data
    const portfolio = this.calculatePortfolio(userId);
    ws.send(JSON.stringify({
      type: 'portfolio:initial',
      data: portfolio
    }));
  }

  broadcastToUser(userId, data) {
    this.wsClients.forEach(client => {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'portfolio:update',
          data
        }));
      }
    });
  }

  // Position management
  addPosition(userId, position) {
    const positions = this.userPositions.get(userId) || [];
    positions.push({
      id: position.id,
      coin: position.coin,
      side: position.side,
      avgEntry: position.avgEntry,
      qty: position.qty,
      leverage: position.leverage || 1,
      tp: position.tp,
      sl: position.sl,
      createdAt: new Date()
    });
    this.userPositions.set(userId, positions);
  }

  removePosition(userId, positionId) {
    const positions = this.userPositions.get(userId) || [];
    const updatedPositions = positions.filter(p => p.id !== positionId);
    this.userPositions.set(userId, updatedPositions);
  }

  // Get current price for a coin
  getCurrentPrice(coin) {
    const symbol = coin + 'USDT';
    return this.priceCache.get(symbol)?.price || 0;
  }

  // Get 24h stats
  get24hStats(coin) {
    const symbol = coin + 'USDT';
    const data = this.priceCache.get(symbol);
    if (!data) return null;

    return {
      price: data.price,
      change24h: data.change24h,
      volume24h: data.volume24h,
      timestamp: data.timestamp
    };
  }
}

module.exports = PortfolioService;