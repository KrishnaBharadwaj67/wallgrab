import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ActiveDownload {
  id: string;
  url: string;
  fileName: string;
  status: 'downloading' | 'success' | 'error';
  progress?: number; // Optional, if we ever add progress events from Rust
}

interface DownloadManagerProps {
  downloads: ActiveDownload[];
  onDismiss: (id: string) => void;
}

const DownloadManager: React.FC<DownloadManagerProps> = ({ downloads, onDismiss }) => {
  if (downloads.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col gap-3 w-80">
      <AnimatePresence>
        {downloads.map((download) => (
          <motion.div
            key={download.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="bg-surface-800/90 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl shadow-black/40 flex items-center gap-4"
          >
            {/* Status Icon */}
            <div className="shrink-0">
              {download.status === 'downloading' && (
                <div className="w-8 h-8 rounded-full bg-accent-cyan/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-accent-cyan animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
              )}
              {download.status === 'success' && (
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {download.status === 'error' && (
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate" title={download.fileName}>
                {download.fileName}
              </p>
              <p className="text-xs text-surface-400 mt-0.5 capitalize">
                {download.status}
              </p>
            </div>

            {/* Actions */}
            {(download.status === 'success' || download.status === 'error') && (
              <button
                onClick={() => onDismiss(download.id)}
                className="shrink-0 w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors"
                title="Dismiss"
              >
                <svg className="w-4 h-4 text-surface-400 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default DownloadManager;
