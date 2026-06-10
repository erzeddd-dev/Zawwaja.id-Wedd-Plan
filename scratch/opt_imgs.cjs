const sharp = require('sharp');
const fs = require('fs');

async function optimize() {
  const images = ['public/bg-garden.png', 'public/logo.png'];
  for (const img of images) {
    if (fs.existsSync(img)) {
      const out = img.replace('.png', '.webp');
      try {
        await sharp(img).webp({ quality: 80 }).toFile(out);
        console.log('Successfully optimized ' + img + ' to ' + out);
        // We will keep the original files but update references, or just overwrite the pngs
        // Actually, let's just create .webp and we will update references in code.
      } catch (e) {
        console.error('Error optimizing ' + img, e);
      }
    }
  }
}

optimize();
