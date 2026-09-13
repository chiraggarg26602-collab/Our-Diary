import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Lock, Key, Sparkles, Loader2, Feather } from 'lucide-react';
import { diaryService } from '../lib/diaryService';

interface DiaryCoverProps {
  onUnlock: () => void;
  diaryName: string;
  memberNames: string[];
  expectedPinHash: string;
}

export const DiaryCover: React.FC<DiaryCoverProps> = ({ onUnlock, diaryName, memberNames, expectedPinHash }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;
    
    setLoading(true);
    const hash = diaryService.hashPin(pin);
    
    if (hash === expectedPinHash) {
      setTimeout(() => {
        onUnlock();
      }, 500);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
      setPin('');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] perspective-2000 overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[#1a0f0f] z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-20" />
        <div className="absolute inset-0 bg-gradient-radial from-pink-900/40 via-transparent to-transparent opacity-60" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: 0.1
            }}
            animate={{ 
              y: [null, -100, 100],
              x: [null, 50, -50],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ 
              duration: 10 + Math.random() * 20, 
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute w-1 h-1 bg-pink-200 rounded-full blur-[1px]"
          />
        ))}
      </div>

      <motion.div
        initial={{ rotateY: -10, scale: 0.9, opacity: 0 }}
        animate={{ rotateY: 0, scale: 1, opacity: 1 }}
        exit={{ 
          rotateY: -90, 
          scale: 1.1, 
          opacity: 0,
          transition: { duration: 1.2, ease: [0.4, 0, 0.2, 1] } 
        }}
        className="w-[90vw] max-w-[500px] h-[75vh] bg-pink-900 rounded-r-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative flex flex-col items-center justify-center text-white border-l-[12px] border-pink-950 preserve-3d"
        style={{ transformOrigin: 'left center' }}
      >
        {/* Ornate Border */}
        <div className="absolute inset-6 border-[3px] border-pink-700/40 rounded-r-[2.5rem] pointer-events-none" />
        <div className="absolute inset-8 border border-pink-600/20 rounded-r-[2rem] pointer-events-none" />
        
        {/* Cover Content */}
        <motion.div
          animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
          className="z-10 flex flex-col items-center w-full px-12 text-center select-none"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-pink-400 blur-2xl opacity-20 animate-pulse" />
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl">
                  <Heart className="w-12 h-12 text-pink-400 fill-current drop-shadow-[0_0_15px_rgba(244,114,182,0.5)]" />
                </div>
              </div>
            </div>
            
            <h1 className="serif-display text-5xl md:text-6xl mb-4 text-pink-100 tracking-tight leading-tight">
              {diaryName || 'Our Secret Story'}
            </h1>
            
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-pink-500/40" />
              <p className="typewriter text-base text-pink-300 font-medium tracking-widest uppercase">
                {memberNames?.join(' • ') || 'Infinite Love'}
              </p>
              <div className="h-px w-8 bg-pink-500/40" />
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-pink-400/60 mb-2">
                <Lock className="w-4 h-4" />
                <span className="typewriter text-[10px] uppercase tracking-[0.3em] font-bold">Locked for privacy</span>
              </div>
              
              <div className="relative group">
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  disabled={loading}
                  placeholder="PIN"
                  className="w-full bg-white/5 border-2 border-white/10 focus:border-pink-400/50 outline-none text-4xl tracking-[1em] p-6 rounded-[2rem] typewriter text-center transition-all backdrop-blur-md placeholder:text-white/10"
                />
                <Key className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/10 group-focus-within:text-pink-400/40 transition-colors" />
              </div>
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-pink-400 text-sm typewriter italic animate-pulse"
                >
                  "That's not our secret path..."
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full group bg-white text-pink-950 py-5 rounded-full font-bold shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] hover:bg-pink-100 active:scale-95 transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-30 disabled:pointer-events-none"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Unlock Memories <Sparkles className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Embossed Detail */}
        <div className="absolute right-8 bottom-8 opacity-20">
          <Feather className="w-16 h-16 text-white rotate-45" />
        </div>

        {/* Book spine aesthetic */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/60 to-transparent rounded-l-[12px]" />
        <div className="absolute left-3 top-0 bottom-0 w-px bg-white/10" />
        <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />
      </motion.div>

      {/* Ornate corner flourishes */}
      <div className="absolute top-10 left-10 w-24 h-24 border-t-2 border-l-2 border-pink-500/20 rounded-tl-[3rem] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-24 h-24 border-b-2 border-r-2 border-pink-500/20 rounded-br-[3rem] pointer-events-none" />
    </div>
  );
};
