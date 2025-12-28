// Trading Service for Aetheria Vault
// Handles order execution, risk management, and liquidity provider integration

const axios = require('axios');
const { TRADING_PAIRS, TRADING_LIMITS, API_CONFIG, ORDER_TYPES, ORDER_STATUS } = require('./trading-config');

class TradingService {
  constructor() {
    this.orders = new Map(); // userId -> orders array
    this.positions = new Map(); // userId -> positions map
    this.priceCache = new Map(); // pair -> price data
    this.orderBooks = new Map(); // pair -> order book data
    this.candlesCache = new Map(); // pair -> candles data
    
    // Initialize with default prices for demo
    this.initializeDefaultPrices();
    
    // Start price updates
    this.startPriceUpdates();
  }

  // Initialize with default prices for demo
  initializeDefaultPrices() {
    const defaultPrices = {
      'BTC/USDT': 95000,
      'ETH/USDT': 3500,
      'TON/USDT': 6.50,
      'SOL/USDT': 200,
      'BNB/USDT': 600,
      'XRP/USDT': 2.40,
      'ADA/USDT': 1.20,
      'DOGE/USDT': 0.35,
      'TRX/USDT': 0.25,
      'AVAX/USDT': 45
    };
    
    Object.entries(defaultPrices).forEach(([symbol, price]) => {
      this.priceCache.set(symbol, {
        price,
        lastUpdated: new Date().toISOString()
      });
    });
  }

  // Get available trading pairs
  getTradingPairs() {
    return TRADING_PAIRS.filter(pair => pair.isActive);
  }

  // Get trading pair by symbol
  getTradingPair(symbol) {
    if (!symbol) return undefined;
    const normalizedInput = symbol.replace(/[\/-]/g, '').toUpperCase();
    return TRADING_PAIRS.find(pair => {
        const normalizedPair = pair.symbol.replace(/[\/-]/g, '').toUpperCase();
        return normalizedPair === normalizedInput && pair.isActive;
    });
  }

  // Validate order parameters
  validateOrder(userId, orderData) {
    const { pair, side, type, quantity, price } = orderData;
    
    // Check if pair exists and is active
    const tradingPair = this.getTradingPair(pair);
    if (!tradingPair) {
      throw new Error(`Trading pair not found or inactive: ${pair}`);
    }

    // Use canonical symbol for price check
    const canonicalPair = tradingPair.symbol;

    // Validate quantity
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Invalid quantity');
    }

    if (qty < tradingPair.minQty || qty > tradingPair.maxQty) {
      throw new Error(`Quantity must be between ${tradingPair.minQty} and ${tradingPair.maxQty}`);
    }

    // Check order value in USD
    const currentPrice = this.getCurrentPrice(canonicalPair);
    // If price is 0 (missing), we might skip this check or throw error
    if (currentPrice > 0) {
        const orderValue = qty * currentPrice;
        
        if (orderValue < TRADING_LIMITS.MIN_ORDER_USD) {
          throw new Error(`Minimum order value is $${TRADING_LIMITS.MIN_ORDER_USD} (Current: $${orderValue.toFixed(2)})`);
        }

        if (orderValue > TRADING_LIMITS.MAX_ORDER_USD) {
          throw new Error(`Maximum order value is $${TRADING_LIMITS.MAX_ORDER_USD}`);
        }
    } else {
        console.warn(`Price missing for ${canonicalPair}, skipping value check`);
    }

    // Check position limits
    const userPositions = this.getUserPositions(userId);
    const currentPosition = userPositions.get(canonicalPair) || { quantity: 0, value: 0 };
    const newPositionValue = Math.abs(currentPosition.quantity + (side === 'buy' ? qty : -qty)) * currentPrice;
    
    if (newPositionValue > TRADING_LIMITS.MAX_POSITION_USD) {
      throw new Error(`Maximum position size is $${TRADING_LIMITS.MAX_POSITION_USD} per pair`);
    }

    // Validate price for limit orders
    if (type === ORDER_TYPES.LIMIT && (!price || parseFloat(price) <= 0)) {
      throw new Error('Price is required for limit orders');
    }

