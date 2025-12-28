import React from 'react';
import { motion } from 'framer-motion';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8 bg-black text-white">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-sm"
      >
        <h1 className="text-3xl font-semibold mb-3">
          Money that moves like messages.
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          Trade stocks, swap crypto, and spend with your Aetheria Card directly inside
          Telegram.
        </p>
        <button
          onClick={onContinue}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm"
        >
          Continue with Telegram
        </button>
      </motion.div>
    </div>
  );
};

