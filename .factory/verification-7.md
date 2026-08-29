# Independent product verification 7 — PASS

- **Candidate:** `c820f4395876d8f89f7eacaacf866e1511392042`
- **Live URL:** <https://message-archive-audit.sociobot.in>
- **Work order:** `message-archive-audit-verify-7`
- **Verified:** 2026-08-29 UTC

## Verdict

**PASS — this candidate satisfies the supplied acceptance contract and is ready
to release.** The earlier deployment/provenance concern is absent: the requested
candidate is on `origin/main`, and the live application's six core artifacts are
byte-identical to the candidate's fresh production build. The four defects from
verification 6 are repaired in the deployed product and covered by local
regressions plus independent live counterexamples.

No product code was changed during this verification. The repository does not
contain `.factory/brief.json`; the researched brief supplied in the work order,
`AGENTS.md`, and `.factory/design.md` were used as the acceptance sources.

## Mandatory first checks

### Claims

`.factory/claims.json` exists with seven entries. Before installation, each exact
command reported `ERR_MODULE_NOT_FOUND` for the clean clone's not-yet-installed
`@playwright/test`. After the required `npm ci` installed the locked dependencies,
every exact command ran independently against the demo entry point and passed.

| Claim | Exact command | Result |
| --- | --- | --- |
| MIME audit | `npm run test:e2e -- --grep @claim:mime-audit` | PASS — 1 test |
| Local only | `npm run test:e2e -- --grep @claim:local-only` | PASS — 1 test |
| Offline reload | `npm run test:e2e -- --grep @claim:offline-reload` | PASS — 1 test |
| Receipt exports | `npm run test:e2e -- --grep @claim:receipt-exports` | PASS — 1 test |
| Report persistence | `npm run test:e2e -- --grep @claim:report-persistence` | PASS — 1 test |
| Free use | `npm run test:e2e -- --grep @claim:free-use` | PASS — 1 test |
| Demo without setup | `npm run test:e2e -- --grep @claim:demo-no-setup` | PASS — 1 test |

The installed-run outputs and exit codes are retained under
[`verification-evidence-7/claims`](verification-evidence-7/claims).

Landing, result, legal, and README claims map to these seven entries. No
unlisted positive product claim was found. The independent request log also
tests the privacy wording through demo, real upload, export, persistence, error,
and recovery flows.

### Cold first-read

The live first screen passes at desktop and 390 px:

- what it does: **“Check an email export before access ends”**;
- for whom: **“For people leaving an account or device…”**;
- what to click: **“Try it with sample data”**;
- what happens: **“The sample opens a complete audit. No setup is needed.”**

The mobile primary action was fully visible at y=307.7–352.5 in the first
844 px viewport. One click opened a completed four-message audit in the current
viewport with the persistent “Demo — sample data, nothing is saved” banner,
“Reset demo,” and “Start for real.” The demo created no `archive-audit`
IndexedDB. Evidence:
[`live-cold-desktop.png`](verification-evidence-7/live-cold-desktop.png),
[`live-cold-mobile.png`](verification-evidence-7/live-cold-mobile.png),
[`live-demo-desktop.png`](verification-evidence-7/live-demo-desktop.png), and
[`live-demo-mobile.png`](verification-evidence-7/live-demo-mobile.png).

## Clean local gates

| Check | Result |
| --- | --- |
| Initial tree / candidate | PASS — exact requested SHA; clean before QA artifacts |
| `npm ci` | PASS — 60 packages installed; 0 vulnerabilities |
| `npm test` | PASS — 20 tests in 3 files |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — configured TypeScript gate |
| `npm run build` | PASS — exact production build produced `dist/` |
| `node --check public/sw.js` | PASS |
| `npm run test:e2e` | PASS — 15 Playwright tests |
| Factory `verify-url.sh` | PASS — 851 ms; title/lang/h1/main/alt/labels; no errors |

Logs are under [`verification-evidence-7/logs`](verification-evidence-7/logs)
and [`verification-evidence-7/verify-url`](verification-evidence-7/verify-url).
This is a static PWA, not a library or CLI, so consumer package installation is
not applicable.

## Independent end-to-end evidence

All cases below were exercised through the deployed UI in fresh Chromium
contexts. The verifier harness and complete observations are
[`live-independent-qa.mjs`](verification-evidence-7/live-independent-qa.mjs)
and
[`live-independent-results.json`](verification-evidence-7/live-independent-results.json).

| Case | Result |
| --- | --- |
| One-click sample | PASS — 4 messages, 2 named/hashed attachments, 0 missing |
| Empty EML | PASS — rejected with a specific empty-file error |
| Nonsense EML | PASS — rejected with a header-block error |
| Recovery after invalid input | PASS — valid EML audited without reload |
| 20 controlled exports | PASS — 20 messages; exactly 10 supplied matches and 10 missing; 0 ambiguous |
| HTML receipt | PASS — first/last messages and selected-folder inventory retained |
| CSV receipt | PASS — header + 30 inventory rows; found and missing states retained |
| JSON receipt | PASS — all 20 messages, 10 folder files, statuses, and hashes retained |
| RFC 2231 continuation | PASS — `quarterly report.pdf`, 5 bytes, exact SHA-256 |
| UTF-8 Q headers | PASS — `Café receipt` and `José Archive` preserved |
| Duplicate reference cardinality | PASS — one file produced one ambiguous and one missing reference, never two verified matches |
| Unreferenced folder file | PASS — full relative path and unmatched status present in UI, HTML, CSV, and JSON |
| Zero-byte attachment | PASS — 0 bytes and the empty SHA-256 retained |
| Real report persistence | PASS — survived reload; 280-byte metadata record contained no source body |
| Clear report cancel/confirm | PASS — cancel retained it; confirm removed it across reload |

