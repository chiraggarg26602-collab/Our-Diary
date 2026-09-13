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
  Users
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const { user, profile, loading, isLoggingIn, authError, clearAuthError, login, logout } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [diaryData, setDiaryData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState('https://i.pinimg.com/736x/80/4f/7b/804f7bf1516e4533031023778a48378d.jpg');
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

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
            className="w-full bg-pink-400 text-white py-4 rounded-full font-bold shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Opening Google Sign-In...</span>
              </>
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 bg-white rounded-full p-1" alt="Google" />
                <span>Login with Google</span>
              </>
            )}
          </button>
          {authError && (
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
          )}
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
