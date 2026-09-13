import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Calendar, User, Smile } from 'lucide-react';
import { DiaryEntry, STICKERS } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface EntryDetailModalProps {
  diaryId: string;
  entry: DiaryEntry | null;
  onClose: () => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({ diaryId, entry, onClose }) => {
  if (!entry) return null;

  const date = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[150] p-6 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#fdfcf0] paper-texture max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl shadow-2xl relative flex flex-col"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-white/50 hover:bg-white rounded-full transition-colors z-20 shadow-sm"
        >
          <X className="w-5 h-5 text-[#5D4037]" />
        </button>

        <div className="p-6 md:p-10">
          {/* Header Info */}
          <div className="flex flex-col gap-1 md:gap-2 mb-6 md:mb-8 border-b border-pink-200 pb-4 md:pb-6 relative text-wrap">
            <div className="flex items-center gap-3 md:gap-4 flex-wrap">
              <span className="typewriter text-2xl md:text-3xl text-[#5D4037]">
                {format(date, 'MMMM d, yyyy')}
              </span>
              <span className="text-2xl md:text-3xl">{entry.mood}</span>
            </div>
            <div className="flex items-center gap-4 typewriter text-xs opacity-50 uppercase tracking-widest font-bold">
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {entry.authorName || 'Someone'}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(date, 'p')}</span>
            </div>
          </div>

          {/* Image Gallery */}
          {entry.imageUrls && entry.imageUrls.length > 0 && (
            <div className="mb-8 md:mb-10 space-y-6 md:space-y-8">
              {entry.imageUrls.map((url, idx) => (
                <div 
                  key={idx} 
                  className="bg-white p-3 md:p-4 pb-10 md:pb-12 shadow-xl border border-gray-100 transform -rotate-1 relative group"
                >
                  <img 
                    src={url} 
                    alt="" 
                    loading="lazy"
                    className="w-full h-auto rounded-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 md:bottom-3 left-0 right-0 text-center typewriter text-[8px] md:text-[10px] opacity-20">
                    Memory {idx + 1} • {format(date, 'MMM yyyy')}
                  </div>
                  
                  {/* Stickers specific to this image */}
                  <div className="absolute inset-0 pointer-events-none">
                    {entry.stickers?.filter((_, si) => si % entry.imageUrls!.length === idx).map((sid, si) => {
                      const sticker = STICKERS.find(s => s.id === sid);
                      if (!sticker) return null;
                      return (
                        <span 
                          key={si}
                          className="absolute text-5xl drop-shadow-lg"
                          style={{ 
                            top: `${20 + si * 15}%`, 
                            right: si % 2 === 0 ? '-10px' : 'auto',
                            left: si % 2 === 1 ? '-10px' : 'auto',
                            transform: `rotate(${si * 20 - 10}deg)`
                          }}
                        >
                          {sticker.emoji}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Text Content */}
          <div className="relative">
             <div className="absolute -left-4 md:-left-6 top-0 bottom-0 w-1 bg-pink-100/50 rounded-full" />
             <p className="typewriter text-lg md:text-xl leading-relaxed text-[#5D4037] whitespace-pre-wrap">
               {entry.text}
             </p>
          </div>

          {/* Floating Stickers for text-only or general decoration */}
          {!entry.imageUrls?.length && entry.stickers && (
            <div className="flex flex-wrap gap-4 mt-8 opacity-60">
              {entry.stickers.map((sid, idx) => {
                const sticker = STICKERS.find(s => s.id === sid);
                return sticker && <span key={idx} className="text-4xl animate-bounce" style={{ animationDelay: `${idx * 0.2}s` }}>{sticker.emoji}</span>;
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto p-10 bg-pink-50/30 flex justify-center">
            <Heart className={cn("w-8 h-8", entry.isFavorite ? "fill-[#FF6B6B] text-[#FF6B6B]" : "text-pink-200")} />
        </div>
      </motion.div>
    </div>
  );
};
