#!/usr/bin/env node
/**
 * Patch for @react-native-community/cli-server-api@18.0.0
 * 
 * This fixes a bug where indexPageMiddleware is not exported from the package,
 * causing Metro bundler to fail with "Cannot read properties of undefined (reading 'handle')".
 * 
 * Issue: indexPageMiddleware is imported but not exported in the package's index.js
 * Solution: Add the export statement
 */

const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '../node_modules/@react-native-community/cli-server-api/build/index.js'
);

if (!fs.existsSync(targetFile)) {
  console.log('⚠️  cli-server-api not found, skipping patch');
  process.exit(0);
}

const content = fs.readFileSync(targetFile, 'utf8');

// Check if already patched
if (content.includes('indexPageMiddleware", {')) {
  console.log('✓ cli-server-api already patched');
  process.exit(0);
}

// Apply patch
const patchedContent = content.replace(
  'exports.createDevServerMiddleware = createDevServerMiddleware;',
  `exports.createDevServerMiddleware = createDevServerMiddleware;
Object.defineProperty(exports, "indexPageMiddleware", {
  enumerable: true,
  get: function () {
    return _indexPageMiddleware.default;
  }
});`
);

if (patchedContent === content) {
  console.error('✗ Failed to apply patch: pattern not found');
  process.exit(1);
}

fs.writeFileSync(targetFile, patchedContent, 'utf8');
console.log('✓ Successfully patched @react-native-community/cli-server-api');

