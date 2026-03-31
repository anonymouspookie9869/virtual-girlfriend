import React from 'react';
import { motion } from 'motion/react';
import type { ChatMessage } from '../types';
import ClockIcon from './icons/ClockIcon';
import ErrorIcon from './icons/ErrorIcon';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  if (message.role === 'system') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center gap-4 my-6"
      >
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-500/20" />
        <p className="text-[10px] font-bold text-rose-400/60 uppercase tracking-[0.2em] whitespace-nowrap px-2">
          {message.content}
        </p>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-rose-500/20" />
      </motion.div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <motion.div 
      initial={{ opacity: 0, x: isUser ? 20 : -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={cn(
        "flex w-full mb-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex items-end gap-2 max-w-[85%] md:max-w-[70%]",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        <div
          className={cn(
            "px-4 py-3 rounded-2xl shadow-lg whitespace-pre-wrap text-sm md:text-base transition-all duration-200",
            isUser 
              ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-br-none border border-rose-400/20" 
              : "bg-slate-800/90 backdrop-blur-sm text-slate-100 rounded-bl-none border border-slate-700/50"
          )}
        >
          <p className="leading-relaxed">{message.content}</p>
          <div className={cn(
            "mt-1 flex items-center gap-1 text-[10px] opacity-50",
            isUser ? "justify-end" : "justify-start"
          )}>
            <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {isUser && (
              <div className="flex-shrink-0">
                {message.status === 'pending' && <ClockIcon className="w-3 h-3" />}
                {message.status === 'error' && <ErrorIcon className="w-3 h-3 text-red-400" />}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
