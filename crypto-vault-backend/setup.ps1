# Setup Script for Crypto Vault Backend
# Run this script after getting your bot token from @BotFather

Write-Host "🏦 Crypto Vault Backend Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env already exists
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne 'y') {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit
    }
}

Write-Host "Please follow these steps to get your bot token:" -ForegroundColor Green
Write-Host "1. Open Telegram and search for @BotFather" -ForegroundColor White
Write-Host "2. Send /newbot" -ForegroundColor White
Write-Host "3. Choose a name (e.g., 'Crypto Trading Vault')" -ForegroundColor White
Write-Host "4. Choose a username (must end in 'bot', e.g., 'your_crypto_vault_bot')" -ForegroundColor White
Write-Host "5. Copy the bot token that BotFather gives you" -ForegroundColor White
Write-Host ""

$botToken = Read-Host "Enter your bot token"

if ([string]::IsNullOrWhiteSpace($botToken)) {
    Write-Host "❌ No token provided. Setup cancelled." -ForegroundColor Red
    exit
}

# Create .env file
$envContent = @"
# Telegram Bot Configuration
BOT_TOKEN=$botToken

# Server Configuration
PORT=3000
NODE_ENV=development

# Webhook Configuration (for production deployment)
WEBHOOK_DOMAIN=https://your-app-domain.com
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run dev" -ForegroundColor White
Write-Host "2. Open Telegram and send /start to your bot" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Your bot is ready to launch!" -ForegroundColor Green
