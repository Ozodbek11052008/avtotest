#!/usr/bin/env node
/**
 * Deploy Firestore indexes.
 * Run: npm run deploy:indexes
 * If you see "Failed to authenticate", run once: npx firebase login
 */

const { execSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname);

console.log('Deploying Firestore indexes to project avtotest-3d00b...\n');
try {
  execSync('npx firebase deploy --only firestore:indexes', {
    encoding: 'utf8',
    cwd: projectRoot,
    stdio: 'inherit',
  });
  console.log('\nDone. Indexes may take a few minutes to finish building.');
} catch (e) {
  const msg = (e.stderr || e.message || '').toString();
  if (msg.includes('authenticate') || msg.includes('firebase login')) {
    console.log('\n*** Log in to Firebase first (one-time, opens browser): ***\n  npx firebase login\n\nThen run again:  npm run deploy:indexes\n');
  }
  process.exit(typeof e.status === 'number' ? e.status : 1);
}
