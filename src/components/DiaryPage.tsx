import React from 'react';
import { DiaryEntry, STICKERS } from '../types';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { Heart, Sparkles, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface DiaryPageProps {
  entries: DiaryEntry[];
  pageNumber: number;
  onEntryClick: (entry: DiaryEntry) => void;
}

export const DiaryPage = React.memo(React.forwardRef<HTMLDivElement, DiaryPageProps>(
  ({ entries, pageNumber, onEntryClick }, ref) => {
    const isLeftPage = pageNumber % 2 !== 0;

    return (
      <div 
        ref={ref}
        className={cn(
          "w-full h-full paper-texture p-4 md:p-10 flex flex-col relative overflow-hidden will-change-transform shadow-inner",
          isLeftPage ? "page-inner-shadow-right" : "page-inner-shadow-left"
        )}
      >
        {/* Page Header */}
        <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-pink-200 pb-2">
          <span className="typewriter text-[9px] md:text-[10px] opacity-30 uppercase tracking-[0.2em] font-bold">
            Chapter {Math.ceil(pageNumber / 2)}
          </span>
          <div className="flex items-center gap-1 md:gap-2">
             <Heart className="w-2 h-2 md:w-3 md:h-3 text-pink-200 fill-current" />
             <span className="typewriter text-[9px] md:text-[10px] opacity-30 italic">
               Our Shared Journey
             </span>
          </div>
        </div>

        {/* Dynamic Grid Layout (up to 4 entries) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4 md:gap-8 py-2 md:py-4 overflow-hidden">
          {entries.length === 0 ? (
             <div className="col-span-1 md:col-span-2 row-span-2 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-white/40 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white">
                  <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-pink-200 animate-pulse" />
                </div>
                <h2 className="serif-display text-xl md:text-2xl mb-3 text-pink-900/40">"A memory is waiting to be written."</h2>
                <p className="typewriter opacity-40 text-[10px] md:text-xs max-w-[200px] md:max-w-[300px] leading-relaxed">
                  Some pages are still waiting for your story. Years later, you’ll come back to this page and smile.
                </p>
             </div>
          ) : (
            <>
              {entries.map((entry, idx) => {
                const date = entry.createdAt?.toDate ? entry.createdAt.toDate() : (entry.createdAt ? new Date(entry.createdAt) : new Date());
                const rotation = (idx % 2 === 0 ? -1.5 : 1.5) * (idx + 1);
                
                return (
                  <motion.div
                    key={entry.id}
                    layoutId={entry.id}
                    onClick={() => onEntryClick(entry)}
                    className="group cursor-pointer flex flex-col items-center justify-center transition-all hover:z-10 will-change-transform"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    {/* The Polaroid Card */}
                    <div className="bg-white p-1.5 pb-6 md:p-3 md:pb-12 shadow-xl border border-gray-100 flex flex-col w-full max-w-[140px] md:max-w-[200px] h-auto relative hover:-translate-y-2 transition-transform duration-300">
                      {/* Paper Tape Effect */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-pink-100/40 backdrop-blur-sm -rotate-2 z-20 border border-white/40 shadow-sm" />
                      
                      {/* Stack effect */}
                      {entry.imageUrls && entry.imageUrls.length > 1 && (
                        <div className="absolute inset-0 bg-white shadow-sm border border-gray-100 rotate-2 -z-10 translate-x-1 translate-y-1" />
                      )}

                      <div className="w-full aspect-square overflow-hidden bg-gray-50 border border-gray-100/30 mb-2 md:mb-4 relative">
                        {entry.imageUrls?.[0] ? (
                          <img 
                            src={entry.imageUrls[0]} 
                            alt="" 
                            className="w-full h-full object-cover sepia-[0.1] contrast-[0.9]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-pink-200/50 p-4 text-center">
                            <ImageIcon className="w-4 h-4 md:w-6 md:h-6 mb-1 opacity-20" />
                            <span className="typewriter text-[6px] md:text-[8px] italic leading-tight">No photo captured in this moment...</span>
                          </div>
                        )}
                        
                        {/* Status indicators */}
                        <div className="absolute top-1 right-1 flex flex-col gap-1">
                          {entry.isFavorite && <Heart className="w-2 h-2 md:w-3 md:h-3 text-pink-400 fill-current drop-shadow-sm" />}
                        </div>
                      </div>

                      {/* Small date on frame */}
                      <div className="absolute bottom-2 md:bottom-4 left-0 right-0 text-center typewriter text-[7px] md:text-[9px] opacity-30 select-none font-bold tracking-wider">
                        {format(date, 'MMM d, yy')}
                      </div>
                    </div>

                    {/* Snippet */}
                    <div className="mt-2 md:mt-4 text-center px-1">
                      <p className="typewriter text-[8px] md:text-[10px] text-[#5D4037] line-clamp-2 italic leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                        "{entry.text}"
                      </p>
                      <p className="typewriter text-[6px] md:text-[8px] opacity-30 mt-1 uppercase tracking-widest font-bold">
                         - {entry.authorName?.split(' ')[0] || 'Someone'}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}
        </div>

        {/* Page Footer */}
        <div className="mt-auto flex justify-between items-center opacity-20 border-t border-pink-200 pt-3">
          <span className="typewriter text-[10px] font-bold">{pageNumber}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-pink-300" />
          <span className="typewriter text-[8px] italic">Memories Forever</span>
        </div>
      </div>
    );
  }
));
