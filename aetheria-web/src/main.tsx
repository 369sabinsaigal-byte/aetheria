import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import { ThemeProvider } from './components/ThemeContext.tsx'
import './index.css'
import App from './App.tsx'

// Development mode check
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TonConnectUIProvider 
      manifestUrl="/tonconnect-manifest.json"
      // Reduce bridge connection attempts in development
      restoreConnection={!isDevelopment}
      actionsConfiguration={{
        modals: ['before', 'error', 'success'],
        notifications: ['before', 'success', 'error']
      }}
      // Filter out problematic wallets (Tomo bridge is currently unstable)
      walletsListConfiguration={{
        includeWallets: [
          {
            appName: "tonkeeper",
            name: "Tonkeeper",
            imageUrl: "https://tonkeeper.com/assets/tonconnect-icon.png",
            aboutUrl: "https://tonkeeper.com",
            universalLink: "https://app.tonkeeper.com/ton-connect",
            bridgeUrl: "https://bridge.tonapi.io/bridge",
            platforms: ["ios", "android", "chrome", "firefox"]
          }
        ]
      }}
    >
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </TonConnectUIProvider>
  </StrictMode>,
)