The 20-export result meets the brief's supplied-case precision target for the
controlled fixture: there were no false matches or missed expected matches.
The prior verification-6 counterexamples now all pass live. Screenshots:
[`live-rfc2231-utf8.png`](verification-evidence-7/live-rfc2231-utf8.png) and
[`live-duplicate-orphan.png`](verification-evidence-7/live-duplicate-orphan.png).

The missed-leverage review found no appropriate AI addition. Sending private
archive content to a model would conflict with the local-only job; accurate
standards-based import and portable export are the useful capabilities, and
both are present.

## Privacy, network, headers, routes, and identity

Playwright recorded 48 requests through the complete demo and real audit flow.
Every request was an HTTPS `GET` to
`message-archive-audit.sociobot.in`; no message, attachment, hash, analytics,
font, identity, billing, AI, advertising, or third-party request occurred.
Browser response records show the root's `no-cache`, same-origin CSP,
`frame-ancestors 'none'`, HSTS, strict referrer policy, and
`X-Content-Type-Options: nosniff`. Curl independently confirmed these plus
`X-Frame-Options: DENY` and the restrictive Permissions Policy.

`/`, `/demo`, `/privacy/`, `/terms/`, `robots.txt`, `sitemap.xml`, and the
manifest returned 200. An unknown route returned the designed page with HTTP
404. All discovered non-fragment links returned 200; see
[`link-crawl-results.json`](verification-evidence-7/link-crawl-results.json).
Successful pages produced no console or page errors. Chromium emitted only its
expected failed-resource message for the deliberate HTTP 404 navigation.

Caching is appropriate: root and `sw.js` use `no-cache`; hashed JS/CSS use
one-year `immutable`; routes and unhashed support files revalidate after 30
seconds. Captured responses are under
[`verification-evidence-7/headers`](verification-evidence-7/headers).

The live deployment exactly matches local `dist/`:

| Artifact | Local and live SHA-256 |
| --- | --- |
| `index.html` | `99c5d943de54712d00f1238006b44fc487675672ca696514bcb3122f972c6501` |
| `assets/index-BdmCWYZZ.js` | `c8ed31b97d51f25da3bafe47bb7a36e64620ca46346950de68dfc15844245103` |
| `assets/index-DhpJzuom.css` | `f20e3774c890f2779493150ac62cc3ac5f1e1d2929feb1534d58fed71480d9c9` |
| `sw.js` | `98872fe7e5c0ce89fc652cba77cece361157dc460788ae6ddfb8895faaeaff87` |
| `manifest.webmanifest` | `5f6103d3d3e83eaa5d2a23f954ba3f1c6097207a59a011f171f7564b046126f8` |
| `hero-notebook.webp` | `cb97fbdf1cfcbcb917db3b4c7721a2f18829c8fc181ef6ea4fda481ea7ed9ccc` |

There is no backend, server-side API, authentication, product-unlock request,
payment flow, or external endpoint. Rate-limit/429, persistence concurrency,
health/build identity, billing, and Microsoft Entra checks are not applicable.

## PWA, accessibility, responsive behavior, and performance

- Live `/demo` was controlled by `archive-audit-v4`; offline reload returned
  200 and restored the completed audit.
- A fresh isolated production-build update from v4 to v5 displayed “An offline
  update is ready,” activated through “Refresh now,” removed v4, and preserved
  a real saved report without errors. Evidence:
  [`pwa-update-results.json`](verification-evidence-7/pwa-update-results.json).
- The manifest declares standalone display, a versioned start URL, local
  192/512 icons, and a maskable 512 icon.
- Axe 4.10.2 found zero serious or critical violations on root and demo in
  desktop light mode and on demo, Privacy, Terms, and the real 404 at 390 px in
  dark/reduced-motion mode.
- At 390×844, document width was exactly 390 px, no visible interactive target
  was below 44×44 px, and the reduced-motion maximum was 0.01 ms.
- Keyboard skip navigation moved focus to `main`; the primary action displayed
  a designed 3 px focus outline. Scrollable ledgers are keyboard focusable.
- Each checked route had its own title, one h1, `lang=en`, a main landmark,
  complete local metadata, and image alternatives.

Fresh Lighthouse 12.8.2 mobile results were **99 performance, 100
accessibility, 100 best practices, and 100 SEO**. FCP was 0.8 s, LCP 1.2 s,
TBT 130 ms, CLS 0, and transferred size 64 KiB. The first Lighthouse browser
process crashed before measurement; a container-safe retry completed with the
reported result. Evidence:
[`lighthouse-live.json`](verification-evidence-7/lighthouse-live.json).

Build budgets pass: JavaScript is 23.24 KB raw / 8.78 KB gzip, CSS is 9.60 KB
raw / 2.96 KB gzip, the hero image is 48.97 KB, and no fonts download.

## Defects by severity

| Severity | Finding |
| --- | --- |
| Critical | None found. |
| High | None found. |
| Medium | None found. |
| Low | None found. |

## Release recommendation

Release candidate `c820f4395876d8f89f7eacaacf866e1511392042`. The deployed
product performs the real local archive-audit job, its documented limits are
honest, and all mandatory release gates pass from fresh evidence.
