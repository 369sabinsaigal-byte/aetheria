import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTonWallet } from '@tonconnect/ui-react';

interface CardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (paymentMethod: 'crypto' | 'ton') => void;
  amount: number;
}

export const CardPaymentModal: React.FC<CardPaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onPaymentComplete,
  amount 
}) => {
  const [selectedPayment, setSelectedPayment] = useState<'crypto' | 'ton' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const wallet = useTonWallet();

  const handlePayment = async () => {
    if (!selectedPayment) return;
    
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      onPaymentComplete(selectedPayment);
      setIsProcessing(false);
      onClose();
    }, 2000);
  };

  const tonPrice = (amount / 2.5).toFixed(2); // Mock TON price conversion

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Card Creation Fee</h2>
              <p className="text-gray-400">Pay ${amount} to create your virtual card</p>
            </div>

            {/* Amount Display */}
            <div className="bg-gray-800 rounded-xl p-4 mb-6 text-center">
              <div className="text-3xl font-bold text-white">${amount}</div>
              <div className="text-gray-400 text-sm">One-time card creation fee</div>
            </div>

            {/* Payment Options */}
            <div className="space-y-3 mb-6">
              <div
                onClick={() => setSelectedPayment('crypto')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPayment === 'crypto'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">₿</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">Crypto Payment</div>
                      <div className="text-gray-400 text-sm">Pay with Bitcoin, ETH, etc.</div>
                    </div>
                  </div>
                  <div className="text-white font-medium">${amount}</div>
                </div>
              </div>

              <div
                onClick={() => setSelectedPayment('ton')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPayment === 'ton'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">TON</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">TON Payment</div>
                      <div className="text-gray-400 text-sm">Pay with TON tokens</div>
                    </div>
                  </div>
                  <div className="text-white font-medium">{tonPrice} TON</div>
                </div>
              </div>
            </div>

            {/* Wallet Connection Status */}
            {selectedPayment === 'ton' && !wallet && (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 mb-4">
                <div className="text-yellow-400 text-sm">
                  Please connect your TON wallet to proceed with TON payment
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={!selectedPayment || isProcessing || (selectedPayment === 'ton' && !wallet)}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </span>
                ) : (
                  'Pay Now'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};