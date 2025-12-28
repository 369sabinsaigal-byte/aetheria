# 🚀 Deployment Guide for Aetheria Exchange

This guide covers how to deploy the Aetheria Exchange, including the React frontend (Telegram Mini App) and the Node.js backend.

## 🏗️ Architecture Overview

-   **Frontend (`aetheria-web`)**: React + Vite + TypeScript. Deploys as a static site (SPA).
-   **Backend (`crypto-vault-backend`)**: Node.js + Express + SQLite + WebSockets. Deploys as a long-running service.
-   **Database**: SQLite (embedded in backend). For high-availability production, consider migrating to PostgreSQL, but SQLite works fine for single-instance deployments (e.g., Railway, VPS).

---

## 1️⃣ Frontend Deployment (Telegram Mini App)

The frontend must be served over **HTTPS** to work within Telegram.

### **Recommended: Vercel** (Zero Config)

1.  **Install Vercel CLI**:
    ```bash
    npm install -g vercel
    ```
2.  **Deploy**:
    ```bash
    cd aetheria-web
    vercel
    ```
    -   *Settings*: Accept all defaults (Vite is auto-detected).
    -   *Environment Variables*: Add these in Vercel Dashboard or during deploy:
        -   `VITE_BACKEND_URL`: `https://your-backend-url.com`
        -   `VITE_WS_URL`: `wss://your-backend-url.com`

### **Alternative: Netlify / GitHub Pages**
Build the project locally:
```bash
cd aetheria-web
npm install
npm run build
```
Upload the `dist` folder to any static host.

### **Telegram Configuration**
1.  Open **@BotFather** in Telegram.
2.  Select your bot.
3.  Go to **Menu Button** -> **Configure**.
4.  Enter your **Frontend URL** (e.g., `https://aetheria-exchange.vercel.app`).

---

## 2️⃣ Backend Deployment

The backend requires a persistent environment for the SQLite database (unless you use a cloud DB) and WebSocket support.

### **Recommended: Railway / Render / VPS**

**Railway/Render Steps:**
1.  Connect your GitHub repo.
2.  Root Directory: `crypto-vault-backend`
3.  Build Command: `npm install`
4.  Start Command: `node index.js`
5.  **Environment Variables**:
    ```env
    PORT=3000
    BOT_TOKEN=your_telegram_bot_token
    JWT_SECRET=your_secure_random_string
    NODE_ENV=production
    ```
6.  **Persistent Volume (Crucial for SQLite)**:
    -   Mount a volume to `/app/data` (or wherever `exchange.db` is stored) to prevent data loss on restarts.
    -   *Alternative*: Switch `services/db.js` to use PostgreSQL if persistent volumes are difficult.

### **VPS (Ubuntu/Debian)**
1.  Clone repo.
2.  Install Node.js 18+.
3.  `cd crypto-vault-backend && npm install`.
4.  Use **PM2** to keep it running:
    ```bash
    npm install -g pm2
    pm2 start index.js --name "aetheria-backend"
    pm2 save
    ```
5.  Set up Nginx with SSL (LetsEncrypt) to reverse proxy port 3000.

---

## 3️⃣ Verification

1.  **Check Backend**: Visit `https://your-backend-url.com/api/health` (if endpoint exists) or check logs.
2.  **Check Frontend**: Open the Mini App in Telegram.
3.  **Test Real-Time**: Open the app on two devices. Place an order on one; the other should update instantly via WebSockets.

---

## 🛠️ Troubleshooting

-   **CORS Errors**: Ensure your Backend allows the Frontend domain in `index.js` (currently `cors()` allows all).
-   **WebSocket Failures**: Ensure your load balancer/proxy (Nginx/Cloudflare) supports WebSockets upgrades.
-   **Database Reset**: If using a non-persistent filesystem (like standard Heroku/Vercel functions), data will vanish on restart. Use Railway Volumes or a VPS.
