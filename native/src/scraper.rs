use crate::types::{ScrapeResult, WallpaperInfo};
use scraper::{Html, Selector};
use url::Url;
use std::collections::HashSet;

/// Standard Chrome User-Agent to avoid bot detection / Cloudflare blocks
const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/// Build a reqwest client with realistic browser headers
fn build_client() -> Result<reqwest::Client, napi::Error> {
    reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

/// Fetch a page with proper browser-like headers
async fn fetch_page(client: &reqwest::Client, url: &str) -> Result<String, napi::Error> {
    let response = client
        .get(url)
        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
        .header("Accept-Language", "en-US,en;q=0.9")
        .header("Accept-Encoding", "identity")
        .header("Connection", "keep-alive")
        .header("Sec-Fetch-Dest", "document")
        .header("Sec-Fetch-Mode", "navigate")
        .header("Sec-Fetch-Site", "none")
        .header("Sec-Fetch-User", "?1")
        .send()
        .await
        .map_err(|e| napi::Error::from_reason(format!("Failed to fetch: {}", e)))?;

    if !response.status().is_success() {
        return Err(napi::Error::from_reason(format!(
            "HTTP {} when fetching {}",
            response.status(),
            url
        )));
    }

    response
        .text()
        .await
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

fn generate_page_url(base_url_str: &str, page: u32) -> String {
    if page <= 1 {
        return base_url_str.to_string();
    }
    
    let Ok(mut parsed) = Url::parse(base_url_str) else {
        return base_url_str.to_string();
    };
    
    let host = parsed.host_str().unwrap_or("").to_lowercase();
    
    if host.contains("alphacoders.com") || host.contains("4kwallpapers.com") {
        parsed.query_pairs_mut().append_pair("page", &page.to_string());
        parsed.to_string()
    } else {
        base_url_str.to_string()
    }
}

pub async fn scrape_wallpapers(url_str: String, pages_to_scrape: u32) -> Result<ScrapeResult, napi::Error> {
    println!("Rust scraper: Fetching URL: {} for {} pages", url_str, pages_to_scrape);

    let client = build_client()?;
    let global_semaphore = std::sync::Arc::new(tokio::sync::Semaphore::new(5));
    
    let mut all_wallpapers = Vec::new();
    let mut all_errors = Vec::new();
    let mut final_page_title = String::new();
    let mut seen_full_urls = HashSet::new();

    let pages = if pages_to_scrape < 1 { 1 } else { pages_to_scrape };

    for page in 1..=pages {
        let page_url = generate_page_url(&url_str, page);
        println!("Rust scraper: Fetching page {}: {}", page, page_url);

        let base_url = match Url::parse(&page_url) {
            Ok(u) => u,
            Err(_) => {
                all_errors.push(format!("Page {}: Invalid URL", page));
                continue;
            }
        };

        let html_content = {
            let _permit = global_semaphore.acquire().await.unwrap();
            match fetch_page(&client, &page_url).await {
                Ok(h) => h,
                Err(e) => {
                    all_errors.push(format!("Page {}: {}", page, e));
                    continue;
                }
            }
        };

        let host = base_url.host_str().unwrap_or("").to_lowercase();

        let (page_title, parsed_result) = {
            let document = Html::parse_document(&html_content);
            
            let title_selector = Selector::parse("title").unwrap();
            let page_title = document
                .select(&title_selector)
                .next()
                .map(|el| el.text().collect::<Vec<_>>().join("").trim().to_string())
                .unwrap_or_else(|| "Unknown Page".to_string());

            let parsed_result = if host.contains("4kwallpapers.com") {
                Ok(scrape_4kwallpapers(&document, &base_url))
            } else if host.contains("alphacoders.com") {
                Err(extract_alphacoders_data(&document, &base_url))
            } else {
                Ok(scrape_generic(&document, &base_url))
            };
            
            (page_title, parsed_result)
        };

        if page == 1 {
            final_page_title = page_title;
        }

        let (wallpapers, errors) = match parsed_result {
            Ok(res) => res,
            Err((mut wps, tasks, fallback, mut errs)) => {
                if !tasks.is_empty() {
                    let (fetched_wps, fetch_errs) = fetch_alphacoders_details(client.clone(), global_semaphore.clone(), tasks).await;
                    wps.extend(fetched_wps);
                    errs.extend(fetch_errs);
                }
                if wps.is_empty() {
                    wps.extend(fallback);
                }
                (wps, errs)
            }
        };
        
        all_errors.extend(errors);
        
        for wp in wallpapers {
            if !seen_full_urls.contains(&wp.full_url) {
                seen_full_urls.insert(wp.full_url.clone());
                all_wallpapers.push(wp);
            }
        }
    }

    let total = all_wallpapers.len() as u32;
    println!("Rust scraper: Found {} total wallpapers across {} pages", total, pages);

    Ok(ScrapeResult {
        wallpapers: all_wallpapers,
        page_title: final_page_title,
        total_found: total,
        errors: all_errors,
    })
}

// ─── 4KWallpapers.com ───────────────────────────────────────────────────────

fn scrape_4kwallpapers(document: &Html, base_url: &Url) -> (Vec<WallpaperInfo>, Vec<String>) {
    let path = base_url.path();
    if path.ends_with(".html") {
        scrape_4kwallpapers_detail(document, base_url)
    } else {
        scrape_4kwallpapers_listing(document, base_url)
    }
}

fn scrape_4kwallpapers_listing(
    document: &Html,
    base_url: &Url,
) -> (Vec<WallpaperInfo>, Vec<String>) {
    let mut wallpapers = Vec::new();
    let errors = Vec::new();

    // Wallpaper entries are typically wrapped in <div class="wallpapers"> or <p> with <a> containing an <img>.
    // We look for any <a> with an href that points to a detail page (usually .html or contains /wallpapers/).
    let link_selector = Selector::parse("a[href]").unwrap();
    let img_child_selector = Selector::parse("img").unwrap();

    for link in document.select(&link_selector) {
        let href = match link.value().attr("href") {
            Some(h) => h,
            None => continue,
        };

        // Skip non-wallpaper links
        if href.contains("privacy")
            || href.contains("terms")
            || href.contains("copyright")
            || href.contains("contact")
            || href.contains("category")
            || href.contains("resolution")
            || href == "/"
        {
            continue;
        }

        let detail_url = match base_url.join(href) {
            Ok(u) => u,
            Err(_) => continue,
        };

        // Must have a child <img> with a thumbnail
        let img = match link.select(&img_child_selector).next() {
            Some(i) => i,
            None => continue,
        };

        let thumbnail_src = img.value().attr("data-src").or_else(|| img.value().attr("src")).unwrap_or("");
        if thumbnail_src.is_empty() {
            continue;
        }

        // Broaden matching: detail pages on 4kwallpapers typically end in .html or have an ID
        if !href.ends_with(".html") && !thumbnail_src.contains("images") {
            continue;
        }

        let thumbnail_url = base_url
            .join(thumbnail_src)
            .map(|u| u.to_string())
            .unwrap_or_default();

        let alt = img
            .value()
            .attr("alt")
            .unwrap_or("Wallpaper")
            .to_string();

        // Extract slug and ID from detail page path
        // e.g., /abstract/shattered-glass-26258.html → slug=shattered-glass, id=26258
        let filename = detail_url
            .path()
            .rsplit('/')
            .next()
            .unwrap_or("")
            .trim_end_matches(".html");

        let (slug, id) = match extract_slug_and_id(filename) {
            Some(pair) => pair,
            None => continue,
        };

        // Get extension from thumbnail (e.g., .jpg, .png)
        let ext = thumbnail_src
            .rsplit('.')
            .next()
            .unwrap_or("jpg");

        // Construct a guessed 4K download URL
        // Pattern: /images/wallpapers/{slug}-3840x2160-{id}.{ext}
        let full_url = format!(
            "https://4kwallpapers.com/images/wallpapers/{}-3840x2160-{}.{}",
            slug, id, ext
        );

        wallpapers.push(WallpaperInfo {
            thumbnail_url,
            full_url,
            alt,
            width: Some(3840),
            height: Some(2160),
            detail_page_url: Some(detail_url.to_string()),
        });
    }

    (wallpapers, errors)
}

fn scrape_4kwallpapers_detail(
    document: &Html,
    base_url: &Url,
) -> (Vec<WallpaperInfo>, Vec<String>) {
    let mut errors = Vec::new();

    // Find all download links pointing to /images/wallpapers/
    let resolution_selector =
        Selector::parse("a[href*='/images/wallpapers/']").unwrap();

    let mut best_url = String::new();
    let mut best_pixels: u64 = 0;
    let mut best_width: u32 = 0;
    let mut best_height: u32 = 0;

    for link in document.select(&resolution_selector) {
        if let Some(href) = link.value().attr("href") {
            let abs_url = base_url
                .join(href)
                .map(|u| u.to_string())
                .unwrap_or_default();

            if let Some((w, h)) = parse_resolution_from_url(href) {
                let pixels = w as u64 * h as u64;
                // Pick the highest pixel count (landscape preferred over portrait)
                if pixels > best_pixels
                    || (pixels == best_pixels && w > best_width)
                {
                    best_pixels = pixels;
                    best_url = abs_url;
                    best_width = w;
                    best_height = h;
                }
            }
        }
    }

    if best_url.is_empty() {
        errors.push("No download links found on detail page".to_string());
        return (Vec::new(), errors);
    }

    // Get the main preview image for thumbnail
    let img_selector = Selector::parse("img[itemprop='contentUrl']").unwrap();
    let thumbnail_url = document
        .select(&img_selector)
        .next()
        .and_then(|img| img.value().attr("src"))
        .map(|src| {
            base_url
                .join(src)
                .map(|u| u.to_string())
                .unwrap_or_default()
        })
        .unwrap_or_else(|| best_url.clone());

    let alt_text = document
        .select(&img_selector)
        .next()
        .and_then(|img| img.value().attr("alt"))
        .unwrap_or("Wallpaper")
        .to_string();

    let wallpapers = vec![WallpaperInfo {
        thumbnail_url,
        full_url: best_url,
        alt: alt_text,
        width: Some(best_width),
        height: Some(best_height),
        detail_page_url: Some(base_url.to_string()),
    }];

    (wallpapers, errors)
}

/// Extract slug and numeric ID from a filename like "shattered-glass-red-26288"
fn extract_slug_and_id(filename: &str) -> Option<(String, String)> {
    let pos = filename.rfind('-')?;
    let potential_id = &filename[pos + 1..];
    let slug = &filename[..pos];

    if potential_id.chars().all(|c| c.is_ascii_digit()) && !potential_id.is_empty() {
        Some((slug.to_string(), potential_id.to_string()))
    } else {
        None
    }
}

/// Parse WxH resolution from a URL segment like "shattered-glass-3840x2160-26258.jpg"
fn parse_resolution_from_url(url: &str) -> Option<(u32, u32)> {
    let filename = url.rsplit('/').next()?;
    for part in filename.split('-') {
        if let Some(pos) = part.find('x') {
            let w_str = &part[..pos];
            let h_str = &part[pos + 1..];
            if let (Ok(w), Ok(h)) = (w_str.parse::<u32>(), h_str.parse::<u32>()) {
                if w >= 480 && h >= 480 {
                    return Some((w, h));
                }
            }
        }
    }
    None
}

// ─── AlphaCoders ─────────────────────────────────────────────────────────────

type DetailTask = (String, String, String, Option<u32>, Option<u32>);

fn extract_alphacoders_data(document: &Html, base_url: &Url) -> (Vec<WallpaperInfo>, Vec<DetailTask>, Vec<WallpaperInfo>, Vec<String>) {
    let mut wallpapers = Vec::new();
    let mut tasks = Vec::new();
    let mut fallback = Vec::new();
    let mut seen_urls = HashSet::new();
    let errors = Vec::new();

    let _host = base_url.host_str().unwrap_or("").to_lowercase();
    let is_detail_page = base_url.path().contains("big.php");

    // On detail pages, look for the main image
    if is_detail_page {
        let selectors = [
            "img#main_img",
            "img.main-content",
            "img[itemprop='image']",
            "div.center-block img",
            "div.boxgrid img",
        ];

        for sel_str in selectors {
            if let Ok(sel) = Selector::parse(sel_str) {
                for img in document.select(&sel) {
                    if let Some(src) = img
                        .value()
                        .attr("src")
                        .or_else(|| img.value().attr("data-src"))
                    {
                        if let Ok(abs_url) = base_url.join(src) {
                            let abs_url_str = abs_url.to_string();
                            if abs_url_str.contains("alphacoders.com")
                                && !seen_urls.contains(&abs_url_str)
                            {
                                seen_urls.insert(abs_url_str.clone());
                                wallpapers.push(WallpaperInfo {
                                    thumbnail_url: abs_url_str.clone(),
                                    full_url: abs_url_str,
                                    alt: img
                                        .value()
                                        .attr("alt")
                                        .unwrap_or("Wallpaper")
                                        .to_string(),
                                    width: img
                                        .value()
                                        .attr("width")
                                        .and_then(|w| w.parse().ok()),
                                    height: img
                                        .value()
                                        .attr("height")
                                        .and_then(|h| h.parse().ok()),
                                    detail_page_url: Some(base_url.to_string()),
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    // On listing pages, collect detail page URLs and fetch them concurrently
    if wallpapers.is_empty() {
        let img_selector = Selector::parse("img").unwrap();
        let link_selector = Selector::parse("a[href*='big.php']").unwrap();

        for link in document.select(&link_selector) {
            let detail_href = match link.value().attr("href") {
                Some(h) => h,
                None => continue,
            };

            let detail_url = base_url
                .join(detail_href)
                .map(|u| u.to_string())
                .unwrap_or_default();

            if let Some(img) = link.select(&img_selector).next() {
                let src = img
                    .value()
                    .attr("data-src")
                    .or_else(|| img.value().attr("src"))
                    .unwrap_or("");

                if src.is_empty() {
                    continue;
                }

                if let Ok(abs_url) = base_url.join(src) {
                    let abs_url_str = abs_url.to_string();
                    if seen_urls.contains(&abs_url_str) {
                        continue;
                    }
                    seen_urls.insert(abs_url_str.clone());

                    let alt = img.value().attr("alt").unwrap_or("Wallpaper").to_string();
                    let width = img.value().attr("width").and_then(|w| w.parse().ok());
                    let height = img.value().attr("height").and_then(|h| h.parse().ok());

                    tasks.push((detail_url, abs_url_str, alt, width, height));
                }
            }
        }

        // Fallback: if no linked images found, grab all alphacoders images
        for img in document.select(&img_selector) {
            let src = img
                .value()
                .attr("data-src")
                .or_else(|| img.value().attr("src"))
                .unwrap_or("");

            if src.is_empty() {
                continue;
            }

            if let Ok(abs_url) = base_url.join(src) {
                let abs_url_str = abs_url.to_string();

                if !abs_url_str.contains("alphacoders.com")
                    || abs_url_str.contains("icon")
                    || abs_url_str.contains("logo")
                    || abs_url_str.contains("avatar")
                {
                    continue;
                }

                let w: u32 = img
                    .value()
                    .attr("width")
                    .and_then(|w| w.parse().ok())
                    .unwrap_or(0);
                let h: u32 = img
                    .value()
                    .attr("height")
                    .and_then(|h| h.parse().ok())
                    .unwrap_or(0);
                if (w > 0 && w < 150) || (h > 0 && h < 150) {
                    continue;
                }

                if seen_urls.contains(&abs_url_str) {
                    continue;
                }
                seen_urls.insert(abs_url_str.clone());

                fallback.push(WallpaperInfo {
                    thumbnail_url: abs_url_str.clone(),
                    full_url: abs_url_str,
                    alt: img
                        .value()
                        .attr("alt")
                        .unwrap_or("Wallpaper")
                        .to_string(),
                    width: if w > 0 { Some(w) } else { None },
                    height: if h > 0 { Some(h) } else { None },
                    detail_page_url: None,
                });
            }
        }
    }

    (wallpapers, tasks, fallback, errors)
}

async fn fetch_alphacoders_details(
    client: reqwest::Client,
    semaphore: std::sync::Arc<tokio::sync::Semaphore>,
    tasks: Vec<DetailTask>
) -> (Vec<WallpaperInfo>, Vec<String>) {
    let mut wallpapers = Vec::new();
    let mut errors = Vec::new();
    let mut handles = Vec::new();

    for (detail_url, thumb_url, alt, w, h) in tasks {
        let client_clone = client.clone();
        let sem_clone = semaphore.clone();
        let d_url = detail_url.clone();

        handles.push(tokio::spawn(async move {
            let _permit = sem_clone.acquire().await.unwrap();
            println!("Rust scraper: Fetching AlphaCoders detail page: {}", d_url);
            
            let mut full_url = thumb_url.clone(); // fallback to thumb if fetch fails
            
            if let Ok(html_content) = fetch_page(&client_clone, &d_url).await {
                let doc = Html::parse_document(&html_content);
                let selectors = [
                    "img#main_img",
                    "img.main-content",
                    "img[itemprop='image']",
                    "div.center-block img",
                    "div.boxgrid img",
                ];
                
                if let Ok(base_d_url) = Url::parse(&d_url) {
                    'outer: for sel_str in selectors {
                        if let Ok(sel) = Selector::parse(sel_str) {
                            for img in doc.select(&sel) {
                                if let Some(src) = img.value().attr("src").or_else(|| img.value().attr("data-src")) {
                                    if let Ok(abs) = base_d_url.join(src) {
                                        if abs.to_string().contains("alphacoders.com") {
                                            full_url = abs.to_string();
                                            break 'outer;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                println!("Rust scraper: Failed to fetch detail page: {}", d_url);
            }

            WallpaperInfo {
                thumbnail_url: thumb_url,
                full_url,
                alt,
                width: w,
                height: h,
                detail_page_url: Some(detail_url),
            }
        }));
    }

    for handle in handles {
        if let Ok(info) = handle.await {
            wallpapers.push(info);
        } else {
            errors.push("Failed to join AlphaCoders detail task".to_string());
        }
    }

    (wallpapers, errors)
}

// ─── Generic Scraper (all other sites) ───────────────────────────────────────

fn scrape_generic(document: &Html, base_url: &Url) -> (Vec<WallpaperInfo>, Vec<String>) {
    let mut wallpapers = Vec::new();
    let mut seen_urls = HashSet::new();
    let errors = Vec::new();

    let img_selector = Selector::parse("img, picture source").unwrap();
    let link_selector = Selector::parse("a[href]").unwrap();

    // 1. Extract from <img> and <picture> tags
    for element in document.select(&img_selector) {
        let src = element
            .value()
            .attr("data-src")
            .or_else(|| element.value().attr("data-original"))
            .or_else(|| element.value().attr("src"))
            .or_else(|| element.value().attr("srcset"));

        if let Some(src) = src {
            // Clean up srcset
            let src = if element.value().attr("srcset").is_some() {
                src.split(',')
                    .last()
                    .unwrap_or(src)
                    .split_whitespace()
                    .next()
                    .unwrap_or(src)
                    .trim()
            } else {
                src.split_whitespace().next().unwrap_or(src).trim()
            };

            if src.is_empty() {
                continue;
            }

            if let Ok(abs_url) = base_url.join(src) {
                let abs_url_str = abs_url.to_string();

                // Filter out icons, avatars, logos
                if abs_url_str.contains("icon")
                    || abs_url_str.contains("avatar")
                    || abs_url_str.contains("logo")
                    || abs_url_str.contains("profile")
                {
                    continue;
                }

                // Skip tiny images (tracking pixels, etc.)
                let w: u32 = element
                    .value()
                    .attr("width")
                    .and_then(|w| w.parse().ok())
                    .unwrap_or(0);
                let h: u32 = element
                    .value()
                    .attr("height")
                    .and_then(|h| h.parse().ok())
                    .unwrap_or(0);
                if (w > 0 && w < 150) || (h > 0 && h < 150) {
                    continue;
                }

                if !seen_urls.contains(&abs_url_str) {
                    seen_urls.insert(abs_url_str.clone());

                    let high_res_url = infer_high_res_url_generic(&abs_url);

                    wallpapers.push(WallpaperInfo {
                        thumbnail_url: abs_url_str,
                        full_url: high_res_url,
                        alt: element
                            .value()
                            .attr("alt")
                            .unwrap_or("Wallpaper")
                            .to_string(),
                        width: if w > 0 { Some(w) } else { None },
                        height: if h > 0 { Some(h) } else { None },
                        detail_page_url: None,
                    });
                }
            }
        }
    }

    // 2. Extract from <a> links pointing directly to image files
    for element in document.select(&link_selector) {
        if let Some(href) = element.value().attr("href") {
            let lower_href = href.to_lowercase();
            if lower_href.ends_with(".jpg")
                || lower_href.ends_with(".jpeg")
                || lower_href.ends_with(".png")
                || lower_href.ends_with(".webp")
            {
                if let Ok(abs_url) = base_url.join(href) {
                    let abs_url_str = abs_url.to_string();
                    if !seen_urls.contains(&abs_url_str) {
                        seen_urls.insert(abs_url_str.clone());

                        // Try to find a child image to use as thumbnail
                        let child_img =
                            element.select(&Selector::parse("img").unwrap()).next();
                        let thumbnail_url = if let Some(img) = child_img {
                            let src = img.value().attr("src").unwrap_or(&abs_url_str);
                            base_url
                                .join(src)
                                .map(|u| u.to_string())
                                .unwrap_or_else(|_| abs_url_str.clone())
                        } else {
                            abs_url_str.clone()
                        };

                        wallpapers.push(WallpaperInfo {
                            thumbnail_url,
                            full_url: abs_url_str,
                            alt: "Linked Image".to_string(),
                            width: None,
                            height: None,
                            detail_page_url: None,
                        });
                    }
                }
            }
        }
    }

    (wallpapers, errors)
}

/// Generic high-res URL inference for non-site-specific images
fn infer_high_res_url_generic(url: &Url) -> String {
    let mut url_clone = url.clone();

    // Remove sizing query parameters
    let query_pairs: Vec<(String, String)> = url_clone
        .query_pairs()
        .filter(|(k, _)| {
            let key = k.to_lowercase();
            !key.starts_with("w")
                && !key.starts_with("h")
                && !key.starts_with("resize")
                && !key.starts_with("size")
                && !key.starts_with("fit")
                && key != "q"
        })
        .map(|(k, v)| (k.into_owned(), v.into_owned()))
        .collect();

    url_clone
        .query_pairs_mut()
        .clear()
        .extend_pairs(query_pairs);

    let host = url_clone.host_str().unwrap_or("").to_lowercase();
    let mut path = url_clone.path().to_string();

    if host.contains("unsplash.com") {
        url_clone.query_pairs_mut().append_pair("w", "3840");
        url_clone.query_pairs_mut().append_pair("q", "100");
    } else if host.contains("wallpapers.com") {
        path = path.replace("/images/hd/", "/images/high/");
    }

    // Generic path-based thumbnail-to-original replacements
    if path.contains("/thumb/") {
        path = path.replace("/thumb/", "/original/");
    }
    if path.contains("-small") {
        path = path.replace("-small", "");
    }
    if path.contains("-thumb") {
        path = path.replace("-thumb", "");
    }

    url_clone.set_path(&path);
    url_clone.to_string()
}

/// Parse a 4kwallpapers.com detail page to find the highest resolution download URL.
/// This is used as a fallback by the downloader when the guessed URL returns 404.
pub fn parse_4kwallpapers_best_url(html: &str, page_url: &str) -> Option<String> {
    let document = Html::parse_document(html);
    let base_url = match Url::parse(page_url) {
        Ok(u) => u,
        Err(_) => return None,
    };

    let resolution_selector =
        Selector::parse("a[href*='/images/wallpapers/']").unwrap();

    let mut best_url = String::new();
    let mut best_pixels: u64 = 0;

    for link in document.select(&resolution_selector) {
        if let Some(href) = link.value().attr("href") {
            if let Some((w, h)) = parse_resolution_from_url(href) {
                let pixels = w as u64 * h as u64;
                if pixels > best_pixels {
                    best_pixels = pixels;
                    best_url = base_url
                        .join(href)
                        .map(|u| u.to_string())
                        .unwrap_or_default();
                }
            }
        }
    }

    if best_url.is_empty() {
        None
    } else {
        Some(best_url)
    }
}
