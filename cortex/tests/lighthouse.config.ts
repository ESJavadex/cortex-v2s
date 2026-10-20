import path from 'node:path';
import { defineConfig } from '@playwright/test';

import upstream from '../../e2e/playwright.config.lighthouse';

export default defineConfig({
  ...upstream,
  testDir: path.resolve(__dirname, '../../e2e/lighthouse'),
  outputDir: path.resolve(__dirname, 'artifacts/lighthouse-results'),
  globalSetup: require.resolve('./lighthouse-auth'),
  use: {
    ...upstream.use,
    storageState: path.resolve(__dirname, 'artifacts/lighthouse-state.json'),
  },
});
