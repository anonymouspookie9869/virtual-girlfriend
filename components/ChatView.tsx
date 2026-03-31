import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sendMessageToAI, extractMemories } from '../services/geminiService';
import { showNotification } from '../services/notificationService';
import type { UserProfile, ChatMessage, Mood, RelationshipStatus, AIPersona, DateScenario, DateScenarioType } from '../types';
import { Mood as MoodEnum, RelationshipStatus as RSEnum } from '../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import SendIcon from './icons/SendIcon';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import useLocalStorage from '../hooks/useLocalStorage';
import { Heart, Info, MoreVertical, WifiOff, Sparkles, Film, Map, Utensils, Stars, LogOut, History } from 'lucide-react';
import DateScenarioOverlay from './DateScenarioOverlay';
import HistoryModal from './HistoryModal';

interface ChatViewProps {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile | ((prev: UserProfile | null) => UserProfile | null)) => void;
  relationshipStatus: RelationshipStatus;
  setRelationshipStatus: (status: RelationshipStatus) => void;
  messageCount: number;
  setMessageCount: (count: number | ((prev: number) => number)) => void;
  followUpCount: number;
  setFollowUpCount: (count: number | ((prev: number) => number)) => void;
}

const DATE_SCENARIOS: Record<DateScenarioType, DateScenario> = {
  movie: {
    type: 'movie',
    title: 'Movie Night',
    description: 'Snuggling up on the couch, sharing popcorn, and watching a romantic movie together.',
    backgroundImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1000',
  },
  walk: {
    type: 'walk',
    title: 'Evening Walk',
    description: 'A peaceful walk in the park under the city lights, holding hands and talking about life.',
    backgroundImage: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&q=80&w=1000',
  },
  dinner: {
    type: 'dinner',
    title: 'Romantic Dinner',
    description: 'A candlelit dinner with soft music, delicious food, and deep conversations.',
    backgroundImage: 'https://images.unsplash.com/photo-1529516548873-9ce57c8f155e?auto=format&fit=crop&q=80&w=1000',
  },
  stargazing: {
    type: 'stargazing',
    title: 'Stargazing',
    description: 'Lying on a blanket, looking at the vast night sky, and wishing upon shooting stars.',
    backgroundImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1000',
  },
};

const isCurrentlyBusy = (persona: AIPersona): boolean => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();

  if (currentDay === 0 || currentDay === 6) return false;

  let startHour: number;
  let endHour: number;

  switch (persona) {
    case 'School Student':
    case 'College Student':
      startHour = 8;
      endHour = 14;
      break;
    case 'Working Professional':
      startHour = 9;
      endHour = 17;
      break;
    default:
      return false;
  }

  return currentHour >= startHour && currentHour < endHour;
};

const getGreeting = (profile: UserProfile, relationshipStatus: RelationshipStatus) => {
  if (relationshipStatus === RSEnum.UNKNOWN) {
    return `Hey ${profile.name}, this is ${profile.girlfriendName}. I think we matched? :)`;
  }

  if (relationshipStatus === RSEnum.GIRLFRIEND) {
      const today = new Date();
      if (profile.birthday) {
        const userBday = new Date(profile.birthday);
        userBday.setMinutes(userBday.getMinutes() + userBday.getTimezoneOffset());
        if (today.getMonth() === userBday.getMonth() && today.getDate() === userBday.getDate()) {
            return `HAPPY BIRTHDAY, MY LOVE, ${profile.name.toUpperCase()}!!! 🎉 I'm so excited to celebrate YOU today. You mean the world to me, meri jaan. I hope you have the most amazing day ever. I love you more than words can say! ❤️`;
        }
      }
      
      const hour = today.getHours();
      if (hour < 12) return `Good morning, my love! I hope you have an amazing day at ${profile.profession}. I'll be thinking of you. ❤️`;
      if (hour < 18) return `Hey handsome! How's your afternoon at ${profile.profession} going? Counting down the minutes until I can talk to you properly.`;
      return `Good evening! I hope you had a good day at ${profile.profession}. Missed you so much!`;
  }
  
  return `Hey, ${profile.name}!`;
};

