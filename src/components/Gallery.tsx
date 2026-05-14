import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WallpaperInfo } from '../types';
import WallpaperCard from './WallpaperCard';

interface GalleryProps {
  wallpapers: WallpaperInfo[];
  pageTitle: string;
  onPreview: (wallpaper: WallpaperInfo) => void;
  onDownload: (wallpapers: WallpaperInfo[]) => void;
}

const Gallery: React.FC<GalleryProps> = ({ wallpapers, pageTitle, onPreview, onDownload }) => {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  const handleToggleSelect = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedUrls(new Set());
  };

  const handleDownloadSelected = () => {
    const selectedWallpapers = wallpapers.filter(w => selectedUrls.has(w.fullUrl));
    onDownload(selectedWallpapers);
    setSelectedUrls(new Set());
  };
  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 pb-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {pageTitle || 'Results'}
            <span className="text-xs font-mono font-normal text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded-full">
              {wallpapers.length} found
            </span>
          </h2>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <motion.div 
          className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          {wallpapers.map((wallpaper, index) => (
            <WallpaperCard
              key={`${wallpaper.fullUrl}-${index}`}
              wallpaper={wallpaper}
              index={index}
              isSelected={selectedUrls.has(wallpaper.fullUrl)}
              onPreview={() => onPreview(wallpaper)}
              onSelect={() => handleToggleSelect(wallpaper.fullUrl)}
            />
          ))}
        </motion.div>
      </div>

      {/* Floating Action Bar (FAB) */}
      <AnimatePresence>
        {selectedUrls.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-surface-800/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center gap-2 mr-2">
              <div className="bg-accent-cyan text-surface-900 font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">
                {selectedUrls.size}
              </div>
              <span className="text-white text-sm font-medium">Selected</span>
            </div>
            
            <button
              onClick={handleClearSelection}
              className="text-surface-400 hover:text-white text-sm font-medium px-3 py-1.5 transition-colors"
            >
              Clear
            </button>
            
            <button
              onClick={handleDownloadSelected}
              className="bg-accent-purple hover:bg-accent-purple/80 text-white text-sm font-bold px-5 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-accent-purple/20 transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
