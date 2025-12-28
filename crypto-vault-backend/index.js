const { Bot } = require("grammy");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");
const WebSocket = require('ws');
const TradingService = require("./trading-service");
const matchingEngine = require("./services/matching-engine");
const PortfolioService = require("./services/portfolio-service");
const NewsService = require("./services/news-service");
const db = require("./services/db");
const { authenticateToken } = require("./middleware/auth");
const { verifyTelegramWebAppData, generateToken } = require("./utils/auth");
const WebSocketService = require("./services/websocket-service");
require("dotenv").config();

// Initialize the bot if token is present
let bot;
if (process.env.BOT_TOKEN) {
    bot = new Bot(process.env.BOT_TOKEN);
} else {
    console.warn("⚠️ BOT_TOKEN not found in .env. Bot features will be disabled.");
    // Create a mock bot to prevent crashes in routes
    bot = {
        command: () => {},
        on: () => {},
        catch: () => {},
        start: () => {},
        stop: () => {},
        handleUpdate: async () => {}
    };
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const tradingService = new TradingService();
const portfolioService = new PortfolioService();
const newsService = new NewsService();

console.log("📈 Trading service initialized");
console.log("💼 Portfolio service initialized");
console.log("📰 News service initialized");

// --- Helper Functions ---

// Fetch Crypto Prices (CoinGecko)
async function getCryptoPrices(ids) {
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
            params: {
                ids: ids.join(','),
                vs_currencies: 'usd',
                include_24hr_change: 'true'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching crypto prices:", error.message);
        return null;
    }
}

// Fetch Real Crypto News (NewsAPI)
async function getCryptoNews() {
    try {
        const apiKey = process.env.NEWS_API_KEY;
        
        // If no API key, use mock data
        if (!apiKey || apiKey === 'your_newsapi_key_here') {
            return null;
        }
        
        const response = await axios.get('https://newsapi.org/v2/everything', {
            params: {
                q: 'cryptocurrency OR bitcoin OR ethereum OR blockchain',
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: 10,
                apiKey: apiKey
            }
        });
        
        // Transform NewsAPI response to our format
        const articles = response.data.articles.slice(0, 6); // Get top 6 articles
        
        return articles.map((article, index) => ({
            id: `news_${index + 1}`,
            title: article.title,
            source: article.source?.name || 'NewsAPI',
            time: formatTimeAgo(article.publishedAt),
            type: getNewsType(article.title),
            relatedAssets: extractRelatedAssets(article.title),
            theme: getNewsTheme(article.title),
            url: article.url
        }));
        
    } catch (error) {
        console.error("Error fetching crypto news:", error.message);
        return null;
    }
}

// Helper: Format time ago
function formatTimeAgo(publishedAt) {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffMs = now - published;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
}

// Helper: Determine news type
function getNewsType(title) {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('break') || lowerTitle.includes('surge') || lowerTitle.includes('crash')) {
        return 'market_mover';
    }
    return 'narrative';
}

// Helper: Extract related assets from title
function extractRelatedAssets(title) {
    const cryptoKeywords = {
        'bitcoin': 'BTC', 'btc': 'BTC',
        'ethereum': 'ETH', 'eth': 'ETH', 
        'solana': 'SOL', 'sol': 'SOL',
        'dogecoin': 'DOGE', 'doge': 'DOGE',
        'pepe': 'PEPE', 'arbitrum': 'ARB',
        'cardano': 'ADA', 'ada': 'ADA',
        'xrp': 'XRP', 'ripple': 'XRP',
        'polkadot': 'DOT', 'dot': 'DOT',
        'chainlink': 'LINK', 'link': 'LINK',
        'litecoin': 'LTC', 'ltc': 'LTC'
    };
    
    const related = [];
    const lowerTitle = title.toLowerCase();
    
    for (const [keyword, symbol] of Object.entries(cryptoKeywords)) {
        if (lowerTitle.includes(keyword) && !related.includes(symbol)) {
            related.push(symbol);
        }
    }
    
    return related.length > 0 ? related : ['BTC'];
}

// Helper: Determine news theme
function getNewsTheme(title) {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('ai') || lowerTitle.includes('artificial intelligence')) return 'AI Tokens';
    if (lowerTitle.includes('fed') || lowerTitle.includes('federal reserve')) return 'Fed Decision';
    if (lowerTitle.includes('regulation') || lowerTitle.includes('sec')) return 'Regulation';
    if (lowerTitle.includes('nft') || lowerTitle.includes('metaverse')) return 'NFT & Metaverse';
    if (lowerTitle.includes('defi') || lowerTitle.includes('decentralized')) return 'DeFi';
    return 'Market News';
}

