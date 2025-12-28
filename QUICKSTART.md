# 🚀 Quick Start Guide

## Current Status

✅ **Frontend:** Running at http://localhost:5173/
⏳ **Backend:** Waiting for bot token

## Get Your Backend Running (3 Easy Steps)

### Option 1: Use the Setup Script (Recommended)

```powershell
cd crypto-vault-backend
.\setup.ps1
```

The script will guide you through:
1. Getting your bot token from @BotFather
2. Creating the .env file automatically
3. Starting the backend server

### Option 2: Manual Setup

1. **Get Bot Token from Telegram:**
   - Open Telegram
   - Search for `@BotFather`
   - Send `/newbot`
   - Follow the prompts
   - Copy your bot token

2. **Create .env file in `crypto-vault-backend/` folder:**
   ```env
   BOT_TOKEN=your_token_here
   PORT=3000
   NODE_ENV=development
   ```

3. **Start the backend:**
   ```bash
   cd crypto-vault-backend
   npm run dev
   ```

## Testing Your Bot

Once backend is running:

1. Open Telegram
2. Find your bot (search for the username you created)
3. Send `/start` - you should see a welcome message!
4. Send `/menu` - bot will prompt you to use the menu button
5. Try `/help` and `/portfolio` commands

## Accessing the Mini App

- **Local Development:** http://localhost:5173/
- **In Telegram:** You'll need to deploy and update the bot's menu button URL

## Need Help?

- Frontend issues: Check `crypto-vault-miniapp/README.md`
- Backend issues: Check `crypto-vault-backend/README.md`
- Overall guide: Check main `README.md`

---

**Ready?** Run the setup script or follow the manual steps above! 🚀
