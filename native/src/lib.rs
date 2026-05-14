use napi_derive::napi;

mod types;
mod scraper;
mod downloader;

use types::ScrapeResult;

#[napi]
pub async fn scrape_url(url: String, pages_to_scrape: u32) -> napi::Result<ScrapeResult> {
    // Call the scraper logic
    scraper::scrape_wallpapers(url, pages_to_scrape).await
}

#[napi]
pub async fn download_wallpaper(
    url: String,
    save_path: String,
    detail_page_url: Option<String>,
) -> napi::Result<String> {
    // Call the real downloader logic with optional fallback URL
    downloader::download_wallpaper(url, save_path, detail_page_url).await
}
