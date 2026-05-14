import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { WallpaperInfo } from '../types';

interface WallpaperCardProps {
  wallpaper: WallpaperInfo;
  index: number;
  isSelected: boolean;
  onPreview: () => void;
  onSelect: () => void;
}

const WallpaperCard: React.FC<WallpaperCardProps> = ({ wallpaper, index, isSelected, onPreview, onSelect }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const resolutionLabel = wallpaper.width && wallpaper.height
    ? `${wallpaper.width} × ${wallpaper.height}`
    : 'HD';

  return (
    <motion.div
      layoutId={`card-${wallpaper.fullUrl}`}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
      }}
      whileHover={{ scale: 1.02 }}
      className={`break-inside-avoid group relative rounded-xl overflow-hidden cursor-pointer shadow-lg bg-surface-800/30 transition-all ${
        isSelected ? 'ring-4 ring-accent-cyan ring-offset-2 ring-offset-surface-900 scale-[0.98]' : 'hover:scale-102'
      }`}
      onClick={onSelect}
    >
      {/* Selection Checkmark */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-20 bg-accent-cyan text-surface-900 rounded-full p-1 shadow-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      {/* Image skeleton */}
      {!isLoaded && (
        <div className="skeleton w-full aspect-video rounded-xl" />
      )}

      {/* Actual image */}
      <img
        src={wallpaper.thumbnailUrl}
        alt={wallpaper.alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={`w-full block rounded-xl transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
        }`}
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      flex flex-col justify-end p-3 rounded-xl">
        {/* Info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-xs font-medium truncate max-w-[160px]">
              {wallpaper.alt || 'Wallpaper'}
            </p>
            <p className="text-surface-400 text-[10px] font-mono mt-0.5">{resolutionLabel}</p>
          </div>

          {/* Preview button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center
                       hover:bg-white/20 transition-all duration-200 active:scale-90"
            title="Preview"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Gradient border on hover */}
      <div className="absolute inset-0 rounded-xl border border-white/0 group-hover:border-accent-purple/30
                      transition-colors duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default WallpaperCard;
