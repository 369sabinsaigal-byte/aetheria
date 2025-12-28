import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { theme } from '../theme';

interface VirtualCardProps {
  lastFour: string;
  holderName: string;
  balance: number;
  variant?: 'gold' | 'black' | 'metal';
}

const VisaLogo = () => (
  <svg width="48" height="16" viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.728 0.283203L13.104 15.7232H8.78398L5.32798 3.5392C5.13598 2.7232 4.94398 2.4832 4.31998 2.1472C3.26398 1.6192 1.58398 1.1392 0.239984 0.851203L0.335984 0.419203H6.95998C7.82398 0.419203 8.63998 0.995203 8.83198 2.0032L10.512 10.9952L16.656 0.283203H19.728ZM37.296 10.8512C37.296 6.7232 31.488 6.5312 31.536 4.9952C31.584 4.5152 32.064 4.0352 33.312 3.8432C33.936 3.7472 35.616 3.6992 37.344 4.4672L38.016 1.3952C37.056 1.0592 35.808 0.867203 34.224 0.867203C30.096 0.867203 27.168 3.0272 27.168 6.1952C27.168 8.5472 29.328 9.8432 30.912 10.6112C32.544 11.3792 33.072 11.8592 33.072 12.5312C33.072 13.5392 31.872 13.9712 30.72 13.9712C28.608 13.9712 27.36 13.3952 26.4 12.9632L25.68 15.9872C26.592 16.4192 28.32 16.7552 30.096 16.7552C34.464 16.7552 37.296 14.6432 37.296 10.8512ZM48 15.7232H44.112C42.864 15.7232 42.624 14.7632 42.192 12.5552L36.096 15.7232H31.728L36.624 3.9392C37.776 3.9392 39.264 3.7952 40.56 3.7952C41.712 3.7952 41.952 4.9472 42.192 6.0992L43.488 12.6512L43.92 14.7632L44.448 12.0272L45.936 3.9392H48V15.7232ZM25.056 15.7232L22.128 15.7232L24.48 3.9392L27.408 3.9392L25.056 15.7232ZM14.16 3.9392L14.784 7.0112L15.36 3.9392H14.16Z" fill="white"/>
  </svg>
);

const ChipIcon = () => (
  <svg width="40" height="30" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="30" rx="4" fill="#E0C9A6"/>
    <path d="M0 10H12V20H0V10Z" stroke="#B09976" strokeWidth="1"/>
    <path d="M28 10H40V20H28V10Z" stroke="#B09976" strokeWidth="1"/>
    <path d="M12 0V30" stroke="#B09976" strokeWidth="1"/>
    <path d="M28 0V30" stroke="#B09976" strokeWidth="1"/>
    <path d="M12 15H28" stroke="#B09976" strokeWidth="1"/>
  </svg>
);

const ContactlessIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(90deg)' }}>
    <path d="M12 18.5C13.6569 18.5 15 17.1569 15 15.5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 18.5C7.34315 18.5 6 17.1569 6 15.5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M15.5 12C17.1569 12 18.5 13.3431 18.5 15" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M5.5 12C3.84315 12 2.5 13.3431 2.5 15" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const VirtualCard: React.FC<VirtualCardProps> = ({ lastFour, holderName, variant = 'black' }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const getBackground = () => {
    switch (variant) {
      case 'gold': return theme.colors.goldGradient;
      case 'metal': return 'linear-gradient(135deg, #434343 0%, #000000 100%)';
      case 'black': default: return 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)';
    }
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '360px', // Standard credit card ratio
    aspectRatio: '1.586', // 85.6mm / 53.98mm
    borderRadius: '16px',
    position: 'relative' as const,
    cursor: 'pointer',
    margin: '0 auto',
  };

  const faceStyle = {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden' as const,
    borderRadius: '16px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    background: getBackground(),
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    border: `1px solid rgba(255,255,255,0.1)`,
  };

  const backStyle = {
    ...faceStyle,
    background: '#111',
    transform: 'rotateY(180deg)',
    padding: 0,
    justifyContent: 'flex-start',
  };

  return (
    <div style={{ perspective: '1000px', ...cardStyle }} onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Card Front */}
        <div style={faceStyle}>
          {/* Top Row: Chip & Contactless */}
          <div className="flex justify-between items-start">
             <div className="flex items-center space-x-4">
               <ChipIcon />
               <ContactlessIcon />
             </div>
             <div className="text-white opacity-80 font-bold tracking-widest text-sm">DEBIT</div>
          </div>

          {/* Middle: Number */}
          <div className="mt-2">
            <div style={{ fontSize: '1.4rem', letterSpacing: '3px', fontWeight: 500, color: '#fff', fontFamily: 'monospace' }}>
              •••• •••• •••• {lastFour}
            </div>
          </div>

          {/* Bottom Row: Name, Exp, Visa */}
          <div className="flex justify-between items-end">
             <div>
                <div className="text-[10px] uppercase text-gray-400 mb-0.5">Card Holder</div>
                <div className="text-white font-medium tracking-wide uppercase">{holderName}</div>
             </div>
             <div className="flex flex-col items-end">
                <div className="text-white font-bold italic mb-1 text-xs">Visa Signature</div>
                <VisaLogo />
             </div>
          </div>
        </div>

        {/* Card Back */}
        <div style={backStyle}>
          <div style={{ 
            height: '45px', 
            background: '#000', 
            width: '100%',
            marginTop: '25px'
          }}></div>
          
          <div className="px-6 w-full mt-4">
            <div className="flex items-center justify-between">
                <div className="text-[10px] text-gray-500 w-2/3 pr-2">
                    Authorized signature - not valid unless signed. This card is issued by Aetheria Bank pursuant to license by Visa International.
                </div>
                <div style={{ 
                    background: '#fff', 
                    height: '35px', 
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '0 10px',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    color: '#000',
                    width: '60px'
                }}>
                    123
                </div>
            </div>
          </div>
          
          <div className="mt-auto mb-6 w-full text-center">
             <div className="text-gray-500 text-xs">24/7 Support: +1 (800) VAULT-VIP</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
