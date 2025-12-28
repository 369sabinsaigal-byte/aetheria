import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VirtualCard } from '../VirtualCard';

interface CardSetupWizardProps {
  onComplete: () => void;
}

export const CardSetupWizard: React.FC<CardSetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-8 bg-black text-white">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-2xl font-semibold mb-3">
                Want to spend your crypto anywhere?
              </h2>
              <p className="text-sm text-gray-400 mb-8">
                Get a free virtual Aetheria card that works worldwide.
              </p>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm"
              >
                Get Free Card
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-semibold mb-2">Your Aetheria Card</h2>
                <p className="text-sm text-gray-400">
                  We&apos;ve pre-configured limits and security for you.
                </p>
              </div>
              <motion.div
                initial={{ rotateY: -30, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 120 }}
                style={{ perspective: 1000, width: '100%' }}
                className="mb-8"
              >
                <VirtualCard lastFour="8842" holderName="AETHERIA USER" balance={0} />
              </motion.div>
              <button
                onClick={() => setStep(3)}
                className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm"
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-2xl font-semibold mb-3">Card ready!</h2>
              <p className="text-sm text-gray-400 mb-6">
                Add it to your favorite wallet now or do it later.
              </p>
              <div className="space-y-3">
                <button
                  onClick={onComplete}
                  className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm"
                >
                  Add to Apple Wallet
                </button>
                <button
                  onClick={onComplete}
                  className="w-full bg-transparent border border-white/20 text-white font-semibold py-3 rounded-xl text-sm"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

