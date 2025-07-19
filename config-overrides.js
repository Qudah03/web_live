const path = require('path');

module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "fs": false,
    "path": false,
    "os": false,
  };
  
  // Add rule to handle .wasm files
  config.module.rules.push({
    test: /\.wasm$/,
    type: 'webassembly/sync',
  });

  // Enable WebAssembly experiments
  config.experiments = {
    ...config.experiments,
    syncWebAssembly: true,
    asyncWebAssembly: true,
  };

  // Fix the module resolution for @rerun-io/web-viewer
  config.resolve.extensionAlias = {
    ...config.resolve.extensionAlias,
    ".js": [".js", ".ts"],
  };

  // Add module resolution for the re_viewer import
  config.resolve.alias = {
    ...config.resolve.alias,
    're_viewer': path.resolve(__dirname, 'node_modules/@rerun-io/web-viewer/re_viewer.js'),
  };

  return config;
};
