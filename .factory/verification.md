# Independent product verification

## Verdict: FAIL — do not release

- Candidate: `9aa6482d605ec566bd2f95d6432fb7bdd31c1e50`
- Branch: `main`
- Live URL: <https://message-archive-audit.sociobot.in>
- Verified: 2026-08-28 UTC
- Work order: `message-archive-audit-verify-1`
- Initial worktree: clean; `HEAD` exactly matched the requested candidate

This candidate fails mandatory release gates. `.factory/claims.json` is absent, the first screen does not satisfy the plain-words/demo contract, the PWA cannot reload offline, common MIME input is misclassified, invalid files are certified as verified, portable receipts omit messages, and the advertised purchase link returns 404.

No product code was changed during verification.

## Mandatory gates run first

### Claims: FAIL

The clean clone has no `.factory/claims.json`. Therefore there were no listed claim commands to run. The claims contract explicitly makes a missing file release-blocking.

All product-facing claims are consequently unlisted and untested as claims, including:

- “Nothing is uploaded.”
- “It runs in your browser, even after installation.”
- MBOX/EML message counting and attachment verification.
- SHA-256 hashing and missing-reference identification.
- HTML, CSV, and JSON receipt export.
- IndexedDB report persistence and offline-first behavior in the README.

The existing E2E test has no `@claim:<id>` tag. It does not intercept network traffic, validate export contents, or reload after going offline.

### Cold first-read: FAIL

Cold reads were captured at 1440×900 and 390×844 before interaction.

- What it does: the paragraph eventually explains that it opens MBOX/EML, counts messages, checks attachments, and creates a receipt.
- For whom: the first screen never names the person facing imminent account/device loss.
- What to click first: there is no single clear primary first action. “Audit selected files” and “Load a safe example” compete; on 390 px neither action appears in the initial viewport.
- The headline, “Keep the evidence. Check the gaps.”, is metaphorical rather than the job in plain words.
- There is no required “Try it with sample data” entry point. `/demo` and `?demo=1` render the ordinary app.
- Clicking “Load a safe example” is one click, but it is not a demo sandbox: there is no persistent “Demo — sample data, nothing is saved” banner, “Reset demo,” or “Start for real.” The sample writes to the production `archive-audit` IndexedDB database and restores after reload.
- `.factory/demo.md` and `.factory/copy-audit.md` are absent.

## Clean-clone checks

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | 56 packages installed; audit reported 0 vulnerabilities |
| `npm test` | PASS | 2 parser tests passed |
| Type check | PASS | `tsc -b` ran as part of the production build |
| `npm run build` | PASS | Vite wrote `dist/`; JS 15.52 KB raw / 6.30 KB gzip, CSS 8.85 KB raw / 2.81 KB gzip |
| `npm run test:e2e` | PASS, inadequate assertion | 1 smoke test passed; it checks the already-rendered heading after setting offline and never performs an offline reload |
| Lint | Not available | No lint script/configuration exists |
| `/opt/fleet/lib/verify-url.sh` | FAIL | Exit 1; service-worker registration page error; title/lang/main/alt checks otherwise present |

## Deployment identity

The deployment is live and matches the candidate; this is not a deployment-only outage. Locally built/public files and live responses were byte-for-byte identical:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `d96777cef86320473c04d1137557b74d71ba8aeef9432eb1faf0ad280e1cd4ce` |
| `assets/index-BepGAi3j.js` | `7d3f2a5130dd9a9ce4e1dc49ec6f6b31a4670ea257a7278faa3a316a31a7a4a3` |
| `assets/index-7pltDZzz.css` | `84c29cbbc71772e85f7d2d2b1b8f38ce063489894b6d565d8492259581954d2f` |
| `sw.js` | `7214546eed62478850de6901666f1608243bcf8d5283beba7cdf1f60155e1e7c` |
| `manifest.webmanifest` | `1023120871757b1cb19dac8bda1b30d67e465c2829794e311e1e24f7acc6cd4b` |
| `hero-notebook.webp` | `cb97fbdf1cfcbcb917db3b4c7721a2f18829c8fc181ef6ea4fda481ea7ed9ccc` |

