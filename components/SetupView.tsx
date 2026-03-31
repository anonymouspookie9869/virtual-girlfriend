import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { UserProfile, AIPersona, UserProfession } from '../types';
import { generateAvatar } from '../services/geminiService';
import { Sparkles, User, Heart, Camera, Loader2 } from 'lucide-react';

interface SetupViewProps {
  setUserProfile: (profile: UserProfile) => void;
}

const PREDEFINED_AVATARS = [
  'https://picsum.photos/seed/girl1/200/200',
  'https://picsum.photos/seed/girl2/200/200',
  'https://picsum.photos/seed/girl3/200/200',
  'https://picsum.photos/seed/girl4/200/200',
];

const SetupView: React.FC<SetupViewProps> = ({ setUserProfile }) => {
  const [name, setName] = useState('');
  const [profession, setProfession] = useState<UserProfession>('College Student');
  const [girlfriendName, setGirlfriendName] = useState('');
  const [birthday] = useState('');
  const [persona, setPersona] = useState<AIPersona>('College Student');
  const [avatarUrl, setAvatarUrl] = useState(PREDEFINED_AVATARS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [hairstyle, setHairstyle] = useState('');
  const [clothing, setClothing] = useState('');
  const [accessory, setAccessory] = useState('');
  const [step, setStep] = useState(1);

  const HAIRSTYLES = ['Long', 'Short', 'Ponytail', 'Braids', 'Bun', 'Curly', 'Straight'];
  const CLOTHING = ['Saree', 'Kurti', 'Western Dress', 'Casual Tee', 'Formal Suit', 'Hoodie'];
  const ACCESSORIES = ['Glasses', 'Earrings', 'Necklace', 'Bindi', 'Nose Ring', 'Scarf'];

  const handleGenerateAvatar = async () => {
    setIsGenerating(true);
    try {
      const fullPrompt = [
        hairstyle ? `${hairstyle} hairstyle` : '',
        clothing ? `wearing ${clothing}` : '',
        accessory ? `with ${accessory}` : '',
        customPrompt
      ].filter(Boolean).join(', ');

      const url = await generateAvatar(fullPrompt || 'beautiful Indian girl');
      setAvatarUrl(url);
    } catch (error) {
      console.error(error);
      // Using a more subtle error feedback would be better, but keeping alert for now as per base
      alert("Failed to generate avatar. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && profession.trim() && girlfriendName.trim()) {
      setUserProfile({
        name,
        profession,
        girlfriendName,
        birthday,
        persona,
        relationshipStartDate: new Date().toISOString(),
        avatarUrl,
      });
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen w-screen flex items-center justify-center text-white p-4 py-12 bg-[#0f172a] relative overflow-hidden">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 rounded-[2.5rem] shadow-2xl p-8 md:p-12 space-y-8 relative z-10"
      >
        <div className="text-center space-y-2">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex p-3 bg-rose-500/10 rounded-2xl mb-2"
          >
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500/20" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-100">
            Create Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500">Soulmate</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base">Let's personalize your experience.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  About You
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Your Name</label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="What should she call you?"
                      className="w-full px-5 py-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all outline-none text-slate-100 placeholder-slate-600 shadow-inner"
                    />
                  </div>
                  <div>
                    <label htmlFor="profession" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Your Profession</label>
                    <select
                      id="profession"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value as UserProfession)}
                      className="w-full px-5 py-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-rose-500/50 transition-all outline-none text-slate-100 appearance-none cursor-pointer shadow-inner"
                    >
                      <option className="bg-slate-900">School Student</option>
                      <option className="bg-slate-900">College Student</option>
                      <option className="bg-slate-900">Employee</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!name.trim()}
                  className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  Her Personality
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="girlfriendName" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Her Name</label>
                    <input
                      id="girlfriendName"
                      type="text"
                      value={girlfriendName}
                      onChange={(e) => setGirlfriendName(e.target.value)}
                      required
                      placeholder="Give her a beautiful name"
                      className="w-full px-5 py-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-rose-500/50 transition-all outline-none text-slate-100 placeholder-slate-600 shadow-inner"
                    />
                  </div>
                  <div>
                    <label htmlFor="persona" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Her Persona</label>
                    <select
                      id="persona"
                      value={persona}
                      onChange={(e) => setPersona(e.target.value as AIPersona)}
                      className="w-full px-5 py-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-rose-500/50 transition-all outline-none text-slate-100 appearance-none cursor-pointer shadow-inner"
                    >
                      <option className="bg-slate-900">School Student</option>
                      <option className="bg-slate-900">College Student</option>
                      <option className="bg-slate-900">Working Professional</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!girlfriendName.trim()}
                    className="flex-[2] py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-white transition-all disabled:opacity-50 shadow-lg"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm uppercase tracking-wider">
                  <Camera className="w-4 h-4" />
                  Appearance
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-3">
                    {PREDEFINED_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 ${avatarUrl === url ? 'border-rose-500 scale-105 ring-4 ring-rose-500/20' : 'border-transparent opacity-40 hover:opacity-100'}`}
                      >
                        <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Hairstyle</label>
                        <select
                          value={hairstyle}
                          onChange={(e) => setHairstyle(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-rose-500/50 outline-none text-slate-100 text-xs appearance-none cursor-pointer"
                        >
                          <option value="">Any Hairstyle</option>
                          {HAIRSTYLES.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Clothing</label>
                        <select
                          value={clothing}
                          onChange={(e) => setClothing(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-rose-500/50 outline-none text-slate-100 text-xs appearance-none cursor-pointer"
                        >
                          <option value="">Any Clothing</option>
                          {CLOTHING.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Accessory</label>
                      <select
                        value={accessory}
                        onChange={(e) => setAccessory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-rose-500/50 outline-none text-slate-100 text-xs appearance-none cursor-pointer"
                      >
                        <option value="">No Accessory</option>
                        {ACCESSORIES.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Additional Details</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. smiling, in a garden..."
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          className="flex-1 px-4 py-3 bg-slate-800/40 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-rose-500/50 transition-all outline-none text-slate-100 text-sm placeholder-slate-600 shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateAvatar}
                          disabled={isGenerating}
                          className="px-4 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-rose-500/20"
                        >
                          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {avatarUrl.startsWith('data:') && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center"
                      >
                        <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-4 border-rose-500 shadow-2xl shadow-rose-500/30">
                          <img src={avatarUrl} alt="Generated Avatar" className="w-full h-full object-cover" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-rose-500/20"
                  >
                    Start Your Journey
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
};

export default SetupView;
