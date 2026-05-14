const https = require('https');

https.get('https://wall.alphacoders.com/by_category.php?id=3&name=Anime+Wallpapers', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Find alphacoders img tags or links to see what the thumbnail and original are
    const matches = data.match(/<picture>[\s\S]*?<\/picture>|<img[^>]+>/gi) || [];
    console.log(matches.slice(0, 5).join('\n\n'));
  });
});
