// @ts-check
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite (Web) imports wa-sqlite.wasm; Metro must treat .wasm as a static asset.
const { assetExts } = config.resolver;
if (assetExts && !assetExts.includes('wasm')) {
  config.resolver.assetExts = [...assetExts, 'wasm'];
}

module.exports = config;
