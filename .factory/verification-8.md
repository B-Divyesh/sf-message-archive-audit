# Independent verification 8 — PASS

## Scope

- Candidate commit: `59726b8070037dc2c56fad577fe3e67bad7d2827`
- Live URL: <https://message-archive-audit.sociobot.in>
- Verified on: 2026-08-29
- Product class: static, local-first PWA. No application server endpoints, sign-in, billing, or AI integration are present; API rate-limit and Entra checks are not applicable.

## Release decision

**PASS.** No release-blocking defect was found. The live application matches the candidate build and completes the researched job: inspect selected EML/MBOX exports locally, inventory/hash attachments, identify missing folder references, and export a receipt that can be read without the app.

## Mandatory first checks

### Claims from a clean checkout

`npm ci` completed with the lockfile. Every exact command from `.factory/claims.json` was run separately against the Playwright demo entry point; all 13 passed:

1. `npm run test:e2e -- --grep @claim:mime-audit`
2. `npm run test:e2e -- --grep @claim:local-only`
3. `npm run test:e2e -- --grep @claim:offline-reload`
4. `npm run test:e2e -- --grep @claim:receipt-exports`
5. `npm run test:e2e -- --grep @claim:report-persistence`
6. `npm run test:e2e -- --grep @claim:free-use`
7. `npm run test:e2e -- --grep @claim:demo-no-setup`
8. `npm run test:e2e -- --grep @claim:missing-attachment-detection`
9. `npm run test:e2e -- --grep @claim:folder-inventory`
10. `npm run test:e2e -- --grep @claim:no-telemetry`
11. `npm run test:e2e -- --grep @claim:demo-reset`
12. `npm run test:e2e -- --grep @claim:clear-report`
13. `npm run test:e2e -- --grep @claim:scope-limits`

The complete `npm run test:e2e` suite also passed: 21/21 (`test-results/.last-run.json` reports `status: passed`). This independently exercises normal EML/MBOX parsing, MIME/RFC 2231 names and UTF-8 headers, zero-byte/nested attachments, the folder ledger, all three receipt formats, persistence without stored bodies, bad-input recovery, CSV formula neutralisation, demo reset, and clear-report confirmation.

### Cold first read

Cold desktop live-page text answers the three required questions in plain words:

- What: “Check an email export before access ends.”
- For whom: “For people leaving an account or device who need a clear record of saved messages and attachments.”
- First action: visible “Try it with sample data,” immediately followed by “The sample opens a complete audit. No setup is needed.”

The action opens the isolated completed demo; its banner says “Demo — sample data, nothing is saved,” with Reset demo and Start for real actions. The first-screen/demo requirement passes.

## Local candidate gates

- `npm test`: 21/21 Vitest tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed and created `dist/`.
- Production entry bundle: 23,854 bytes raw / 8,990 bytes gzip; CSS: 9,602 bytes raw / 2,960 bytes gzip. Both are within the static-product budgets.

## Live product QA

- Deployment identity: SHA-256 comparison matched all 19 publicly served files in candidate `dist/` against the live origin (HTML, hashed JS/CSS, PWA files, legal pages, artwork, icons, sitemap/robots, and 404). `staticwebapp.config.json` is correctly not publicly served; its live routing and headers were separately observed.
- Normal flow: the one-click sample displayed four messages, two named/hashed attachments, zero missing references, ledgers, and enabled HTML/CSV/JSON browser downloads.
- Invalid/recovery flow: a nonsensical EML produced the specific alert “The file has no complete email header block.” Uploading a valid EML immediately afterward produced its report and JSON receipt.
- Privacy/persistence: in a real-audit flow, a unique message-body marker was absent from IndexedDB report data. The browser request log contained only same-origin `GET`s for static application resources; no analytics, advertising, account, payment, AI, provider, or upload request was observed.
- Demo isolation: demo storage did not create the real `archive-audit` IndexedDB database. Demo reset restored the bundled four-message audit in the claimed test.
- PWA: on the live demo, service worker control was established with `archive-audit-v4`; `registration.update()` completed with no pending worker. With network disabled, the controlled demo reloaded and retained “Archive inventory complete.” The implemented update path listens for `updatefound`, presents “An offline update is ready,” and uses the waiting worker’s `skip-waiting` message before reload.
- Responsive/keyboard/motion: 390×844 demo had no horizontal overflow. After the short intended scroll, results were in the viewport. Tab reached visible controls with a designed 3px ochre focus outline; keyboard-only actions and Shift+Tab worked. `prefers-reduced-motion: reduce` reduced the results transition to `0.00001s`.
- Accessibility: `/opt/fleet/lib/verify-url.sh` passed on root and demo (title, `lang=en`, one h1, main landmark, image alt text, no console/page errors). Fresh Playwright axe scans of root, demo, Privacy, Terms, and 404 reported zero serious/critical violations (zero violations overall). Root/demo/Privacy/Terms had no console/page errors. The designed 404 returns HTTP 404; its browser records the expected failed-resource console line for that intentional navigation only.
- Headers/caching: HTTPS root returns CSP with `default-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrer policy, and a restrictive permissions policy. Hashed JS/CSS use `public, max-age=31536000, immutable`; HTML and service worker are revalidated (`no-cache` for root/SW). `/demo`, Privacy, Terms, offline page, and the intended 404 route returned expected status/content.
- Lighthouse: a fresh cold root run scored Performance 98, Accessibility 100, Best Practices 100, SEO 100; LCP 1,053 ms, CLS 0, TBT 165 ms.

## Defects by severity

None found: P0 0, P1 0, P2 0, P3 0.

## Notes

The repository has prior verifier reports, so this report uses the requested `verification-8.md` name. The researched brief used here is the work-order brief; no `.factory/brief.json` is committed in this candidate.
