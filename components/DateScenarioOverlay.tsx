import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Film, Map, Utensils, Stars } from 'lucide-react';
import type { DateScenario } from '../types';

interface DateScenarioOverlayProps {
  scenario: DateScenario | null;
  onClose: () => void;
}

const DateScenarioOverlay: React.FC<DateScenarioOverlayProps> = ({ scenario, onClose }) => {
  if (!scenario) return null;

  const getIcon = () => {
    switch (scenario.type) {
      case 'movie': return <Film className="w-6 h-6" />;
      case 'walk': return <Map className="w-6 h-6" />;
      case 'dinner': return <Utensils className="w-6 h-6" />;
      case 'stargazing': return <Stars className="w-6 h-6" />;
      default: return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800"
        >
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src={scenario.backgroundImage} 
              alt={scenario.title} 
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 p-8 md:p-12 flex flex-col items-center text-center space-y-6">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-slate-800/50 hover:bg-slate-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-rose-500/20 rounded-2xl text-rose-400 border border-rose-500/30"
            >
              {getIcon()}
            </motion.div>

            <div className="space-y-2">
              <motion.h2 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-4xl font-black text-white"
              >
                {scenario.title}
              </motion.h2>
              <motion.p 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-300 text-lg max-w-md mx-auto"
              >
                {scenario.description}
              </motion.p>
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="pt-4"
            >
              <div className="px-6 py-3 bg-white text-slate-900 rounded-full font-bold shadow-xl">
                Enjoy your date!
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DateScenarioOverlay;
