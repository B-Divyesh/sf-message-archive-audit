# Archive Audit repair 4 handoff

## Status

**Ready to deploy.** This repair starts from the available remote base
`3092196290158dcfb129b302c818d627376272d2`. The work order's requested object
`3e56ef195918c350468a6e7291f2812318fd600b` is not present in the supplied
clone or `origin`, as recorded by the independent verifier. It cannot be
recreated from its SHA, so the replacement repair commit is
`0141008b2aeb56d444f2919cdc2e28bfe9917960`.

## Repairs

| Verifier finding | Root cause | Repair and regression coverage |
| --- | --- | --- |
| Privacy, Terms, and 404 skip links changed the hash but left focus on `body`. | Static legal-page `<main>` elements were not programmatically focusable. | Added `tabindex="-1"` to each target and made `route-focus.js` focus and scroll the target on activation. The Playwright keyboard regression tabs to the skip link, presses Enter, and asserts `main` is focused on all three routes. |
| The sole 404 recovery link was 20px high. | The content link did not use the product's 44px control treatment. | Added `.return-home` with a 44px minimum target; the browser regression measures it at both 1440px and 390px. |
| Privacy named “Clear local audit summary,” while the UI says “Clear local report.” | Documentation drift. | Privacy now names the actual control, and the regression asserts the exact sentence. |

The offline fallback received the same focusable-main and recovery-target treatment. Footer build IDs now report `repair-4`.

## Verification

Ran from a clean dependency install:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
node --check public/sw.js
npm run test:e2e
```

- `npm ci`: PASS — 60 packages, 0 vulnerabilities.
- `npm test`: PASS — 15 tests in 3 files, including static response-policy coverage.
- Typecheck and lint: PASS.
- Production build: PASS — `dist/` created; JavaScript 19.83 KB raw / 7.80 KB gzip and CSS 9.52 KB raw / 2.93 KB gzip.
- Worker syntax: PASS.
- `npm run test:e2e`: PASS — 14 Playwright tests.
- Each exact command in `.factory/claims.json` was run separately: all 7 claims passed (`mime-audit`, `local-only`, `offline-reload`, `receipt-exports`, `report-persistence`, `free-use`, and `demo-no-setup`).
- Desktop and 390px browser checks passed with no overflow or undersized visible controls. Keyboard checks include the repaired skip links. The Playwright Axe integration found zero serious or critical issues on demo, Privacy, Terms, and 404.
- The factory URL check against the production build passed: HTTP 200 in 567 ms, no console/page errors, title/lang/h1/main/alt/button checks all passed.
- The standalone `@axe-core/cli` was also attempted, but its Selenium runner could not start Chrome in this container (ChromeDriver/browser startup failure). The repository's Playwright Axe integration uses the installed Playwright browser and passed on the same four routes.
- Offline/update, local-only network behavior, receipt downloads, report persistence, and response-policy configuration remain exercised by the passing browser/unit suites. This is a static PWA, so backend rate-limit, identity, API response-policy, and package-consumer checks do not apply.

## Deployment

Push this repair to `main`; the static deployment is configured to publish `dist/` with `staticwebapp.config.json` at its root. After publish, verify the live app identity and repeat the keyboard, 390px, privacy, service-worker/offline, and route checks.

## Known gaps

None in product behavior. The only tooling limitation is the standalone Axe CLI's ChromeDriver startup in this disposable runner; equivalent Playwright Axe coverage passed.
