const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Ensure dist directories exist
const dirs = [
  distDir,
  path.join(distDir, 'popup'),
  path.join(distDir, 'icons'),
  path.join(distDir, 'shared'),
  path.join(distDir, 'utils')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Copy files
const filesToCopy = [
  { src: 'manifest.json', dest: 'manifest.json' },
  { src: 'src/popup/popup.html', dest: 'popup/popup.html' },
  { src: 'src/popup/popup.css', dest: 'popup/popup.css' }
];

filesToCopy.forEach(({ src, dest }) => {
  const srcPath = path.join(rootDir, src);
  const destPath = path.join(distDir, dest);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${src} -> dist/${dest}`);
  } else {
    console.warn(`Warning: ${src} not found`);
  }
});

// Copy icons directory
const iconsDir = path.join(rootDir, 'icons');
const distIconsDir = path.join(distDir, 'icons');

if (fs.existsSync(iconsDir)) {
  const iconFiles = fs.readdirSync(iconsDir);
  iconFiles.forEach(file => {
    fs.copyFileSync(
      path.join(iconsDir, file),
      path.join(distIconsDir, file)
    );
    console.log(`Copied: icons/${file} -> dist/icons/${file}`);
  });
}

console.log('Static files copied successfully!');
