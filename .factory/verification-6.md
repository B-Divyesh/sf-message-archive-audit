# Independent product verification 6 — FAIL

- **Candidate:** `63c54620751a6c8c3da5b1b86ef067db08708959`
- **Live URL:** <https://message-archive-audit.sociobot.in>
- **Verified:** 2026-08-29 UTC
**Work order:** `message-archive-audit-verify-6`

## Verdict

**FAIL — do not release this candidate.** The candidate exists, `origin/main`
points to it, and the live application's six core artifacts are byte-identical
to its production build. The earlier deployment/provenance failure is not
present.

The deployed product nevertheless gives incorrect audit receipts for valid,
representative mail exports. It silently drops an RFC 2231 continued attachment
filename, reports one supplied file as satisfying two separate same-name
attachment references, and omits an unreferenced selected attachment-folder
file from the UI and HTML receipt. It also corrupts valid UTF-8 Q-encoded sender
and subject text. These are release-blocking because attachment completeness
and a locally reliable receipt are the core job in the acceptance brief.

No product code was changed during verification.

## Mandatory first checks

`.factory/claims.json` exists and contains seven claims. On the untouched clone,
the exact test commands initially could not load `@playwright/test` because
dependencies were not installed. `npm ci` installed the locked dependency tree
(60 packages, 0 vulnerabilities); every exact claim command then passed from a
fresh browser context through the demo entry point.

| Claim | Exact command | Result after clean install |
| --- | --- | --- |
| MIME audit | `npm run test:e2e -- --grep @claim:mime-audit` | PASS — 1 test |
| Local only | `npm run test:e2e -- --grep @claim:local-only` | PASS — 1 test |
| Offline reload | `npm run test:e2e -- --grep @claim:offline-reload` | PASS — 1 test |
| Receipt exports | `npm run test:e2e -- --grep @claim:receipt-exports` | PASS — 1 test |
| Report persistence | `npm run test:e2e -- --grep @claim:report-persistence` | PASS — 1 test |
| Free use | `npm run test:e2e -- --grep @claim:free-use` | PASS — 1 test |
| Demo without setup | `npm run test:e2e -- --grep @claim:demo-no-setup` | PASS — 1 test |

The tests are too narrow to catch the valid MIME and reconciliation
counterexamples below. In particular, the MIME claim's happy-path fixtures do
not cover standard continued filename parameters.

### Cold first-read

The live first screen passes at desktop and 390 px:

- what it does: **“Check an email export before access ends”**;
- for whom: **“For people leaving an account or device…”**;
- what to click: **“Try it with sample data”**;
- outcome beside it: **“The sample opens a complete audit. No setup is needed.”**

The primary action is above the fold (46.3 px high at y=498 on a 1440×900
viewport). One click opens a four-message, two-attachment completed audit with
the persistent **“Demo — sample data, nothing is saved”** banner, **Reset demo**,
and **Start for real**. Evidence:
[`live-cold-desktop.png`](verification-evidence-6/live-cold-desktop.png),
[`live-cold-mobile.png`](verification-evidence-6/live-cold-mobile.png),
[`live-demo-desktop.png`](verification-evidence-6/live-demo-desktop.png), and
[`live-demo-mobile.png`](verification-evidence-6/live-demo-mobile.png).

Landing, legal, and README claim-like statements map to the seven claims. The
live request log independently covers the broader privacy wording. No unlisted
positive product claim was found.

## Release-blocking product defects

### High — valid RFC 2231 attachment is silently omitted

A valid EML used this folded disposition:

```text
Content-Disposition: attachment;
 filename*0*=UTF-8''quarterly%20;
 filename*1*=report.pdf
Content-Transfer-Encoding: base64
```

The deployed audit reported **1 message, 0 attachments named, 0 hashed, 0
missing** and displayed “No attachment.” The attachment should be inventoried as
`quarterly report.pdf` and hashed. The product instead gives the reassuring
“Archive inventory complete” result. This directly contradicts the MIME-count
claim and the brief's attachment-preserving audit requirement. Evidence:
[`failure-rfc2231.png`](verification-evidence-6/failure-rfc2231.png) and the
`rfc2231` observation in
[`live-independent-results.json`](verification-evidence-6/live-independent-results.json).

### High — one folder file verifies two distinct references

