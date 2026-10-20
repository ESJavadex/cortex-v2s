import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

import type { FullConfig } from '@playwright/test';

import { getE2EUser } from '../../e2e/setup/user';

export default async function authenticate(config: FullConfig): Promise<void> {
  const { baseURL, storageState } = config.projects[0].use;
  assert(typeof baseURL === 'string', 'Lighthouse requires an isolated harness URL');
  assert(typeof storageState === 'string', 'Lighthouse requires a storage state file');
  assert(new URL(baseURL).port !== '3082', 'Never run Lighthouse setup against the demo');
  const user = getE2EUser();
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.E2E_CHROMIUM_CHANNEL ? { channel: process.env.E2E_CHROMIUM_CHANNEL } : {}),
    args: ['--no-sandbox'],
  });
  try {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      localStorage.setItem('lang', JSON.stringify('en'));
      localStorage.setItem('navVisible', 'true');
    });
    const registration = await context.request.post(`${baseURL}/api/auth/register`, {
      data: { ...user, confirm_password: user.password },
    });
    assert(registration.ok(), `Harness registration failed with HTTP ${registration.status()}`);
    const page = await context.newPage();
    await page.goto(`${baseURL}/login`);
    await page.locator('input[name="email"]').fill(user.email);
    await page.locator('input[name="password"]').fill(user.password);
    await page.locator('input[name="password"]').press('Enter');
    await page.waitForURL('**/c/**');
    await page.getByTestId('text-input').waitFor({ state: 'visible' });
    fs.mkdirSync(path.dirname(storageState), { recursive: true });
    await context.storageState({ path: storageState });
    console.log('Lighthouse isolated user authenticated; no model request sent');
  } finally {
    await browser.close();
  }
}
