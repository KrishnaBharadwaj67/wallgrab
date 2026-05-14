use napi_derive::napi;
use serde::{Deserialize, Serialize};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WallpaperInfo {
    pub thumbnail_url: String,
    pub full_url: String,
    pub alt: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    /// The URL of the detail/single-wallpaper page, used for fallback resolution discovery
    pub detail_page_url: Option<String>,
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapeResult {
    pub wallpapers: Vec<WallpaperInfo>,
    pub page_title: String,
    pub total_found: u32,
    pub errors: Vec<String>,
}
