// Trading Configuration for Aetheria Vault
// Supports top 10 liquid coins for 2025

const TRADING_PAIRS = [
  {
    id: 'BTC-USDT',
    base: 'BTC',
    quote: 'USDT',
    symbol: 'BTC/USDT',
    minQty: 0.00001,
    maxQty: 100,
    tickSize: 0.01,
    stepSize: 0.00001,
    isActive: true,
    description: 'Bitcoin - The King'
  },
  {
    id: 'ETH-USDT',
    base: 'ETH',
    quote: 'USDT',
    symbol: 'ETH/USDT',
    minQty: 0.0001,
    maxQty: 1000,
    tickSize: 0.01,
    stepSize: 0.0001,
    isActive: true,
    description: 'Ethereum - DeFi Base'
  },
  {
    id: 'SOL-USDT',
    base: 'SOL',
    quote: 'USDT',
    symbol: 'SOL/USDT',
    minQty: 0.001,
    maxQty: 10000,
    tickSize: 0.001,
    stepSize: 0.001,
    isActive: true,
    description: 'Solana - High Volatility'
  },
  {
    id: 'BNB-USDT',
    base: 'BNB',
    quote: 'USDT',
    symbol: 'BNB/USDT',
    minQty: 0.001,
    maxQty: 1000,
    tickSize: 0.01,
    stepSize: 0.001,
    isActive: true,
    description: 'Binance Coin - Exchange Token'
  },
  {
    id: 'XRP-USDT',
    base: 'XRP',
    quote: 'USDT',
    symbol: 'XRP/USDT',
    minQty: 0.1,
    maxQty: 100000,
    tickSize: 0.0001,
    stepSize: 0.1,
    isActive: true,
    description: 'Ripple - Legal Clarity Boost'
  },
  {
    id: 'ADA-USDT',
    base: 'ADA',
    quote: 'USDT',
    symbol: 'ADA/USDT',
    minQty: 1,
    maxQty: 1000000,
    tickSize: 0.0001,
    stepSize: 1,
    isActive: true,
    description: 'Cardano - Large Cap'
  },
  {
    id: 'DOGE-USDT',
    base: 'DOGE',
    quote: 'USDT',
    symbol: 'DOGE/USDT',
    minQty: 1,
    maxQty: 10000000,
    tickSize: 0.00001,
    stepSize: 1,
    isActive: true,
    description: 'Dogecoin - Meme Leader'
  },
  {
    id: 'MATIC-USDT',
    base: 'MATIC',
    quote: 'USDT',
    symbol: 'MATIC/USDT',
    minQty: 1,
    maxQty: 1000000,
    tickSize: 0.0001,
    stepSize: 1,
    isActive: true,
    description: 'Polygon - L2 Gas'
  },
  {
    id: 'LTC-USDT',
    base: 'LTC',
    quote: 'USDT',
    symbol: 'LTC/USDT',
    minQty: 0.001,
    maxQty: 10000,
    tickSize: 0.01,
    stepSize: 0.001,
    isActive: true,
    description: 'Litecoin - Payments'
  },
  {
    id: 'TON-USDT',
    base: 'TON',
    quote: 'USDT',
    symbol: 'TON/USDT',
    minQty: 0.01,
    maxQty: 100000,
    tickSize: 0.001,
    stepSize: 0.01,
    isActive: true,
    description: 'TON - Telegram Native'
  }
];

// Trading Limits and Risk Management
const TRADING_LIMITS = {
  MAX_POSITION_USD: 5000,           // Max $5k per pair per user
  MAX_ORDERS_PER_MINUTE: 20,        // Rate limiting
  MAX_OPEN_ORDERS: 50,              // Per user
  MIN_ORDER_USD: 10,                // Minimum $10 order
  MAX_ORDER_USD: 10000,             // Maximum $10k order
  SPREAD_MARKUP: 0.0005,            // 0.05% spread markup
  PROVIDER_FEE: 0.0008,              // 0.08% provider fee
  USER_FEE: 0.0010                   // 0.10% user fee
};

// API Configuration
const API_CONFIG = {
  BINANCE: {
    BASE_URL: 'https://api.binance.com',
    DEPTH_ENDPOINT: '/api/v3/depth',
    CANDLES_ENDPOINT: '/api/v3/klines',
    TICKER_ENDPOINT: '/api/v3/ticker/24hr',
    RATE_LIMIT: 1200,               // requests per minute
    FALLBACK_ENABLED: true
  },
  OKX: {
    BASE_URL: 'https://www.okx.com',
    DEPTH_ENDPOINT: '/api/v5/market/books',
    CANDLES_ENDPOINT: '/api/v5/market/candles',
    TICKER_ENDPOINT: '/api/v5/market/ticker',
    RATE_LIMIT: 1000,
    FALLBACK_ENABLED: true
  }
};

// Order Types and Time in Force
const ORDER_TYPES = {
  MARKET: 'market',
  LIMIT: 'limit',
  STOP: 'stop'
};

const TIME_IN_FORCE = {
  GTC: 'GTC',   // Good Till Cancel
  IOC: 'IOC',   // Immediate or Cancel
  FOK: 'FOK'    // Fill or Kill
};

// Order Status
const ORDER_STATUS = {
  OPEN: 'open',
  FILLED: 'filled',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  PARTIALLY_FILLED: 'partially_filled'
};

module.exports = {
  TRADING_PAIRS,
  TRADING_LIMITS,
  API_CONFIG,
  ORDER_TYPES,
  TIME_IN_FORCE,
  ORDER_STATUS
};