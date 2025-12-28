import React from 'react';
import { motion } from 'framer-motion';

interface SeedPhraseBackupProps {
  seedPhrase: string[];
  onComplete: () => void;
}

export const SeedPhraseBackup: React.FC<SeedPhraseBackupProps> = ({
  seedPhrase,
  onComplete,
}) => {
  return (
    <motion.div
      className="min-h-screen flex flex-col px-6 py-8 text-white bg-black"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-semibold mb-2">Save these 24 words</h2>
      <p className="text-sm text-gray-400 mb-6">
        Write them down and store safely. You&apos;ll need them to recover your wallet.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {seedPhrase.map((word, index) => (
          <motion.div
            key={index}
            className="seed-card bg-[#111111] border border-white/5 rounded-lg px-3 py-2 flex items-center gap-2"
            initial={{
              opacity: 0,
              rotateY: -90,
              z: -50,
            }}
            animate={{
              opacity: 1,
              rotateY: 0,
              z: 0,
            }}
            transition={{
              delay: index * 0.03,
              type: 'spring',
              stiffness: 200,
            }}
          >
            <span className="seed-number text-xs text-gray-500 w-6">
              {index + 1}.
            </span>
            <span className="seed-word text-sm font-medium">{word}</span>
          </motion.div>
        ))}
      </div>

      <motion.button
        className="mt-auto w-full bg-white text-black font-semibold py-3 rounded-xl text-sm"
        whileTap={{ scale: 0.95 }}
        onClick={onComplete}
      >
        I&apos;ve saved my seed phrase
      </motion.button>
    </motion.div>
  );
};

