import { init } from '@tma.js/sdk';

// Initialize Telegram WebApp SDK
export const initTelegram = async () => {
  try {
    // Check if we're in development mode
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      console.log('📱 Running in development mode - Telegram WebApp simulation active');
      return true; // Simulate successful initialization in development
    }
    
    // Only try to initialize Telegram SDK in production/Telegram environment
    await init();
    
    console.log('✅ Telegram WebApp SDK initialized successfully');
    return true;
  } catch (error) {
    console.warn('⚠️ Telegram SDK initialization failed (expected in development):', error);
    return true; // Return true to allow app to continue in development mode
  }
};

// Get user data from Telegram
export const getUserData = () => {
  try {
    // This would normally come from Telegram.WebApp.initData
    // For development, we'll return mock data
    return {
      id: 'telegram_12345',
      firstName: 'Crypto',
      lastName: 'Trader',
      username: 'cryptotrader',
      languageCode: 'en',
      allowsWriteToPm: true
    };
  } catch (error) {
    console.error('Failed to get user data:', error);
    return null;
  }
};

// Haptic feedback
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => {
  try {
    console.log(`Haptic feedback: ${type}`);
    // In a real Telegram app, this would call Telegram.WebApp.HapticFeedback.impactOccurred(type)
  } catch (error) {
    console.error('Failed to trigger haptic feedback:', error);
  }
};

// Close the app
export const closeApp = () => {
  try {
    console.log('Closing app...');
    // In a real Telegram app, this would call Telegram.WebApp.close()
  } catch (error) {
    console.error('Failed to close app:', error);
  }
};