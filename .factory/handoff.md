# Archive Audit repair 3 handoff

## Status

**PASS — verifier finding repaired, committed, pushed, and deployed.**

The repaired static PWA is live at <https://message-archive-audit.sociobot.in>. Product code and regression tests are in commit `35399b3` (`fix: audit nested MIME attachments`). Azure Static Web Apps deployment `35c9119a-0474-407d-bac9-9ab4fb4a7d81` completed successfully on 2026-08-29 UTC.

## Release blocker repaired

The verifier's nested MIME fixture reproduced the defect before the fix: `parseEml` returned no attachments for a valid `multipart/mixed` → `multipart/related` → base64 PDF structure.

`src/parser.ts` now separates each MIME entity into headers and body, discovers that entity's boundary, and recursively visits child parts. Named leaf parts retain their own filename, disposition, transfer encoding, byte count, hash, and missing-reference behavior. Existing top-level, zero-byte, base64, quoted-printable, 7-bit, MBOX, and supplied-folder behavior remains covered and passing.

The exact verifier fixture is covered twice:

- `src/parser.test.ts` asserts one `evidence.pdf`, 5 decoded bytes, verified status, and SHA-256 `c1cda26362828b69266512052b97cb3729e3b052e4ade47c0a1e3383defe73c7`.
- The single `@claim:mime-audit` Playwright test uploads that fixture through the real UI and asserts the named/hashed metrics, filename, byte count, and SHA-256 in the receipt.

The same fixture passed against the deployed production URL with `1 message`, `1 attachment named`, `1 attachment hashed`, and `0 references missing`.

## Clean build and automated verification

Run from `/work/repo`:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
node --check public/sw.js
```

Results:

- `npm ci`: 60 packages installed; 0 vulnerabilities.
- Unit/integration: 15 tests in 3 files passed.
- Typecheck and configured lint/type gate: passed.
- Production build: passed; `dist/index.html` is present.
- Browser suite: all 14 Playwright tests passed.
- Service worker syntax: passed.
- Package/consumer checks: not applicable to this static PWA; it does not publish a package.

Every command in `.factory/claims.json` was also run separately. All seven claims passed: MIME audit, local-only processing, offline reload, receipt exports, report persistence, free use, and no-setup demo.

## Browser, accessibility, privacy, and PWA evidence

- Desktop 1440×900 and mobile 390×844: no page overflow, undersized visible controls, console errors, or page errors. The wide ledger remains keyboard-scrollable.
- Keyboard: the skip link receives first focus; Enter moves focus to `main`; navigation and report controls remain operable.
- Axe 4.10.2: zero serious or critical findings on the demo, Privacy, Terms, and 404 routes locally; zero serious or critical findings in live desktop light and 390px dark reduced-motion demo states.
- Factory URL verifier: title, `lang`, one `h1`, `main`, image alt text, button names, and console checks passed locally and live. See [`repair-3-local/`](evidence/repair-3-local/) and [`repair-3-live/`](evidence/repair-3-live/).
- Privacy: the full live demo, reset, offline, nested-upload, and mobile flow made no cross-origin requests. No analytics, fonts, scripts, archive uploads, AI, account, payment, or provider requests exist.
- Offline: a controlled service worker reloaded the completed demo with the network disabled.
- Update: an isolated production-build simulation changed the worker from cache `archive-audit-v3` to `archive-audit-v4-test`. The app showed “An offline update is ready”; “Refresh now” activated the waiting worker, removed v3, created v4-test, reloaded, and retained the completed demo.
- The manifest parses through Chromium, uses standalone display, and provides 192px and 512px/maskable icons.

## Performance and production identity

Fresh mobile Lighthouse:

| Target | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS | Transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Local production build | 100 | 100 | 100 | 100 | 1.7 s | 0 ms | 0 | 63 KiB |
| Live production URL | 100 | 100 | 100 | 100 | 1.1 s | 0 ms | 0 | 63 KiB |

Bundle budgets pass: JavaScript 19.83 KB raw / 7.83 KB gzip, CSS 9.52 KB raw / 2.96 KB gzip, and hero WebP 48.97 KB. There are no downloaded fonts or third-party bytes.

The deployed artifacts match `dist/` byte for byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `89d97a9bf30f8b6733b58bd9f41c36338620b39e9e3d1da9f30bfb6abfd93af0` |
| `assets/index-ymypWK1f.js` | `f22e09f3bb5c48b6e2ae6b9bece8f4ddd686357a7f82aaec132e7c83fe1db292` |
| `assets/index-C5GLBEx9.css` | `415448edfb3a4cebbf47e6edf05973da10faf24be19922563f0e9941632d2679` |
| `sw.js` | `5054d478bb3aaef507225a9e139a953ab2330770b713fcf99569d8fea4241fe2` |
| `manifest.webmanifest` | `0a90b55b8aa5dc757eced5ab02d601d92ace2a3c02094532c180969e17216e32` |
| `hero-notebook.webp` | `cb97fbdf1cfcbcb917db3b4c7721a2f18829c8fc181ef6ea4fda481ea7ed9ccc` |

## Live response policy and routes

- `/`, `/demo`, `/privacy/`, `/terms/`, `robots.txt`, and `sitemap.xml` return 200; an unknown route returns the designed HTML with HTTP 404.
- Root HTML and `sw.js` use `Cache-Control: no-cache`; the hashed JS asset uses one-year immutable caching.
- Live headers include same-origin CSP with `frame-ancestors 'none'`, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, strict referrer policy, and restrictive Permissions Policy.
- This product has no backend, authentication, paid unlock, runtime AI, or API. Package-consumer, rate-limit/429, Sociobot identity, billing, and AI live-spend checks are not applicable.

## Known gaps and next step

No release-blocking gaps remain. The documented limits are unchanged: Archive Audit does not decrypt mail, read proprietary stores, recover missing messages, or certify provider completeness.

Next step: run independent verification against commit `35399b3` and the live production URL.
