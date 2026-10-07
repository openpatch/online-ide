import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/test/**/*.test.ts'],
    reporters: ['default'],
    // Keep the compiler/runtime workers within the memory available in CI.
    pool: 'forks',
    poolOptions: { forks: { minForks: 1, maxForks: 2 } },
    testTimeout: 10000,
    alias: [{
      find: /^monaco-editor$/,
      replacement: __dirname + '/node_modules/monaco-editor/esm/vs/editor/editor.api'
    }],
    environment: 'jsdom'
  },
  logLevel: 'silent',
  esbuild: {
    logOverride: {
      'unsupported-css-nesting': 'silent',
      'unsupported-@namespace': 'silent'
    }
  }
});
