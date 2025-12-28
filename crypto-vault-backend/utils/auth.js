const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-prod';

// Verify Telegram Web App Data
function verifyTelegramWebAppData(initData) {
    if (!process.env.BOT_TOKEN) return true; // Dev bypass

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    // Sort keys alphabetically
    const dataCheckString = Array.from(urlParams.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    // HMAC-SHA256 signature
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    return calculatedHash === hash;
}

// Generate JWT
function generateToken(user) {
    return jwt.sign(
        { id: user.id, telegram_id: user.telegram_id },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

// Verify JWT
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return null;
    }
}

module.exports = {
    verifyTelegramWebAppData,
    generateToken,
    verifyToken
};
