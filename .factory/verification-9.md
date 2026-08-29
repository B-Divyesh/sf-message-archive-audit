# Independent verification 9 — PASS

## Scope and decision

- Candidate commit: `d874dd907b4b0823ebe8ad130eb823a1e3c86fc8`
- Live URL: <https://message-archive-audit.sociobot.in>
- Verified: 2026-08-29 UTC
- Product class: static, local-first PWA

**PASS.** No release-blocking defect was found. The live deployment matches the candidate build and completes the researched job: it inspects selected EML/MBOX exports locally, inventories and hashes attachments, identifies missing or ambiguous folder matches, and downloads portable HTML, CSV, and JSON receipts.

## Mandatory first checks

### Claims from the clean candidate checkout

The checkout was clean and exactly at the candidate SHA before testing. `npm ci` completed with 0 vulnerabilities. `.factory/claims.json` exists. Every listed command was run separately; all 13 passed:

1. `@claim:mime-audit`
2. `@claim:local-only`
3. `@claim:offline-reload`
4. `@claim:receipt-exports`
5. `@claim:report-persistence`
6. `@claim:free-use`
7. `@claim:demo-no-setup`
8. `@claim:missing-attachment-detection`
9. `@claim:folder-inventory`
10. `@claim:no-telemetry`
11. `@claim:demo-reset`
12. `@claim:clear-report`
13. `@claim:scope-limits`

Landing, legal-page, result, and README copy were cross-checked against the claim inventory. No unlisted product claim was found.

### Cold first-read gate

The live first screen passes in plain words:

- What: “Check an email export before access ends.”
- For whom: “For people leaving an account or device who need a clear record of saved messages and attachments.”
- What to click: “Try it with sample data,” followed by “The sample opens a complete audit. No setup is needed.”

The primary action is visible without scrolling on desktop and 390×844 mobile. One click opens a completed four-message audit. The persistent banner says “Demo — sample data, nothing is saved” and provides “Reset demo” and “Start for real.” The completed receipt intersects the first post-click viewport and creates no production IndexedDB database.

Evidence: [desktop cold page](qa-evidence/live-cold-desktop.png), [mobile cold page](qa-evidence/live-cold-mobile.png), [desktop demo](qa-evidence/live-demo-desktop.png), and [mobile demo](qa-evidence/live-demo-mobile.png).

## Clean local gates

- `npm test`: 21/21 Vitest tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; `dist/` was produced.
- `npm run test:e2e`: 21/21 Playwright tests passed.
- Output: JS 23,871 bytes raw / 9.00 kB gzip; CSS 9,565 bytes raw / 2.95 kB gzip; complete `dist/` 141,199 bytes.

The browser suite covers normal EML and MBOX input, MIME/base64/7-bit parsing, RFC 2231 filenames, UTF-8 headers, malformed and empty inputs, zero-byte attachments, duplicate-name ambiguity, orphan folder files, spreadsheet-formula neutralisation, all receipt formats, persistence boundaries, clear/reset recovery, keyboard navigation, public-route metadata, and Axe.

## Fresh live product QA

### End-to-end job and boundary cases

- Sample: four messages, two named/hashed attachments, zero missing references; HTML/CSV/JSON controls were usable.
- Representative success-measure fixture: 20 EML exports plus 10 matching folder files produced 20 messages, 10 `found`, 10 `missing`, 0 `ambiguous`, 10 unique folder hashes, a 31-row CSV, and complete HTML/JSON inventories.
- Invalid input: empty EML and non-email text produced specific `role=alert` explanations. A valid EML immediately afterward completed successfully.
- MIME boundaries: an RFC 2231 continuation decoded `quarterly report.pdf`; UTF-8 Q headers decoded “José Archive” and “Café receipt”; embedded bytes matched the expected SHA-256.
- Matching boundaries: two references to one `invoice.pdf` produced one ambiguous and one missing reference rather than reusing the file. An unreferenced nested file remained in all receipts.
- Zero-byte embedded attachment: displayed 0 bytes and the correct empty-content SHA-256.
- Persistence: the saved metadata survived reload, but a unique message-body marker was absent from IndexedDB. Cancel preserved the report; confirmed clear removed it across reload.

Machine-readable details: [live-independent-results.json](qa-evidence/live-independent-results.json).

