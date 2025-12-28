import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VirtualCard } from './VirtualCard';
import { NumberCounter } from './Animations/NumberCounter';
import { HolographicShimmer } from './Animations/HolographicShimmer';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import { CardPaymentModal } from './CardPaymentModal';
import { aetheriaCardService, CardType, TransactionType, formatCurrency } from '../services/aetheriaCard';
import type { Card, Transaction } from '../services/aetheriaCard';

// Icons
const TopUpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5V19M5 12H19" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FreezeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
    <path d="M12 6V12L16 16" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

type TransactionTab = 'all' | 'income' | 'expense';

const MOCK_USER_ID = 'user_123'; // Matches mock service user ID

export const AetheriaCard: React.FC = () => {
  const [hasCard, setHasCard] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<TransactionTab>('all');
  const [card, setCard] = useState<Card | null>(null);
  const wallet = useTonWallet();

  useEffect(() => {
    const load = async () => {
      try {
        const userCards = await aetheriaCardService.getUserCards(MOCK_USER_ID);
        if (userCards.length > 0) {
          const userCard = userCards[0]; // Get first card
          setHasCard(true);
          setCard(userCard);
          
          // Load balance and transactions
          const balanceResponse = await aetheriaCardService.getBalance(userCard.id);
          setBalance(balanceResponse.available);
          const txs = await aetheriaCardService.getTransactions(userCard.id);
          setTransactions(txs);
        }
      } catch (error) {
        console.error('Failed to load card data:', error);
      }
    };

    load();
  }, []);

  const handleIssueCard = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (paymentMethod: 'crypto' | 'ton') => {
    setIsIssuing(true);
    setShowPaymentModal(false);
    
    try {
      // Issue new virtual card
      const newCard = await aetheriaCardService.issueCard(MOCK_USER_ID, CardType.VIRTUAL);
      setHasCard(true);
      setCard(newCard);

      // Top up the card with initial amount
      await aetheriaCardService.topUpFromWallet(
        newCard.id,
        5,
        paymentMethod === 'ton' ? 'TON' : 'USDT',
      );

      // Refresh balance and transactions
      const balanceResponse = await aetheriaCardService.getBalance(newCard.id);
      setBalance(balanceResponse.available);

      const txs = await aetheriaCardService.getTransactions(newCard.id);
      setTransactions(txs);

      setIsIssuing(false);
    } catch (error) {
      setIsIssuing(false);
      alert('Payment failed. Please try again.');
    }
  };

  const handleTopUp = async () => {
    if (!card) {
      alert('Card not found. Please create your card first.');
      return;
    }

    try {
      const tx = await aetheriaCardService.topUpFromWallet(card.id, 100, 'USDT');
      const balanceResponse = await aetheriaCardService.getBalance(card.id);
      setBalance(balanceResponse.available);
      setTransactions((prev) => [tx, ...prev]);
    } catch (error) {
      console.error('Top up failed:', error);
      alert('Top up failed. Please try again.');
    }
  };

  interface ActionButtonProps {
    icon: React.ComponentType;
    label: string;
    onClick: () => void;
    primary?: boolean;
  }

  const ActionButton: React.FC<ActionButtonProps> = ({ icon: Icon, label, onClick, primary = false }) => (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex flex-col items-center justify-center space-y-2 w-full`}
    >
      <div 
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          primary 
            ? 'bg-white text-black' 
            : 'bg-gray-800 text-white hover:bg-gray-700'
        }`}
      >
        <Icon />
      </div>
      <span className="text-xs font-medium text-gray-400">{label}</span>
    </motion.button>
  );

  if (!hasCard) {
    return (
      <div className="min-h-screen pb-24 text-white flex flex-col relative overflow-hidden" style={{ background: '#000' }}>
         <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />

         <div className="px-6 pt-6 flex justify-between items-center z-10">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-bold text-xs">A</div>
              <span className="font-bold text-lg tracking-wide">Aetheria Card</span>
            </div>
            <TonConnectButton />
         </div>

         <div className="flex-1 flex flex-col items-center justify-center px-6 text-center z-10 mt-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                The Card for<br/>Crypto Natives
              </h1>
              <p className="text-gray-400 mb-8 max-w-xs mx-auto">
                Spend your crypto worldwide. Instant virtual issuance. No hidden fees.
              </p>
            </motion.div>

            {/* Card Preview */}
            <motion.div 
              className="mb-12 w-full max-w-sm"
              initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              style={{ perspective: 1000 }}
            >
                <div className="relative transform transition-transform duration-500 hover:scale-105">
                  <div className="absolute -inset-4 bg-purple-500/30 blur-2xl rounded-full opacity-50"></div>
                  <VirtualCard 
                      lastFour="0000" 
                      holderName="FUTURE HOLDER" 
                      balance={0}
                      variant="metal"
                  />
                </div>
            </motion.div>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8 text-left">
               <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm">
                  <div className="text-xl mb-1">🌍</div>
                  <div className="font-bold text-sm">Global</div>
                  <div className="text-xs text-gray-500">Accepted everywhere</div>
               </div>
               <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm">
                  <div className="text-xl mb-1">⚡</div>
                  <div className="font-bold text-sm">Instant</div>
                  <div className="text-xs text-gray-500">Ready in seconds</div>
               </div>
            </div>

            <button 
              onClick={handleIssueCard}
              disabled={isIssuing}
              className="w-full max-w-sm bg-white text-black font-bold py-4 rounded-xl text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
            >
               {isIssuing ? (
                 <span className="flex items-center justify-center space-x-2">
                   <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   <span>Creating Card...</span>
                 </span>
               ) : (
                 "Get Your Card - $5"
               )}
            </button>
            <p className="mt-4 text-xs text-gray-500">One-time $5 fee for virtual card creation. No hidden fees.</p>
         </div>
      </div>
    );
  }

  // Dashboard for Card Holders
  return (
    <div className="min-h-screen pb-24 text-white" style={{ background: '#000' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex justify-between items-center sticky top-0 z-10 bg-black/80 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-500 flex items-center justify-center text-black font-bold text-xs">
            A
          </div>
          <span className="font-bold text-lg tracking-wide">Aetheria</span>
        </div>
        <div className="flex items-center space-x-4">
           <div className="text-xs px-2 py-1 rounded bg-gray-900 border border-gray-800 text-gray-400">
              {wallet ? `${wallet.account.address.slice(0, 4)}...${wallet.account.address.slice(-4)}` : 'No Wallet'}
           </div>
           <TonConnectButton />
        </div>
      </div>

      {/* Hero Section */}
      <div className="px-6 py-4 text-center">
        <div className="text-gray-400 text-sm mb-1">Total Balance</div>
        <div className="text-4xl font-bold tracking-tight mb-8">
          <NumberCounter
            value={balance}
            prefix="$"
            decimals={2}
            className="inline-block"
          />
        </div>
        
        <div className="mb-10 relative z-0 flex justify-center">
          <HolographicShimmer>
            <div className="w-full h-full flex items-center justify-center">
              <VirtualCard 
                lastFour={card?.lastFour || "0000"} 
                holderName={wallet ? "Crypto User" : "Valued Member"} 
                balance={balance}
                variant="black"
              />
            </div>
          </HolographicShimmer>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-4 gap-4 px-2">
            <ActionButton icon={TopUpIcon} label="Top Up" onClick={handleTopUp} primary />
            <ActionButton icon={SendIcon} label="Send" onClick={handleTopUp} />
            <ActionButton icon={FreezeIcon} label="Freeze" onClick={handleTopUp} />
            <ActionButton icon={SettingsIcon} label="Settings" onClick={() => {}} />
        </div>
      </div>

      {/* Transactions Sheet */}
      <div className="mt-6 bg-[#0D0D0D] rounded-t-[30px] min-h-[500px] border-t border-gray-900">
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Transactions</h3>
                <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg">
                    {['all', 'income', 'expense'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-3 py-1 text-xs capitalize rounded-md transition-all ${
                                activeTab === tab ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {transactions.length > 0 ? (
                  transactions
                    .filter(t => activeTab === 'all' || 
                      (activeTab === 'income' && (t.type === TransactionType.TOP_UP || t.type === TransactionType.REFUND)) ||
                      (activeTab === 'expense' && t.type === TransactionType.PURCHASE)
                    )
                    .map((tx) => (
                    <motion.div 
                        key={tx.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-900/50 transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-lg group-hover:bg-gray-800 transition-colors">
                                {tx.type === TransactionType.PURCHASE ? '🛍️' : 
                                 tx.type === TransactionType.TOP_UP ? '💰' : 
                                 tx.type === TransactionType.REFUND ? '↩️' : '📄'}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="font-medium text-sm text-gray-200">{tx.merchant || tx.type}</span>
                                <span className="text-xs text-gray-500">
                                    {tx.createdAt.toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <span className={`font-mono font-medium text-sm ${
                            tx.amount > 0 ? 'text-green-500' : 'text-white'
                        }`}>
                            {formatCurrency(Math.abs(tx.amount))}
                        </span>
                    </motion.div>
                ))
                ) : (
                  <div className="text-center py-10 text-gray-500 text-sm">
                    No transactions yet. Top up your card to get started.
                  </div>
                )}
            </div>
        </div>
      </div>
      
      {/* Floating AI Assistant Button (Karta AI) */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 w-12 h-12 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 z-50"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
        </svg>
      </motion.button>

      {/* Payment Modal */}
      <CardPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentComplete={handlePaymentComplete}
        amount={5}
      />
    </div>
  );
};
