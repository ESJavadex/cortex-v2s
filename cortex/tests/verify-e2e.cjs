#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch {
    const globalModules = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
    return require(path.join(globalModules, 'playwright'));
  }
}

const { chromium } = loadPlaywright();
const baseURL = process.env.CORTEX_URL || 'http://127.0.0.1:3082';
const artifacts = process.env.CORTEX_ARTIFACT_DIR || path.join(__dirname, 'artifacts');
const envFile = path.join(__dirname, '..', '.env');
const envText = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
const passwordEntry = envText.match(/^DEMO_PASSWORD=(.*)$/m)?.[1]?.trim();
const password = process.env.DEMO_PASSWORD || passwordEntry?.replace(/^(['"])(.*)\1$/, '$2');
const email = process.env.DEMO_EMAIL || 'demo@v2s.cortex.test';
const smokeOnly = process.argv.includes('--smoke');
const expectedModel = 'openai/gpt-6-luna';
const prompt =
  'Revisa las alertas críticas y correlaciona el problema de almacenamiento con las copias de seguridad. Cita IDs y recomienda próximos pasos.';

function requestModelSettings(payload, prefix = '') {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  return Object.entries(payload).reduce((settings, [key, value]) => {
    const field = prefix ? `${prefix}.${key}` : key;
    if (['model', 'reasoning_effort', 'endpoint'].includes(key) && typeof value === 'string') {
      settings[field] = value;
      return settings;
    }
    return Object.assign(settings, requestModelSettings(value, field));
  }, {});
}

function parseFinalEvent(stream) {
  const events = stream
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => {
      try {
        return JSON.parse(line.slice(5));
      } catch {
        return null;
      }
    });
  const final = events.findLast((event) => event?.final === true);
  assert(final, 'Chat stream must complete');
  return final;
}

async function main() {
  assert(password, 'Set DEMO_PASSWORD or create cortex/.env before running verification');
  fs.mkdirSync(artifacts, { recursive: true });
  const report = {
    baseURL,
    startedAt: new Date().toISOString(),
    checks: [],
    chatRequested: !smokeOnly,
  };
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CORTEX_CHROMIUM_CHANNEL
      ? { channel: process.env.CORTEX_CHROMIUM_CHANNEL }
      : {}),
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 1512, height: 1080 },
    locale: 'en-US',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    const configResponse = await context.request.get(`${baseURL}/api/config`);
    assert.equal(configResponse.status(), 200, 'Startup config must return HTTP 200');
    const config = await configResponse.json();
    assert.match(config.appTitle, /Cortex/i);
    assert.equal(config.registrationEnabled, false, 'Public registration must be disabled');
    assert.doesNotMatch(
      config.appTitle,
      /LibreChat/i,
      'Application title must use Cortex branding',
    );
    report.checks.push('startup HTTP 200, Cortex title, registration closed');

    await page.goto(`${baseURL}/login`);
    await page
      .getByRole('heading', { name: 'Menos ruido. Más claridad.', exact: true })
      .waitFor({ state: 'visible' });
    const loginCredit = page.getByRole('link', { name: 'Hecho por Javadex', exact: true });
    await loginCredit.waitFor({ state: 'visible' });
    assert.equal(await loginCredit.getAttribute('href'), 'https://javadex.es');
    report.checks.push('fresh en-US browser defaults to Spanish login and links to Javadex');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.screenshot({ path: path.join(artifacts, 'login.png'), animations: 'disabled' });
    const loginPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/login') && response.request().method() === 'POST',
    );
    await page.locator('input[name="password"]').press('Enter');
    const loginResponse = await loginPromise;
    assert.equal(loginResponse.status(), 200, 'Demo login must succeed');
    const login = await loginResponse.json();
    await page.waitForURL('**/c/**');
    await page.getByTestId('text-input').waitFor({ state: 'visible' });
    await page
      .getByRole('heading', { name: 'Cortex · Operaciones V2S', exact: true })
      .waitFor({ state: 'visible' });
    const chatCredit = page.getByRole('link', { name: 'Javadex', exact: true });
    await chatCredit.waitFor({ state: 'visible' });
    assert.equal(await chatCredit.getAttribute('href'), 'https://javadex.es');
    assert.match(await page.locator('body').innerText(), /Hecho por Javadex/);
    assert.doesNotMatch(
      await page.locator('body').innerText(),
      /LibreChat/i,
      'Visible application must use Cortex branding',
    );
    assert.match(await page.title(), /Cortex/i);
    report.checks.push('browser login, chat editor visible, title and visible branding');

    const modelsResponse = await context.request.get(`${baseURL}/api/models`, {
      headers: { Authorization: `Bearer ${login.token}` },
    });
    assert.equal(modelsResponse.status(), 200, 'Authenticated models must return HTTP 200');
    const models = await modelsResponse.json();
    assert(Object.keys(models).length > 0, 'At least one model endpoint must be configured');
    report.preset = 'Cortex · Operaciones V2S';
    assert.match(
      (await page.getByTestId('text-input').getAttribute('placeholder')) || '',
      /GPT-6 Luna/,
      'The selected model preset must identify GPT-6 Luna',
    );
    await page
      .getByRole('button')
      .filter({ hasText: report.preset })
      .first()
      .waitFor({ state: 'visible' });
    await page
      .getByRole('button')
      .filter({ hasText: 'Zabbix V2S' })
      .first()
      .waitFor({ state: 'visible' });
    const zabbixLogo = page
      .locator('[title="Zabbix V2S"] img[src="/assets/zabbix-logo.svg"]')
      .first();
    await zabbixLogo.waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const logo = document.querySelector(
        '[title="Zabbix V2S"] img[src="/assets/zabbix-logo.svg"]',
      );
      return logo?.complete && logo.naturalWidth > 0;
    });
    report.checks.push(
      'Spanish welcome and Javadex footer; visible Zabbix V2S title and loaded logo',
    );
    report.checks.push(
      'authenticated model catalogue, GPT-6 Luna preset and reasoning_effort none',
    );
    await page.screenshot({ path: path.join(artifacts, 'workspace.png') });
    if (!smokeOnly) {
      await page.getByTestId('text-input').fill(prompt);
      const chatPromise = page.waitForResponse(
        (response) =>
          response.request().method() === 'GET' &&
          /\/api\/agents\/chat\/stream\//.test(response.url()),
        { timeout: 180000 },
      );
      const requestPromise = page.waitForRequest(
        (request) =>
          request.method() === 'POST' &&
          /\/api\/agents\/chat(?:\/[^/?]+)?(?:\?.*)?$/.test(request.url()),
        { timeout: 30000 },
      );
      await page.getByTestId('send-button').click();
      const chatRequest = await requestPromise;
      report.requestSettings = requestModelSettings(chatRequest.postDataJSON());
      assert(
        Object.entries(report.requestSettings).some(
          ([field, value]) => field.endsWith('model') && value === expectedModel,
        ),
        'Browser request must select GPT-6 Luna',
      );
      const requestEfforts = Object.entries(report.requestSettings).filter(([field]) =>
        field.endsWith('reasoning_effort'),
      );
      assert(
        requestEfforts.every(([, value]) => value === 'none'),
        'Browser request reasoning must be none when provided',
      );
      const chatResponse = await chatPromise;
      assert.equal(chatResponse.status(), 200, 'Chat request must return HTTP 200');
      const stream = (await chatResponse.body()).toString('utf8');
      fs.writeFileSync(path.join(artifacts, 'chat-stream.txt'), stream);
      const final = parseFinalEvent(stream);
      report.responseModel = final.responseMessage?.model;
      assert.equal(
        report.responseModel,
        expectedModel,
        'Final generated response must use GPT-6 Luna',
      );
      assert.equal(
        final.responseMessage?.error ?? false,
        false,
        'Chat must finish without an error',
      );
      await page.locator('.agent-turn').last().waitFor({ state: 'visible', timeout: 180000 });
      const content = final.responseMessage?.content || [];
      const answer =
        content
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join('\n') ||
        final.responseMessage?.text ||
        '';
      report.answer = await page
        .locator('.agent-turn')
        .last()
        .locator('.message-content')
        .last()
        .innerText();
      report.toolEvidence = content
        .filter((part) => part.type === 'tool_call' && part.tool_call?.output)
        .map((part) => part.tool_call.name);
      await page.screenshot({ path: path.join(artifacts, 'conversation.png') });
      assert(answer.length > 300, 'Agent must return a substantive answer');
      assert.match(
        answer,
        /ZBX[- _]?104[12]/i,
        'Answer must cite a real synthetic storage alert ID',
      );
      assert.match(
        answer,
        /ZBX[- _]?1044|BK-ERP-DAILY/i,
        'Answer must cite the synthetic failed backup alert or job ID',
      );
      assert.match(answer, /backup|copia|respaldo/i, 'Answer must correlate backup information');
      assert.match(
        answer,
        /almacenamiento|storage|datastore|capacidad/i,
        'Answer must correlate storage information',
      );
      assert(
        report.toolEvidence.some((name) => /zabbix_alerts|zabbix_history/.test(name)),
        'Chat must call a real V2S monitoring MCP tool',
      );
      assert(
        report.toolEvidence.some((name) => /backup_jobs/.test(name)),
        'Chat must call the V2S backups MCP tool',
      );
      report.checks.push(
        'real chat stream completed, answer cites IDs and correlates storage/backups, MCP evidence',
      );
      await page.screenshot({ path: path.join(artifacts, 'conversation.png') });
    }
    assert.equal(errors.length, 0, `Browser runtime errors: ${errors.join('; ')}`);
    report.checks.push('no browser runtime errors');
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed';
    report.error = error.message;
    report.pageURL = page.url();
    await page.screenshot({ path: path.join(artifacts, 'failure.png') }).catch(() => {});
    throw error;
  } finally {
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(
      path.join(artifacts, smokeOnly ? 'smoke-report.json' : 'e2e-report.json'),
      JSON.stringify(report, null, 2),
    );
    await browser.close();
    console.log(
      JSON.stringify({ status: report.status, checks: report.checks, artifacts }, null, 2),
    );
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { parseFinalEvent };
