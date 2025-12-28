# 🏦 Crypto Trading Vault

A Telegram Bot with Mini App interface for cryptocurrency trading. Features a premium dark theme, real-time portfolio tracking, and seamless Telegram integration.

![Phase](https://img.shields.io/badge/Phase-1-blue) ![Status](https://img.shields.io/badge/Status-Development-yellow)

## 🚀 Features

### Current (Phase 1)
- ✅ **Telegram Bot** with grammY framework
- ✅ **Mini App Interface** with React + TypeScript + Vite
- ✅ **Premium UI** with glassmorphism and vibrant gradients
- ✅ **Telegram SDK Integration** for seamless in-app experience
- ✅ **Trading Dashboard** with portfolio overview
- ✅ **Quick Actions** for trading operations
- ✅ **User Authentication** via Telegram

### Coming Soon
- 🔜 **Phase 2**: PostgreSQL database for user data and transactions
- 🔜 **Phase 3**: Binance API integration for live trading

## 📁 Project Structure

```
crypto-trading-vault/
├── crypto-vault-backend/      # Node.js + Express + grammY
│   ├── index.js               # Main server & bot logic
│   ├── package.json           # Dependencies
│   ├── .env.example           # Environment template
│   └── README.md              # Backend documentation
│
├── crypto-vault-miniapp/      # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx            # Main dashboard component
│   │   ├── App.css            # Premium styling
│   │   ├── telegram.ts        # Telegram SDK utilities
│   │   └── main.tsx           # App entry point
│   ├── package.json
│   └── README.md              # Frontend documentation
│
└── README.md                  # This file
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Telegram account
- Code editor (VS Code recommended)

### Step 1: Create Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/botfather)
2. Use `/newbot` command to create a bot
3. Save the bot token provided
4. Use `/setmenubutton` to configure the menu button (use placeholder URL for now)

### Step 2: Set Up Backend

```bash
cd crypto-vault-backend
npm install
cp .env.example .env
```

Edit `.env` and add your bot token:
```env
BOT_TOKEN=your_bot_token_here
PORT=3000
NODE_ENV=development
```

Start the backend:
```bash
npm run dev
```

The bot should now be running and responding to commands like `/start`!

### Step 3: Set Up Frontend

```bash
cd crypto-vault-miniapp
npm install
npm run dev
```

The Mini App will be available at `http://localhost:5173`

## 🎨 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Bot Library**: grammY
- **Environment**: dotenv

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Telegram**: @telegram-apps/sdk
- **Styling**: CSS with custom design system

## 📚 Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and overview |
| `/menu` | Open trading dashboard |
| `/portfolio` | View your portfolio |
| `/help` | Show help message |

## 🚢 Deployment

### Backend Deployment (Railway/Fly.io)

1. Create account on Railway or Fly.io
2. Connect your repository
3. Set environment variables (BOT_TOKEN, NODE_ENV=production, WEBHOOK_DOMAIN)
4. Deploy!

### Frontend Deployment (Vercel)

1. Create account on Vercel
2. Import your repository
3. Deploy with default settings
4. Update bot menu button with deployed URL

### After Deployment

Update your bot's webhook and menu button:
```bash
# Set webhook (in production)
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-backend.com/webhook/<TOKEN>"

# Update menu button via @BotFather
/setmenubutton
# Enter your deployed frontend URL
```

## 🗺️ Roadmap

### ✅ Phase 1: Tech Stack & Project Setup
- Backend server with bot commands
- Frontend Mini App with Telegram integration
- Premium UI/UX design
- Local development environment

### 🔄 Phase 2: Database Schema Design (Next)
- PostgreSQL database setup
- User accounts and authentication
- Wallet balance tracking
- Transaction history
- Redis for caching

### 📋 Phase 3: Exchange API Integration (Future)
- Binance Testnet API integration
- Live market data
- Order placement and management
- Real-time portfolio updates
- Trading history and analytics

## 🤝 Development

### Running Locally

**Backend:**
```bash
cd crypto-vault-backend
npm run dev  # Uses nodemon for auto-restart
```

**Frontend:**
```bash
cd crypto-vault-miniapp
npm run dev  # Uses Vite HMR
```

### Building for Production

**Backend:**
```bash
npm start  # Runs with Node.js in production mode
```

**Frontend:**
```bash
npm run build  # Creates optimized production bundle
npm run preview  # Preview production build
```

## 📄 License

MIT License - feel free to use this project for your own trading bot!

## 🙏 Acknowledgments

- [grammY](https://grammy.dev/) - Modern Telegram Bot framework
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps) - Official SDK
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [React](https://react.dev/) - UI library

---

**Ready to start trading?** Follow the setup instructions above and get your bot running in minutes! 🚀
