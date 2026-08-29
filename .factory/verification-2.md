# Independent verification — PASS

**Candidate:** `8df79782b25505f318d26b1b5f5f3374722fbf9d`  
**Live URL:** https://message-archive-audit.sociobot.in  
**Verified:** 2026-08-29 UTC from a clean checkout  
**Verdict:** **PASS — suitable for release.**

This supersedes the earlier failing report in `verification.md`. The earlier report covers the pre-repair candidate; this report verifies the repaired candidate named above.

## Required first checks

`.factory/claims.json` is present and has six claims. I ran every declared command separately, after `npm ci`, using the product's Playwright demo entry point:

| Claim | Exact command | Result |
| --- | --- | --- |
| MIME audit | `npm run test:e2e -- --grep @claim:mime-audit` | PASS — EML/MBOX, base64 and 7-bit attachments counted and hashed |
| Local-only | `npm run test:e2e -- --grep @claim:local-only` | PASS — demo requests same-origin only; no real DB |
| Offline reload | `npm run test:e2e -- --grep @claim:offline-reload` | PASS |
| Receipt exports | `npm run test:e2e -- --grep @claim:receipt-exports` | PASS — HTML, CSV, JSON, including messages without attachments |
| Report persistence | `npm run test:e2e -- --grep @claim:report-persistence` | PASS — metadata restores without source body |
| Free use | `npm run test:e2e -- --grep @claim:free-use` | PASS — no account/purchase; all exports usable |

Cold, cacheless live first read passed. The screen says “Check an email export before access ends,” identifies people leaving an account or device as the audience, and presents **Try it with sample data** as the visible first action. Its adjacent text explains that the completed sample opens without setup. The first screen also gives the three plain privacy/offline/price facts.

## Local quality gates

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 60 packages; audit reported 0 vulnerabilities |
| `npm test` | PASS — 13 tests in 3 files |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — produced `dist/` |
| `npm run test:e2e` | PASS — all 11 browser tests (`test-results/.last-run.json` records `passed`) |

The exact build emitted 18.53 KB raw / 7.44 KB gzip JS and 9.46 KB raw / 2.91 KB gzip CSS, comfortably under the static-product budgets. The hero is 48.97 KB WebP.

## Live deployment and product behavior

The live root HTML, app JS, and service worker are byte-identical to the local production artifact:

| File | SHA-256 |
| --- | --- |
| `index.html` | `ae6fe0741c4b03425ff19f871be0b96e557981c9c0a63b0affe354eb4900ac97` |
| `assets/index-BhhrRVk8.js` | `e04f824fc12f6f21f5fbd22495342bd58793da8f468a2d40c7ad6a344adb40e9` |
| `sw.js` | `66ed048deffb2bd091f9ccda5bcb542d6dd0407d873ad7dd096dcf75cf28c030` |

Fresh live-browser checks passed:

- `/demo` loaded the persistent “Demo — sample data, nothing is saved” banner with Reset demo and Start for real. It produced 4 messages, 2 named attachments, 2 hashes, 0 missing references. `indexedDB.databases()` was empty in that demo context.
- Empty EML produced the announced error “The message file is empty.” Replacing it with a valid EML in the same session recovered to a completed audit. All three receipt formats downloaded with the expected filenames.
- Twenty controlled standard MIME EMLs with named external references and ten matching supplied files produced exactly **20 messages, 20 named attachments, 10 found, 10 missing, and 20 ledger rows**. This is the brief's attachment-reference precision test.
- Real-report storage was checked live: a private body marker was absent from IndexedDB, while the report metadata restored on reload.
- An online visit obtained SW control (`archive-audit-v2`), then a completed `/demo` reloaded while the browser was offline. A synthetic same-origin next worker in an isolated context triggered the visible update toast; Refresh now activated the waiting worker and cleared the toast.

This is a static PWA only: there are no server-side product/API/unlock endpoints, authentication flows, or rate-limited request allowances to test. The request log during the full demo flow contained only this origin (`/demo`, local JS/CSS, and the local hero); there were no analytics, provider, account, or payment requests.

## Accessibility, responsive behavior, headers, and privacy

- Axe 4.10.2: **0 serious/critical** findings on live `/demo`, `/privacy/`, `/terms/`, and the designed `/404` page.
- Each page has `lang=en`, one h1, and a main landmark. The primary live pages had no page errors or console errors. The browser's expected network message for the explicit HTTP-404 document was not treated as an application error.
- Desktop 1440px and mobile 390px had no horizontal overflow or visible controls below 44px. On the real landing page, Tab focused the visible Skip to main content link; the regular focus outline is a solid 3px ochre ring. Reduced-motion media mode changed scroll behavior to `auto` and collapsed animation/transition durations to 0.01ms.
- HTTPS responses have CSP with `default-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`, plus `nosniff`, `DENY`, strict referrer policy, and restrictive Permissions Policy. HTML and `sw.js` are no-cache; hashed JS is `public, max-age=31536000, immutable`.
- Live GET `/demo`, `/privacy/`, and `/terms/` are 200. GET `/404` is a designed 404 with a route back home.

The Lighthouse CLI was attempted twice against the live demo but could not produce a report in this disposable runner (first Chromium tab crash, then Lighthouse 13 `NO_LCP` trace error). This is an environment/tooling limitation, not a product error: the independent Playwright accessibility, responsive, request, console, offline, headers, and bundle-budget checks above passed. The previous handoff's Lighthouse 12.8 run records 100/100/100/100; I do not rely on that result for this independent verdict.

## Defects

| Severity | Findings |
| --- | --- |
| Critical | None |
| Major | None |
| Minor | None |

## Scope limits verified

The product correctly limits itself to standard MIME EML and text MBOX. It does not claim to decrypt mail, recover unavailable messages, access providers, or read proprietary stores. No sign-in is present, so the Sociobot Entra tenant requirement is not applicable.
