const db = require('./db');

class MatchingEngine {
  constructor(symbol) {
    this.symbol = symbol;
    this.bids = []; // Buy orders: [{ price, amount, id, total, userId }] (Sorted DESC)
    this.asks = []; // Sell orders: [{ price, amount, id, total, userId }] (Sorted ASC)
    this.trades = []; // History
    
    // Load open orders from DB
    this.loadState();
  }

  loadState() {
    // In a real app, we would query DB for open orders for this symbol
    // For MVP, we'll just seed if empty
    this.seedLiquidity();
  }

  seedLiquidity() {
    const basePrice = this.symbol === 'BTC/USDT' ? 87500 : 3000;
    // ... (keep existing seeding logic for demo liquidity)
    for (let i = 0; i < 10; i++) {
      this.asks.push({
        id: `seed-ask-${i}`,
        userId: 'market-maker',
        price: basePrice + i * 5 + Math.random() * 2,
        amount: Math.random() * 2 + 0.1,
        total: 0 
      });
    }
    for (let i = 0; i < 10; i++) {
      this.bids.push({
        id: `seed-bid-${i}`,
        userId: 'market-maker',
        price: basePrice - i * 5 - Math.random() * 2,
        amount: Math.random() * 2 + 0.1,
        total: 0
      });
    }
    this.sortBook();
  }

  sortBook() {
    this.bids.sort((a, b) => b.price - a.price);
    this.asks.sort((a, b) => a.price - b.price);
  }

  setBroadcaster(callback) {
    this.broadcaster = callback;
  }

  broadcast(channel, data) {
    if (this.broadcaster) {
      this.broadcaster(channel, data);
    }
  }

  getOrderBook() {
    // ... (keep existing logic)
    let bidTotal = 0;
    const bidsWithTotal = this.bids.map(b => {
      bidTotal += b.amount;
      return { ...b, total: bidTotal };
    });

    let askTotal = 0;
    const asksWithTotal = this.asks.map(a => {
      askTotal += a.amount;
      return { ...a, total: askTotal };
    });

    return {
      symbol: this.symbol,
      bids: bidsWithTotal.slice(0, 20),
      asks: asksWithTotal.slice(0, 20),
      spread: this.asks.length > 0 && this.bids.length > 0 ? this.asks[0].price - this.bids[0].price : 0
    };
  }

  placeOrder(order) {
    // order: { side, type, price, amount, userId }
    const { side, type, price, amount, userId } = order;
    
    // Persist Order to DB
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    try {
        db.createOrder({
            id: orderId,
            user_id: userId,
            pair: this.symbol,
            side,
            type,
            price: price || 0, // Market order might have 0 price initially
            amount
        });
    } catch (e) {
        console.error("DB Error creating order:", e);
    }

    let remainingAmount = amount;
    const executedTrades = [];

    // Simple Matching Logic (In-Memory)
    if (side === 'buy') {
      while (remainingAmount > 0 && this.asks.length > 0) {
        const bestAsk = this.asks[0];
        if (type === 'limit' && price < bestAsk.price) break;

        const tradePrice = bestAsk.price;
        const tradeAmount = Math.min(remainingAmount, bestAsk.amount);

        executedTrades.push({ price: tradePrice, amount: tradeAmount, side: 'buy', time: new Date().toISOString() });
        
        // DB Update: Trade
        // db.createTrade(...) - To be implemented

        remainingAmount -= tradeAmount;
        bestAsk.amount -= tradeAmount;
        
        // DB Update: Maker Order
        // db.updateOrder(bestAsk.id, tradeAmount, 'partial')

        if (bestAsk.amount <= 0.000001) {
          this.asks.shift();
          // DB Update: Maker Order Filled
        }
      }

      if (type === 'limit' && remainingAmount > 0) {
        this.bids.push({ id: orderId, userId, price, amount: remainingAmount, total: 0 });
        this.sortBook();
      }
    } else {
      // Sell Side
      while (remainingAmount > 0 && this.bids.length > 0) {
        const bestBid = this.bids[0];
        if (type === 'limit' && price > bestBid.price) break;

        const tradePrice = bestBid.price;
        const tradeAmount = Math.min(remainingAmount, bestBid.amount);

        executedTrades.push({ price: tradePrice, amount: tradeAmount, side: 'sell', time: new Date().toISOString() });

        remainingAmount -= tradeAmount;
        bestBid.amount -= tradeAmount;

        if (bestBid.amount <= 0.000001) {
          this.bids.shift();
        }
      }

      if (type === 'limit' && remainingAmount > 0) {
        this.asks.push({ id: orderId, userId, price, amount: remainingAmount, total: 0 });
        this.sortBook();
      }
    }
    
    // Update Taker Order in DB
    const filled = amount - remainingAmount;
    try {
        db.updateOrder(orderId, filled, remainingAmount <= 0 ? 'filled' : 'partial');
    } catch (e) {
        console.error("DB Error updating order:", e);
    }

    // Broadcast updates
    if (executedTrades.length > 0) {
        executedTrades.forEach(trade => {
             this.broadcast('tradeUpdate', { symbol: this.symbol, ...trade });
        });
    }
    this.broadcast('depthUpdate', this.getOrderBook());
    
    return {
      success: true,
      orderId,
      filled,
      remaining: remainingAmount,
      trades: executedTrades
    };
  }
}

module.exports = new MatchingEngine('BTC/USDT');
