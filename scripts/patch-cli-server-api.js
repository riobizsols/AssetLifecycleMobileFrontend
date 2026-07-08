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

function patchCliServerApi() {
  const targetFile = path.join(
    __dirname,
    '../node_modules/@react-native-community/cli-server-api/build/index.js'
  );

  if (!fs.existsSync(targetFile)) {
    console.log('⚠️  cli-server-api not found, skipping patch');
    return;
  }

  const content = fs.readFileSync(targetFile, 'utf8');

  // Check if already patched
  if (content.includes('indexPageMiddleware", {')) {
    console.log('✓ cli-server-api already patched');
    return;
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
    console.error('✗ Failed to apply cli-server-api patch: pattern not found');
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(targetFile, patchedContent, 'utf8');
  console.log('✓ Successfully patched @react-native-community/cli-server-api');
}

function patchDateTimePickerAndroidPackage() {
  const targetFile = path.join(
    __dirname,
    '../node_modules/@react-native-community/datetimepicker/android/src/main/java/com/reactcommunity/rndatetimepicker/RNDateTimePickerPackage.java'
  );

  if (!fs.existsSync(targetFile)) {
    console.log('⚠️  datetimepicker package file not found, skipping patch');
    return;
  }

  const content = fs.readFileSync(targetFile, 'utf8');

  // If references are already removed, skip.
  if (!content.includes('MaterialDatePickerModule.NAME') && !content.includes('MaterialTimePickerModule.NAME')) {
    console.log('✓ datetimepicker already patched');
    return;
  }

  let patchedContent = content;
  patchedContent = patchedContent.replace(
    `    } else if (name.equals(MaterialDatePickerModule.NAME)) {
      return new MaterialDatePickerModule(reactContext);
    } else if (name.equals(MaterialTimePickerModule.NAME)) {
      return new MaterialTimePickerModule(reactContext);
`,
    ''
  );

  patchedContent = patchedContent.replace(
    `      moduleInfos.put(
        MaterialDatePickerModule.NAME,
        new ReactModuleInfo(
          MaterialDatePickerModule.NAME,
          MaterialDatePickerModule.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // hasConstants
          false, // isCxxModule
          isTurboModule // isTurboModule
        ));
      moduleInfos.put(
        MaterialTimePickerModule.NAME,
        new ReactModuleInfo(
          MaterialTimePickerModule.NAME,
          MaterialTimePickerModule.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // hasConstants
          false, // isCxxModule
          isTurboModule // isTurboModule
        ));
`,
    ''
  );

  if (patchedContent === content) {
    console.error('✗ Failed to apply datetimepicker patch: pattern not found');
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(targetFile, patchedContent, 'utf8');
  console.log('✓ Successfully patched @react-native-community/datetimepicker Android package');
}

patchCliServerApi();
patchDateTimePickerAndroidPackage();

