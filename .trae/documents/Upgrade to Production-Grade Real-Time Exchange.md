# Phase 6: Upgrade to Production-Grade Exchange (Real-Time & Persistence)

To transform this from a local MVP into a "100% legit" exchange like Binance/Bybit, we need to replace the in-memory simulations with robust, scalable infrastructure. This is a massive undertaking, so I will break it down into a concrete execution plan starting with the most critical component: **Persistence & Authentication**.

## 1. 💾 Persistence Layer (Database)
**Goal**: Replace in-memory `Map` storage with a real database to persist users, orders, and balances.
- **Technology**: **PostgreSQL** (via `pg` and raw SQL or a light query builder like `knex`).
- **Implementation**:
  - **Schema Design**:
    - `users`: id, telegram_id, created_at.
    - `wallets`: id, user_id, asset, balance, address.
    - `orders`: id, user_id, pair, side, type, price, amount, status, created_at.
    - `trades`: id, maker_order_id, taker_order_id, price, amount, executed_at.
  - **Migration**: Create initialization scripts to set up tables on startup if they don't exist.
  - **Service Update**: Rewrite `portfolio-service.js` and `matching-engine.js` to read/write to DB.

## 2. 🔐 Production Security (Authentication)
**Goal**: Secure the API with real JWTs and signature verification.
- **Implementation**:
  - **Telegram Auth**: Verify the cryptographic signature of `initData` from Telegram to prevent spoofing.
  - **JWT Middleware**: Issue signed JWTs (using `jsonwebtoken`) instead of base64 strings.
  - **Route Protection**: Apply `authenticateToken` middleware to all `/api/trading` and `/api/portfolio` routes.

## 3. ⚡ Real-Time WebSocket Architecture
**Goal**: Push updates instantly (orders fills, ticker changes) instead of frontend polling.
- **Implementation**:
  - **Upgrade WebSocket Server**:
    - Channel subscription model (e.g., `subscribe:ticker:BTCUSDT`, `subscribe:user:orders`).
  - **Broadcast Events**:
    - When `MatchingEngine` matches a trade -> Emit `trade` event to specific users via WS.
    - When `OrderBook` updates -> Broadcast `depth` update to all subscribers.

## 4. 📈 Real Market Data Integration
**Goal**: Use real-world data for the chart and order book "seed".
- **Implementation**:
  - **Binance Public API Proxy**:
    - Connect backend to `wss://stream.binance.com:9443/ws` to consume real-time trades/depth for BTC/ETH.
    - Feed this data into our local `MatchingEngine` to act as a "Liquidity Provider" (Market Maker).

## Execution Plan (Immediate Steps)
1.  **Install Dependencies**: `pg`, `jsonwebtoken`, `knex` (or just `pg`).
2.  **Setup Database**: Create a local SQLite or simple file-based DB (like `better-sqlite3`) if Postgres is too heavy for this playground, OR mock the DB layer with persistent JSON files for now to simulate "real" persistence without external deps. *Given the environment, I will use `better-sqlite3` for a robust, file-based SQL database that acts like a real server.*
3.  **Refactor Backend**: Rewrite `index.js` and services to use the DB.
4.  **Secure Auth**: Implement the JWT flow.

*Note: Achieving "100% legit like Binance" also requires a matching engine written in C++/Rust and distributed systems, but this Node.js + SQL implementation will be functionally identical for a high-performance MVP.*