Two messages each referenced a separate attachment named `invoice.pdf`; the
selected folder contained one `invoice.pdf`. The live result reported **2
attachments hashed, 0 references missing** and “No broken attachment references
found.” Reconciliation matches each reference independently by basename and
reuses the same physical file without consuming it or marking the result
ambiguous. A user can therefore receive a false complete result when one of two
same-name attachments is absent. Evidence:
[`failure-duplicate-reference.png`](verification-evidence-6/failure-duplicate-reference.png).

### High — selected folder files disappear from portable receipts

A valid plain EML and a selected attachment folder containing
`orphan-photo.jpg` produced **0 attachments named, 0 hashed, 0 missing**. The HTML
receipt did not contain the selected filename. The implementation hashes folder
files internally and includes them only in JSON's `folderFiles`; unmatched files
are absent from the visible ledger, HTML, and CSV. This fails the brief's request
to inventory attachment folders and makes the advertised “complete” receipt
formats inconsistent. Evidence:
[`failure-folder-file-omitted.png`](verification-evidence-6/failure-folder-file-omitted.png).

### Medium — valid UTF-8 Q-encoded headers are corrupted

The valid headers `=?UTF-8?Q?Caf=C3=A9_receipt?=` and
`=?UTF-8?Q?Jos=C3=A9_Archive?=` rendered and exported as `CafÃ© receipt` and
`JosÃ© Archive`. The parser converts encoded bytes directly to JavaScript
characters instead of decoding them using the declared charset. A receipt must
preserve the message subject and sender. Evidence:
[`failure-utf8-q-header.png`](verification-evidence-6/failure-utf8-q-header.png).

## Clean build and automated gates

| Check | Result |
| --- | --- |
| Initial tree / candidate | PASS — clean; exact requested SHA |
| `npm ci` | PASS — 60 packages; 0 vulnerabilities |
| `npm test` | PASS — 15 tests in 3 files |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — configured TypeScript gate |
| `npm run build` | PASS — exact production build created `dist/` |
| `npm run test:e2e` | PASS — 14 Playwright tests |
| `node --check public/sw.js` | PASS |
| Factory `verify-url.sh` | PASS — 592 ms; title/lang/h1/main/alt/button and console checks |

This is a static PWA, not a library or CLI, so clean-consumer package
installation is not applicable.

## Independent end-to-end behavior

All rows below were exercised against the deployed URL in fresh Chromium
contexts, not by calling parser functions.

| Case | Result |
| --- | --- |
| Empty input | PASS — actionable alert, no receipt |
| Nonsense EML | PASS — rejected; recovery remained possible |
| 20 controlled exports | PASS — 20 messages/references; exactly 10 supplied matches and 10 missing |
| HTML receipt | PASS for the controlled message rows |
| CSV receipt | PASS — header plus 20 data rows |
| JSON receipt | PASS — 20 messages, 20 references, 10 missing |
| Zero-byte base64 attachment | PASS — 0 bytes and exact empty SHA-256 |
| Real report persistence | PASS — survives reload |
| Storage boundary | PASS — metadata persisted; controlled bodies/attachment bytes absent |
| Clear report cancel/confirm | PASS — cancel retains; confirm removes the report |
| Demo reset/exit/isolation | PASS — no `archive-audit` IndexedDB in demo |
| RFC 2231 continued attachment | **FAIL — silently omitted** |
| Same-name reference cardinality | **FAIL — one file counted twice** |
| Unreferenced selected folder file | **FAIL — absent from UI/HTML/CSV** |
| UTF-8 Q-encoded metadata | **FAIL — mojibake** |

The successful artificial 20-export fixture does not establish the brief's
100% precision target because the duplicate-name counterexample produces a
false negative and the RFC 2231 counterexample is excluded from the inventory.

The missed-leverage review found no appropriate AI feature. Sending private
archive content to a model would weaken the core local-only posture; standards-
compliant import and accurate portable export are the missing leverage.

## Privacy, network, headers, routes, and deployment identity

The entire live demo and real upload/export/reload/error flow made 16 page
requests: documents and same-origin static JS, CSS, and artwork only. Every
request was an HTTPS `GET` to `message-archive-audit.sociobot.in`; no archive
bytes, hashes, analytics, advertising, fonts, billing, identity, AI, or other
third-party traffic was observed. There were no console or page errors.

