const https = require('https');

function fetchSnippets(url) {
  const options = {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  };
  https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const imgTags = data.match(/<img[^>]+>/g) || [];
      console.log(`\n--- ${url} ---`);
      imgTags.slice(0, 10).forEach(tag => console.log(tag));
    });
  });
}

fetchSnippets('https://4kwallpapers.com/abstract/');
fetchSnippets('https://wall.alphacoders.com/by_category.php?id=3&name=Anime+Wallpapers');
fetchSnippets('https://wallpapers.com/search/nature');
