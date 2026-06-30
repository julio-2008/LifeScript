// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');
const { FileStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

// Adiciona .wasm para servir arquivos WebAssembly
if (config.resolver && config.resolver.assetExts) {
  if (!config.resolver.assetExts.includes('wasm')) {
    config.resolver.assetExts.push('wasm');
  }
}

// Use a stable on-disk store (shared across web/android)
const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, '.metro-cache');
config.cacheStores = [
  new FileStore({ root: path.join(root, 'cache') }),
];

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 1;

// Aggressive blacklist to reduce file watchers
config.watchFolders = [__dirname];
config.resolver.blacklistRE = /(.*)\/(__tests__|\.git|node_modules\/.*\/(android|ios|windows|macos|__tests__|test|spec|\.git|example|demo|docs))(\/.*)?$/;

// Ignore node_modules from file watching (huge performance win)
config.watchPathIgnorePatterns = [
  /node_modules[/\\].*/,
  /\.expo[/\\].*/,
  /\.git[/\\].*/,
  /\.next[/\\].*/,
  /dist[/\\].*/,
  /build[/\\].*/,
];

module.exports = config;