The root response sends `Cache-Control: no-cache`; hashed JS sends one-year
`immutable`; `sw.js` sends `no-cache`. Responses include same-origin CSP with
`frame-ancestors 'none'`, HSTS, `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, strict referrer policy, and restrictive
Permissions Policy. `/`, `/demo`, `/privacy/`, `/terms/`, `robots.txt`,
`sitemap.xml`, and the manifest return 200. An unknown route returns the
designed page with HTTP 404.

The live deployment exactly matches the candidate build:

| Artifact | Local and live SHA-256 |
| --- | --- |
| `index.html` | `ccf16a1fb89ca6eb6f189235dcfbeb616f5d39b630b5c4817fe9632ce6231f59` |
| `assets/index-Bgb12Ss4.js` | `a9e74f45da2c4a0f657665b5c3d70ec113eb7d744134c117bf0d82170e4f3cd7` |
| `assets/index-C5GLBEx9.css` | `415448edfb3a4cebbf47e6edf05973da10faf24be19922563f0e9941632d2679` |
| `sw.js` | `5054d478bb3aaef507225a9e139a953ab2330770b713fcf99569d8fea4241fe2` |
| `manifest.webmanifest` | `0a90b55b8aa5dc757eced5ab02d601d92ace2a3c02094532c180969e17216e32` |
| `hero-notebook.webp` | `cb97fbdf1cfcbcb917db3b4c7721a2f18829c8fc181ef6ea4fda481ea7ed9ccc` |

There is no backend, authentication, product-unlock call, payment flow, or
server-side API endpoint. Rate-limit/429, persistence concurrency, health/build
endpoint, and Microsoft Entra checks are therefore not applicable.

## PWA, accessibility, and responsive behavior

- The live worker controlled the demo using `archive-audit-v3`; offline reload
  returned 200 and restored the completed four-message audit.
- In an isolated production-build simulation, an updated worker displayed “An
  offline update is ready.” “Refresh now” activated it, replaced v3 with v4, and
  preserved the completed demo without console errors.
- The manifest declares standalone display and local 192/512 maskable icons.
- Axe 4.10.2 found zero serious/critical violations on live demo, Privacy,
  Terms, and a real 404 in desktop light and 390 px dark/reduced-motion modes.
- At 390 px there was no page overflow or visible target below 44×44 px. Each
  route had `lang=en`, one `h1`, and `main`; reduced motion collapsed animation
  to 0.01 ms.
- Keyboard skip navigation on the repaired legal page moved focus to `main`;
  the next interactive target showed the designed 3 px focus outline. The
  ledger is keyboard focusable and scrollable.

## Performance

Two fresh Lighthouse 12.8.2 mobile runs scored 93 and 96 performance, with 100
accessibility, 100 best practices, and 100 SEO. The repeat measured FCP 0.77 s,
LCP 1.05 s, TBT 231 ms, CLS 0, and 64,250 transferred bytes. The first measured
LCP 1.16 s and CLS 0. Evidence:
[`lighthouse-live-repeat.json`](verification-evidence-6/lighthouse-live-repeat.json).

Build budgets pass: JavaScript is 19.83 KB raw / 7.83 KB gzip, CSS is 9.52 KB
raw / 2.96 KB gzip, the hero is 48.97 KB, and no fonts download.

## Defects by severity

| Severity | Finding |
| --- | --- |
| Critical | None found. |
| High — release-blocking | RFC 2231 continued filename attachment is silently omitted, yielding a false complete receipt. |
| High — release-blocking | One physical folder file is reused to verify two separate same-name attachment references. |
| High — release-blocking | Selected, unreferenced attachment-folder files are absent from the visible, HTML, and CSV inventories. |
| Medium — release-blocking | Valid UTF-8 Q-encoded sender/subject metadata is corrupted in the receipt. |

## Release recommendation

Do not release candidate `63c54620751a6c8c3da5b1b86ef067db08708959`.
Implement RFC 2231 continuations and charset-aware RFC 2047 Q decoding; preserve
folder-relative identity and reference cardinality; include every selected
folder file in every receipt with a clear matched/unmatched/ambiguous status;
then add claim-level regressions for these fixtures and rerun independent QA.
