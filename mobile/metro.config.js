const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

// 1. Get the default React Native configuration
const defaultConfig = getDefaultConfig(__dirname);

// 2. Merge any custom config (empty for now)
const config = mergeConfig(defaultConfig, {});

// 3. Wrap the fully formed config with NativeWind
module.exports = withNativeWind(config, { input: './global.css' });