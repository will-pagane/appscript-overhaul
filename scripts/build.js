const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Clean dist directory
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

console.log('Building extension with esbuild...');

// Build content script (bundle all dependencies)
esbuild.buildSync({
  entryPoints: ['src/content/content.ts'],
  bundle: true,
  outfile: 'dist/content/content.js',
  platform: 'browser',
  target: 'es2020',
  format: 'iife',
  globalName: 'ContentScript',
  sourcemap: false,
  minify: false,
  treeShaking: true,
  legalComments: 'none',
});

// Build popup script (bundle all dependencies)
esbuild.buildSync({
  entryPoints: ['src/popup/popup.ts'],
  bundle: true,
  outfile: 'dist/popup/popup.js',
  platform: 'browser',
  target: 'es2020',
  format: 'iife',
  globalName: 'PopupScript',
  sourcemap: false,
  minify: false,
  treeShaking: true,
  legalComments: 'none',
});

console.log('✓ TypeScript compiled and bundled');

// Remove "use strict" from bundled files (Chrome extension compatibility)
function removeUseStrict(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/^"use strict";\s*/m, '');
  fs.writeFileSync(filePath, content, 'utf8');
}

removeUseStrict('dist/content/content.js');
removeUseStrict('dist/popup/popup.js');
console.log('✓ Removed "use strict" directives');

// Copy static files
const staticFiles = [
  { from: 'manifest.json', to: 'manifest.json' },
  { from: 'src/popup/popup.html', to: 'popup/popup.html' },
  { from: 'src/popup/popup.css', to: 'popup/popup.css' },
];

for (const file of staticFiles) {
  const fromPath = path.join(__dirname, '..', file.from);
  const toPath = path.join(distDir, file.to);
  const toDir = path.dirname(toPath);

  if (!fs.existsSync(toDir)) {
    fs.mkdirSync(toDir, { recursive: true });
  }

  fs.copyFileSync(fromPath, toPath);
  console.log(`Copied: ${file.from} -> ${file.to}`);
}

console.log('✓ Static files copied');
console.log('\n✅ Build complete! Extension ready in dist/');
