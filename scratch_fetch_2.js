const https = require('https');

function fetchTags(url) {
  const options = {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  };
  https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      // Find <a> tags that contain <img> tags
      const matches = data.match(/<a[^>]+>[\s\S]*?<img[^>]+>[\s\S]*?<\/a>/g) || [];
      console.log(`\n--- ${url} ---`);
      matches.slice(0, 3).forEach(tag => console.log(tag.replace(/\s+/g, ' ')));
    });
  });
}

fetchTags('https://4kwallpapers.com/abstract/');
