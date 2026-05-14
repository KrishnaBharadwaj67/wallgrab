import React, { useState, useCallback } from 'react';
import Titlebar from './components/Titlebar';
import UrlInput from './components/UrlInput';
import Gallery from './components/Gallery';
import EmptyState from './components/EmptyState';
import PreviewModal from './components/PreviewModal';
import Toast from './components/Toast';
import DownloadManager, { ActiveDownload } from './components/DownloadManager';
import type { WallpaperInfo } from './types';

type AppState = 'idle' | 'loading' | 'results' | 'error';

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('idle');
  const [wallpapers, setWallpapers] = useState<WallpaperInfo[]>([]);
  const [pageTitle, setPageTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedWallpaper, setSelectedWallpaper] = useState<WallpaperInfo | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<ActiveDownload[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const handleScrape = useCallback(async (url: string, pagesToScrape: number) => {
    setState('loading');
    setWallpapers([]);
    setPageTitle('');
    setErrorMessage('');

    try {
      addToast('info', `Scraping ${pagesToScrape} page(s) with Rust backend...`);
      const result = await window.wallgrab.scrapeUrl(url, pagesToScrape);

      console.log("Scrape result from Rust:", result);

      if (result.errors && result.errors.length > 0) {
         console.warn("Scraping warnings:", result.errors);
      }

      setWallpapers(result.wallpapers);
      setPageTitle(result.pageTitle || 'Results');
      setState('results');
      addToast('success', `Found ${result.wallpapers.length} wallpapers`);
    } catch (err) {
      setState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error occurred');
      addToast('error', 'Failed to scrape wallpapers');
    }
  }, [addToast]);

  const handleBatchDownload = useCallback(async (selectedWallpapers: WallpaperInfo[]) => {
    if (selectedWallpapers.length === 0) return;

    // Prompt user for folder once
    const saveFolder = await window.wallgrab.selectFolder();
    if (!saveFolder) return;

    addToast('info', `Starting download of ${selectedWallpapers.length} wallpapers...`);

    // Process downloads in chunks of 3 to limit concurrency
    const chunkSize = 3;
    for (let i = 0; i < selectedWallpapers.length; i += chunkSize) {
      const chunk = selectedWallpapers.slice(i, i + chunkSize);

      await Promise.all(chunk.map(async (wallpaper) => {
        let downloadId = '';
        try {
          let fileName = 'wallpaper.jpg';
          try {
            const urlObj = new URL(wallpaper.fullUrl);
            fileName = urlObj.pathname.split('/').pop() || 'wallpaper.jpg';
          } catch (e) {
            fileName = wallpaper.fullUrl.split('/').pop()?.split('?')[0] || 'wallpaper.jpg';
          }
          
          // Basic deduplication if files have the same name, we don't handle it perfectly here,
          // but we ensure the savePath is constructed.
          const savePath = `${saveFolder}/${fileName}`;
          downloadId = Date.now().toString() + Math.random().toString().slice(2, 6);

          // Add to active downloads
          setActiveDownloads(prev => [
            ...prev,
            { id: downloadId, url: wallpaper.fullUrl, fileName, status: 'downloading' }
          ]);
          
          // Start Rust download
          await window.wallgrab.downloadWallpaper(
            wallpaper.fullUrl, 
            savePath, 
            wallpaper.detailPageUrl
          );
          
          // Update status to success
          setActiveDownloads(prev => prev.map(dl => 
            dl.id === downloadId ? { ...dl, status: 'success' } : dl
          ));
        } catch (err) {
          console.error("Download failed", err);
          if (downloadId) {
            setActiveDownloads(prev => prev.map(dl => 
              dl.id === downloadId ? { ...dl, status: 'error' } : dl
            ));
          }
        }
      }));
    }

    addToast('success', `Finished downloading ${selectedWallpapers.length} wallpapers`);
  }, [addToast]);

  const handleDismissDownload = useCallback((id: string) => {
    setActiveDownloads(prev => prev.filter(dl => dl.id !== id));
  }, []);

  const handlePreview = useCallback((wallpaper: WallpaperInfo) => {
    setSelectedWallpaper(wallpaper);
  }, []);

  const handleClosePreview = useCallback(() => {
    setSelectedWallpaper(null);
  }, []);

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="ambient-bg" />

      {/* Custom titlebar */}
      <Titlebar />

      {/* URL Input area */}
      <div className="relative z-10 px-6 pt-2 pb-4">
        <UrlInput onSubmit={handleScrape} isLoading={state === 'loading'} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 overflow-hidden">
        {state === 'idle' && <EmptyState />}

        {state === 'loading' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-fade-in">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-surface-700" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-purple animate-spin" />
              </div>
              <p className="text-surface-400 text-sm font-medium">Scanning for wallpapers...</p>
              <p className="text-surface-600 text-xs mt-1">Analyzing page content</p>
            </div>
          </div>
        )}

        {state === 'results' && (
          <Gallery
            wallpapers={wallpapers}
            pageTitle={pageTitle}
            onPreview={handlePreview}
            onDownload={handleBatchDownload}
          />
        )}

        {state === 'error' && (
          <div className="flex items-center justify-center h-full animate-fade-in">
            <div className="text-center glass rounded-2xl p-8 max-w-md">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Scraping Failed</h3>
              <p className="text-surface-400 text-sm">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {selectedWallpaper && (
        <PreviewModal
          wallpaper={selectedWallpaper}
          onClose={handleClosePreview}
          onDownload={handleDownload}
        />
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} type={toast.type} message={toast.message} />
        ))}
      </div>

      {/* Download Manager */}
      <DownloadManager downloads={activeDownloads} onDismiss={handleDismissDownload} />
    </div>
  );
};

export default App;
