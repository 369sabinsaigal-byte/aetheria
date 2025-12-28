import React, { useState } from 'react';
import SumsubWebSdk from '@sumsub/websdk-react';

interface WalletState {
  balance: number;
  isVerified: boolean;
  trustScore: number;
  address: string;
  holdings: {
    asset: string;
    amount: number;
    value: number;
  }[];
}

const Wallet: React.FC = () => {
  const [wallet, setWallet] = useState<WalletState>({
    balance: 1250.50,
    isVerified: false,
    trustScore: 10,
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976A',
    holdings: [
      { asset: 'USD', amount: 1250.50, value: 1250.50 },
      { asset: 'BTC', amount: 0.005, value: 437.55 },
      { asset: 'ETH', amount: 0.25, value: 731.92 },
      { asset: 'SOL', amount: 5.2, value: 642.20 }
    ]
  });
  const [showSumsub, setShowSumsub] = useState<boolean>(false);
  const [accessToken] = useState<string>(''); // Placeholder for real token

  const startVerification = () => {
    if (!accessToken) {
        // In a real app, you would fetch the token here.
        // For this demo, we'll just toggle the view and show a message if token is missing.
        console.log("No access token provided. In production, fetch this from backend.");
    }
    setShowSumsub(true);
  };

  const handleDeposit = () => {
    if (!wallet.isVerified) {
      alert('Please complete verification first to enable deposits.');
      return;
    }
    // Simulate deposit
    alert('Zero-fee deposit initiated! In production, this would open a deposit interface.');
  };

  const handleWithdraw = () => {
    if (!wallet.isVerified) {
      alert('Please complete verification first to enable withdrawals.');
      return;
    }
    alert('Withdrawal interface would open here.');
  };

  const expirationHandler = async () => {
      return Promise.resolve(accessToken);
  }

  const config = {
      lang: 'en', 
      email: 'applicant@email.com',
      phone: '123456789',
      i18n: {
          document: {
              subTitle: 'Identity Verification'
          }
      },
      uiConf: {
          customCssStr: ":root {\n  --black: #000000;\n  --grey: #F5F5F5;\n  --grey-darker: #B2B2B2;\n  --border-color: #DBDBDB;\n}\n\np {\n  color: var(--black);\n  font-size: 16px;\n  line-height: 24px;\n}\n\nsection {\n  margin: 40px auto;\n}\n\ninput {\n  color: var(--black);\n  font-weight: 600;\n  outline: none;\n}\n\nsection.content {\n  background-color: var(--grey);\n  color: var(--black);\n  padding: 40px 40px 16px;\n  box-shadow: none;\n  border-radius: 6px;\n}\n\nbutton.submit,\nbutton.back {\n  text-transform: capitalize;\n  border-radius: 6px;\n  height: 48px;\n  padding: 0 30px;\n  font-size: 16px;\n  background-image: none !important;\n  transform: none !important;\n  box-shadow: none !important;\n  transition: all 0.2s linear;\n}\n\nbutton.submit {\n  min-width: 132px;\n  background: none;\n  background-color: var(--black);\n}\n\n.round-icon {\n  background-color: var(--black) !important;\n  background-image: none !important;\n}"
      }
  };

  return (
    <section className="wallet-section">
      <div className="section-header">
        <h2>Multi-Asset Wallet</h2>
        <div className="trust-badge">
          <span>Trust Score: {wallet.trustScore}</span>
        </div>
      </div>

      {!wallet.isVerified && (
        <div className="verification-card">
          {!showSumsub ? (
            <>
              <div className="verify-icon">🛡️</div>
              <h3>Verify Your Identity</h3>
              <p>Unlock higher withdrawal limits and enhanced features by verifying your identity.</p>
              <button className="primary-btn verify-btn" onClick={startVerification}>
                Verify Now (Sumsub)
              </button>
            </>
          ) : (
             <div className="sumsub-container" style={{ minHeight: '300px', background: '#fff', borderRadius: '12px', padding: '10px' }}>
                {accessToken ? (
                    <SumsubWebSdk
                        accessToken={accessToken}
                        expirationHandler={expirationHandler}
                        config={config}
                        options={{ addViewportTag: false, adaptIframeHeight: true }}
                        onMessage={(type: any, payload: any) => {
                            console.log('Sumsub message:', type, payload);
                        }}
                        onError={(data: any) => {
                            console.error('Sumsub error:', data);
                        }}
                    />
                ) : (
                    <div className="mock-verification" style={{ color: '#333', textAlign: 'center', padding: '20px' }}>
                        <h4>Sumsub SDK Placeholder</h4>
                        <p style={{ fontSize: '12px', color: '#666' }}>
                           (A valid Access Token is required to load the real SDK iframe)
                        </p>
                        <div style={{ marginTop: '15px' }}>
                            <button 
                                className="primary-btn" 
                                style={{ marginRight: '10px', fontSize: '12px', padding: '8px 16px' }}
                                onClick={() => {
                                    setWallet(prev => ({ ...prev, isVerified: true, trustScore: 85 }));
                                    setShowSumsub(false);
                                }}
                            >
                                Simulate Pass
                            </button>
                            <button 
                                className="action-btn"
                                style={{ fontSize: '12px', padding: '8px 16px', color: '#333', background: '#eee' }} 
                                onClick={() => setShowSumsub(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
          )}
        </div>
      )}

      <div className="wallet-balance-card">
        <span className="label">Total Balance <span className="zero-fee-badge">Zero-Fee</span></span>
        <h1 className="amount">${wallet.balance.toFixed(2)}</h1>
        <p className="address">
          {wallet.address} 
          <span className="copy-icon">📋</span>
        </p>
        <div className="wallet-actions">
          <button className="action-btn" onClick={handleDeposit}>Deposit</button>
          <button className="action-btn" onClick={handleWithdraw}>Withdraw</button>
        </div>
      </div>

      <div className="asset-holdings">
        <h3>Asset Holdings</h3>
        {wallet.holdings.map((holding) => (
          <div key={holding.asset} className="holding-item">
            <span className="holding-asset">{holding.asset}</span>
            <div className="holding-details">
              <span className="holding-amount">{holding.amount}</span>
              <span className="holding-value">${holding.value.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="security-info">
        <h3>Security Status</h3>
        <ul className="security-list">
          <li className="secure">Encryption: AES-256 (Active)</li>
          <li className="secure">Custody: Hybrid Non-Custodial</li>
          <li className={wallet.isVerified ? "secure" : "warning"}>
            KYC Status: {wallet.isVerified ? "Verified" : "Pending"}
          </li>
          <li className="secure">Multi-Asset Support: USD, BTC, ETH, SOL</li>
          <li className="secure">Zero-Fee Deposits: Active</li>
        </ul>
      </div>
    </section>
  );
};

export default Wallet;
