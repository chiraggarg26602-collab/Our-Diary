import React, { useRef, useState, useEffect, useMemo } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { DiaryEntry } from '../types';
import { DiaryPage } from './DiaryPage';
import { ChevronLeft, ChevronRight, Calendar, Bookmark, X, Compass } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

import { cn } from '../lib/utils';

interface DiaryBookProps {
  entries: DiaryEntry[];
  onEntryClick: (entry: DiaryEntry) => void;
  selectedMonth: Date | null;
  onMonthChange: (date: Date | null) => void;
}

export const DiaryBook: React.FC<DiaryBookProps> = ({ 
  entries, 
  onEntryClick, 
  selectedMonth,
  onMonthChange
}) => {
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const bookDimensions = useMemo(() => {
    if (isMobile) {
      const w = Math.min(window.innerWidth - 40, 400);
      return { width: w, height: w * 1.5 }; // Maintain a portrait aspect ratio
    }
    return { width: 500, height: 750 };
  }, [isMobile]);

  // Split entries into chunks of 4 (two per page in a 2-page grid, or 4 total on a spread)
  // Actually, since we use two-page spread, each "page" in the flipbook component is one page of the physical book.
  // So if we have 4 entries per PAGE, and it's a 2nd page spread, we see 8 entries at once?
  // User says "Each page: maximum 4 memory cards". 
  // Let's stick to 4 per page. 
  const pages = useMemo(() => {
    if (entries.length === 0) return [[]];
    const p = [];
    for (let i = 0; i < entries.length; i += 4) {
      p.push(entries.slice(i, i + 4));
    }
    return p;
  }, [entries]);

  const uniqueMonths = useMemo(() => {
    const months = entries.map(e => e.createdAt?.toDate ? startOfMonth(e.createdAt.toDate()) : null).filter(Boolean) as Date[];
    const unique = Array.from(new Set(months.map(m => format(m, 'yyyy-MM'))))
      .map(str => new Date(str + '-01'))
      .sort((a, b) => b.getTime() - a.getTime());
    return unique;
  }, [entries]);

  useEffect(() => {
    if (selectedMonth && bookRef.current) {
      const firstEntryIdx = entries.findIndex(e => {
        const date = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
        return format(date, 'yyyy-MM') === format(selectedMonth, 'yyyy-MM');
      });
      if (firstEntryIdx !== -1) {
        const pageIdx = Math.floor(firstEntryIdx / 4);
        bookRef.current.pageFlip().flip(pageIdx);
      }
    }
  }, [selectedMonth, entries]);

  const onFlip = (e: any) => {
    setCurrentPage(e.data);
  };

  const jumpToPage = (num: number) => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flip(num);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center py-10 px-4 select-none">
      {/* Navigation Overlay (Top Right) */}
      <div className="absolute top-4 right-8 z-40 flex items-center gap-2">
        <AnimatePresence>
          {(showMonthPicker || showControls) && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="flex items-center gap-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-white/40 shadow-2xl"
            >
              {/* Page Slider (Only if month picker isn't taking up the screen) */}
              {!showMonthPicker && (
                <div className="flex items-center gap-3 pr-4 border-r border-pink-100">
                  <span className="typewriter text-[10px] uppercase font-bold opacity-30">Jump</span>
                  <input 
                    type="range"
                    min={0}
                    max={Math.max(0, pages.length - 1)}
                    value={currentPage}
                    onChange={(e) => jumpToPage(parseInt(e.target.value))}
                    className="w-24 accent-pink-400 h-1"
                  />
                </div>
              )}

              {/* Calendar Toggle */}
              <button 
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className={cn(
                  "p-2 rounded-full transition-all hover:bg-pink-50 flex items-center gap-2",
                  showMonthPicker ? "text-pink-500 bg-pink-50" : "text-gray-400"
                )}
              >
                <Calendar className="w-4 h-4" />
                <span className="typewriter text-[10px] uppercase font-bold">Dates</span>
              </button>

              {/* Close internal menu */}
              <button 
                onClick={() => { setShowControls(false); setShowMonthPicker(false); }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 opacity-20" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Toggle Button */}
        <button 
          onClick={() => setShowControls(!showControls)}
          className={cn(
            "w-10 h-10 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/40 transition-all hover:scale-110 active:scale-95",
            showControls ? "text-pink-500" : "text-gray-400"
          )}
        >
          <Compass className="w-5 h-5" />
        </button>

        {/* Month Picker Popover (Floating separately or integrated) */}
        <AnimatePresence>
          {showMonthPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-14 right-0 bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-white/40 shadow-2xl w-64 max-h-[60vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center mb-4 border-b border-pink-100 pb-2">
                <span className="typewriter text-xs font-bold uppercase tracking-widest opacity-40">Timeline</span>
                <button onClick={() => setShowMonthPicker(false)}><X className="w-4 h-4 opacity-40" /></button>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => { onMonthChange(null); jumpToPage(0); setShowMonthPicker(false); setShowControls(false); }}
                  className={cn(
                    "w-full text-left p-2 rounded-xl text-xs typewriter transition-all",
                    !selectedMonth ? "bg-pink-100 text-pink-600 font-bold" : "hover:bg-pink-50"
                  )}
                >
                  ✨ All Memories
                </button>
                {uniqueMonths.map(month => (
                  <button
                    key={format(month, 'yyyy-MM')}
                    onClick={() => { onMonthChange(month); setShowMonthPicker(false); setShowControls(false); }}
                    className={cn(
                      "w-full text-left p-3 rounded-xl text-xs typewriter transition-all flex justify-between items-center",
                      selectedMonth && format(month, 'yyyy-MM') === format(selectedMonth, 'yyyy-MM') 
                        ? "bg-pink-100 text-pink-600 font-bold" 
                        : "hover:bg-pink-50"
                    )}
                  >
                    <span>{format(month, 'MMMM yyyy')}</span>
                    <Bookmark className="w-3 h-3 opacity-20" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The Book Container */}
      <section className="relative w-full flex-1 flex justify-center items-center overflow-hidden py-4 md:py-8">
        <div className="relative book-shadow rounded-[1.5rem] md:rounded-[3.5rem] bg-pink-900/10 p-1 md:p-2 border-2 md:border-4 border-pink-100/20 max-h-full">
          <HTMLFlipBook
            width={isMobile ? 320 : 500}
            height={isMobile ? 580 : 700}
            size="fixed"
            minWidth={300}
            maxWidth={1000}
            minHeight={450}
            maxHeight={1533}
            maxShadowOpacity={0.4}
            showCover={false}
            mobileScrollSupport={true}
            onFlip={onFlip}
            className="diary-book"
            ref={bookRef}
            startPage={0}
            drawShadow={true}
            flippingTime={1000}
            usePortrait={isMobile}
            startZIndex={0}
            autoSize={true}
            clickEventForward={true}
            swipeDistance={30}
            showPageCorners={true}
            disableFlipByClick={false}
            style={{}}
            useMouseEvents={true}
          >
            {pages.map((entriesOnPage, index) => (
              <DiaryPage 
                key={index} 
                entries={entriesOnPage} 
                pageNumber={index + 1}
                onEntryClick={onEntryClick}
              />
            ))}
          </HTMLFlipBook>

          {/* Kindle-like Click Regions */}
          <button 
            onClick={() => bookRef.current?.pageFlip().flipPrev()}
            className="absolute left-0 top-0 bottom-0 w-20 z-20 cursor-w-resize group"
            aria-label="Previous page"
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </div>
          </button>
          
          <button 
            onClick={() => bookRef.current?.pageFlip().flipNext()}
            className="absolute right-0 top-0 bottom-0 w-20 z-20 cursor-e-resize group"
            aria-label="Next page"
          >
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          {/* Spine effect */}
          {!isMobile && pages.length > 0 && (
            <div className="absolute left-1/2 top-2 bottom-2 w-12 -translate-x-1/2 spine-gradient z-10 pointer-events-none rounded-sm" />
          )}
        </div>
      </section>

      {/* Page Navigation Controls */}
      <div className="mt-6 md:mt-12 flex items-center gap-4 md:gap-10 bg-white/60 backdrop-blur-md p-3 md:p-4 rounded-full border border-white/40 shadow-xl scale-90 md:scale-100">
        <motion.button 
          whileHover={{ scale: 1.1, x: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => bookRef.current?.pageFlip().flipPrev()}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-all shadow-md text-pink-400"
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
        
        <div className="flex flex-col items-center gap-1 px-2 md:px-4 min-w-[100px] md:min-w-[120px]">
          <div className="flex items-center gap-1 md:gap-2">
             <span className="text-[8px] md:text-[10px] typewriter uppercase font-bold opacity-30">Page</span>
             <span className="text-xl md:text-2xl serif-display text-pink-500 leading-none">{currentPage + 1}</span>
             <span className="text-[8px] md:text-[10px] typewriter uppercase font-bold opacity-30">of {Math.max(1, pages.length)}</span>
          </div>
          <input 
            type="range"
            min={0}
            max={Math.max(0, pages.length - 1)}
            value={currentPage}
            onChange={(e) => jumpToPage(parseInt(e.target.value))}
            className="w-24 md:w-32 accent-pink-400 h-1"
          />
        </div>

        <motion.button 
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => bookRef.current?.pageFlip().flipNext()}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-all shadow-md text-pink-400"
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
};
