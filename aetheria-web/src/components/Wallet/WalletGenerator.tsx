import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '../../theme';

const MOCK_WORDS = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
  'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
  'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album'
];

export const WalletGenerator: React.FC = () => {
  const [step, setStep] = useState<'intro' | 'generating' | 'reveal' | 'confirm'>('intro');
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);

  const generateWallet = () => {
    setStep('generating');
    // Simulate cryptographic generation
    setTimeout(() => {
      const words = [];
      for (let i = 0; i < 12; i++) {
        words.push(MOCK_WORDS[Math.floor(Math.random() * MOCK_WORDS.length)]);
      }
      setMnemonic(words);
      setStep('reveal');
    }, 1500);
  };

  return (
    <div style={{
      background: theme.colors.surface,
      borderRadius: '24px',
      padding: '2rem',
      border: `1px solid ${theme.colors.primaryDark}`,
      maxWidth: '500px',
      margin: '0 auto',
      color: theme.colors.textPrimary
    }}>
      <AnimatePresence mode='wait'>
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ 
                width: '64px', height: '64px', 
                background: theme.colors.goldGradient, 
                borderRadius: '50%', margin: '0 auto 1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Secure Non-Custodial Wallet</h2>
              <p style={{ color: theme.colors.textSecondary }}>
                Generate a new wallet where YOU control the private keys. 
                Your funds, your rules. Bank-grade security on your device.
              </p>
            </div>
            
            <div style={{ background: 'rgba(248, 81, 73, 0.1)', border: `1px solid ${theme.colors.error}`, borderRadius: '12px', padding: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', color: theme.colors.error, fontWeight: 'bold', marginBottom: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Important
              </div>
              <p style={{ fontSize: '0.9rem', color: theme.colors.textSecondary }}>
                We do not store your seed phrase. If you lose it, your funds are lost forever.
              </p>
            </div>

            <button
              onClick={generateWallet}
              style={{
                width: '100%',
                padding: '1rem',
                background: theme.colors.primary,
                color: theme.colors.background,
                border: 'none',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Generate Secure Wallet
            </button>
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '3rem 0' }}
          >
            <div className="spinner" style={{ 
              width: '40px', height: '40px', 
              border: `3px solid ${theme.colors.primaryDark}`, 
              borderTopColor: theme.colors.primary, 
              borderRadius: '50%', margin: '0 auto 1rem',
              animation: 'spin 1s linear infinite' 
            }} />
            <p>Generating high-entropy keys...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </motion.div>
        )}

        {step === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Your Secret Recovery Phrase</h3>
            <p style={{ textAlign: 'center', color: theme.colors.textSecondary, marginBottom: '2rem' }}>
              Write these 12 words down in order and store them safely.
            </p>

            <div 
              onClick={() => setRevealed(true)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '2rem',
                filter: revealed ? 'none' : 'blur(8px)',
                cursor: revealed ? 'default' : 'pointer',
                transition: 'filter 0.3s ease',
                position: 'relative'
              }}
            >
              {!revealed && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.2)'
                }}>
                  <span style={{ background: theme.colors.background, padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem' }}>
                    Click to Reveal
                  </span>
                </div>
              )}
              {mnemonic.map((word, i) => (
                <div key={i} style={{
                  background: theme.colors.background,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.primaryDark}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ color: theme.colors.textSecondary, fontSize: '0.8rem' }}>{i+1}.</span>
                  <span style={{ fontWeight: 600 }}>{word}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '2rem', padding: '1rem', background: theme.colors.background, borderRadius: '8px', wordBreak: 'break-all' }}>
              <div style={{ fontSize: '0.8rem', color: theme.colors.textSecondary, marginBottom: '0.5rem' }}>Private Key (Demo Only)</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: theme.colors.primary }}>
                0x{Array(64).fill(0).map(() => Math.floor(Math.random()*16).toString(16)).join('')}
              </div>
            </div>

            <button
              onClick={() => setStep('confirm')}
              style={{
                width: '100%',
                padding: '1rem',
                background: theme.colors.success,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              I Saved My Phrase
            </button>
          </motion.div>
        )}
        
        {step === 'confirm' && (
            <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center' }}
            >
                <div style={{ 
                    width: '64px', height: '64px', 
                    background: theme.colors.success, 
                    borderRadius: '50%', margin: '0 auto 1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white'
                }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3>Wallet Ready!</h3>
                <p style={{ color: theme.colors.textSecondary, margin: '1rem 0 2rem' }}>
                    Your non-custodial wallet is now active. You can now deposit funds and trade on the exchange.
                </p>
                <button
                    onClick={() => setStep('intro')} // Reset for demo
                    style={{
                        padding: '0.75rem 2rem',
                        background: 'transparent',
                        border: `1px solid ${theme.colors.primary}`,
                        color: theme.colors.primary,
                        borderRadius: '12px',
                        cursor: 'pointer'
                    }}
                >
                    Close
                </button>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
