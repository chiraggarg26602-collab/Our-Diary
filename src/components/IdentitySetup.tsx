import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Plus, Users, ArrowRight, Loader2, Link as LinkIcon, Book, Lock, Copy, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { diaryService } from '../lib/diaryService';

export const IdentitySetup: React.FC = () => {
  const { profile, logout } = useAuth();
  const [mode, setMode] = useState<'selection' | 'create' | 'join' | 'success'>('selection');
  const [diaryName, setDiaryName] = useState('');
  const [pin, setPin] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState('');
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const queryInvite = new URLSearchParams(window.location.search).get('invite');

  React.useEffect(() => {
    if (queryInvite && mode === 'selection') {
      setInviteCode(queryInvite);
      setMode('join');
    }
  }, [queryInvite, mode]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !diaryName || pin.length < 4) return;
    
    setLoading(true);
    setError(null);
    try {
      const diaryData = await diaryService.createDiary(profile.uid, profile.name, diaryName, pin);
      setCreatedCode(diaryData.inviteCode);
      setCreatedId(diaryData.id);
      setMode('success');
    } catch (err: any) {
      setError(err.message || "Failed to create diary");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDiary = async () => {
    if (!profile || !createdId) return;
    setLoading(true);
    try {
      await diaryService.linkDiaryToUser(profile.uid, createdId);
      // Real-time listener in AuthContext will handle the "redirect"
    } catch (err: any) {
      setError("Failed to open diary");
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !inviteCode) return;
    setLoading(true);
    setError(null);
    try {
      await diaryService.joinDiary(profile.uid, profile.name, inviteCode);
      // Real-time observer in AuthContext will update profile.diaryId 
      // which triggers App.tsx to switch from IdentitySetup to the Diary view.
    } catch (err: any) {
      setError(err.message || "Invalid code or failed to join");
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full min-h-screen app-bg flex flex-col items-center justify-center p-4 md:p-8 text-[#5D4037]">
      <div className="fixed inset-0 bg-white/40 backdrop-blur-md pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-xl w-full p-8 md:p-12 text-center relative z-10 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-200 via-pink-400 to-pink-200" />
        
        <AnimatePresence mode="wait">
          {mode === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner relative group cursor-default">
                  <Heart className="text-pink-400 fill-current w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 rounded-full border-2 border-pink-100 animate-ping opacity-20" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="serif-display text-4xl md:text-5xl text-pink-900">Welcome, {profile?.name?.split(' ')[0]}</h1>
                <p className="typewriter text-base opacity-60 italic">"A thousand miles begins with a shared secret."</p>
              </div>

              <div className="space-y-4 pt-4">
                <button
                  onClick={() => setMode('create')}
                  className="w-full group bg-white border-2 border-pink-100 p-8 rounded-[2.5rem] flex items-center justify-between hover:border-pink-300 hover:-translate-y-1 active:scale-95 transition-all shadow-lg hover:shadow-pink-100 hover:shadow-2xl"
                >
                  <div className="flex items-center gap-6 text-left">
                    <div className="p-4 bg-pink-50 rounded-2xl text-pink-500">
                      <Book className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="font-bold text-xl typewriter text-pink-900">Create Your Diary</div>
                      <div className="text-sm opacity-60 typewriter">Safe-keep your shared history</div>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-pink-300 group-hover:text-pink-500 transition-colors" />
                </button>

                <button
                  onClick={() => setMode('join')}
                  className="w-full group bg-pink-400 p-8 rounded-[2.5rem] flex items-center justify-between hover:bg-pink-500 hover:-translate-y-1 active:scale-95 transition-all shadow-xl shadow-pink-200"
                >
                  <div className="flex items-center gap-6 text-left">
                    <div className="p-4 bg-white/20 rounded-2xl text-white">
                      <Users className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="font-bold text-xl typewriter text-white">Join a Diary</div>
                      <div className="text-sm opacity-80 typewriter text-white">Enter a code from your partner</div>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
                </button>
              </div>

              <button 
                onClick={logout}
                className="mt-8 typewriter text-[10px] uppercase font-bold opacity-30 hover:opacity-100 transition-opacity tracking-widest"
              >
                Sign out
              </button>
            </motion.div>
          )}

          {mode === 'create' && (
            <motion.form
              key="create"
              onSubmit={handleCreate}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 text-left"
            >
              <div className="space-y-2 text-center">
                <h2 className="serif-display text-4xl text-pink-900">Name Your Journey</h2>
                <p className="typewriter text-sm opacity-50 italic">Pick a title for your shared story.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="typewriter text-[10px] uppercase tracking-widest font-bold opacity-40 pl-4">Diary Name</label>
                  <div className="relative">
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Our Rainy Days, Chirag & Sneha..."
                      value={diaryName}
                      onChange={(e) => setDiaryName(e.target.value)}
                      className="w-full bg-white border-2 border-pink-100 p-5 rounded-3xl text-lg typewriter focus:border-pink-400 outline-none transition-all shadow-inner"
                    />
                    <Sparkles className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-200 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="typewriter text-[10px] uppercase tracking-widest font-bold opacity-40 pl-4 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Private PIN (4 Digits)
                  </label>
                  <input 
                    type="password"
                    required
                    maxLength={4}
                    placeholder="****"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white border-2 border-pink-100 p-5 rounded-3xl text-3xl tracking-[1em] text-center typewriter focus:border-pink-400 outline-none transition-all shadow-inner"
                  />
                  <p className="text-[10px] typewriter opacity-40 px-4 italic leading-relaxed">
                    This PIN will lock your dairy on all devices. Choose something only the two of you know.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs typewriter italic border border-red-100">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || !diaryName || pin.length < 4}
                  className="w-full bg-pink-400 text-white py-5 rounded-full font-bold shadow-xl shadow-pink-100 flex items-center justify-center gap-3 hover:bg-pink-500 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Create Our Secret Sanctuary"}
                  {!loading && <ArrowRight className="w-6 h-6" />}
                </button>
                <button 
                  type="button" 
                  onClick={() => setMode('selection')}
                  className="typewriter text-xs text-center opacity-40 hover:opacity-100 transition-opacity font-bold uppercase tracking-widest"
                >
                  Go back
                </button>
              </div>
            </motion.form>
          )}

          {mode === 'join' && (
            <motion.form
              key="join"
              onSubmit={handleJoin}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2 text-center">
                <h2 className="serif-display text-4xl text-pink-900">A Story Awaits</h2>
                <p className="typewriter text-sm opacity-50 italic">Enter the invitation code your partner shared.</p>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="typewriter text-[10px] uppercase tracking-widest font-bold opacity-40 text-left pl-4">6-Digit Invitation Code</label>
                  <input 
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full bg-white border-2 border-pink-100 p-6 rounded-3xl text-center typewriter text-4xl tracking-[0.3em] font-bold focus:border-pink-400 outline-none transition-all shadow-inner text-pink-500"
                    autoFocus
                  />
                </div>
                
                {error && (
                  <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs typewriter italic border border-red-100">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || inviteCode.length < 6}
                  className="w-full bg-pink-400 text-white py-5 rounded-full font-bold shadow-xl shadow-pink-100 flex items-center justify-center gap-3 hover:bg-pink-500 active:scale-95 transition-all disabled:opacity-30"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Join Shared Sanctuary"}
                  {!loading && <ArrowRight className="w-6 h-6" />}
                </button>
                <button type="button" onClick={() => setMode('selection')} className="typewriter text-xs opacity-40 hover:opacity-100 transition-opacity font-bold uppercase tracking-widest">
                  Go back
                </button>
              </div>
            </motion.form>
          )}

          {mode === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-10"
            >
              <div className="p-8 bg-pink-50 rounded-[3rem] border border-pink-100 flex flex-col items-center relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-1000" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-1000" />
                
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 text-pink-400 shadow-xl relative z-10">
                  <Users className="w-10 h-10" />
                </div>
                <h3 className="serif-display text-3xl mb-3 text-pink-900 relative z-10">Invite Your Partner</h3>
                <p className="typewriter text-sm opacity-60 italic relative z-10 max-w-[250px]">"Every amazing story needs at least two writers."</p>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-pink-100 shadow-inner flex flex-col items-center relative">
                   <label className="typewriter text-[10px] uppercase font-bold opacity-40 mb-4 tracking-widest">Shared Secret Code</label>
                   <span className="typewriter text-5xl font-bold tracking-[0.4em] text-pink-500 mb-6">{createdCode}</span>
                   <div className="flex gap-3">
                     <button 
                      onClick={() => copyToClipboard(createdCode)}
                      className="px-6 py-3 bg-pink-50 text-pink-500 rounded-2xl typewriter text-xs uppercase font-bold hover:bg-pink-100 transition-colors flex items-center gap-2"
                     >
                       {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                       {copied ? 'Copied!' : 'Copy Code'}
                     </button>
                     <button 
                      onClick={() => copyToClipboard(`${window.location.origin}?invite=${createdCode}`)}
                      className="px-4 py-3 border border-pink-100 text-pink-400 rounded-2xl hover:bg-pink-50 transition-colors"
                      title="Copy Invite Link"
                     >
                       <LinkIcon className="w-4 h-4" />
                     </button>
                   </div>
                </div>

                <div className="pt-4">
                  <p className="typewriter text-[10px] opacity-40 leading-relaxed italic mb-8 mx-auto max-w-[300px]">
                    Your part of the book is ready. Once your partner joins, these pages will come to life with your shared memories.
                  </p>

                  <button 
                    onClick={handleOpenDiary}
                    disabled={loading}
                    className="w-full bg-pink-900 text-white py-6 rounded-full font-bold shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.03] active:scale-95 transition-all text-xl serif-display tracking-wide disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        Open Your Diary <ArrowRight className="w-6 h-6" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
