import { miniApp, themeParams, viewport, initData, init, hapticFeedback } from '@telegram-apps/sdk';

/**
 * Initialize the Telegram Mini App SDK
 * This sets up the app to work seamlessly within Telegram
 */
export function initTelegramWebApp() {
    try {
        // Initialize the SDK
        init();

        // Initialize the Mini App
        if (miniApp.mount.isAvailable()) {
            miniApp.mount();
            miniApp.ready();
        }

        // Expand the app to full viewport height
        if (viewport.mount.isAvailable()) {
            viewport.mount();
            viewport.expand();
        }

        // Apply Telegram theme colors
        if (themeParams.mount.isAvailable()) {
            themeParams.mount();
            applyTheme();
        }

        // Set header color to match app theme
        if (miniApp.setHeaderColor.isAvailable()) {
            miniApp.setHeaderColor('#1a1a2e');
        }

        console.log('✅ Telegram Web App initialized successfully');

    } catch (error) {
        console.error('❌ Failed to initialize Telegram Web App:', error);
    }
}

/**
 * Apply Telegram theme params to CSS variables
 */
function applyTheme() {
    if (!themeParams.isMounted()) return;

    const root = document.documentElement;
    const tp = themeParams.state();

    if (tp) {
        if (tp.bgColor) root.style.setProperty('--color-bg-primary', tp.bgColor);
        if (tp.secondaryBgColor) root.style.setProperty('--color-bg-secondary', tp.secondaryBgColor);
        if (tp.textColor) root.style.setProperty('--color-text-primary', tp.textColor);
        if (tp.hintColor) root.style.setProperty('--color-text-secondary', tp.hintColor);
        if (tp.buttonColor) root.style.setProperty('--color-accent-primary', tp.buttonColor);
        if (tp.buttonTextColor) root.style.setProperty('--color-text-primary', tp.buttonTextColor);
    }
}

/**
 * Trigger Haptic Feedback
 * type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') {
    try {
        if (hapticFeedback.impactOccurred.isAvailable()) {
            hapticFeedback.impactOccurred(type);
        }
    } catch (error) {
        console.error('Haptic feedback error:', error);
    }
}

/**
 * Trigger Notification Feedback
 * type: 'error' | 'success' | 'warning'
 */
export function triggerNotification(type: 'error' | 'success' | 'warning') {
    try {
        if (hapticFeedback.notificationOccurred.isAvailable()) {
            hapticFeedback.notificationOccurred(type);
        }
    } catch (error) {
        console.error('Notification feedback error:', error);
    }
}

/**
 * Get user information from Telegram
 */
export function getTelegramUser() {
    try {
        initData.restore();
        const data = initData.state();
        return data?.user || null;
    } catch (error) {
        console.error('Failed to get Telegram user:', error);
        return null;
    }
}

/**
 * Close the Mini App
 */
export function closeMiniApp() {
    try {
        if (miniApp.close.isAvailable()) {
            miniApp.close();
        }
    } catch (error) {
        console.error('Failed to close Mini App:', error);
    }
}

/**
 * Show a confirmation dialog
 */
export function showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
        try {
            // Use browser confirm as fallback
            const result = confirm(message);
            resolve(result);
        } catch (error) {
            console.error('Failed to show confirmation:', error);
            resolve(false);
        }
    });
}
