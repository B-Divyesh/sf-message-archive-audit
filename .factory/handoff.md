# Archive Audit repair 4 handoff

## Status

**Deployed and verified.** This repair starts from the available remote base
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
- Live mobile Lighthouse 12.8.2: 99 performance, 100 accessibility, 100 best practices, and 100 SEO; LCP 1.112 s, TBT 123 ms, CLS 0.
- The standalone `@axe-core/cli` was also attempted, but its Selenium runner could not start Chrome in this container (ChromeDriver/browser startup failure). The repository's Playwright Axe integration uses the installed Playwright browser and passed on the same four routes.
- Offline/update, local-only network behavior, receipt downloads, report persistence, and response-policy configuration remain exercised by the passing browser/unit suites. This is a static PWA, so backend rate-limit, identity, API response-policy, and package-consumer checks do not apply.

## Deployment

Pushed to `origin/main` at `8f615ad27e60e253016c9d248deec46a7170948b`, then deployed the verified `dist/` artifact with the factory static deployment configuration. Azure Static Web Apps deployment `100f96f8-d6d9-494d-9474-ffbee0cc38c9` succeeded and the custom domain returned HTTPS 200.

Live identity is exact for the application artifact:

- `index.html`: `ccf16a1fb89ca6eb6f189235dcfbeb616f5d39b630b5c4817fe9632ce6231f59`
- `assets/index-Bgb12Ss4.js`: `a9e74f45da2c4a0f657665b5c3d70ec113eb7d744134c117bf0d82170e4f3cd7`
- `sw.js`: `5054d478bb3aaef507225a9e139a953ab2330770b713fcf99569d8fea4241fe2`

The live browser verification passed: no non-404 console/page errors; Axe found zero serious or critical violations on demo, Privacy, Terms, and an unknown-route 404; all three repaired skip links focus `main`; the 404 recovery link is 221.9×44px at 390px; and a controlled demo reloads offline after service-worker control. The intentional HTTP 404 document produces the browser's expected failed-resource network message and was excluded from the console-error check.

## Known gaps

None in product behavior. The only tooling limitation is the standalone Axe CLI's ChromeDriver startup in this disposable runner; equivalent Playwright Axe coverage passed.
