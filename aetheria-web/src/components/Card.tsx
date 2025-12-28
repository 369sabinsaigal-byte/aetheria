import React, { useState, useEffect } from 'react';
import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import { rampService } from '../services/ramp';
import type { VirtualCard as VirtualCardType, CardCreationRequest, Transaction, ConversionQuote } from '../services/ramp';
import { triggerHaptic } from '../services/telegram';
import { VirtualCard } from './VirtualCard';

interface CardFormData {
  displayName: string;
  spendingLimit: number;
  currency: string;
}

export const Card: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [virtualCards, setVirtualCards] = useState<VirtualCardType[]>([]);
  const [selectedCard, setSelectedCard] = useState<VirtualCardType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [conversionQuote, setConversionQuote] = useState<ConversionQuote | null>(null);
  const [formData, setFormData] = useState<CardFormData>({
    displayName: 'My Spending Card',
    spendingLimit: 1000,
    currency: 'USD'
  });
  const [conversionAmount, setConversionAmount] = useState('');
  const [conversionCurrency, setConversionCurrency] = useState('BTC');
  
  // TON Connect hooks
  const wallet = useTonWallet();
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [tonPrice, setTonPrice] = useState<number>(0);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  useEffect(() => {
    initializeRampService();
    fetchTonPrice();
    loadStrigaCards();
  }, []);

  useEffect(() => {
    if (wallet) {
      fetchWalletBalance();
    }
  }, [wallet]);

  const fetchTonPrice = async () => {
    try {
      // Use a CORS proxy or backend endpoint in production
      // For demo, we'll try fetch but fallback immediately on error
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      if (data['the-open-network']) {
        setTonPrice(data['the-open-network'].usd);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      // Silently fail and use fallback to avoid console spam in dev
      // console.warn('Using fallback TON price');
      setTonPrice(5.50); // Fallback price
    }
  };

  const fetchWalletBalance = async () => {
    if (!wallet?.account?.address) return;
    
    try {
      setIsConnectingWallet(true);
      
      // Get TON balance (simplified - in production, use TON SDK)
      const balanceResponse = await fetch(`https://tonapi.io/v2/accounts/${wallet.account.address}`);
      const balanceData = await balanceResponse.json();
      
      // Convert from nanotons to TON
      const balanceInTon = (parseInt(balanceData.balance) / 1e9).toFixed(4);
      setWalletBalance(balanceInTon);
      
      triggerHaptic('success');
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      setWalletBalance('0.0000');
      triggerHaptic('error');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const initializeRampService = async () => {
    // Skip if no API key is configured to avoid errors
    if (!import.meta.env.VITE_RAMP_PUBLIC_KEY) {
       // console.log('Skipping Ramp initialization: No public key');
       return;
    }

    try {
      setIsLoading(true);
      const initialized = await rampService.initialize();
      if (initialized) {
        console.log('Ramp Network service ready');
        triggerHaptic('success');
      }
    } catch (error) {
      console.error('Failed to initialize Ramp service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchRampWidget = () => {
    try {
      // Get Telegram user data for personalization
      const userData = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      const userId = userData?.id ? `telegram_${userData.id}` : 'demo-user-id';
      
      // Use TON wallet address if available
      const walletAddress = wallet?.account?.address || userId;
      
      const rampWidget = new RampInstantSDK({
        hostAppName: 'Aetheria Vault',
        hostLogoUrl: 'https://your-logo-url.com/logo.png',
        variant: 'hosted-auto',
        hostApiKey: import.meta.env.VITE_RAMP_PUBLIC_KEY || 'demo-public-key',
        finalUrl: 'https://t.me/YourBotName/app',
        defaultAsset: 'CARD_USD',
        userAddress: walletAddress,
        swapAsset: 'CARD_USD',
        fiatCurrency: 'USD',
        fiatValue: formData.spendingLimit.toString(),
        userEmailAddress: userData?.username ? `${userData.username}@telegram.org` : undefined
      });
      
      rampWidget.show();
      triggerHaptic('success');
    } catch (error) {
      console.error('Failed to launch Ramp widget:', error);
      triggerHaptic('error');
    }
  };

  // Striga Integration Functions
  const handleCreateStrigaCard = async () => {
    if (!formData.displayName || formData.spendingLimit <= 0) {
      triggerHaptic('error');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get Telegram user data
      const userData = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      const userId = userData?.id ? `telegram_${userData.id}` : 'demo-user-id';
      
      // Use TON wallet address if available
      const walletAddress = wallet?.account?.address || userId;
      
      const response = await fetch('/api/striga/create-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          displayName: formData.displayName,
          spendingLimit: formData.spendingLimit,
          currency: formData.currency,
          walletAddress
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create Striga card');
      }

      const result = await response.json();
      
      // Create VirtualCard format for UI consistency
      const newCard: VirtualCardType = {
        id: result.card.id,
        cardholderName: result.card.cardholder_name,
        lastFour: result.card.last_four_digits,
        expiration: `${result.card.expiry_month}/${result.card.expiry_year}`,
        spendingLimit: result.card.spending_limit,
        currency: result.card.currency,
        status: result.card.status,
        createdAt: result.card.created_at,
        provider: 'striga'
      };
      
      setVirtualCards(prev => [...prev, newCard]);
      setSelectedCard(newCard);
      triggerHaptic('success');
      
    } catch (error) {
      console.error('Failed to create Striga card:', error);
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStrigaCards = async () => {
    try {
      const userData = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      const userId = userData?.id ? `telegram_${userData.id}` : 'demo-user-id';
      
      const response = await fetch(`/api/striga/cards/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load Striga cards');
      }

      const result = await response.json();
      
      // Convert to VirtualCard format
      const strigaCards: VirtualCardType[] = result.cards.map((card: any) => ({
        id: card.id,
        cardholderName: card.cardholderName,
        lastFour: card.lastFour,
        expiration: card.expiration,
        spendingLimit: card.spendingLimit,
        currency: card.currency,
        status: card.status,
        createdAt: card.createdAt,
        provider: 'striga'
      }));
      
      setVirtualCards(prev => [...prev, ...strigaCards]);
      triggerHaptic('success');
      
    } catch (error) {
      console.error('Failed to load Striga cards:', error);
    }
  };

  const handleCreateCard = async () => {
    if (!formData.displayName || formData.spendingLimit <= 0) {
      triggerHaptic('error');
      return;
    }

    try {
      setIsLoading(true);
      const request: CardCreationRequest = {
        userId: 'demo-user-id', // In real app, use actual user ID
        displayName: formData.displayName,
        spendingLimit: formData.spendingLimit,
        currency: formData.currency
      };

      const newCard = await rampService.createVirtualCard(request);
      setVirtualCards(prev => [...prev, newCard]);
      setSelectedCard(newCard);
      triggerHaptic('success');
      
      // Load transactions for the new card
      await loadCardTransactions(newCard.id);
    } catch (error) {
      console.error('Failed to create virtual card:', error);
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCardTransactions = async (cardId: string) => {
    try {
      const cardTransactions = await rampService.getCardTransactions(cardId);
      setTransactions(cardTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const handleGetConversionQuote = async () => {
    if (!conversionAmount || !selectedCard) {
      triggerHaptic('error');
      return;
    }

    try {
      setIsLoading(true);
      const amount = parseFloat(conversionAmount);
      const quote = await rampService.getConversionQuote(
        amount,
        conversionCurrency,
        selectedCard.currency
      );
      
      setConversionQuote(quote);
      triggerHaptic('success');
    } catch (error) {
      console.error('Failed to get conversion quote:', error);
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteConversion = async () => {
    if (!conversionQuote || !selectedCard) {
      triggerHaptic('error');
      return;
    }

    try {
      setIsLoading(true);
      const result = await rampService.executeConversion('quote-id', selectedCard.id);
      
      if (result.success) {
        triggerHaptic('success');
        alert(`Conversion successful! Transaction ID: ${result.transactionId}`);
        setConversionQuote(null);
        setConversionAmount('');
        
        // Reload transactions to see the new conversion
        await loadCardTransactions(selectedCard.id);
      } else {
        triggerHaptic('error');
        alert('Conversion failed. Please try again.');
      }
    } catch (error) {
      console.error('Failed to execute conversion:', error);
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="card-page">
      <h2>Virtual Card</h2>
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Processing...</p>
        </div>
      )}

      {/* Card Creation Form */}
      <div className="card-creation-section">
        <h3>Create Virtual Card</h3>
        
        {/* TON Connect Integration */}
          <div className="ton-connect-section">
            <h4>🔗 Connect Your TON Wallet</h4>
            <p>Connect your TON wallet for seamless crypto-to-fiat conversion</p>
            <div className="ton-connect-wrapper">
              <TonConnectButton />
            </div>
            {wallet && (
              <div className="wallet-info">
                <div className="wallet-header">
                  <p>✅ Connected: {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}</p>
                  <button 
                    onClick={fetchWalletBalance}
                    disabled={isConnectingWallet}
                    className="refresh-balance-btn"
                  >
                    {isConnectingWallet ? '🔄' : '↻'}
                  </button>
                </div>
                <p>Network: {wallet.account.chain}</p>
                <div className="wallet-balance">
                  <p>💎 Balance: {walletBalance} TON</p>
                  <p className="balance-usd">≈ ${(parseFloat(walletBalance) * tonPrice).toFixed(2)} USD</p>
                </div>
                <div className="ton-price-info">
                  <p>📈 TON Price: ${tonPrice.toFixed(4)}</p>
                </div>
              </div>
            )}
          </div>
        
        <div className="card-form">
          <div className="form-group">
            <label htmlFor="displayName">Card Name:</label>
            <input
              type="text"
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
              placeholder="e.g., My Spending Card"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="spendingLimit">Monthly Limit:</label>
            <input
              type="number"
              id="spendingLimit"
              value={formData.spendingLimit}
              onChange={(e) => setFormData({...formData, spendingLimit: Number(e.target.value)})}
              min="1"
              step="1"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="currency">Currency:</label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => setFormData({...formData, currency: e.target.value})}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          
          {/* Provider Selection */}
          <div className="provider-selection">
            <h4>🏦 Choose Card Provider</h4>
            <div className="provider-buttons">
              <button 
                onClick={handleCreateStrigaCard}
                disabled={isLoading || !wallet}
                className="provider-btn striga-btn"
              >
                {wallet ? '🚀 Create with Striga' : '🔑 Connect Wallet First'}
              </button>
              <button 
                onClick={handleCreateCard}
                disabled={isLoading || !wallet}
                className="provider-btn ramp-btn"
              >
                {wallet ? '💳 Create with Ramp' : '🔑 Connect Wallet First'}
              </button>
            </div>
          </div>
          
          {/* Ramp Network Integration */}
          <div className="ramp-integration-section">
            <h4>🎯 Instant Card Issuance with Ramp Network</h4>
            <p>Get your virtual card instantly with secure crypto-to-fiat conversion</p>
            <button 
              onClick={handleLaunchRampWidget}
              disabled={isLoading || !wallet}
              className="ramp-widget-btn"
            >
              {wallet ? '💳 Get Card with Ramp Network' : '🔑 Connect Wallet First'}
            </button>
          </div>
        </div>
      </div>

      {/* Virtual Cards List */}
      {virtualCards.length > 0 && (
        <div className="cards-list-section">
          <h3>Your Virtual Cards</h3>
          <div className="cards-grid">
            {virtualCards.map((card) => (
              <div key={card.id} onClick={() => {
                  setSelectedCard(card);
                  loadCardTransactions(card.id);
                  triggerHaptic('light');
                }}>
                <VirtualCard 
                  lastFour={card.lastFour} 
                  holderName={card.cardholderName} 
                  balance={card.spendingLimit} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Card Details */}
      {selectedCard && (
        <div className="card-details-section">
          <h3>Card Details: {selectedCard.cardholderName}</h3>
          
          {/* Crypto-to-Fiat Conversion */}
          <div className="conversion-section">
            <h4>💰 Crypto to Fiat Conversion</h4>
            <div className="conversion-form">
              <div className="form-group">
                <label htmlFor="conversionAmount">Amount:</label>
                <input
                  type="number"
                  id="conversionAmount"
                  value={conversionAmount}
                  onChange={(e) => setConversionAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.0001"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="conversionCurrency">From:</label>
                <select
                  id="conversionCurrency"
                  value={conversionCurrency}
                  onChange={(e) => setConversionCurrency(e.target.value)}
                >
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
              
              <button 
                onClick={handleGetConversionQuote}
                disabled={isLoading || !conversionAmount}
                className="quote-btn"
              >
                Get Quote
              </button>
            </div>

            {conversionQuote && (
              <div className="quote-details">
                <h5>Conversion Quote:</h5>
                <p>
                  {conversionQuote.sourceAmount} {conversionQuote.sourceCurrency} → 
                  {formatCurrency(conversionQuote.targetAmount, conversionQuote.targetCurrency)}
                </p>
                <p>Exchange Rate: 1 {conversionQuote.sourceCurrency} = {conversionQuote.exchangeRate} {conversionQuote.targetCurrency}</p>
                <p>Fees: {formatCurrency(conversionQuote.fees, conversionQuote.targetCurrency)}</p>
                <p>Expires: {new Date(conversionQuote.expiresAt).toLocaleTimeString()}</p>
                
                <button 
                  onClick={handleExecuteConversion}
                  disabled={isLoading}
                  className="convert-btn"
                >
                  Convert & Top Up
                </button>
              </div>
            )}
          </div>

          {/* Transactions */}
          <div className="transactions-section">
            <h4>Recent Transactions</h4>
            {transactions.length === 0 ? (
              <p className="no-transactions">No transactions yet</p>
            ) : (
              <div className="transactions-list">
                {transactions.map((txn) => (
                  <div key={txn.id} className="transaction-item">
                    <div className="transaction-merchant">
                      <span className="merchant-name">{txn.merchant}</span>
                      <span className="transaction-category">{txn.category}</span>
                    </div>
                    <div className="transaction-amount">
                      <span className={`amount ${txn.status.toLowerCase()}`}>
                        {formatCurrency(txn.amount, txn.currency)}
                      </span>
                      <span className="transaction-status">{txn.status}</span>
                    </div>
                    <div className="transaction-time">
                      {new Date(txn.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Spending Features */}
      <div className="features-section">
        <h3>🌍 Global Spending Features</h3>
        <div className="features-grid">
          <div className="feature-item">
            <h4>Instant Virtual Cards</h4>
            <p>Create disposable virtual cards for secure online shopping</p>
          </div>
          <div className="feature-item">
            <h4>Crypto-to-Fiat</h4>
            <p>Seamlessly convert your crypto to spendable currency</p>
          </div>
          <div className="feature-item">
            <h4>Real-time Tracking</h4>
            <p>Monitor all transactions with instant notifications</p>
          </div>
          <div className="feature-item">
            <h4>Global Acceptance</h4>
            <p>Spend anywhere Visa is accepted worldwide</p>
          </div>
        </div>
      </div>
    </div>
  );
};