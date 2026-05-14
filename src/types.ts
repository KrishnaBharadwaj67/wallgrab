// Type declarations for the wallgrab API exposed via preload
export interface WallpaperInfo {
  thumbnailUrl: string;
  fullUrl: string;
  alt: string;
  width?: number;
  height?: number;
  /** The URL of the detail/single-wallpaper page, used for fallback resolution discovery */
  detailPageUrl?: string;
}

export interface ScrapeResult {
  wallpapers: WallpaperInfo[];
  pageTitle: string;
  totalFound: number;
  errors: string[];
}

export interface WallGrabAPI {
  // Window controls
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;

  // Folder picker
  selectFolder: () => Promise<string | null>;

  // Scraping
  scrapeUrl: (url: string, pagesToScrape: number) => Promise<ScrapeResult>;
  downloadWallpaper: (url: string, savePath: string, detailPageUrl?: string) => Promise<string>;
}

declare global {
  interface Window {
    wallgrab: WallGrabAPI;
  }
}
