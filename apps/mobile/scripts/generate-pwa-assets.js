const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, '..', 'assets', 'hira-logo.png');
const publicDir = path.join(__dirname, '..', 'public');

async function main() {
    let sharp;
    try {
        sharp = require('sharp');
    } catch (e) {
        console.error('Sharp not found');
        process.exit(1);
    }

    if (!fs.existsSync(inputPath)) {
        console.error('Input icon not found:', inputPath);
        process.exit(1);
    }

    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }

    // Generate 192x192
    await sharp(inputPath)
        .resize(192, 192)
        .png()
        .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('Generated icon-192.png');

    // Generate 512x512
    await sharp(inputPath)
        .resize(512, 512)
        .png()
        .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('Generated icon-512.png');

    // Generate favicon (32x32) as png
    await sharp(inputPath)
        .resize(32, 32)
        .png()
        .toFile(path.join(publicDir, 'favicon.png'));
    console.log('Generated favicon.png');
}

main().catch(console.error);