// Binance Testnet API Helper Functions
function generateBinanceSignature(queryString, secret) {
    return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

async function getBinanceTestnetAccount() {
    try {
        const apiKey = process.env.BINANCE_TESTNET_API_KEY;
        const secret = process.env.BINANCE_TESTNET_SECRET_KEY;
        
        if (!apiKey || !secret || apiKey === 'your_binance_testnet_api_key') {
            console.log('Binance Testnet credentials not configured, using mock trading');
            return null;
        }
        
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}`;
        const signature = generateBinanceSignature(queryString, secret);
        
        const response = await axios.get('https://testnet.binance.vision/api/v3/account', {
            params: { timestamp, signature },
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        
        return response.data;
        
    } catch (error) {
        console.error('Binance Testnet account error:', error.response?.data || error.message);
        return null;
    }
}

async function executeBinanceTestnetOrder(symbol, side, quantity) {
    try {
        const apiKey = process.env.BINANCE_TESTNET_API_KEY;
        const secret = process.env.BINANCE_TESTNET_SECRET_KEY;
        
        if (!apiKey || !secret || apiKey === 'your_binance_testnet_api_key') {
            console.log('Binance Testnet credentials not configured, using mock order');
            return {
                orderId: `mock_${Date.now()}`,
                status: 'FILLED',
                executedQty: quantity,
                fills: [{ price: await getCurrentPrice(symbol) }]
            };
        }
        
        const timestamp = Date.now();
        const params = {
            symbol: symbol.toUpperCase(),
            side: side.toUpperCase(),
            type: 'MARKET',
            quantity: quantity,
            timestamp: timestamp
        };
        
        const queryString = Object.keys(params)
            .map(key => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');
        
        const signature = generateBinanceSignature(queryString, secret);
        
        const response = await axios.post('https://testnet.binance.vision/api/v3/order', 
            null,
            {
                params: { ...params, signature },
                headers: { 'X-MBX-APIKEY': apiKey }
            }
        );
        
        return response.data;
        
    } catch (error) {
        console.error('Binance Testnet order error:', error.response?.data || error.message);
        throw new Error(`Order failed: ${error.response?.data?.msg || error.message}`);
    }
}

async function getCurrentPrice(symbol) {
    try {
        const response = await axios.get(`https://testnet.binance.vision/api/v3/ticker/price`, {
            params: { symbol: symbol.toUpperCase() }
        });
        return parseFloat(response.data.price);
    } catch (error) {
        console.error('Price fetch error:', error.message);
        // Fallback prices
        const fallbackPrices = {
            'BTCUSDT': 87450,
            'ETHUSDT': 2927.68,
            'SOLUSDT': 123.50,
            'DOGEUSDT': 0.15,
            'PEPEUSDT': 0.00000876,
            'ARBUSDT': 1.25
        };
        return fallbackPrices[symbol.toUpperCase()] || 1;
    }
}

async function getCryptoNews() {
    if (!process.env.NEWS_API_KEY) {
        console.log("NEWS_API_KEY not set, using mock news.");
        return null;
    }
    try {
        const response = await axios.get(`https://newsapi.org/v2/everything`, {
            params: {
                q: 'crypto OR bitcoin OR ethereum',
                sortBy: 'publishedAt',
                language: 'en',
                apiKey: process.env.NEWS_API_KEY
            }
        });
        return response.data.articles.slice(0, 5).map((article, index) => ({
            id: String(index),
            title: article.title,
            source: article.source.name,
            time: new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: index % 2 === 0 ? 'market_mover' : 'narrative', // Simple logic for demo
            relatedAssets: ['BTC', 'ETH'], // Placeholder logic
            theme: 'General'
        }));
    } catch (error) {
        console.error("Error fetching news:", error.message);
        return null;
    }
}

// --- Endpoints ---

// Bot command handlers
bot.command("start", async (ctx) => {
    const welcomeMessage = `
🏦 Welcome to Your Crypto Trading Vault!

Your secure, Telegram-native cryptocurrency trading platform.

Use the menu button below to access your trading dashboard, or try these commands:

/menu - Open Trading Dashboard
/portfolio - View Your Portfolio
/help - Get Help

Let's start trading! 🚀
  `.trim();

    await ctx.reply(welcomeMessage);
});

bot.command("menu", async (ctx) => {
    await ctx.reply("Click the menu button below to open your trading dashboard! 📊");
});

bot.command("portfolio", async (ctx) => {
    await ctx.reply("Your portfolio will be displayed in the Mini App. Use /menu to open it!");
});

bot.command("help", async (ctx) => {
    const helpMessage = `
📖 Crypto Trading Vault Help

Available Commands:
/start - Welcome message and overview
/menu - Open your trading dashboard
/portfolio - View your crypto portfolio
/help - Show this help message

For full functionality, use the menu button to access the Mini App interface.

Need assistance? Contact support or check our documentation.
  `.trim();

    await ctx.reply(helpMessage);
});

// Handle all other messages
bot.on("message", async (ctx) => {
    await ctx.reply("Use /menu to access your trading dashboard or /help for available commands.");
});

// Error handling for the bot
bot.catch((err) => {
    console.error("Bot error occurred:", err);
});

// Webhook endpoint for production
app.post(`/webhook/${process.env.BOT_TOKEN}`, async (req, res) => {
    try {
        await bot.handleUpdate(req.body);
        res.sendStatus(200);
    } catch (error) {
        console.error("Webhook error:", error);
        res.sendStatus(500);
    }
});

// Sumsub Webhook Endpoint
app.post('/webhook/sumsub', async (req, res) => {
    // Verify Sumsub signature here in production
    console.log('Received Sumsub webhook:', req.body);
    res.sendStatus(200);
});

