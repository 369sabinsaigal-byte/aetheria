#!/bin/bash

echo "🚀 Aetheria Exchange Deployment Script"
echo "======================================"

# Check if build exists
if [ ! -d "dist" ]; then
    echo "❌ Frontend build not found. Running build..."
    npm run build
fi

echo "✅ Frontend build ready"
echo ""

# Vercel deployment (requires authentication)
echo "📦 Deploying Frontend to Vercel..."
echo "Please ensure you are logged into Vercel CLI"
echo "If not, run: vercel login"
echo ""

# Deploy to Vercel
vercel deploy --prod --yes

echo ""
echo "🔄 Backend deployment to Railway..."
echo "Please ensure you are logged into Railway CLI"
echo "If not, run: railway login"
echo ""

# Navigate to backend and deploy
cd ../crypto-vault-backend
railway up --environment production

echo ""
echo "✅ Deployment script completed!"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Set environment variables in Railway dashboard"
echo "3. Configure Telegram bot with @BotFather"
echo "4. Update frontend environment variables to point to backend"
echo ""
echo "See DEPLOYMENT_GUIDE.md for detailed instructions"