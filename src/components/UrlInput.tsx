import React, { useState, useRef } from 'react';

interface UrlInputProps {
  onSubmit: (url: string, pages: number) => void;
  isLoading: boolean;
}

const UrlInput: React.FC<UrlInputProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');
  const [pages, setPages] = useState<number>(1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    // Basic URL validation — add https if missing
    let finalUrl = trimmed;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    onSubmit(finalUrl, pages);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        inputRef.current?.focus();
      }
    } catch {
      // Clipboard access denied
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
      <div
        className={`
          bg-[#0f172a]/80 backdrop-blur-[20px] border border-white/5
          rounded-2xl flex items-center gap-3 px-5 py-3
          transition-all duration-300 ease-out
          ${isFocused ? 'border-accent-purple/40 shadow-[0_0_20px_rgba(139,92,246,0.15)]' : ''}
          ${isLoading ? 'animate-pulse-glow' : ''}
        `}
      >
        {/* Search / Globe icon */}
        <div className="shrink-0">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          )}
        </div>

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Paste a wallpaper website URL..."
          disabled={isLoading}
          className="flex-1 bg-transparent text-white text-sm placeholder-surface-600
                     outline-none font-medium tracking-wide disabled:opacity-50"
        />

        {/* Paste button */}
        <button
          type="button"
          onClick={handlePaste}
          disabled={isLoading}
          className="btn-ghost shrink-0 text-xs gap-1.5 px-3 py-1.5 disabled:opacity-30 border-r border-white/10 rounded-r-none mr-2"
          title="Paste from clipboard"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Paste
        </button>

        {/* Pages Input */}
        <div className="shrink-0 flex items-center gap-2 text-sm text-surface-400 mr-2">
          <span>Pages:</span>
          <input
            type="number"
            min="1"
            max="10"
            value={pages}
            onChange={(e) => setPages(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
            disabled={isLoading}
            className="w-12 bg-surface-900 border border-white/10 rounded px-2 py-1 text-white text-center outline-none focus:border-accent-purple/50"
            title="Number of pages to scrape (1-10)"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="btn-primary shrink-0 text-xs px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Scanning...' : 'Grab'}
          {!isLoading && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
};

export default UrlInput;