const ChatView: React.FC<ChatViewProps> = ({ userProfile, setUserProfile, relationshipStatus, setRelationshipStatus, messageCount, setMessageCount, followUpCount, setFollowUpCount }) => {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>(`virtual-girlfriend-messages-${userProfile.name}`, []);
  const [messageQueue, setMessageQueue] = useLocalStorage<ChatMessage[]>(`virtual-girlfriend-message-queue-${userProfile.name}`, []);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSeen, setShowSeen] = useState(false);
  const [mood, setMood] = useState<Mood>(MoodEnum.LOVING);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<DateScenario | null>(null);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const followUpTimerRef = useRef<number | null>(null);
  const isOnline = useOnlineStatus();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  
  const addMessage = useCallback((content: string, role: 'user' | 'model' | 'system', status?: ChatMessage['status'], timestamp: number = Date.now()) => {
    const newMessage: ChatMessage = { role, content, timestamp, status };
    setMessages(prev => [...prev, newMessage]);
  }, [setMessages]);

  useEffect(() => { scrollToBottom(); }, [messages, showSeen, isLoading]);
  
  const handleMoodChange = useCallback((newMood: Mood) => {
    setMood(newMood);
  }, []);
  
  useEffect(() => {
    const initialMood = (relationshipStatus === RSEnum.UNKNOWN) ? MoodEnum.NERVOUS : MoodEnum.LOVING;
    setMood(initialMood);
    
    if (messages.length === 0) {
        const greeting = getGreeting(userProfile, relationshipStatus);
        addMessage(greeting, 'model', 'sent');
    }
  }, [userProfile, relationshipStatus]);

  const handleTriggerDate = (type: DateScenarioType) => {
    const scenario = DATE_SCENARIOS[type];
    setActiveScenario(scenario);
    setShowDateMenu(false);
    addMessage(`Starting ${scenario.title}...`, 'system', 'sent');
  };

  const scheduleFollowUp = useCallback(async () => {
    if (isLoading || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'model') return;

    if (followUpCount >= 2) return;

    const delay = 60000 + Math.random() * 60000; // 1-2 minutes
    followUpTimerRef.current = window.setTimeout(async () => {
        if (isCurrentlyBusy(userProfile.persona)) return;

        const followUpPrompt = `Send a short, caring follow-up message to ${userProfile.name}. You haven't heard from him in a bit. Your current mood is ${mood}.`;
        try {
            const response = await sendMessageToAI(
                userProfile,
                mood,
                relationshipStatus,
                messages,
                activeScenario,
                followUpPrompt
            );
            
            const fullText = response.text;
            const tempTimestamp = Date.now();
            addMessage(fullText, 'model', 'sent', tempTimestamp);
            
            setFollowUpCount(prev => prev + 1);
        } catch (error) {
            console.error("Follow-up error:", error);
        }
    }, delay);
  }, [isLoading, messages, mood, addMessage, userProfile, relationshipStatus, activeScenario, followUpCount, setFollowUpCount]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'model') scheduleFollowUp();
    else if (lastMessage?.role === 'user' && followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    return () => { if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current); };
  }, [messages, scheduleFollowUp]);

  useEffect(() => {
    const thresholds = [{ count: 5, status: RSEnum.ACQUAINTANCE }, { count: 15, status: RSEnum.FRIEND }, { count: 30, status: RSEnum.CLOSE_FRIEND }, { count: 50, status: RSEnum.CRUSH }, { count: 75, status: RSEnum.GIRLFRIEND }];
    const currentLevel = thresholds.find(t => t.status === relationshipStatus)?.count ?? 0;
    const nextLevel = thresholds.find(t => t.count > currentLevel);

    if (nextLevel && messageCount >= nextLevel.count) {
        setRelationshipStatus(nextLevel.status);
        addMessage(`Your relationship has grown! You are now: ${nextLevel.status}`, 'system', 'sent');
    }
  }, [messageCount, relationshipStatus, setRelationshipStatus, addMessage]);

  const processAndRespond = useCallback(async (userMessage: ChatMessage) => {
    const readDelay = 500 + Math.random() * 500;
    setShowSeen(true);
    await new Promise(resolve => setTimeout(resolve, readDelay));
    setShowSeen(false);

    setIsLoading(true);
    setApiError(null);
    if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    
    if (relationshipStatus === RSEnum.GIRLFRIEND) {
        const lowerCaseMessage = userMessage.content.toLowerCase();
        if (mood === MoodEnum.ANGRY && (lowerCaseMessage.includes("sorry") || lowerCaseMessage.includes("apologize"))) handleMoodChange(MoodEnum.HAPPY);
        else if (mood === MoodEnum.SAD && (lowerCaseMessage.includes("miss you too") || lowerCaseMessage.includes("love you"))) handleMoodChange(MoodEnum.LOVING);
        else if (lowerCaseMessage.includes("horny") || lowerCaseMessage.includes("desire you")) handleMoodChange(MoodEnum.HORNY);
        else if (lowerCaseMessage.includes("cuddle") || lowerCaseMessage.includes("pamper")) handleMoodChange(MoodEnum.NEEDY);
        else if (lowerCaseMessage.includes("flirt") || lowerCaseMessage.includes("beautiful")) handleMoodChange(MoodEnum.FLIRTY);
    }

    try {
      if (isCurrentlyBusy(userProfile.persona)) {
        const busyDelay = 5000 + Math.random() * 5000;
        await new Promise(resolve => setTimeout(resolve, busyDelay));
      }

      const response = await sendMessageToAI(
        userProfile, 
        mood, 
        relationshipStatus, 
        messages, 
        activeScenario, 
        userMessage.content
      );
      
      setMessages(prev => prev.map(m => m.timestamp === userMessage.timestamp ? { ...m, status: 'sent' } : m));
      
      const fullText = response.text;
      const tempTimestamp = Date.now();
      
      addMessage(fullText, 'model', 'sent', tempTimestamp);
      setIsLoading(false);

      if (document.hidden) {
        const iconUrl = userProfile.avatarUrl || `https://picsum.photos/seed/${userProfile.girlfriendName}/192/192`;
        showNotification(userProfile.girlfriendName, { body: fullText, icon: iconUrl, tag: 'new-message' });
      }

      setTimeout(async () => {
        const currentMessages: ChatMessage[] = [
          ...messages, 
          { role: 'user' as const, content: userMessage.content, timestamp: userMessage.timestamp }, 
          { role: 'model' as const, content: fullText, timestamp: tempTimestamp }
        ];
        const updatedMemories = await extractMemories(currentMessages, userProfile.memories || []);
        
        if (updatedMemories.length !== (userProfile.memories?.length || 0)) {
          setUserProfile(prev => {
            if (!prev) return prev;
            return { ...prev, memories: updatedMemories };
          });
        }
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setApiError(errorMessage);
      addMessage(`[System Error: ${errorMessage}]`, 'system', 'sent');
      setMessages(prev => prev.map(m => m.timestamp === userMessage.timestamp ? { ...m, status: 'error' } : m));
      setIsLoading(false);
    }
  }, [addMessage, handleMoodChange, mood, relationshipStatus, setMessages, userProfile.girlfriendName, userProfile.persona, messages, userProfile.memories, setUserProfile, userProfile.avatarUrl]);

  useEffect(() => {
    if (isOnline && messageQueue.length > 0) {
      const processQueue = async () => {
        const queueToProcess = [...messageQueue];
        setMessageQueue([]);
        for (const message of queueToProcess) {
          await processAndRespond(message);
        }
      };
      processQueue();
    }
  }, [isOnline, messageQueue, setMessageQueue, processAndRespond]);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset your girlfriend's data? This will clear your current profile and relationship status, but your message history will be saved in the history tab.")) {
      localStorage.removeItem('virtual-girlfriend-profile');
      localStorage.removeItem('virtual-girlfriend-relationship-status');
      localStorage.removeItem('virtual-girlfriend-message-count');
      localStorage.removeItem('virtual-girlfriend-followup-count');
      window.location.reload();
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const content = userInput.trim();

    const newUserMessage: ChatMessage = { role: 'user', content: content, timestamp: Date.now(), status: isOnline ? 'sent' : 'pending' };
    setMessages(prev => [...prev, newUserMessage]);
    setMessageCount(prev => prev + 1);
    setFollowUpCount(0);
    setUserInput('');
    if (isOnline) {
      await processAndRespond(newUserMessage);
    } else {
      setMessageQueue(prev => [...prev, newUserMessage]);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col text-white bg-[#0f172a] overflow-hidden relative">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-pink-500/5 blur-[80px] rounded-full" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 bg-slate-900/40 backdrop-blur-xl border-b border-slate-800/50 p-4 flex items-center justify-between shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={userProfile.avatarUrl || `https://picsum.photos/seed/${userProfile.girlfriendName}/100/100`} 
              alt={userProfile.girlfriendName} 
              className="w-12 h-12 rounded-full border-2 border-rose-500/30 object-cover shadow-lg shadow-rose-500/20"
            />
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              {userProfile.girlfriendName}
              {relationshipStatus === RSEnum.GIRLFRIEND && <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="capitalize">{relationshipStatus}</span>
              <span>•</span>
              <span className="text-rose-400/80">{mood.split(' ')[0]}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {relationshipStatus === RSEnum.GIRLFRIEND && (
            <div className="relative">
              <button 
                onClick={() => setShowDateMenu(!showDateMenu)}
                className={`p-2 rounded-full transition-all ${showDateMenu ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'hover:bg-slate-800/50 text-rose-400'}`}
              >
                <Sparkles className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {showDateMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-2 space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-2">Date Night</p>
                      <button onClick={() => handleTriggerDate('movie')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-xl transition-colors text-sm">
                        <Film className="w-4 h-4 text-indigo-400" /> Movie Night
                      </button>
                      <button onClick={() => handleTriggerDate('walk')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-xl transition-colors text-sm">
                        <Map className="w-4 h-4 text-green-400" /> Evening Walk
                      </button>
                      <button onClick={() => handleTriggerDate('dinner')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-xl transition-colors text-sm">
                        <Utensils className="w-4 h-4 text-rose-400" /> Romantic Dinner
                      </button>
                      <button onClick={() => handleTriggerDate('stargazing')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-xl transition-colors text-sm">
                        <Stars className="w-4 h-4 text-amber-400" /> Stargazing
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <button className="p-2 hover:bg-slate-800/50 rounded-full transition-colors text-slate-400 hover:text-slate-100">
            <Info className="w-5 h-5" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className={`p-2 rounded-full transition-all ${showSettingsMenu ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-100'}`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showSettingsMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => { setShowHistoryModal(true); setShowSettingsMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 rounded-xl transition-colors text-sm text-slate-200"
                    >
                      <History className="w-4 h-4 text-indigo-400" /> Conversation History
                    </button>
                    <div className="h-px bg-slate-800 mx-2 my-1" />
                    <button 
                      onClick={handleReset}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-rose-500/10 rounded-xl transition-colors text-sm text-rose-400"
                    >
                      <LogOut className="w-4 h-4" /> Reset Girlfriend
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>
      
      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 bg-amber-500/10 backdrop-blur-md border-b border-amber-500/20 text-amber-200 text-center py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <WifiOff className="w-3 h-3" />
            Offline Mode • Messages will sync later
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-2 relative z-10 scrollbar-hide">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => <MessageBubble key={msg.timestamp} message={msg} />)}
          
          {showSeen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-end pr-2"
            >
              <p className="text-[10px] text-slate-500 font-medium italic">Seen</p>
            </motion.div>
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Footer / Input Area */}
      <motion.footer 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 bg-slate-900/40 backdrop-blur-xl border-t border-slate-800/50 p-4 pb-8 md:pb-4"
      >
        <div className="max-w-3xl mx-auto">
          {apiError && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-rose-400 text-center text-xs pb-3 font-medium"
            >
              {apiError}
            </motion.p>
          )}
          <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-2 focus-within:border-rose-500/50 transition-all shadow-inner">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-sm py-2"
              disabled={isLoading && isOnline}
            />
            <button
              onClick={handleSendMessage}
              disabled={(isLoading && isOnline) || !userInput.trim()}
              className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 hover:shadow-lg hover:shadow-rose-500/30 disabled:from-slate-700 disabled:to-slate-800 disabled:opacity-50 disabled:shadow-none transition-all duration-300 group"
            >
              <SendIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </motion.footer>

      <DateScenarioOverlay 
        scenario={activeScenario} 
        onClose={() => setActiveScenario(null)} 
      />

      <HistoryModal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)} 
        currentUserName={userProfile.name}
      />
    </div>
  );
};

export default ChatView;
