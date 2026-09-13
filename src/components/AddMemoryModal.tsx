import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, Camera, Send, Loader2, Sparkles, Plus } from 'lucide-react';
import { MOODS, STICKERS } from '../types';
import { uploadImages } from '../services/cloudinary';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

import { useAuth } from '../lib/AuthContext';

interface AddMemoryModalProps {
  diaryId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({ diaryId, onClose, onSuccess }) => {
  const { profile } = useAuth();
  const [text, setText] = useState('');
  const [mood, setMood] = useState(MOODS[0].emoji);
  const [images, setImages] = useState<File[]>([]);
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !profile) return;

    setIsUploading(true);
    const entriesPath = `diaries/${diaryId}/entries`;
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        try {
          imageUrls = await uploadImages(images);
        } catch (uploadError: any) {
          console.error("Upload failed:", uploadError);
          if (confirm(`Image upload failed: ${uploadError.message}. Share memory without photos anyway?`)) {
            imageUrls = [];
          } else {
            setIsUploading(false);
            return;
          }
        }
      }

      await addDoc(collection(db, entriesPath), {
        text,
        authorId: profile.uid,
        authorName: profile.name,
        mood,
        imageUrls,
        stickers: selectedStickers,
        isFavorite: false,
        createdAt: serverTimestamp(),
      });

      onSuccess();
      onClose();
    } catch (error) {
      // Catch Firestore permission errors
      if (typeof error === 'object' && error !== null && 'code' in (error as any)) {
        handleFirestoreError(error, OperationType.WRITE, entriesPath);
      }
      console.error("Error adding entry:", error);
      alert("Failed to share memory. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 z-10 backdrop-blur-md">
          <h2 className="serif-display text-3xl text-[#5D4037]">Add to our Story</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Mood Selection */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold opacity-40 mb-4">
              How are you feeling, {profile?.name?.split(' ')[0]}?
            </label>
            <div className="flex flex-wrap gap-3">
              {MOODS.map((m) => (
                <button
                  key={m.emoji}
                  type="button"
                  onClick={() => setMood(m.emoji)}
                  className={`p-4 rounded-[1.5rem] text-2xl transition-all duration-300 ${
                    mood === m.emoji ? 'bg-white shadow-xl scale-110 ring-2 ring-pink-200' : 'bg-white/40 hover:bg-white/60'
                  }`}
                  title={m.label}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Text Content */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold opacity-40 mb-4">
              The details of this moment...
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start writing..."
              className="w-full h-48 p-6 rounded-3xl bg-white/50 border border-white/40 focus:ring-2 focus:ring-romantic-base typewriter text-lg text-[#5D4037] resize-none shadow-inner"
              required
            />
          </div>

          {/* Stickers */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold opacity-40 mb-4">
              Add Decorations (Stickers)
            </label>
            <div className="flex flex-wrap gap-2">
              {STICKERS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (selectedStickers.includes(s.id)) {
                      setSelectedStickers(prev => prev.filter(id => id !== s.id));
                    } else {
                      setSelectedStickers(prev => [...prev, s.id]);
                    }
                  }}
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl text-2xl transition-all ${
                    selectedStickers.includes(s.id) 
                      ? 'bg-romantic-base scale-110 shadow-lg' 
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                >
                  {s.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold opacity-40 mb-4">
              Visual Memories
            </label>
            <div className="flex flex-wrap gap-3">
              <label 
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-white flex flex-col items-center justify-center cursor-pointer hover:bg-white/30 transition-all bg-white/10"
              >
                <ImageIcon className="w-6 h-6 text-[#FF6B6B]" />
                <span className="text-[10px] font-bold text-[#FF6B6B] mt-1 uppercase">Upload</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
              
              {images.map((img, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden group shadow-md border-2 border-white">
                  <img 
                    src={URL.createObjectURL(img)} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="text-white w-6 h-6" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading || !text.trim()}
            className="w-full py-5 rounded-[2rem] bg-pink-400 text-white font-bold text-lg shadow-[0_10px_30px_rgba(244,143,177,0.4)] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 border-4 border-white/50"
          >
            {isUploading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <><Sparkles className="w-6 h-6" /> Share this memory</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
