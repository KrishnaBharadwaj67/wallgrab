const https = require('https');
const url = require('url');

// 1. Test AlphaCoders URL
const alphaUrl = 'https://images7.alphacoders.com/134/thumb-1920-1348642.webp';
https.get(alphaUrl, (res) => {
  console.log(`AlphaCoders without ?: ${res.statusCode}`);
});
https.get(alphaUrl + '?', (res) => {
  console.log(`AlphaCoders with ?: ${res.statusCode}`);
});

// 2. Test 4kwallpapers heuristic
// Original: https://4kwallpapers.com/images/walls/thumbs/26258.jpg
const urls = [
  'https://4kwallpapers.com/images/walls/resolutions/26258.jpg',
  'https://4kwallpapers.com/images/walls/original/26258.jpg',
  'https://4kwallpapers.com/images/wallpapers/26258.jpg',
  'https://4kwallpapers.com/images/wallpapers/abstract-26258.jpg',
];

urls.forEach(u => {
  https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    console.log(`4kwallpapers ${u} : ${res.statusCode}`);
  });
});
