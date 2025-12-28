# Crypto Vault Backend

Backend server for the Crypto Trading Vault Telegram Bot.

## Features

- 🤖 Telegram Bot with grammY framework
- 🌐 Express.js REST API
- 🔄 Webhook support for production
- 🔧 Polling mode for development
- ✅ Health check endpoint

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your bot token from @BotFather.

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Bot Commands

- `/start` - Welcome message
- `/menu` - Open trading dashboard
- `/portfolio` - View portfolio
- `/help` - Show help

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `POST /webhook/:token` - Telegram webhook (production)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BOT_TOKEN` | Telegram bot token from @BotFather | Yes |
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment (development/production) | No |
| `WEBHOOK_DOMAIN` | Public domain for webhooks | Production only |

## Development vs Production

**Development Mode:**
- Uses polling to receive updates
- Auto-restarts on file changes (nodemon)
- Runs on localhost

**Production Mode:**
- Uses webhooks for updates
- Requires public HTTPS domain
- Set `NODE_ENV=production`