The page does not expose a build ID, but the complete app-shell hash match establishes candidate identity.

## End-to-end archive behavior

Tests used fresh Playwright browser contexts against the live deployment.

| Case | Result | Evidence |
| --- | --- | --- |
| Included base64 sample | PASS | 1 message, 1 attachment, 13 decoded bytes, SHA-256 `f8976760708ac1d60ab4b2dd1fa3c02d3bbf9693846f1db27aa77b46f0bb4276`; CSV/HTML downloaded |
| 20 controlled EML references | PASS for exact-name matching | 20 messages; 10 supplied folder matches and 10 missing references were classified correctly |
| Two-message MBOX | PASS in UI | Both messages appeared in the on-screen ledger |
| Empty `.eml` | FAIL | Labeled `VERIFIED` / “Archive inventory complete” as one message with unknown sender/date/subject |
| Nonsense text named `.eml` | FAIL | Also labeled `VERIFIED` / complete instead of rejecting invalid mail |
| Standard 7-bit MIME attachment | FAIL | Embedded bytes were reported as “No readable bytes” and “Missing from folder” |
| Separate attachment-folder match | Partial | UI says “Found separately,” but HTML/CSV provide no hash for the folder file; only JSON retains it |
| Message with no attachment | FAIL export | UI inventories it, but CSV contains only its header and HTML omits the message subject entirely |
| Empty selection / wrong extension | PASS | Clear error asks for `.eml` or `.mbox`; sample action recovers |
| Malformed percent-encoded filename | Partial | Honest `URI malformed` read error; the user can recover with the sample |
| Clear report | PASS | Confirmation is specific and clears the stored report |

The invalid-input “VERIFIED” result and false missing-reference result are incompatible with an archive audit whose job is trustworthy evidence of completeness. The parser handles only base64 attachment bodies even though the UI claims standard MIME EML support.

CSV fields beginning with `=`, `+`, `-`, or `@` are exported unchanged. A test subject `=2+2` and sender `=cmd|qa` appeared verbatim in the CSV, creating spreadsheet formula-injection risk when a receipt is opened in common spreadsheet software.

## PWA and offline behavior: FAIL

- `node --check public/sw.js` fails with `SyntaxError: missing ) after argument list`.
- Chromium reports: `Failed to register a ServiceWorker ... ServiceWorker script evaluation failed`.
- After a complete online visit, the page had 0 service-worker registrations and no controller.
- With the context then offline, `page.reload()` failed with `net::ERR_INTERNET_DISCONNECTED` and an empty document.
- Service-worker update behavior cannot work or be tested while registration fails. Even as written, the worker uses a permanent `archive-audit-v1` name and has no old-cache cleanup.
- Chromium parses the manifest without errors, but installability/offline behavior is blocked by the worker.

## Accessibility, keyboard, and responsive behavior

- Axe-core 4.10.3: 0 serious/critical findings on the empty light desktop page, empty dark mobile page, Privacy, and Terms.
- Axe-core after loading the sample: **1 serious finding**, `scrollable-region-focusable`; `.table-wrap` cannot be reached/scrolled by keyboard.
- Keyboard smoke: skip link moves focus to `<main>`; the sample loads with Enter; export buttons and native confirmation are keyboard operable.
- Visible focus: 3 px ochre outline observed; skip link becomes visible on focus.
- Reduced motion: `prefers-reduced-motion: reduce` is detected and animations collapse to 0.01 ms.
- At 390 px the document is 42 px wider than its viewport. File-control/drop-zone content visibly spills off the right edge.
- Undersized mobile targets include the 40.2 px-wide theme button, 21.7 px-high Privacy link, 26 px-high home link, and 15 px-high footer Terms link. Large wrapping labels mitigate file-input touch size, but the listed links/buttons remain below 44×44 px.
- Home has `lang`, a descriptive title, one H1, `<main>`, alt text, and a skip link. Privacy and Terms omit the standard header/nav/footer/skip-link shell.

## Privacy and outbound traffic

