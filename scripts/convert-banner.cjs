const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

(async () => {
  try {
    const svgPath = path.resolve(__dirname, '..', 'assets', 'images', 'logo', 'banner.svg');
    const pngPath = path.resolve(__dirname, '..', 'assets', 'images', 'logo', 'banner.png');

    if (!fs.existsSync(svgPath)) {
      console.error('SVG not found at', svgPath);
      process.exit(1);
    }

    const svgBuffer = fs.readFileSync(svgPath);
    const png = await sharp(svgBuffer, { density: 300 })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .resize({ width: 1200 }) // generate large raster; email will scale down
      .toBuffer();

    fs.writeFileSync(pngPath, png);
    console.log('Generated PNG:', pngPath);
  } catch (err) {
    console.error('Conversion failed:', err);
    process.exit(1);
  }
})();
