use reqwest::header::{CONTENT_TYPE, REFERER};
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use std::path::Path;

use crate::scraper;

/// Standard Chrome User-Agent
const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/// Build a download client with proper headers
fn build_client() -> Result<reqwest::Client, napi::Error> {
    reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

/// Extract the origin (scheme + host) from a URL for the Referer header
fn get_referer(url: &str) -> String {
    url::Url::parse(url)
        .map(|u| format!("{}://{}/", u.scheme(), u.host_str().unwrap_or("")))
        .unwrap_or_default()
}

pub async fn download_wallpaper(
    url_str: String,
    save_path: String,
    detail_page_url: Option<String>,
) -> Result<String, napi::Error> {
    println!("Rust downloader: Downloading {} to {}", url_str, save_path);

    let client = build_client()?;
    let referer = get_referer(&url_str);

    // Try the primary URL first
    let response = client
        .get(&url_str)
        .header(REFERER, &referer)
        .header("Accept", "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8")
        .send()
        .await
        .map_err(|e| napi::Error::from_reason(e.to_string()))?;

    // If 404 and we have a detail page URL for 4kwallpapers, try fallback
    if response.status() == reqwest::StatusCode::NOT_FOUND {
        println!("Rust downloader: Got 404 for {}, attempting fallback...", url_str);

        if let Some(ref detail_url) = detail_page_url {
            if detail_url.contains("4kwallpapers.com") {
                return download_4kwallpapers_fallback(
                    &client, detail_url, &save_path,
                )
                .await;
            }
        }

        return Err(napi::Error::from_reason(format!(
            "Failed to download: HTTP 404 Not Found for {}",
            url_str
        )));
    }

    if !response.status().is_success() {
        return Err(napi::Error::from_reason(format!(
            "Failed to download: HTTP {} for {}",
            response.status(),
            url_str
        )));
    }

    // Validate Content-Type
    let content_type = response
        .headers()
        .get(CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_lowercase();

    if content_type.contains("text/html") {
        return Err(napi::Error::from_reason(format!(
            "URL returned HTML instead of an image (possible hotlink block): {}",
            content_type
        )));
    }

    save_response_to_file(response, &save_path).await?;
    Ok(save_path)
}

/// Fallback for 4kwallpapers.com: fetch the detail page, parse all resolution
/// links, pick the highest, and download that instead.
async fn download_4kwallpapers_fallback(
    client: &reqwest::Client,
    detail_url: &str,
    save_path: &str,
) -> Result<String, napi::Error> {
    println!(
        "Rust downloader: Fetching detail page for fallback: {}",
        detail_url
    );

    let page_response = client
        .get(detail_url)
        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
        .header("Accept-Language", "en-US,en;q=0.9")
        .send()
        .await
        .map_err(|e| napi::Error::from_reason(format!("Failed to fetch detail page: {}", e)))?;

    if !page_response.status().is_success() {
        return Err(napi::Error::from_reason(format!(
            "Detail page returned HTTP {}",
            page_response.status()
        )));
    }

    let html = page_response
        .text()
        .await
        .map_err(|e| napi::Error::from_reason(e.to_string()))?;

    let best_url = scraper::parse_4kwallpapers_best_url(&html, detail_url).ok_or_else(|| {
        napi::Error::from_reason(
            "Could not find any download links on the detail page".to_string(),
        )
    })?;

    println!(
        "Rust downloader: Found best URL from detail page: {}",
        best_url
    );

    let referer = get_referer(&best_url);
    let img_response = client
        .get(&best_url)
        .header(REFERER, &referer)
        .header("Accept", "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8")
        .send()
        .await
        .map_err(|e| napi::Error::from_reason(e.to_string()))?;

    if !img_response.status().is_success() {
        return Err(napi::Error::from_reason(format!(
            "Fallback download failed: HTTP {} for {}",
            img_response.status(),
            best_url
        )));
    }

    // Update the save path filename to match the actual file
    let actual_filename = best_url
        .rsplit('/')
        .next()
        .unwrap_or("wallpaper.jpg");
    let actual_save_path = if let Some(parent) = Path::new(save_path).parent() {
        parent.join(actual_filename).to_string_lossy().to_string()
    } else {
        save_path.to_string()
    };

    save_response_to_file(img_response, &actual_save_path).await?;
    Ok(actual_save_path)
}

/// Stream a response body to a file on disk
async fn save_response_to_file(
    mut response: reqwest::Response,
    save_path: &str,
) -> Result<(), napi::Error> {
    // Create directory if needed
    if let Some(parent) = Path::new(save_path).parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| napi::Error::from_reason(e.to_string()))?;
    }

    let mut file = File::create(save_path)
        .await
        .map_err(|e| napi::Error::from_reason(e.to_string()))?;

    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|e| napi::Error::from_reason(e.to_string()))?
    {
        file.write_all(&chunk)
            .await
            .map_err(|e| napi::Error::from_reason(e.to_string()))?;
    }

    file.flush()
        .await
        .map_err(|e| napi::Error::from_reason(e.to_string()))?;

    Ok(())
}