- During the complete sample flow, observed requests were same-origin only: document, hashed JS/CSS, and the product image. No analytics, third-party font, or archive upload was observed.
- Source inspection confirms selected message bytes are read in the browser; the stored report contains metadata/hashes, not source bodies.
- The sample nevertheless persists into the same real IndexedDB namespace, violating demo isolation.
- The optional license path sends the token only to the documented Sociobot verify endpoint. No sign-in exists, so Entra authority testing is not applicable.

## Billing endpoint and rate limiting

- `GET https://api.sociobot.in/api/v1/products/message-archive-audit/checkout` returns **404** with `{"error":"enabled factory product","status":404}`. The visible “View one-time upgrade” link is dead.
- The page does not state an exact price; it says the price appears at checkout.
- Source inspection shows no paid-feature activation: a valid verdict only changes status text. There is no signed index-sheet generation or retained history beyond the same latest report already saved for free.
- Rate limiting PASS: a rapid 50-request burst to the invalid-license verify endpoint produced 29×200 and 21×429. The first observed 429 was client request #29 and every sampled 429 had `Retry-After: 4` with `Too Many Requests! Wait for 4s`.

## Headers, routing, metadata, and caching

Present on the live app: HTTPS, HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`.

Missing or incorrect:

- No Content-Security-Policy, frame restriction (`frame-ancestors`/X-Frame-Options), or Permissions-Policy.
- Hashed JS/CSS and the image use `cache-control: public, must-revalidate, max-age=30`, not long-lived immutable caching.
- No canonical URL, Open Graph/Twitter metadata, favicon link, or apple-touch icon link in the document.
- `robots.txt`, `sitemap.xml`, and `staticwebapp.config.json` return 404.
- `/404` returns the normal app with status 200; there is no designed real 404 route.
- `/demo` returns the normal page with the normal title rather than a demo route.
- The footer has no version/build identifier.
- The checkout link is the only crawled dead product link; home, Privacy, and Terms return 200.

## Performance and bundle budgets

Lighthouse 12.8.2, live mobile throttling:

| Category/metric | Result |
| --- | --- |
| Performance | 99 |
| Accessibility | 100 before loading results |
| Best practices | 96 (console error) |
| SEO | 100 for Lighthouse's tested subset |
| FCP | 0.9 s |
| LCP | 1.1 s |
| TBT | 120 ms |
| CLS | 0 |

Static budgets pass: initial JS 15.52 KB raw / 6.30 KB gzip, CSS 8.85 KB raw / 2.81 KB gzip, no font files, and hero WebP 48.97 KB. Lab TBT is below the 200 ms interaction proxy; field INP is not available. Caching policy fails despite the size/performance pass.

## Defects by severity

### Release blockers

1. Missing `.factory/claims.json`; every claim is unlisted and no claim test exists.
2. First screen does not plainly identify the user and first action; required demo sandbox and demo documentation are absent.
3. Broken service-worker syntax causes a page error and makes offline reload/update impossible despite explicit offline claims.
4. Core audit correctness is unsafe: empty/nonsense files are stamped `VERIFIED`, and standard 7-bit MIME attachments become false missing-reference findings.
5. HTML/CSV receipts omit messages without attachments, so portable receipts do not inventory the archive.
6. Sample-results ledger has an axe serious keyboard-accessibility violation.
7. Advertised paid checkout returns 404, exact price is absent, and the described paid features are not implemented.

### High

1. The sample writes into and restores from the real IndexedDB namespace instead of an isolated disposable demo namespace.
2. Separate attachment-folder hashes are absent from HTML/CSV receipts, weakening local verifiability.
3. CSV export does not neutralize spreadsheet formulas from attacker-controlled mail headers/filenames.

### Medium

1. 390 px layout has 42 px horizontal overflow and several touch targets below 44×44 px.
2. Required site metadata/routes and the real 404 are missing.
3. Security policy headers are incomplete.
4. Hashed assets are cached for only 30 seconds rather than immutably.
5. Privacy and Terms do not use the standard site shell.

## Release recommendation

Do not promote this candidate. Repair the release blockers, add a complete claim registry with tagged observable tests through an isolated `/demo`, and rerun independent verification from a new candidate commit.
