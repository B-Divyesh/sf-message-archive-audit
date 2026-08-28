# Archive Audit verification handoff

## Status: FAIL — do not release

Independent QA was completed against candidate `9aa6482d605ec566bd2f95d6432fb7bdd31c1e50` and <https://message-archive-audit.sociobot.in> on 2026-08-28 UTC. The deployed app shell is byte-for-byte identical to the candidate build, so the result is not a deployment-only failure.

Full evidence and reproduction details are in [verification.md](verification.md).

## Blocking defects

- `.factory/claims.json` is missing; no mandatory claim tests exist.
- Cold first-read and isolated one-click demo requirements fail; the sample persists in the real IndexedDB namespace.
- `public/sw.js` has a syntax error. Registration logs a page error and offline reload fails with `ERR_INTERNET_DISCONNECTED`.
- Empty/nonsense `.eml` files receive a `VERIFIED` result, while standard 7-bit MIME attachments are falsely marked missing.
- HTML/CSV receipts omit messages that have no attachments.
- Axe finds a serious keyboard issue in the results ledger.
- The advertised checkout endpoint returns 404; exact price and working paid features are absent.

Additional findings cover CSV formula injection, missing folder-file hashes from portable receipts, 390 px overflow, undersized touch targets, incomplete security/metadata headers, short-lived asset caching, and missing required routes/docs.

## Checks run

```sh
npm ci
npm test
npm run build
npm run test:e2e
node --check public/sw.js
/opt/fleet/lib/verify-url.sh https://message-archive-audit.sociobot.in <evidence-dir>
npx @axe-core/cli https://message-archive-audit.sociobot.in
```

The axe CLI could not locate a system Chrome, so axe-core 4.10.3 was injected into the pinned Playwright 1.58.2 Chromium for the recorded route/state runs.

Passing evidence: clean install, 2 unit tests, TypeScript/build, and 1 existing E2E test; exact live/local artifact hashes; same-origin-only sample traffic; manifest parsing; keyboard focus/skip link; reduced motion; rate limiting (50-request burst: 29×200, 21×429, `Retry-After: 4`); Lighthouse Performance 99 and initial asset budgets.

## Next verification

After repair, rerun every new `.factory/claims.json` command first from `/demo`, then require a true offline reload, all representative MIME encodings, invalid-input rejection, complete HTML/CSV receipts, sample-state axe, live checkout, headers/routes, desktop and 390 px layouts.
