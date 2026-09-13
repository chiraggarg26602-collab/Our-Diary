import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Image as ImageIcon, Loader2, Sparkles, Pencil, Lock, Users, Copy, Check } from 'lucide-react';
import { uploadImages } from '../services/cloudinary';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn } from '../lib/utils';
import { Diary, diaryService } from '../lib/diaryService';
import { useAuth } from '../lib/AuthContext';

interface SettingsModalProps {
  onClose: () => void;
  diary: Diary;
}

const PRESET_BGS = [
  { id: 'classic', name: 'Classic Rose', url: 'https://i.pinimg.com/736x/80/4f/7b/804f7bf1516e4533031023778a48378d.jpg' },
  { id: 'vintage', name: 'Vintage Paper', url: 'https://i.pinimg.com/736x/01/f9/4b/01f94b80362f689e4726cd5ff883015b.jpg' },
  { id: 'romantic', name: 'Romantic Evening', url: 'https://i.pinimg.com/736x/9e/3a/28/9e3a2862e3d5b78f87e5b2e987cce69b.jpg' },
  { id: 'minimal', name: 'Minimal Blush', url: 'https://i.pinimg.com/736x/8d/6d/4d/8d6d4d8e8749830c33fb07567784033b.jpg' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, diary }) => {
  const { profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(diary.backgroundImage || null);
  const [diaryName, setDiaryName] = useState(diary.diaryName || '');
  const [newPin, setNewPin] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(diary.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsUploading(true);
    try {
      let bgUrl = preview;
      if (file) {
        const urls = await uploadImages([file]);
        if (urls.length > 0) bgUrl = urls[0];
      }

      const updates: any = {
        backgroundImage: bgUrl,
        diaryName,
        lastUpdated: serverTimestamp(),
      };

      if (newPin.length === 4) {
        updates.pinHash = diaryService.hashPin(newPin);
      }

      await updateDoc(doc(db, 'diaries', diary.id), updates);
      onClose();
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error) {
        handleFirestoreError(error, OperationType.WRITE, `diaries/${diary.id}`);
      }
      console.error("Failed to update settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] p-6 bg-black/20 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card max-w-md w-full bg-white/90 p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="serif-display text-3xl mb-8 text-[#5D4037] text-center">Settings</h2>
        
        <div className="space-y-8">
          {/* Members Section */}
          <div className="p-5 bg-white/60 rounded-[2rem] border border-pink-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-500">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="typewriter text-[9px] uppercase font-bold opacity-30 tracking-widest">Shared With</div>
                <div className="typewriter text-sm font-bold text-pink-900 leading-tight">
                  {diary.memberNames?.join(' & ') || 'Loading...'}
                </div>
              </div>
            </div>
            {diary.members?.length === 1 && (
              <span className="typewriter text-[8px] uppercase font-bold text-pink-400 animate-pulse bg-pink-50 px-2 py-1 rounded-full border border-pink-100">Waiting...</span>
            )}
          </div>

          {/* Diary Name Section */}
          <div className="space-y-3 pb-2">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40 pl-2">
              <Pencil className="w-3 h-3" /> Diary Title
            </label>
            <input 
              type="text"
              value={diaryName}
              onChange={(e) => setDiaryName(e.target.value)}
              className="w-full bg-white border border-pink-100 p-4 rounded-2xl typewriter text-base focus:border-pink-400 outline-none shadow-inner"
              placeholder="Give your story a name..."
            />
          </div>

          {/* Passcode Section */}
          <div className="space-y-3 pb-2">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40 pl-2">
              <Lock className="w-3 h-3" /> Update Private PIN
            </label>
            <div className="relative">
              <input 
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4 digits to change..."
                className="w-full bg-white border border-pink-100 p-4 rounded-2xl typewriter text-base focus:border-pink-400 outline-none shadow-inner placeholder:text-[10px] placeholder:opacity-30"
              />
              {newPin.length > 0 && newPin.length < 4 && (
                <p className="text-[10px] text-pink-400 mt-1 pl-2 typewriter italic">Must be 4 digits</p>
              )}
            </div>
          </div>

          {/* Invite Section */}
          <div className="p-5 bg-pink-50 rounded-[2rem] border border-pink-100 relative group">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40 mb-3">
              Invitation Code
            </label>
            <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-pink-100 shadow-inner">
               <span className="typewriter text-2xl font-bold tracking-[0.3em] text-pink-600">{diary.inviteCode}</span>
               <button 
                onClick={handleCopyInvite}
                className="p-3 hover:bg-pink-50 rounded-xl text-pink-400 transition-colors"
               >
                 {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
               </button>
            </div>
          </div>

          {/* Background Section */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40 pl-2">
              <ImageIcon className="w-3 h-3" /> Book Cover Style
            </label>
            
            <div className="grid grid-cols-4 gap-3">
              {PRESET_BGS.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => { setPreview(bg.url); setFile(null); }}
                  className={cn(
                    "aspect-square rounded-xl overflow-hidden border-2 transition-all group relative",
                    preview === bg.url ? "border-pink-400 scale-105 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={bg.url} alt={bg.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  {preview === bg.url && (
                    <div className="absolute inset-0 bg-pink-400/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white drop-shadow-md" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="relative group aspect-video rounded-3xl overflow-hidden bg-gray-50 border-2 border-dashed border-pink-100 hover:border-pink-300 transition-colors">
              {preview ? (
                <img src={preview} alt="Background preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-pink-200">
                  <ImageIcon className="w-10 h-10 mb-2" />
                  <span className="text-xs typewriter uppercase font-bold tracking-widest">Select Image</span>
                </div>
              )}
              
              <label className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center cursor-pointer transition-all">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                <div className="bg-white px-6 py-3 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 shadow-2xl translate-y-2 group-hover:translate-y-0">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  Custom Image
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isUploading || (newPin.length > 0 && newPin.length < 4)}
            className="w-full h-16 bg-pink-900 text-white rounded-[2rem] font-bold flex items-center justify-center gap-3 disabled:opacity-30 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl relative overflow-hidden group"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <span className="relative z-10">Save Settings</span>
                <Sparkles className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-800 to-pink-950 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
