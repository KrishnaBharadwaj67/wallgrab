import React, { useState, useEffect } from 'react';

const Titlebar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      try {
        const maximized = await window.wallgrab.isMaximized();
        setIsMaximized(maximized);
      } catch {
        // preload not available in dev
      }
    };
    checkMaximized();

    // Check on resize
    const handleResize = () => checkMaximized();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMinimize = () => window.wallgrab?.minimize();
  const handleMaximize = async () => {
    await window.wallgrab?.maximize();
    const maximized = await window.wallgrab?.isMaximized();
    setIsMaximized(maximized);
  };
  const handleClose = () => window.wallgrab?.close();

  return (
    <div className="drag-region flex items-center justify-between h-11 px-4 bg-surface-950/80 border-b border-white/[0.04] select-none shrink-0">
      {/* App logo & name */}
      <div className="flex items-center gap-2.5 no-drag">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center shadow-lg shadow-accent-purple/20">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-sm font-bold tracking-tight">
          <span className="gradient-text">Wall</span>
          <span className="text-white">Grab</span>
        </span>
      </div>

      {/* Window controls */}
      <div className="flex items-center gap-0.5 no-drag">
        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="group w-11 h-8 flex items-center justify-center rounded-md
                     hover:bg-white/[0.06] transition-colors duration-150"
          aria-label="Minimize"
        >
          <svg className="w-3 h-3 text-surface-500 group-hover:text-surface-300" fill="currentColor" viewBox="0 0 12 12">
            <rect y="5" width="12" height="1.5" rx="0.75" />
          </svg>
        </button>

        {/* Maximize / Restore */}
        <button
          onClick={handleMaximize}
          className="group w-11 h-8 flex items-center justify-center rounded-md
                     hover:bg-white/[0.06] transition-colors duration-150"
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <svg className="w-3 h-3 text-surface-500 group-hover:text-surface-300" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5">
              <rect x="2.5" y="0.5" width="9" height="9" rx="1" />
              <rect x="0.5" y="2.5" width="9" height="9" rx="1" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-surface-500 group-hover:text-surface-300" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="10" height="10" rx="1.5" />
            </svg>
          )}
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="group w-11 h-8 flex items-center justify-center rounded-md
                     hover:bg-red-500/80 transition-colors duration-150"
          aria-label="Close"
        >
          <svg className="w-3 h-3 text-surface-500 group-hover:text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 1l10 10M11 1L1 11" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Titlebar;
