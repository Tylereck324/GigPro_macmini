const fs = require('fs');
const path = require('path');

// Create a simple SVG icon with the GigPro branding
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background with rounded corners -->
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bgGradient)"/>

  <!-- Letter "G" -->
  <text
    x="50%"
    y="50%"
    dominant-baseline="central"
    text-anchor="middle"
    font-family="Arial, sans-serif"
    font-weight="bold"
    font-size="${size * 0.6}"
    fill="white">G</text>

  <!-- Small dollar sign accent -->
  <text
    x="${size * 0.75}"
    y="${size * 0.3}"
    font-family="Arial, sans-serif"
    font-weight="bold"
    font-size="${size * 0.25}"
    fill="#34D399">$</text>
</svg>
`;

// Create the public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Generate 192x192 icon
const icon192 = createIconSVG(192);
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), icon192);
console.log('Created icon-192.svg');

// Generate 512x512 icon
const icon512 = createIconSVG(512);
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), icon512);
console.log('Created icon-512.svg');

console.log('\nSVG icons created successfully!');
console.log('Note: For production, you should convert these to PNG files.');
console.log('You can use online tools like:');
console.log('- https://cloudconvert.com/svg-to-png');
console.log('- https://svgtopng.com/');
console.log('\nOr install sharp package: npm install sharp');
