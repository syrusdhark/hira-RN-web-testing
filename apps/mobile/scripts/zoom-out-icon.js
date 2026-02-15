/**
 * Generates a zoomed-out adaptive icon foreground from the main app icon.
 * Android adaptive icons show the foreground in a mask; scaling down the
 * logo within the 1024x1024 canvas makes it appear less zoomed on the home screen.
 *
 * Run from apps/mobile: node scripts/zoom-out-icon.js
 * Requires: npm install --save-dev sharp
 */
const path = require('path');
const fs = require('fs');

const SIZE = 1024;
const SCALE = 0.72; // Logo at 72% of canvas (Android safe zone is ~66–72%)

const inputPath = path.join(__dirname, '..', 'assets', 'hira-logo.png');
const outputPath = path.join(__dirname, '..', 'assets', 'icon-adaptive-foreground.png');

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('Run: npm install --save-dev sharp');
    process.exit(1);
  }

  if (!fs.existsSync(inputPath)) {
    console.error('Input icon not found:', inputPath);
    process.exit(1);
  }

  const scaledSize = Math.round(SIZE * SCALE);
  const offset = Math.round((SIZE - scaledSize) / 2);

  await sharp(inputPath)
    .resize(scaledSize, scaledSize)
    .extend({
      top: offset,
      bottom: offset,
      left: offset,
      right: offset,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outputPath);

  console.log('Wrote', outputPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
