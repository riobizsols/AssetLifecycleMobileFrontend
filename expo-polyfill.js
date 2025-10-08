// Polyfill for Expo modules when using react-native-paper without Expo
if (!global.process) {
  global.process = {};
}

if (!global.process.env) {
  global.process.env = {};
}

// Mock EXPO_OS for babel-preset-expo compatibility
if (!global.process.env.EXPO_OS) {
  global.process.env.EXPO_OS = 'ios'; // or 'android' based on platform
}

// Mock ExpoNativeModulesProxy
if (!global.ExpoModules) {
  global.ExpoModules = {};
}
