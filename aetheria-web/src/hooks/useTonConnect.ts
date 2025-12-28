import { useTonConnectUI } from '@tonconnect/ui-react';

export const useTonConnect = () => {
  const [tonConnectUI] = useTonConnectUI();

  return {
    wallet: tonConnectUI.wallet,
    tonConnectUI
  };
};