import React, { useEffect, useCallback } from 'react';
import type { WallpaperInfo } from '../types';

interface PreviewModalProps {
  wallpaper: WallpaperInfo;
  onClose: () => void;
  onDownload: (wallpaper: WallpaperInfo) => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ wallpaper, onClose, onDownload }) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const resolutionLabel = wallpaper.width && wallpaper.height
    ? `${wallpaper.width} × ${wallpaper.height}`
    : 'Full Resolution';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex flex-col items-center max-w-[90vw] max-h-[85vh]">
        <button onClick={onClose}
          className="absolute -top-12 right-0 w-10 h-10 rounded-full glass flex items-center justify-center text-surface-400 hover:text-white transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
          <img src={wallpaper.fullUrl} alt={wallpaper.alt} className="max-w-full max-h-[70vh] object-contain" />
        </div>
        <div className="mt-4 glass rounded-xl px-5 py-3 flex items-center gap-6 animate-fade-in-up">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{wallpaper.alt || 'Wallpaper'}</p>
            <p className="text-surface-500 text-xs font-mono mt-0.5">{resolutionLabel}</p>
          </div>
          <button onClick={() => onDownload(wallpaper)} className="btn-primary text-xs shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
