const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, 'exchange.db'));

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize Schema
function init() {
    console.log('📦 Initializing Database Schema...');
    
    // Users Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            telegram_id TEXT UNIQUE,
            username TEXT,
            first_name TEXT,
            last_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Wallets Table (Balances)
    db.exec(`
        CREATE TABLE IF NOT EXISTS wallets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            asset TEXT,
            balance REAL DEFAULT 0,
            locked REAL DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            UNIQUE(user_id, asset)
        )
    `);

    // Orders Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            pair TEXT,
            side TEXT CHECK(side IN ('buy', 'sell')),
            type TEXT CHECK(type IN ('market', 'limit', 'stop')),
            price REAL,
            amount REAL,
            filled REAL DEFAULT 0,
            remaining REAL,
            status TEXT CHECK(status IN ('open', 'filled', 'partial', 'cancelled')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);

    // Trades Table (Execution History)
    db.exec(`
        CREATE TABLE IF NOT EXISTS trades (
            id TEXT PRIMARY KEY,
            maker_order_id TEXT,
            taker_order_id TEXT,
            pair TEXT,
            price REAL,
            amount REAL,
            side TEXT, -- 'buy' or 'sell' from taker perspective
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✅ Database Schema Ready');

    // Ensure demo user exists
    try {
        const demoUser = db.prepare('SELECT * FROM users WHERE id = ?').get('demo-user-id');
        if (!demoUser) {
            console.log('👤 Creating demo user...');
            db.prepare(`
                INSERT INTO users (id, telegram_id, username, first_name, last_name)
                VALUES (?, ?, ?, ?, ?)
            `).run('demo-user-id', 'demo_123', 'demouser', 'Demo', 'User');
            
            // Give demo user some initial balance
            db.prepare(`
                INSERT INTO wallets (user_id, asset, balance, locked)
                VALUES (?, ?, ?, ?)
            `).run('demo-user-id', 'USDT', 10000, 0);
            
            console.log('✅ Demo user created with 10,000 USDT');
        }
    } catch (err) {
        console.error('Error creating demo user:', err);
    }
}

// User Methods
function createUser(user) {
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO users (id, telegram_id, username, first_name, last_name)
        VALUES (@id, @telegram_id, @username, @first_name, @last_name)
    `);
    return stmt.run(user);
}

function getUser(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

// Wallet Methods
function getBalance(userId, asset) {
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ? AND asset = ?').get(userId, asset);
    return wallet || { balance: 0, locked: 0 };
}

function updateBalance(userId, asset, change, lockedChange = 0) {
    const stmt = db.prepare(`
        INSERT INTO wallets (user_id, asset, balance, locked)
        VALUES (@userId, @asset, @balance, @locked)
        ON CONFLICT(user_id, asset) DO UPDATE SET
        balance = balance + @change,
        locked = locked + @lockedChange,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    // For new insert, we need absolute values, but SQL update uses relative.
    // This simple logic assumes the row exists or we handle it carefully.
    // Better approach: Check existence first or use UPSERT logic tailored.
    
    // Simplified UPSERT for balance + change
    const upsert = db.prepare(`
        INSERT INTO wallets (user_id, asset, balance, locked)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, asset) DO UPDATE SET
        balance = balance + ?,
        locked = locked + ?
    `);
    
    // Initial values if row doesn't exist: change, lockedChange
    return upsert.run(userId, asset, change, lockedChange, change, lockedChange);
}

// Order Methods
function createOrder(order) {
    const stmt = db.prepare(`
        INSERT INTO orders (id, user_id, pair, side, type, price, amount, remaining, status)
        VALUES (@id, @user_id, @pair, @side, @type, @price, @amount, @amount, 'open')
    `);
    return stmt.run(order);
}

function updateOrder(id, filled, status) {
    const stmt = db.prepare(`
        UPDATE orders 
        SET filled = filled + ?, remaining = remaining - ?, status = ?
        WHERE id = ?
    `);
    // Note: status logic needs to be careful (e.g. don't set 'filled' if partial)
    // For MVP we just set what's passed
    const current = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    const newFilled = current.filled + filled;
    const newRemaining = current.remaining - filled;
    const newStatus = newRemaining <= 0.00000001 ? 'filled' : 'partial';
    
    const update = db.prepare('UPDATE orders SET filled = ?, remaining = ?, status = ? WHERE id = ?');
    return update.run(newFilled, newRemaining, newStatus, id);
}

function getOpenOrders(userId) {
    return db.prepare("SELECT * FROM orders WHERE user_id = ? AND status IN ('open', 'partial')").all(userId);
}

function getWallet(userId) {
    return db.prepare('SELECT * FROM wallets WHERE user_id = ?').all(userId);
}

function getTrades(userId) {
    // Basic query, might need optimization for large datasets
    // Join logic or multiple queries might be better, but this works for MVP
    // We assume orders table links back to user
    return db.prepare(`
        SELECT t.*, o.side as order_side, o.pair 
        FROM trades t 
        JOIN orders o ON t.taker_order_id = o.id 
        WHERE o.user_id = ?
        ORDER BY t.executed_at DESC LIMIT 50
    `).all(userId);
}

// Initialize on load
init();

module.exports = {
    db,
    createUser,
    getUser,
    getBalance,
    updateBalance,
    createOrder,
    updateOrder,
    getOpenOrders,
    getWallet,
    getTrades
};
