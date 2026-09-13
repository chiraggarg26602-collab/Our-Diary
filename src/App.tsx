import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { DiaryEntry } from './types';
import { useAuth } from './lib/AuthContext';
import { IdentitySetup } from './components/IdentitySetup';
import { DiaryCover } from './components/DiaryCover';
import { DiaryBook } from './components/DiaryBook';
import { EntryDetailModal } from './components/EntryDetailModal';
import { AddMemoryModal } from './components/AddMemoryModal';
import { SettingsModal } from './components/SettingsModal';
import { 
  Heart, 
  Plus, 
  Settings,
  Loader2,
  Users,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import firebaseConfig from '../firebase-applet-config.json';

export default function App() {
  const { user, profile, loading, isLoggingIn, authError, authErrorCode, clearAuthError, login, loginAsGuest, logout } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [diaryData, setDiaryData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState('https://i.pinimg.com/736x/80/4f/7b/804f7bf1516e4533031023778a48378d.jpg');
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    if (!profile?.diaryId) {
      setEntries([]);
      setDiaryData(null);
      return;
    }

    // Settings Listener for the shared diary
    const unsubscribeDiary = onSnapshot(doc(db, 'diaries', profile.diaryId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setDiaryData(data);
        if (data.backgroundImage) {
          setBackgroundUrl(data.backgroundImage);
          const img = new Image();
          img.src = data.backgroundImage;
        }
      }
    });

    const entriesPath = `diaries/${profile.diaryId}/entries`;
    const q = query(collection(db, entriesPath), orderBy('createdAt', 'desc'));
    const unsubscribeEntries = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DiaryEntry[];
      setEntries(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, entriesPath);
    });

    return () => {
      unsubscribeDiary();
      unsubscribeEntries();
    };
  }, [profile?.diaryId]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-romantic-light">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div 
        className="w-full h-screen app-bg flex flex-col items-center justify-center text-[#5D4037]"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      >
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center relative z-10 max-w-md w-full"
        >
          <div className="flex justify-center mb-6">
            <Heart className="w-16 h-16 text-pink-400 fill-current animate-pulse" />
          </div>
          <h1 className="serif-display text-4xl mb-4">Our Romantic Diary</h1>
          <p className="typewriter opacity-60 mb-8 italic">A private shared space for your journey together.</p>
          <button 
            id="google-login-btn"
            onClick={() => login()}
            disabled={isLoggingIn}
            className="w-full bg-pink-400 hover:bg-pink-500 text-white py-4 rounded-full font-bold shadow-xl hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 bg-white rounded-full p-1" alt="Google" />
                <span>Login with Google</span>
              </>
            )}
          </button>

          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-px bg-pink-200/80 flex-1" />
            <span className="text-[10px] typewriter uppercase tracking-widest text-pink-400 font-bold">or</span>
            <div className="h-px bg-pink-200/80 flex-1" />
          </div>

          <button
            id="guest-login-btn"
            type="button"
            onClick={() => loginAsGuest()}
            disabled={isLoggingIn}
            className="mt-3 w-full bg-white/90 border-2 border-pink-100 hover:border-pink-300 text-pink-800 py-3.5 rounded-full font-bold shadow-sm hover:shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Continue as Guest</span>
          </button>

          {authErrorCode === 'auth/unauthorized-domain' ? (
            <div className="mt-6 text-left p-4 bg-amber-50/95 border-2 border-amber-200 rounded-3xl text-amber-900 shadow-sm space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xs text-amber-950 uppercase tracking-wider">Domain Authorization Required</h3>
                  <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                    Firebase Authentication requires this domain to be listed in <strong>Authorized domains</strong> before Google Sign-In will succeed.
                  </p>
                </div>
              </div>

              <div className="bg-white/90 p-2.5 rounded-2xl border border-amber-200 flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-amber-950 truncate select-all px-1">
                  {typeof window !== 'undefined' ? window.location.hostname : ''}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(window.location.hostname);
                      setCopiedDomain(true);
                      setTimeout(() => setCopiedDomain(false), 2000);
                    }
                  }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  {copiedDomain ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-amber-800/90 space-y-1">
                <div className="font-semibold">How to fix in 30 seconds:</div>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>Open your Firebase Console Auth Settings</li>
                  <li>Click <strong>Authorized domains</strong> &gt; <strong>Add domain</strong></li>
                  <li>Paste the domain above and click <strong>Add</strong></li>
                </ol>
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <a
                  href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Open Firebase Auth Settings</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => login()}
                    className="flex-1 py-2 px-2 bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Retry Login
                  </button>
                  <button
                    type="button"
                    onClick={() => loginAsGuest()}
                    className="flex-1 py-2 px-2 bg-pink-100 hover:bg-pink-200 text-pink-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Enter as Guest
                  </button>
                </div>
              </div>
            </div>
          ) : authError ? (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center justify-between text-left">
              <span>{authError}</span>
              <button 
                type="button" 
                onClick={clearAuthError} 
                className="text-rose-400 hover:text-rose-700 font-bold ml-2 p-1 text-sm leading-none"
              >
                ✕
              </button>
            </div>
          ) : null}
        </motion.div>
      </div>
    );
  }

  if (!profile?.diaryId) {
    return <IdentitySetup />;
  }

  return (
    <div 
      className="w-full h-screen app-bg flex flex-col overflow-hidden text-[#5D4037] relative"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div className="absolute inset-0 bg-white/30 pointer-events-none" />

      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div 
            key="cover"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-[100]"
          >
            <DiaryCover 
              onUnlock={() => setIsUnlocked(true)} 
              diaryName={diaryData?.diaryName || 'Our Diary'}
              memberNames={diaryData?.memberNames || []}
              expectedPinHash={diaryData?.pinHash || ''}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="book"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex flex-col h-full w-full"
          >
            {/* Nav */}
            <nav className="h-14 md:h-16 px-4 md:px-8 flex-none flex items-center justify-between border-b border-white/20 backdrop-blur-sm z-30">
              <div className="flex items-center gap-2 md:gap-3">
                <Heart className="w-4 h-4 md:w-5 md:h-5 text-pink-400 fill-current" />
                <h1 className="serif-display text-lg md:text-xl">{diaryData?.diaryName || 'Our Diary'}</h1>
                {diaryData?.memberNames && (
                  <div className="hidden md:flex ml-4 items-center gap-2 typewriter text-[9px] uppercase tracking-widest opacity-40">
                    <span>{diaryData.memberNames[0]?.split(' ')[0]}</span>
                    <span className="text-pink-300">&</span>
                    <span>{diaryData.memberNames[1]?.split(' ')[0] || 'Partner'}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 bg-white/40 hover:bg-white/60 rounded-full transition-colors"
                >
                  <Settings className="w-5 h-5 opacity-60" />
                </button>
                <button 
                  onClick={logout}
                  className="p-2 bg-white/40 hover:bg-white/60 rounded-full transition-colors typewriter text-[10px] uppercase font-bold"
                >
                  Log Out
                </button>
              </div>
            </nav>

            <main className="flex-1 relative overflow-hidden">
              <DiaryBook 
                entries={entries} 
                onEntryClick={setSelectedEntry}
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
              />
            </main>

            {/* Invitation Banner if alone */}
            {diaryData?.members?.length === 1 && showBanner && (
              <div className="fixed bottom-28 right-10 left-10 md:left-auto md:w-80 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-pink-100 z-40 transform hover:-translate-y-1 transition-transform group">
                <button 
                  onClick={() => setShowBanner(false)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="w-4 h-4 rotate-45 text-pink-300" />
                </button>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex-none flex items-center justify-center text-pink-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="serif-display text-sm font-bold text-pink-900">Invite your partner</h4>
                    <p className="typewriter text-[9px] opacity-60 italic mb-3">Copy the code to start your shared story.</p>
                    <div className="flex items-center justify-between gap-2 bg-pink-50 p-2 rounded-lg border border-pink-100 mb-2">
                       <span className="typewriter font-bold tracking-widest text-pink-600">{diaryData.inviteCode}</span>
                       <button 
                        onClick={() => {
                          navigator.clipboard.writeText(diaryData.inviteCode);
                          alert("Invite code copied!");
                        }}
                        className="text-[8px] typewriter uppercase font-bold text-pink-400"
                       >
                         Copy
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Action Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="fixed bottom-10 right-10 w-16 h-16 bg-pink-400 text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 shadow-xl border-4 border-white"
            >
              <Plus className="w-8 h-8" />
              <div className="absolute -top-3 -left-3 text-2xl">🌷</div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals outside AnimatePresence of core views */}
      <AnimatePresence>
        {isModalOpen && (
          <AddMemoryModal 
            diaryId={profile.diaryId}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => setIsModalOpen(false)}
          />
        )}
        {selectedEntry && (
          <EntryDetailModal 
            diaryId={profile.diaryId}
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
          />
        )}
        {isSettingsOpen && (
          <SettingsModal 
            diary={diaryData}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