### Privacy and network

The complete live flow recorded 48 browser requests. Every request was a same-origin static `GET` to `message-archive-audit.sociobot.in`; there were no upload, analytics, advertising, account, payment, AI, provider, CDN, or font requests. Receipt downloads used browser blob URLs. Demo state remained in memory and did not create or mutate the real audit database or preference storage.

The CSP limits resources and connections to self, blocks objects and framing, and permits only local/data images. Live responses also provide HSTS, `nosniff`, strict-origin referrer policy, a restrictive permissions policy, and `X-Frame-Options: DENY`.

This product exposes no application/backend endpoints, product-unlock endpoint, sign-in, billing, or AI gateway. Request-allowance/429 and Microsoft Entra authority checks are therefore not applicable.

### Accessibility, mobile, keyboard, and motion

- Fresh Axe scans of root, demo, Privacy, Terms, and the real 404 found no serious/critical violations; the local suite requires zero violations and passed.
- Root and demo each have `lang=en`, a descriptive title, one h1, a main landmark, image alternatives, and no unlabeled buttons.
- 390×844 dark/reduced-motion testing found no page overflow or sub-44 px interactive target. The required first action remained in the first viewport.
- Keyboard-only checks reached the skip link first, moved focus to main, activated the demo, and operated the horizontally scrollable ledger. Focus uses a visible 3 px ochre outline.
- Reduced-motion mode reported no material animation (`0.01 ms`). Light and dark Axe scans found no contrast issue.
- At 200% browser scaling, page content remained available; the intentionally two-dimensional message ledger retained its own keyboard-scrollable region.

The verification helper reported no console/page errors on root or demo. The only observed console line was the browser’s expected failed-resource message while intentionally loading the HTTP 404 route.

### PWA, offline, and updates

- The manifest supplies name, short name, versioned start URL, standalone display, matching theme/background colors, 192/512 icons, and a maskable 512 icon.
- A fresh controlled demo reload succeeded with the browser offline, returned status 200, and restored “Archive inventory complete” from cache `archive-audit-v5`.
- A candidate-build update simulation changed the worker from `v5` to `v6`. The in-app update notice appeared; “Refresh now” activated the new worker, deleted the old cache, and preserved the saved report with no errors.

Evidence: [pwa-update-results.json](qa-evidence/pwa-update-results.json).

### Deployment identity, routes, headers, and caching

- SHA-256 comparison matched all 19 publicly served candidate `dist/` files byte-for-byte against the live origin. `staticwebapp.config.json` is deployment configuration and correctly is not served as a product file.
- Root, demo, Privacy, Terms, manifest, offline fallback, icons, art, service worker, and designed 404 returned the expected status/content. The real unknown route returned HTTP 404.
- A fresh internal-link crawl found no dead link: [link-crawl-results.json](qa-evidence/link-crawl-results.json).
- Root HTML and `sw.js` use `Cache-Control: no-cache`; hashed JS/CSS and versioned art/icons use `public, max-age=31536000, immutable`.
- `robots.txt` allows crawling and names the sitemap; the sitemap lists root, demo, Privacy, and Terms.

### Performance

Initial transfer was 64,195 bytes: 9,078 bytes JS, 3,081 bytes CSS, and 49,057 bytes image, with no font or third-party bytes. This is below the static/PWA budgets.

Three fresh Lighthouse mobile runs scored Performance 88, 99, and 99; Accessibility, Best Practices, and SEO were 100 in every run. The sequential repeat median is 99 Performance, with LCP about 1.06 s, TBT 125–128 ms, and CLS 0. The first run’s 466 ms TBT was not reproduced. Reports are in `qa-evidence/lighthouse-live*.json`.

## Defects by severity

- P0: 0
- P1: 0
- P2: 0
- P3: 0

## Final result

**PASS — candidate `d874dd907b4b0823ebe8ad130eb823a1e3c86fc8` is accepted at the tested live URL.**

The work-order brief was used as the acceptance source because this candidate does not contain `.factory/brief.json`. No AI-assisted step is a missed requirement: deterministic local MIME parsing, hashing, and portable receipt export best fit the urgent privacy-sensitive job, and proprietary/encrypted store extraction remains an explicit non-goal.
