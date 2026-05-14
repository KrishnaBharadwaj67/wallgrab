const https = require('https');

function fetch4kDetail(url) {
  https.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('=== IMG TAGS (only with src containing images/walls) ===');
      const imgMatches = data.match(/<img[^>]+>/gi) || [];
      imgMatches.filter(m => m.includes('images/walls')).forEach(m => console.log(m));
      
      console.log('\n=== LISTING PAGE: Find img src patterns on listing ===');
    });
  });
}

function fetchListing(url) {
  https.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('\n=== LISTING PAGE IMG TAGS (with images/walls) ===');
      const imgMatches = data.match(/<img[^>]+>/gi) || [];
      imgMatches.filter(m => m.includes('images/walls')).forEach(m => console.log(m));
      
      console.log('\n=== LISTING <a> with wallpaper detail links ===');
      const links = data.match(/<a[^>]*href=['"][^'"]*\d+\.html['"][^>]*>/gi) || [];
      links.slice(0, 5).forEach(m => console.log(m));
    });
  });
}

fetch4kDetail('https://4kwallpapers.com/abstract/shattered-glass-26258.html');
fetchListing('https://4kwallpapers.com/abstract/');
