'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ZIP = path.join(ROOT, 'function.zip');

// 1. Verify dist/ was built
if (!fs.existsSync(DIST)) {
  console.error('ERROR: dist/ not found. Run "npm run build" first.');
  process.exit(1);
}

// 2. Remove old zip
if (fs.existsSync(ZIP)) {
  fs.unlinkSync(ZIP);
  console.log('Removed old function.zip');
}

// 3. Install production dependencies inside dist/
//    This ensures Lambda has all runtime packages without dev dependencies.
console.log('Copying package manifests to dist/...');
fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(DIST, 'package.json'));
const lockFile = path.join(ROOT, 'package-lock.json');
if (fs.existsSync(lockFile)) {
  fs.copyFileSync(lockFile, path.join(DIST, 'package-lock.json'));
}

console.log('Installing production dependencies in dist/ (this may take a moment)...');
execSync('npm ci --omit=dev --no-audit --no-fund', { cwd: DIST, stdio: 'inherit' });

// 4. Create ZIP — cross-platform (PowerShell on Windows, zip on Unix/Mac)
console.log('\nCreating function.zip...');
if (process.platform === 'win32') {
  // PowerShell Compress-Archive is available on all modern Windows systems
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${DIST}\\*' -DestinationPath '${ZIP}' -Force"`,
    { stdio: 'inherit' },
  );
} else {
  execSync(`zip -r "${ZIP}" .`, { cwd: DIST, stdio: 'inherit' });
}

// 5. Report size
const { size } = fs.statSync(ZIP);
console.log(`\nfunction.zip created successfully!`);
console.log(`Size: ${(size / 1024 / 1024).toFixed(1)} MB`);
console.log(`Path: ${ZIP}`);
