
import React from 'react';
import { motion } from 'motion/react';

const TypingIndicator: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center space-x-1.5 px-4 py-3 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-inner"
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -4, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
          className="w-1.5 h-1.5 bg-rose-400 rounded-full shadow-[0_0_8px_rgba(251,113,133,0.4)]"
        />
      ))}
    </motion.div>
  );
};

export default TypingIndicator;
