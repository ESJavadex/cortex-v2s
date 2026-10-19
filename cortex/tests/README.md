# Cortex V2S browser verification

Run from the repository root after starting the stack and creating the demo account:

```sh
node cortex/tests/verify-e2e.cjs --smoke
node cortex/tests/verify-e2e.cjs
```

The smoke check makes no model requests. The full check sends one real operations question through the browser, so it uses the configured OpenRouter model. Both checks read `DEMO_PASSWORD` from the environment or `cortex/.env`; credentials and tokens are never written to reports. Override `CORTEX_URL` and `DEMO_EMAIL` if needed.

Requires Playwright in local or global Node modules and its Chromium browser. Install separately if unavailable: `npm install --prefix cortex/tests --no-save playwright`, then `cortex/tests/node_modules/.bin/playwright install chromium`.

Screenshots and reports are saved under `cortex/tests/artifacts/` (ignored by Git). Override `CORTEX_ARTIFACT_DIR` to keep separate runs. The full report contains the response and records whether the stream included MCP tool evidence. It asserts a completed stream, concrete mock record IDs, and discussion of storage and backups.
