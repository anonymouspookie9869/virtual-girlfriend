import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Trash2, ChevronRight } from 'lucide-react';
import type { ChatMessage } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserName: string;
}

interface ChatSession {
  userName: string;
  messages: ChatMessage[];
  lastMessageTime: number;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

  useEffect(() => {
    if (isOpen) {
      const allSessions: ChatSession[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('virtual-girlfriend-messages-')) {
          const userName = key.replace('virtual-girlfriend-messages-', '');
          try {
            const messages = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(messages) && messages.length > 0) {
              allSessions.push({
                userName,
                messages,
                lastMessageTime: messages[messages.length - 1].timestamp,
              });
            }
          } catch (e) {
            console.error('Error parsing session:', e);
          }
        }
      }
      setSessions(allSessions.sort((a, b) => b.lastMessageTime - a.lastMessageTime));
    }
  }, [isOpen]);

  const deleteSession = (userName: string) => {
    if (window.confirm(`Are you sure you want to delete the conversation history for ${userName}?`)) {
      localStorage.removeItem(`virtual-girlfriend-messages-${userName}`);
      setSessions(prev => prev.filter(s => s.userName !== userName));
      if (selectedSession?.userName === userName) setSelectedSession(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-slate-900 border border-slate-800 w-full max-w-2xl h-[80vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Conversation History</h2>
                  <p className="text-xs text-slate-400">Past chats with your soulmates</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Session List */}
              <div className={`w-full md:w-1/3 border-r border-slate-800 overflow-y-auto p-4 space-y-3 ${selectedSession ? 'hidden md:block' : 'block'}`}>
                {sessions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <MessageSquare className="w-12 h-12 text-slate-700 mb-2" />
                    <p className="text-sm text-slate-500">No past conversations found.</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <button
                      key={session.userName}
                      onClick={() => setSelectedSession(session)}
                      className={`w-full p-4 rounded-2xl text-left transition-all border ${
                        selectedSession?.userName === session.userName
                          ? 'bg-rose-500/10 border-rose-500/30 ring-1 ring-rose-500/20'
                          : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-100 truncate">{session.userName}</span>
                        <span className="text-[10px] text-slate-500">{new Date(session.lastMessageTime).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{session.messages[session.messages.length - 1].content}</p>
                    </button>
                  ))
                )}
              </div>

              {/* Message Preview */}
              <div className={`flex-1 flex flex-col bg-slate-950/30 ${selectedSession ? 'block' : 'hidden md:flex items-center justify-center'}`}>
                {selectedSession ? (
                  <>
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedSession(null)} className="md:hidden p-2 hover:bg-slate-800 rounded-full">
                          <X className="w-5 h-5" />
                        </button>
                        <span className="font-bold text-white">{selectedSession.userName}</span>
                      </div>
                      <button
                        onClick={() => deleteSession(selectedSession.userName)}
                        className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {selectedSession.messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                            msg.role === 'user'
                              ? 'bg-rose-500 text-white rounded-br-none'
                              : msg.role === 'system'
                              ? 'bg-slate-800/50 text-rose-400/80 text-center w-full text-xs italic'
                              : 'bg-slate-800 text-slate-200 rounded-bl-none'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChevronRight className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-500">Select a conversation to view details</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HistoryModal;