// Ramp Network Webhook for Virtual Card Events
app.post('/api/ramp/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    console.log('📨 Received Ramp webhook:', { type, data });
    
    // Verify webhook signature in production (using Ramp's signing secret)
    // For demo, we'll process the events without signature verification
    
    switch (type) {
      case 'CARD_ISSUED':
        // Handle new card issuance
        const { card, user } = data;
        const userId = user?.id ? `telegram_${user.id}` : 'demo-user-id';
        
        // Add card to user's card collection
        const userCardList = userCards.get(userId) || [];
        userCardList.push({
          id: card.id,
          cardholderName: card.holder_name || 'Cardholder',
          lastFour: card.last_four,
          expiration: card.expiration_date,
          spendingLimit: card.spending_limit || 1000,
          currency: card.currency || 'USD',
          status: card.status || 'ACTIVE',
          rampCardId: card.id,
          createdAt: new Date().toISOString()
        });
        userCards.set(userId, userCardList);
        
        console.log('✅ Card issued for user:', userId, card);
        break;
        
      case 'TRANSACTION_CREATED':
        // Handle new transaction
        const { transaction, card: transactionCard } = data;
        
        // Find which user owns this card
        for (const [userId, cards] of userCards.entries()) {
          const userCard = cards.find(c => c.rampCardId === transactionCard.id);
          if (userCard) {
            // Add transaction to card's transaction history
            const transactions = userCard.transactions || [];
            transactions.push({
              id: transaction.id,
              amount: transaction.amount,
              currency: transaction.currency,
              merchant: transaction.merchant?.name || 'Unknown Merchant',
              category: transaction.category || 'OTHER',
              status: transaction.status || 'PENDING',
              timestamp: transaction.created_at,
              description: transaction.description || ''
            });
            userCard.transactions = transactions;
            
            console.log('💳 Transaction created for user:', userId, transaction);
            break;
          }
        }
        break;
        
      case 'CARD_UPDATED':
        // Handle card status updates (e.g., suspended, closed)
        const { card: updatedCard } = data;
        
        for (const [userId, cards] of userCards.entries()) {
          const userCard = cards.find(c => c.rampCardId === updatedCard.id);
          if (userCard) {
            userCard.status = updatedCard.status;
            console.log('🔄 Card updated for user:', userId, updatedCard);
            break;
          }
        }
        break;
        
      default:
        console.log('ℹ️  Unhandled Ramp webhook type:', type);
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error processing Ramp webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Striga Webhook for Virtual Card Events
app.post('/api/striga/webhook', async (req, res) => {
  try {
    const { event, data } = req.body;
    console.log('📨 Received Striga webhook:', { event, data });
    
    // Verify webhook signature in production (using Striga's signing secret)
    // For demo, we'll process the events without signature verification
    
    switch (event) {
      case 'card.created':
        // Handle new card issuance
        const { card, user_id } = data;
        const userId = user_id || 'demo-user-id';
        
        // Add card to user's card collection
        const userCardList = userCards.get(userId) || [];
        userCardList.push({
          id: card.id,
          cardholderName: card.cardholder_name || 'Cardholder',
          lastFour: card.last_four_digits,
          expiration: `${card.expiry_month}/${card.expiry_year}`,
          spendingLimit: card.spending_limit || 1000,
          currency: card.currency || 'USD',
          status: card.status || 'ACTIVE',
          strigaCardId: card.id,
          createdAt: new Date().toISOString()
        });
        userCards.set(userId, userCardList);
        
        console.log('✅ Striga card created for user:', userId, card);
        break;
        
      case 'card.transaction':
        // Handle card transaction
        const { transaction, card_id } = data;
        
        // Find which user owns this card
        for (const [userId, cards] of userCards.entries()) {
          const userCard = cards.find(c => c.strigaCardId === card_id);
          if (userCard) {
            // Add transaction to card's transaction history
            const transactions = userCard.transactions || [];
            transactions.push({
              id: transaction.id,
              amount: transaction.amount,
              currency: transaction.currency,
              merchant: transaction.merchant_name || 'Unknown Merchant',
              category: transaction.category || 'General',
              status: transaction.status,
              timestamp: transaction.created_at,
              type: transaction.type
            });
            userCard.transactions = transactions;
            
            console.log('✅ Striga transaction added for user:', userId, transaction);
            break;
          }
        }
        break;
        
      case 'card.status_changed':
        // Handle card status changes (frozen, unfrozen, etc.)
        const { card_id: statusCardId, new_status } = data;
        
        for (const [userId, cards] of userCards.entries()) {
          const userCard = cards.find(c => c.strigaCardId === statusCardId);
          if (userCard) {
            userCard.status = new_status;
            console.log('✅ Striga card status changed for user:', userId, new_status);
            break;
          }
        }
        break;
        
      default:
        console.log('ℹ️  Unhandled Striga webhook event:', event);
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error processing Striga webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Striga API Endpoints (for frontend integration)
app.post('/api/striga/create-card', async (req, res) => {
  try {
    const { userId, displayName, spendingLimit, currency, walletAddress } = req.body;
    
    // In production, this would call Striga's API
    // For demo, we'll create a mock card
    const mockCard = {
      id: `striga_card_${Date.now()}`,
      cardholder_name: displayName,
      last_four_digits: Math.floor(1000 + Math.random() * 9000).toString(),
      expiry_month: String(Math.floor(Math.random() * 12) + 1).padStart(2, '0'),
      expiry_year: String(new Date().getFullYear() + 3).slice(-2),
      spending_limit: spendingLimit,
      currency: currency,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };
    
    // Add to user's cards
    const userCardList = userCards.get(userId) || [];
    userCardList.push({
      id: mockCard.id,
      cardholderName: mockCard.cardholder_name,
      lastFour: mockCard.last_four_digits,
      expiration: `${mockCard.expiry_month}/${mockCard.expiry_year}`,
      spendingLimit: mockCard.spending_limit,
      currency: mockCard.currency,
      status: mockCard.status,
      strigaCardId: mockCard.id,
      createdAt: mockCard.created_at,
      provider: 'striga'
    });
    userCards.set(userId, userCardList);
    
    res.json({
      success: true,
      card: mockCard
    });
    
  } catch (error) {
    console.error('❌ Error creating Striga card:', error);
    res.status(500).json({ error: 'Failed to create card' });
  }
});

app.get('/api/striga/cards/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const cards = userCards.get(userId) || [];
    
    res.json({
      success: true,
      cards: cards
    });
    
  } catch (error) {
    console.error('❌ Error fetching Striga cards:', error);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// Telegram Mini App Authentication
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const { initData } = req.body;
    
    if (!initData) {
      return res.status(400).json({ error: 'initData is required' });
    }
    
    // Validate Telegram data
    const validation = verifyTelegramWebAppData(initData);
    
    if (!validation.isValid) {
      console.warn('Invalid Telegram data received');
      // For development, we might allow it if explicitly enabled
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Invalid authentication data' });
      }
    }
    
    const userData = validation.user;
    const userId = `telegram_${userData.id}`;
    
    // Create or update user in DB
    let user = db.getUser(userId);
    if (!user) {
        user = db.createUser({
            id: userId,
            username: userData.username,
            first_name: userData.first_name,
            last_name: userData.last_name,
            language_code: userData.language_code
        });
        
        // Give some initial balance to new users
        db.updateBalance(userId, 'USDT', 10000.00); // 10k USDT demo
        db.updateBalance(userId, 'BTC', 0.1);
        db.updateBalance(userId, 'ETH', 1.0);
    }
    
    // Generate JWT
    const token = generateToken(user);
    
    res.json({
      success: true,
      token: token,
      user: {
          id: user.id,
          username: user.username,
          firstName: user.first_name
      },
      message: 'Authentication successful'
    });
    
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Endpoints for Mini App

// Get Growth Vaults
app.get('/api/vaults', async (req, res) => {
    // 1. Define Vault Structure
    const vaults = [
        {
            id: 'foundation',
            title: 'Foundation Vault',
            description: 'Curated portfolio of high-conviction assets for long-term growth.',
            coins: [
                { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', allocation: 50 },
                { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', allocation: 30 },
                { id: 'solana', symbol: 'SOL', name: 'Solana', allocation: 20 }
            ],
            risk: 'Low',
            horizon: '5-Year Journey',
            type: 'foundation',
        },
        {
            id: 'momentum',
            title: 'Momentum Vault',
            description: 'High-potential alts and meme coins selected by algorithm.',
            coins: [
                { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', allocation: 40 },
                { id: 'pepe', symbol: 'PEPE', name: 'Pepe', allocation: 30 },
                { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', allocation: 30 }
            ],
            risk: 'High',
            horizon: 'Swing Trade: 1-4 weeks',
            type: 'momentum',
        },

    ];

    // 2. Fetch Real-Time Prices
    const allCoinIds = vaults.flatMap(v => v.coins.map(c => c.id));
    const prices = await getCryptoPrices(allCoinIds);

    // 3. Merge Prices into Vaults
    const vaultsWithPrices = vaults.map(vault => ({
        ...vault,
        coins: vault.coins.map(coin => {
            const priceData = prices ? prices[coin.id] : null;
            return {
                ...coin,
                current_price: priceData ? priceData.usd : 0,
                change_24h: priceData ? priceData.usd_24h_change : 0
            };
        })
    }));

    res.json(vaultsWithPrices);
});

// Get Intel Feed
app.get('/api/news', async (req, res) => {
    const realNews = await getCryptoNews();
    
    if (realNews) {
        res.json(realNews);
    } else {
        // Fallback to mock data
        const mockNews = [
            {
                id: '1',
                title: 'Bitcoin breaks $100k barrier amid institutional inflow',
                source: 'CryptoControl',
                time: '2m ago',
                type: 'market_mover',
                relatedAssets: ['BTC'],
            },
            {
                id: '2',
                title: 'AI Tokens rally as new GPT model announced',
                source: 'NewsAPI',
                time: '1h ago',
                type: 'narrative',
                relatedAssets: ['FET', 'RNDR'],
                theme: 'AI Tokens',
            },
            {
                id: '3',
                title: 'Fed signals potential rate cuts in Q3',
                source: 'Bloomberg',
                time: '3h ago',
                type: 'narrative',
                relatedAssets: ['SPY', 'BTC'],
                theme: 'Fed Decision',
            },
        ];
        res.json(mockNews);
    }
});

// Enhanced vaults endpoint (crypto-only)
app.get('/api/vaults/enhanced', async (req, res) => {
    try {
        // Get crypto vaults with real-time prices
        const vaultsResponse = await axios.get('http://localhost:3000/api/vaults');
        const vaults = vaultsResponse.data;
        
        res.json(vaults);
        
    } catch (error) {
        console.error('Enhanced vaults error:', error);
        res.status(500).json({ error: 'Failed to fetch vault data' });
    }
});

// Trading Endpoints
app.post('/api/trade/market', async (req, res) => {
    try {
        const { vaultId, asset, amount, side } = req.body;
        
        // Basic validation
        if (!vaultId || !asset || !amount || !side) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (side !== 'buy' && side !== 'sell') {
            return res.status(400).json({ error: 'Side must be buy or sell' });
        }
        
        // Map asset symbols to Binance trading pairs
        const tradingPairs = {
            'BTC': 'BTCUSDT',
            'ETH': 'ETHUSDT', 
            'SOL': 'SOLUSDT',
            'DOGE': 'DOGEUSDT',
            'PEPE': 'PEPEUSDT',
            'ARB': 'ARBUSDT'
        };
        
        const symbol = tradingPairs[asset] || `${asset}USDT`;
        
        console.log(`Executing market order: ${side} ${amount} ${asset} (${symbol}) in vault ${vaultId}`);
        
        // Execute real market order on Binance Testnet
        const orderResult = await executeBinanceTestnetOrder(symbol, side, amount);
        
        // Get execution price from order fills
        const executionPrice = orderResult.fills && orderResult.fills.length > 0 
            ? orderResult.fills[0].price 
            : await getCurrentPrice(symbol);
        
        res.json({
            success: true,
            orderId: orderResult.orderId,
            vaultId,
            asset,
            amount,
            side,
            executedPrice: executionPrice,
            executedAt: new Date().toISOString(),
            message: 'Market order executed successfully on Binance Testnet',
            exchange: 'Binance Testnet'
        });
        
    } catch (error) {
        console.error('Trade execution error:', error.message);
        res.status(500).json({ 
            error: 'Failed to execute trade', 
            details: error.message,
            exchange: 'Binance Testnet'
        });
    }
});

// Get current market prices
app.get('/api/market/prices', async (req, res) => {
    try {
        const { assets } = req.query;
        const assetList = assets ? assets.split(',') : ['BTC', 'ETH', 'SOL', 'DOGE', 'PEPE', 'ARB'];
        
        // In production, fetch from exchange API
        const mockPrices = {
            BTC: { usd: 87450, usd_24h_change: 2.5 },
            ETH: { usd: 2927.68, usd_24h_change: 1.8 },
            SOL: { usd: 123.50, usd_24h_change: 3.2 },
            DOGE: { usd: 0.15, usd_24h_change: 5.1 },
            PEPE: { usd: 0.00000876, usd_24h_change: 8.3 },
            ARB: { usd: 1.25, usd_24h_change: -1.2 }
        };
        
        const prices = {};
        assetList.forEach(asset => {
            prices[asset] = mockPrices[asset] || { usd: 0, usd_24h_change: 0 };
        });
        
        res.json(prices);
        
    } catch (error) {
        console.error('Price fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch prices' });
    }
});

// In-memory storage for user portfolios (replace with database in production)
const userPortfolios = new Map();

// In-memory storage for authentication tokens (replace with Redis/database in production)
const userTokens = new Map();

// In-memory storage for user payments (replace with database in production)
const userPayments = new Map();

// In-memory storage for card payment status (replace with database in production)
const userCardPayments = new Map();

// Initialize with some demo data
const demoUserId = 'telegram_12345';
userPortfolios.set(demoUserId, {
    userId: demoUserId,
    totalBalance: 2500.75,
    assets: [
        { symbol: 'BTC', amount: 0.05, value: 1750.50, change24h: 2.5 },
        { symbol: 'ETH', amount: 2.5, value: 625.25, change24h: -1.2 },
        { symbol: 'SOL', amount: 15, value: 125.00, change24h: 5.8 }
    ],
    transactions: [
        { id: 'tx_001', type: 'buy', symbol: 'BTC', amount: 0.02, price: 35000, timestamp: new Date(Date.now() - 86400000).toISOString(), status: 'completed' },
        { id: 'tx_002', type: 'buy', symbol: 'ETH', amount: 1.5, price: 2500, timestamp: new Date(Date.now() - 172800000).toISOString(), status: 'completed' },
        { id: 'tx_003', type: 'sell', symbol: 'SOL', amount: 5, price: 85, timestamp: new Date(Date.now() - 259200000).toISOString(), status: 'completed' }
    ],
    performance: {
        dailyChange: 125.50,
        dailyChangePercent: 5.3,
        totalGain: 350.25
    }
});

// Portfolio endpoint - GET /api/portfolio
app.get('/api/portfolio', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Get User from DB
        const user = db.getUser(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // 2. Get Balances from DB
        const wallet = db.getWallet(userId);
        
        // 3. Calculate Value
        let totalBalance = 0;
        const assets = [];
        
        for (const w of wallet) {
            if (w.balance > 0) {
                const price = w.asset === 'USDT' ? 1 : (await tradingService.getCurrentPrice(`${w.asset}USDT`) || 0);
                const value = w.balance * price;
                totalBalance += value;
                
                assets.push({
                    symbol: w.asset,
                    amount: w.balance,
                    value: value,
                    currentPrice: price,
                    change24h: 0 
                });
            }
        }
        
        // 4. Get Transactions
        const transactions = db.getTrades(userId).map(t => ({
            id: t.id,
            type: t.order_side,
            symbol: t.pair,
            amount: t.amount,
            price: t.price,
            timestamp: t.executed_at,
            status: 'completed'
        }));
        
        res.json({
            success: true,
            portfolio: {
                userId: user.id,
                totalBalance: totalBalance,
                assets: assets,
                transactions: transactions,
                performance: {
                    dailyChange: 0, 
                    dailyChangePercent: 0
                },
                lastUpdated: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Portfolio endpoint error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch portfolio',
            message: 'Unable to retrieve portfolio information.'
        });
    }
});

// --- Card Management Endpoints (Ramp Network Integration) ---

// Get user cards
app.get('/api/cards', async (req, res) => {
    try {
        // In production: Authenticate user and get user ID
        const userId = demoUserId; // Replace with actual user authentication
        const cards = userCards.get(userId) || [];
        
        res.json({
            success: true,
            cards: cards
        });
        
    } catch (error) {
        console.error('Get cards error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch cards',
            message: 'Unable to retrieve card information. Please try again later.'
        });
    }
});

// Create new virtual card (Ramp Network integration placeholder)
app.post('/api/cards/create', async (req, res) => {
    try {
        const { currency = 'USD', initialBalance = 0 } = req.body;
        
        // In production: Authenticate user and get user ID
        const userId = demoUserId; // Replace with actual user authentication
        
        // In production: Integrate with Ramp Network API
        // const rampResponse = await axios.post('https://api.ramp.network/v1/cards', {
        //     currency: currency,
        //     initial_balance: initialBalance,
        //     user_id: userId
        // }, {
        //     headers: {
        //         'Authorization': `Bearer ${process.env.RAMP_API_KEY}`,
        //         'Content-Type': 'application/json'
        //     }
        // });
        
        // For demo purposes, create a mock card
        const newCard = {
            id: `card_${Date.now()}`,
            last4: Math.floor(1000 + Math.random() * 9000).toString(),
            brand: 'Visa',
            type: 'virtual',
            status: 'active',
            balance: initialBalance,
            currency: currency,
            expiration: '12/2026',
            createdAt: new Date().toISOString(),
            transactions: [],
            provider: 'ramp'
        };
        
        // Add to user's cards
        const userCardList = userCards.get(userId) || [];
        userCardList.push(newCard);
        userCards.set(userId, userCardList);
        
        res.json({
            success: true,
            message: 'Virtual card created successfully',
            card: newCard,
            // In production: rampResponse.data
        });
        
    } catch (error) {
        console.error('Create card error:', error.message);
        res.status(500).json({ 
            error: 'Failed to create card',
            message: 'Unable to create virtual card. Please try again later.'
        });
    }
});

// Top-up card balance
app.post('/api/cards/top-up', async (req, res) => {
    try {
        const { cardId, amount, currency = 'USD' } = req.body;
        
        if (!cardId || !amount || amount <= 0) {
            return res.status(400).json({ 
                error: 'Invalid parameters',
                message: 'Card ID and positive amount are required.'
            });
        }
        
        // In production: Authenticate user and get user ID
        const userId = demoUserId; // Replace with actual user authentication
        
        // Find the card
        const userCardList = userCards.get(userId) || [];
        const cardIndex = userCardList.findIndex(card => card.id === cardId);
        
        if (cardIndex === -1) {
            return res.status(404).json({ 
                error: 'Card not found',
                message: 'The specified card was not found.'
            });
        }
        
        // In production: Integrate with Ramp Network API for actual top-up
        // const rampResponse = await axios.post(`https://api.ramp.network/v1/cards/${cardId}/top-up`, {
        //     amount: amount,
        //     currency: currency
        // }, {
        //     headers: {
        //         'Authorization': `Bearer ${process.env.RAMP_API_KEY}`,
        //         'Content-Type': 'application/json'
        //     }
        // });
        
        // Update card balance for demo
        userCardList[cardIndex].balance += amount;
        userCards.set(userId, userCardList);
        
        res.json({
            success: true,
            message: `Card topped up successfully with ${amount} ${currency}`,
            newBalance: userCardList[cardIndex].balance,
            // In production: rampResponse.data
        });
        
    } catch (error) {
        console.error('Top-up error:', error.message);
        res.status(500).json({ 
            error: 'Failed to top up card',
            message: 'Unable to process top-up. Please try again later.'
        });
    }
});

// Get card transactions
app.get('/api/cards/:cardId/transactions', async (req, res) => {
    try {
        const { cardId } = req.params;
        
        // In production: Authenticate user and get user ID
        const userId = demoUserId; // Replace with actual user authentication
        
        // Find the card
        const userCardList = userCards.get(userId) || [];
        const card = userCardList.find(c => c.id === cardId);
        
        if (!card) {
            return res.status(404).json({ 
                error: 'Card not found',
                message: 'The specified card was not found.'
            });
        }
        
        res.json({
            success: true,
            transactions: card.transactions || []
        });
        
    } catch (error) {
        console.error('Get transactions error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch transactions',
            message: 'Unable to retrieve transaction history. Please try again later.'
        });
    }
});

// Process card creation payment ($5 charge)
app.post('/api/cards/payment', async (req, res) => {
    try {
        const { amount = 5, currency = 'USDT', paymentMethod = 'crypto' } = req.body;
        
        // Validate payment amount
        if (amount < 5) {
            return res.status(400).json({ 
                error: 'Invalid payment amount',
                message: 'Minimum payment amount is $5 USD'
            });
        }
        
        // In production: Authenticate user and get user ID
        const userId = demoUserId; // Replace with actual user authentication
        
        // Check if user has sufficient balance
        const userWallet = db.getWallet(userId);
        const usdtBalance = userWallet.find(w => w.asset === 'USDT')?.balance || 0;
        
        if (usdtBalance < amount) {
            return res.status(402).json({ 
                error: 'Insufficient balance',
                message: `Insufficient USDT balance. Required: ${amount}, Available: ${usdtBalance}`,
                required: amount,
                available: usdtBalance
            });
        }
        
        // Deduct payment from user's USDT balance
        db.updateBalance(userId, 'USDT', usdtBalance - amount);
        
        // Create payment record
        const paymentId = `payment_${Date.now()}`;
        const paymentRecord = {
            id: paymentId,
            userId: userId,
            amount: amount,
            currency: currency,
            type: 'card_creation_fee',
            status: 'completed',
            createdAt: new Date().toISOString(),
            description: 'Virtual card creation fee'
        };
        
        // Store payment record (in production, use proper database)
        if (!userPayments.has(userId)) {
            userPayments.set(userId, []);
        }
        userPayments.get(userId).push(paymentRecord);
        
        // Mark user as having paid for card creation
        userCardPayments.set(userId, {
            hasPaid: true,
            paymentId: paymentId,
            amount: amount,
            paidAt: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'Card creation payment processed successfully',
            payment: paymentRecord,
            newBalance: usdtBalance - amount
        });
        
    } catch (error) {
        console.error('❌ Card payment error:', error.message);
        res.status(500).json({ 
            error: 'Payment processing failed',
            message: 'Unable to process card creation payment. Please try again later.'
        });
    }
});

// Check if user has paid for card creation
app.get('/api/cards/payment-status', async (req, res) => {
    try {
        // In production: Authenticate user and get user ID
        const userId = demoUserId; // Replace with actual user authentication
        
        const paymentStatus = userCardPayments.get(userId) || { hasPaid: false };
        
        res.json({
            success: true,
            hasPaid: paymentStatus.hasPaid,
            paymentDetails: paymentStatus.hasPaid ? paymentStatus : null
        });
        
    } catch (error) {
        console.error('❌ Payment status error:', error.message);
        res.status(500).json({ 
            error: 'Failed to check payment status',
            message: 'Unable to retrieve payment status. Please try again later.'
        });
    }
});

// ==================== TRADING ENDPOINTS ====================

// Get available trading pairs
app.get('/api/trading/pairs', async (req, res) => {
    try {
        const pairs = tradingService.getTradingPairs();
        res.json({
            success: true,
            pairs: pairs
        });
    } catch (error) {
        console.error('❌ Error fetching trading pairs:', error);
        res.status(500).json({ 
            error: 'Failed to fetch trading pairs',
            message: error.message 
        });
    }
});

// Get 24h ticker data for a pair
app.get('/api/trading/ticker/:pair', async (req, res) => {
    try {
        const { pair } = req.params;
        const ticker = await tradingService.get24hTicker(pair);
        
        if (!ticker) {
            return res.status(404).json({ 
                error: 'Ticker data not found',
                message: 'Unable to fetch 24h ticker data' 
            });
        }
        
        res.json({
            success: true,
            ticker: ticker
        });
    } catch (error) {
        console.error('❌ Error fetching ticker:', error);
        res.status(500).json({ 
            error: 'Failed to fetch ticker data',
            message: error.message 
        });
    }
});

// Get order book depth
app.get('/api/trading/depth', async (req, res) => {
    try {
        const { pair, limit = 20 } = req.query;
        
        if (!pair) {
            return res.status(400).json({ 
                error: 'Missing required parameter',
                message: 'pair parameter is required' 
            });
        }
        
        const depth = tradingService.getOrderBook(pair, parseInt(limit));
        res.json({
            success: true,
            depth: depth
        });
    } catch (error) {
        console.error('❌ Error fetching order book:', error);
        res.status(500).json({ 
            error: 'Failed to fetch order book',
            message: error.message 
        });
    }
});

// --- Exchange Core Endpoints ---

// Get Real-Time Order Book from Matching Engine
app.get('/api/exchange/depth', (req, res) => {
    try {
        const depth = matchingEngine.getOrderBook();
        res.json({
            success: true,
            depth: depth
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Place Exchange Order
app.post('/api/exchange/order', (req, res) => {
    try {
        const { side, type, price, amount } = req.body;
        
        if (!side || !type || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const result = matchingEngine.placeOrder({
            side,
            type,
            price: parseFloat(price),
            amount: parseFloat(amount)
        });
        
        res.json({
            success: true,
            result: result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get candlestick data
app.get('/api/trading/candles', async (req, res) => {
    try {
        const { pair, interval = '15m', start, end } = req.query;
        
        if (!pair) {
            return res.status(400).json({ 
                error: 'Missing required parameter',
                message: 'pair parameter is required' 
            });
        }
        
        const candles = tradingService.getCandles(pair, interval, start, end);
        res.json({
            success: true,
            candles: candles
        });
    } catch (error) {
        console.error('❌ Error fetching candles:', error);
        res.status(500).json({ 
            error: 'Failed to fetch candle data',
            message: error.message 
        });
    }
});

// Create new order
app.post('/api/trading/order', authenticateToken, async (req, res) => {
    try {
        const { pair, side, type, quantity, price, timeInForce = 'GTC', leverage = 1, marginMode = 'cross' } = req.body;
        
        // Validate required fields
        if (!pair || !side || !type || !quantity) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'pair, side, type, and quantity are required' 
            });
        }
        
        // Validate order type
        const validTypes = ['market', 'limit', 'stop'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ 
                error: 'Invalid order type',
                message: 'Order type must be one of: market, limit, stop' 
            });
        }
        
        // Validate side
        const validSides = ['buy', 'sell'];
        if (!validSides.includes(side)) {
            return res.status(400).json({ 
                error: 'Invalid side',
                message: 'Side must be either buy or sell' 
            });
        }
        
        const userId = req.user.id;
        
        const order = await tradingService.createOrder(userId, {
            pair, side, type, quantity, price, timeInForce, leverage, marginMode
        });
        
        // Add position to portfolio service for market orders
        if (type === 'market' && order.status === 'filled') {
            const coin = pair.replace('USDT', ''); // Extract coin from pair
            portfolioService.addPosition(userId, {
                id: order.id,
                coin: coin,
                side: side === 'buy' ? 'long' : 'short',
                avgEntry: order.avgPrice || price || await getCurrentPrice(pair),
                qty: quantity,
                leverage: leverage,
                tp: null, // No TP/SL set by default
                sl: null
            });
        }
        
        res.json({
            success: true,
            order: order,
            message: 'Order created successfully'
        });
        
    } catch (error) {
        console.error('❌ Error creating order:', error);
        res.status(400).json({ 
            error: 'Order creation failed',
            message: error.message 
        });
    }
});

// Get user orders
app.get('/api/trading/orders', authenticateToken, async (req, res) => {
    try {
        const { status } = req.query;
        
        const userId = req.user.id;
        
        const orders = tradingService.getUserOrders(userId, status);
        res.json({
            success: true,
            orders: orders,
            count: orders.length
        });
    } catch (error) {
        console.error('❌ Error fetching orders:', error);
        res.status(500).json({ 
            error: 'Failed to fetch orders',
            message: error.message 
        });
    }
});

// Cancel order
app.delete('/api/trading/order/:orderId', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const userId = req.user.id;
        
        const cancelledOrder = tradingService.cancelOrder(userId, orderId);
        
        res.json({
            success: true,
            order: cancelledOrder,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        console.error('❌ Error cancelling order:', error);
        res.status(400).json({ 
            error: 'Order cancellation failed',
            message: error.message 
        });
    }
});

// Get user positions
app.get('/api/trading/positions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const positions = tradingService.getUserPositions(userId);
        const positionsArray = Array.from(positions.entries()).map(([pair, position]) => ({
            pair,
            ...position
        }));
        
        res.json({
            success: true,
            positions: positionsArray,
            count: positionsArray.length
        });
    } catch (error) {
        console.error('❌ Error fetching positions:', error);
        res.status(500).json({ 
            error: 'Failed to fetch positions',
            message: error.message 
        });
    }
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get portfolio live data
app.get('/api/portfolio/:userId/live', async (req, res) => {
    try {
        const { userId } = req.params;
        const portfolio = portfolioService.calculatePortfolio(userId);
        
        res.json({
            success: true,
            data: portfolio
        });
    } catch (error) {
        console.error('Portfolio fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch portfolio'
        });
    }
});

// Get news impact
app.get('/api/news/impact', async (req, res) => {
    try {
        const { coins } = req.query;
        const coinList = coins ? coins.split(',') : null;
        const news = newsService.getNewsForCoins(coinList, 10);
        
        res.json({
            success: true,
            data: news
        });
    } catch (error) {
        console.error('News fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch news'
        });
    }
});

// Get high impact news
app.get('/api/news/high-impact', async (req, res) => {
    try {
        const highImpactNews = newsService.getHighImpactNews(5);
        
        res.json({
            success: true,
            data: highImpactNews
        });
    } catch (error) {
        console.error('High impact news fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch high impact news'
        });
    }
});

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Crypto Trading Vault Backend",
        version: "2.0.0",
        endpoints: {
            websocket: 'ws://localhost:3000',
            webhook: `/webhook/${process.env.BOT_TOKEN ? '[CONFIGURED]' : '[NOT_CONFIGURED]'}`,
            health: '/health',
            portfolio: {
                live: '/api/portfolio/:userId/live'
            },
            news: {
                impact: '/api/news/impact?coins=BTC,ETH',
                highImpact: '/api/news/high-impact'
            },
            trading: {
                pairs: '/api/trading/pairs',
                ticker: '/api/trading/ticker/:pair',
                depth: '/api/trading/depth',
                candles: '/api/trading/candles',
                order: '/api/trading/order',
                orders: '/api/trading/orders',
                positions: '/api/trading/positions',
                cancelOrder: '/api/trading/order/:orderId'
            }
        }
    });
});

const PORT = process.env.PORT || 3000;

// Create HTTP server for WebSocket support
const server = require('http').createServer(app);

// Initialize WebSocket Service
const webSocketService = WebSocketService.init(server);
console.log("🔌 WebSocket service initialized");

// Connect Matching Engine to WebSocket Service for broadcasting
// Note: You might need to add setBroadcaster to MatchingEngine if not present
if (typeof matchingEngine.setBroadcaster === 'function') {
    matchingEngine.setBroadcaster((channel, data) => {
        if (channel === 'depthUpdate') {
            webSocketService.broadcastDepth(data, data.symbol);
        } else if (channel === 'tradeUpdate') {
            webSocketService.broadcastTrade(data, data.symbol);
        }
    });
} else {
    // Fallback or direct integration if setBroadcaster is missing
    console.log("MatchingEngine does not support setBroadcaster yet.");
}

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 WebSocket server: ws://localhost:${PORT}`);

    // Start bot in polling mode for development
    if (process.env.NODE_ENV !== 'production') {
        console.log("🤖 Starting bot in polling mode (development)...");
        bot.start({
            onStart: (botInfo) => {
                console.log(`✅ Bot @${botInfo.username} is running!`);
            }
        });
    } else {
        console.log("🌐 Running in webhook mode (production)");
    }
});

// Graceful shutdown
process.once("SIGINT", () => {
    console.log("\n🛑 Shutting down gracefully...");
    bot.stop();
    process.exit(0);
});

process.once("SIGTERM", () => {
    console.log("\n🛑 Shutting down gracefully...");
    bot.stop();
    process.exit(0);
});