    return true;
  }

  // Create a new order
  async createOrder(userId, orderData) {
    try {
      // Validate order
      this.validateOrder(userId, orderData);
      
      const { pair, side, type, quantity, price, timeInForce = 'GTC', leverage = 1, marginMode = 'cross' } = orderData;
      const tradingPair = this.getTradingPair(pair);
      const canonicalPair = tradingPair.symbol; // Use canonical symbol (e.g. BTC/USDT)
      
      // Generate order ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create order object
      const order = {
        id: orderId,
        userId,
        pair: canonicalPair, // Store normalized pair
        side: side.toLowerCase(),
        type: type.toLowerCase(),
        quantity: parseFloat(quantity),
        price: price ? parseFloat(price) : null,
        timeInForce,
        leverage,
        marginMode,
        status: ORDER_STATUS.OPEN,
        executedQty: 0,
        executedPrice: null,
        provider: 'binance', // Default provider
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Execute market orders immediately
      if (type === ORDER_TYPES.MARKET) {
        await this.executeMarketOrder(order);
      } else if (type === ORDER_TYPES.LIMIT) {
        // Add to order book for limit orders
        await this.addToOrderBook(order);
      } else if (type === 'multihodl') {
        await this.executeMultiHodlOrder(order);
      }

      // Store order
      const userOrders = this.orders.get(userId) || [];
      userOrders.push(order);
      this.orders.set(userId, userOrders);

      return order;
    } catch (error) {
      throw new Error(`Order creation failed: ${error.message}`);
    }
  }

  // Execute market order
  async executeMarketOrder(order) {
    try {
      // 1. Price Glue: Try to match internally first
      const matchedInternally = await this.matchInternalOrder(order);
      if (matchedInternally) {
        console.log(`Order ${order.id} matched internally (Price Glue)`);
        return order;
      }

      // 2. External Execution
      const currentPrice = this.getCurrentPrice(order.pair);
      
      // Calculate estimated execution price
      const spread = TRADING_LIMITS.SPREAD_MARKUP || 0.001;
      const executedPrice = currentPrice * (1 + (order.side === 'buy' ? spread : -spread));
      
      // 3. Slippage Shield
      // Check if price deviates > 0.5% from mid-price
      const slippage = Math.abs((executedPrice - currentPrice) / currentPrice);
      if (slippage > 0.005) {
        throw new Error(`Slippage protection: Price deviation ${(slippage * 100).toFixed(2)}% exceeds 0.5% limit`);
      }

      // Update order
      order.executedQty = order.quantity;
      order.executedPrice = executedPrice;
      order.status = ORDER_STATUS.FILLED;
      order.updatedAt = new Date().toISOString();

      // Update user position
      this.updatePosition(order.userId, order.pair, order.side, order.quantity, executedPrice, order.leverage);

      return order;
    } catch (error) {
      order.status = ORDER_STATUS.REJECTED;
      order.updatedAt = new Date().toISOString();
      throw error;
    }
  }

  // Match order internally against limit orders (Price Glue)
  async matchInternalOrder(order) {
    const orderBook = this.orderBooks.get(order.pair);
    if (!orderBook) return false;

    // In a real engine, we would match against orderBook.bids/asks
    // For this demo, we'll simulate a 10% chance of internal match if liquidity exists
    // to demonstrate the feature without full matching engine logic
    const randomMatch = Math.random() < 0.1; 
    
    if (randomMatch) {
        // Simulate match at mid-price (Zero Fee)
        const currentPrice = this.getCurrentPrice(order.pair);
        
        order.executedQty = order.quantity;
        order.executedPrice = currentPrice; // Mid-price match!
        order.status = ORDER_STATUS.FILLED;
        order.updatedAt = new Date().toISOString();
        
        this.updatePosition(order.userId, order.pair, order.side, order.quantity, currentPrice);
        return true;
    }

    return false;
  }

  // Add limit order to order book
  async addToOrderBook(order) {
    // For demo purposes, we'll simulate order book execution
    // In production, this would integrate with actual exchange order books
    
    // Check if price is favorable for immediate execution
    const currentPrice = this.getCurrentPrice(order.pair);
    const canExecute = order.side === 'buy' ? order.price >= currentPrice : order.price <= currentPrice;
    
    if (canExecute) {
      order.executedQty = order.quantity;
      order.executedPrice = order.price;
      order.status = ORDER_STATUS.FILLED;
    }
    
    order.updatedAt = new Date().toISOString();
  }

  // Execute Multi-HODL order (Simulated Chain)
  async executeMultiHodlOrder(order) {
    const currentPrice = this.getCurrentPrice(order.pair);
    const multiplier = order.multiplier || 1;
    
    // Calculate effective coin size (Investment * Multiplier / Price)
    // order.quantity is the USDT investment amount
    const effectiveCoinSize = (order.quantity * multiplier) / currentPrice;
    const side = order.direction === 'bullish' ? 'buy' : 'sell';

    // Simulate "Chain Creation" time (< 200ms)
    // In a real system, this would loop 5-10 times creating loans
    await new Promise(resolve => setTimeout(resolve, 50)); 

    order.executedQty = effectiveCoinSize;
    order.executedPrice = currentPrice;
    order.status = ORDER_STATUS.FILLED;
    order.updatedAt = new Date().toISOString();

    // Store as a position with leverage
    this.updatePosition(order.userId, order.pair, side, effectiveCoinSize, currentPrice, multiplier);

    return order;
  }

  // Update user position
  updatePosition(userId, pair, side, quantity, price, leverage = 1) {
    const userPositions = this.positions.get(userId) || new Map();
    const currentPosition = userPositions.get(pair) || { quantity: 0, avgPrice: 0, value: 0, leverage: 1 };
    
    const newQuantity = side === 'buy' ? currentPosition.quantity + quantity : currentPosition.quantity - quantity;
    const newValue = Math.abs(newQuantity) * price;
    
    // Update leverage (weighted average if adding to position, or overwrite for simplicity in MVP)
    // For MVP, if leverage > 1 is passed, we update it.
    const newLeverage = leverage > 1 ? leverage : currentPosition.leverage;

    userPositions.set(pair, {
      quantity: newQuantity,
      avgPrice: price,
      value: newValue,
      leverage: newLeverage,
      lastUpdated: new Date().toISOString()
    });
    
    this.positions.set(userId, userPositions);
  }

  // Get user orders
  getUserOrders(userId, status = null) {
    const userOrders = this.orders.get(userId) || [];
    if (status) {
      return userOrders.filter(order => order.status === status);
    }
    return userOrders;
  }

  // Get user positions
  getUserPositions(userId) {
    return this.positions.get(userId) || new Map();
  }

  // Cancel order
  cancelOrder(userId, orderId) {
    const userOrders = this.orders.get(userId) || [];
    const order = userOrders.find(o => o.id === orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.status !== ORDER_STATUS.OPEN) {
      throw new Error('Can only cancel open orders');
    }
    
    order.status = ORDER_STATUS.CANCELLED;
    order.updatedAt = new Date().toISOString();
    
    return order;
  }

  // Get current price for a pair
  getCurrentPrice(pair) {
    const priceData = this.priceCache.get(pair);
    return priceData ? priceData.price : 0;
  }

  // Get order book
  getOrderBook(pair, limit = 20) {
    const orderBook = this.orderBooks.get(pair);
    if (!orderBook) {
      return this.generateMockOrderBook(pair, limit);
    }
    return orderBook;
  }

  // Get candles
  getCandles(pair, interval = '15m', startTime = null, endTime = null) {
    const cacheKey = `${pair}_${interval}`;
    const candles = this.candlesCache.get(cacheKey);
    
    if (!candles || this.isCacheStale(candles.lastUpdated)) {
      return this.generateMockCandles(pair, interval);
    }
    
    return candles.data;
  }

  // Generate mock order book for demo
  generateMockOrderBook(pair, limit) {
    const currentPrice = this.getCurrentPrice(pair);
    const orderBook = {
      lastUpdateId: Date.now(),
      bids: [],
      asks: []
    };
    
    // Generate bids (buy orders)
    for (let i = 0; i < limit; i++) {
      const price = currentPrice * (1 - (i + 1) * 0.0001);
      const quantity = Math.random() * 10 + 0.1;
      orderBook.bids.push([price.toFixed(8), quantity.toFixed(8)]);
    }
    
    // Generate asks (sell orders)
    for (let i = 0; i < limit; i++) {
      const price = currentPrice * (1 + (i + 1) * 0.0001);
      const quantity = Math.random() * 10 + 0.1;
      orderBook.asks.push([price.toFixed(8), quantity.toFixed(8)]);
    }
    
    this.orderBooks.set(pair, orderBook);
    return orderBook;
  }

  // Generate mock candles for demo
  generateMockCandles(pair, interval) {
    const currentPrice = this.getCurrentPrice(pair);
    const candles = [];
    const now = Date.now();
    const intervalMs = this.getIntervalMs(interval);
    
    for (let i = 99; i >= 0; i--) {
      const time = now - (i * intervalMs);
      const open = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
      const close = open * (1 + (Math.random() - 0.5) * 0.02);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.random() * 1000 + 100;
      
      candles.push({
        time: Math.floor(time / 1000),
        open: parseFloat(open.toFixed(8)),
        high: parseFloat(high.toFixed(8)),
        low: parseFloat(low.toFixed(8)),
        close: parseFloat(close.toFixed(8)),
        volume: parseFloat(volume.toFixed(8))
      });
    }
    
    const cacheKey = `${pair}_${interval}`;
    this.candlesCache.set(cacheKey, {
      data: candles,
      lastUpdated: new Date().toISOString()
    });
    
    return candles;
  }

  // Get interval in milliseconds
  getIntervalMs(interval) {
    const intervals = {
      '1m': 60 * 1000,
      '3m': 3 * 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '2h': 2 * 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '8h': 8 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    
    return intervals[interval] || 15 * 60 * 1000; // Default to 15m
  }

  // Check if cache is stale
  isCacheStale(lastUpdated) {
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes
    return (Date.now() - new Date(lastUpdated).getTime()) > cacheExpiry;
  }

  // Start price updates from external APIs
  async startPriceUpdates() {
    // Update prices every 30 seconds
    setInterval(async () => {
      await this.updatePrices();
    }, 30000);
    
    // Initial price update
    await this.updatePrices();
  }

  // Update prices from external APIs
  async updatePrices() {
    try {
      const symbols = TRADING_PAIRS.filter(pair => pair.isActive).map(pair => pair.symbol);
      
      // Try Binance first
      const binancePrices = await this.fetchBinancePrices(symbols);
      if (binancePrices) {
        this.updatePriceCache(binancePrices);
        return;
      }
      
      // Fallback to OKX
      const okxPrices = await this.fetchOKXPrices(symbols);
      if (okxPrices) {
        this.updatePriceCache(okxPrices);
      }
    } catch (error) {
      console.error('Error updating prices:', error.message);
    }
  }

  // Fetch prices from Binance
  async fetchBinancePrices(symbols) {
    try {
      const response = await axios.get(`${API_CONFIG.BINANCE.BASE_URL}/api/v3/ticker/price`);
      const prices = {};
      
      response.data.forEach(ticker => {
        if (symbols.includes(ticker.symbol)) {
          prices[ticker.symbol] = parseFloat(ticker.price);
        }
      });
      
      return prices;
    } catch (error) {
      console.error('Error fetching Binance prices:', error.message);
      return null;
    }
  }

  // Fetch prices from OKX
  async fetchOKXPrices(symbols) {
    try {
      const response = await axios.get(`${API_CONFIG.OKX.BASE_URL}/api/v5/market/tickers`, {
        params: {
          instType: 'SPOT'
        }
      });
      
      const prices = {};
      response.data.data.forEach(ticker => {
        const symbol = ticker.instId.replace('-', '');
        if (symbols.includes(symbol)) {
          prices[symbol] = parseFloat(ticker.last);
        }
      });
      
      return prices;
    } catch (error) {
      console.error('Error fetching OKX prices:', error.message);
      return null;
    }
  }

  // Update price cache
  updatePriceCache(prices) {
    Object.entries(prices).forEach(([symbol, price]) => {
      this.priceCache.set(symbol, {
        price,
        lastUpdated: new Date().toISOString()
      });
    });
  }

  // Get 24h ticker data
  async get24hTicker(pair) {
    try {
      // Try Binance first
      const response = await axios.get(`${API_CONFIG.BINANCE.BASE_URL}/api/v3/ticker/24hr`, {
        params: { symbol: pair }
      });
      
      return {
        symbol: response.data.symbol,
        priceChange: parseFloat(response.data.priceChange),
        priceChangePercent: parseFloat(response.data.priceChangePercent),
        lastPrice: parseFloat(response.data.lastPrice),
        volume: parseFloat(response.data.volume),
        quoteVolume: parseFloat(response.data.quoteVolume),
        highPrice: parseFloat(response.data.highPrice),
        lowPrice: parseFloat(response.data.lowPrice)
      };
    } catch (error) {
      console.error('Error fetching 24h ticker:', error.message);
      return null;
    }
  }
}

module.exports = TradingService;