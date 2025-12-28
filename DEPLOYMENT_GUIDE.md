# 🚀 Deployment Guide

## Current Status
✅ Frontend Build: Complete (dist folder ready)
✅ Backend: Running locally on port 3001
⚠️  Deployment: Requires manual authentication

## Next Steps Required

### 1. Frontend Deployment (Vercel)
**Status**: Build ready, needs Vercel authentication

**Manual Steps**:
1. Go to https://vercel.com and sign up/login
2. Click "New Project"
3. Import your GitHub repository OR use drag-and-drop deployment
4. For drag-and-drop: Upload the entire `aetheria-web/dist` folder
5. Set environment variables in Vercel dashboard:
   - `VITE_BACKEND_URL`: Your backend URL (to be set after backend deployment)
   - `VITE_WS_URL`: Your WebSocket URL (to be set after backend deployment)

**Expected URL**: `https://aetheria-exchange-[random].vercel.app`

### 2. Backend Deployment (Railway)
**Status**: Ready for deployment

**Manual Steps**:
1. Go to https://railway.app and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository with the crypto-vault-backend folder
4. Set environment variables in Railway dashboard:
   ```
   PORT=3000
   BOT_TOKEN=your_telegram_bot_token
   JWT_SECRET=your_secure_random_string
   NODE_ENV=production
   ```
5. Deploy the project

**Alternative**: Use Render.com
1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub repository
4. Set build command: `npm install`
5. Set start command: `node index.js`
6. Add environment variables as above

**Expected URL**: `https://your-backend-[random].railway.app` or `https://your-backend-[random].onrender.com`

### 3. Update Environment Variables
After both deployments are complete:

1. **In Vercel Dashboard** (Frontend):
   - Update `VITE_BACKEND_URL` to your Railway/Render backend URL
   - Update `VITE_WS_URL` to `wss://your-backend-url` (note the `wss://` for WebSocket)

2. **Redeploy frontend** after setting environment variables

### 4. Telegram Bot Configuration
1. Go to @BotFather in Telegram
2. Send `/mybots` and select your bot
3. Go to "Bot Settings" → "Menu Button"
4. Set the URL to your Vercel frontend URL
5. Test by opening your bot in Telegram and clicking the menu button

### 5. Verification
- Frontend should load at your Vercel URL
- Backend health check: `https://your-backend-url/health`
- WebSocket connection should work: `wss://your-backend-url`
- Telegram Mini App should load when accessing through bot menu

## Files Ready for Deployment

### Frontend (aetheria-web/dist/)
- index.html
- assets/index-Cr1E-zOI.css
- assets/index-DAMOO_hw.js
- tonconnect-manifest.json
- vite.svg

### Backend (crypto-vault-backend/)
- index.js (main server file)
- package.json (dependencies)
- railway.json (Railway config)
- Procfile (Process file for hosting platforms)
- All service files in /services/, /middleware/, /utils/

## Current Local URLs
- Frontend Dev: http://localhost:5173
- Backend API: http://localhost:3001
- WebSocket: ws://localhost:3001

## Production URLs (To Be Set)
- Frontend: `https://[your-vercel-url].vercel.app`
- Backend API: `https://[your-railway-url].railway.app`
- WebSocket: `wss://[your-railway-url].railway.app`

## 🚨 Important Notes
1. **HTTPS Required**: Telegram Mini Apps require HTTPS
2. **CORS**: Backend is configured to allow all origins (update for production)
3. **Database**: SQLite will work on Railway/Render with persistent volumes
4. **Redis**: Currently using in-memory fallback (consider Redis addon for production)
5. **Bot Token**: Get from @BotFather in Telegram
6. **JWT Secret**: Generate a secure random string for production

## Support
If you encounter issues:
1. Check build logs in Vercel/Railway dashboards
2. Verify environment variables are set correctly
3. Test health endpoints
4. Check browser console for frontend errors
5. Verify Telegram bot settings in @BotFather