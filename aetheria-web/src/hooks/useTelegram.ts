import { useEffect, useState } from 'react';

export const useTelegram = () => {
  const [user, setUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [webApp, setWebApp] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      setUser(tg.initDataUnsafe?.user || null);
      setWebApp(tg);
      setIsReady(true);
    }
  }, []);

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      try {
        switch (style) {
          case 'success':
            tg.HapticFeedback.notificationOccurred('success');
            break;
          case 'error':
            tg.HapticFeedback.notificationOccurred('error');
            break;
          case 'warning':
            tg.HapticFeedback.notificationOccurred('warning');
            break;
          default:
            tg.HapticFeedback.impactOccurred(style as any);
        }
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }
  };

  return {
    user,
    isReady,
    triggerHaptic,
    webApp
  };
};