# Independent product verification 5 — FAIL

**Requested candidate:** `3e56ef195918c350468a6e7291f2812318fd600b`

**Available and tested commit:** `3e56efd82da873d73f324a155e8f5de9f3ea071e`

**Live URL:** <https://message-archive-audit.sociobot.in>

**Verified:** 2026-08-29 UTC from a clean working tree

**Work order:** `message-archive-audit-verify-5`

## Verdict

**FAIL — do not release the requested candidate.** GitHub does not contain the requested candidate object. A direct fetch returned `fatal: remote error: upload-pack: not our ref`, `git cat-file` could not resolve it, and `git ls-remote origin` exposed only `main` at `3e56efd82da873d73f324a155e8f5de9f3ea071e`. The requested commit therefore cannot be checked out, tested, or matched to production.

Fresh evidence does not show a deployment outage. The live site is healthy and its six core artifacts are byte-identical to a production build of the available `main` commit. All automated and core functional checks passed on that available commit. Two manual accessibility defects remain in its legal/404 shell.

No product code was changed during verification.

## Mandatory first checks

`.factory/claims.json` exists with seven entries. Because the requested candidate was unavailable, each exact command was run separately from the clean available tree at `3e56efd82da873d73f324a155e8f5de9f3ea071e`, using the documented demo entry point. Every command passed. These results do **not** establish the claims for the missing requested candidate.

| Claim | Exact command | Result | Evidence |
| --- | --- | --- | --- |
| MIME audit | `npm run test:e2e -- --grep @claim:mime-audit` | PASS | [`mime-audit.log`](verification-evidence/claims/mime-audit.log) |
| Local-only | `npm run test:e2e -- --grep @claim:local-only` | PASS | [`local-only.log`](verification-evidence/claims/local-only.log) |
| Offline reload | `npm run test:e2e -- --grep @claim:offline-reload` | PASS | [`offline-reload.log`](verification-evidence/claims/offline-reload.log) |
| Receipt exports | `npm run test:e2e -- --grep @claim:receipt-exports` | PASS | [`receipt-exports.log`](verification-evidence/claims/receipt-exports.log) |
| Report persistence | `npm run test:e2e -- --grep @claim:report-persistence` | PASS | [`report-persistence.log`](verification-evidence/claims/report-persistence.log) |
| Free use | `npm run test:e2e -- --grep @claim:free-use` | PASS | [`free-use.log`](verification-evidence/claims/free-use.log) |
| Demo without setup | `npm run test:e2e -- --grep @claim:demo-no-setup` | PASS | [`demo-no-setup.log`](verification-evidence/claims/demo-no-setup.log) |

The live cold first-read passes at desktop and 390 px. Before scrolling, it says:

- what it does: **“Check an email export before access ends”**;
- for whom: **“For people leaving an account or device…”**;
- what to do first: **“Try it with sample data.”**

One click opens a complete four-message audit with the persistent **“Demo — sample data, nothing is saved”** banner, **Reset demo**, and **Start for real**. Screenshots: [`live-cold-desktop.png`](verification-evidence/live-cold-desktop.png), [`live-cold-mobile.png`](verification-evidence/live-cold-mobile.png), [`live-demo-desktop.png`](verification-evidence/live-demo-desktop.png), and [`live-demo-mobile.png`](verification-evidence/live-demo-mobile.png).

The landing page and README claim cross-check found no uncovered positive product claim. Scope limitations are stated as limitations. Privacy, export, persistence, free-use, supported-format, and offline statements map to the seven listed claims.

## Release-blocking provenance failure

The work order names `3e56ef195918c350468a6e7291f2812318fd600b`, while the supplied clean clone and remote `main` point to `3e56efd82da873d73f324a155e8f5de9f3ea071e`. The hashes share only the first six characters and are not interchangeable. Two fresh fetch attempts for the requested object failed. No branch or tag supplies it.

Required resolution: push the exact requested candidate (or issue a new work order naming an available full SHA), then rerun independent verification from that object.

## Clean build and automated verification of available `main`

| Check | Result |
| --- | --- |
| Initial tree | PASS — clean; HEAD `3e56efd82da873d73f324a155e8f5de9f3ea071e` |
| `npm ci` | PASS — 60 packages; 0 vulnerabilities |
| `npm test` | PASS — 15 tests in 3 files |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — configured TypeScript gate |
| `npm run build` | PASS — `dist/index.html` created |
| `npm run test:e2e` | PASS — all 14 Playwright tests |
| `node --check public/sw.js` | PASS |
| Factory `verify-url.sh` | PASS — 628 ms, no console/page errors, title/lang/h1/main/alt/button checks pass |

This is a static PWA, not a library or CLI, so clean-consumer package installation is not applicable.

## Independent end-to-end behavior

Fresh live Chromium contexts exercised the real UI rather than parser functions.

| Case | Result |
| --- | --- |
| Empty selection | PASS — announced “Choose at least one .eml or .mbox file…” |
| Nonsense EML | PASS — rejected with the reason; no false inventory |
| Recovery after invalid input | PASS — a valid nested MIME export completed in the same session |
| Nested MIME attachment | PASS — `evidence.pdf`, 5 bytes, exact SHA-256 `c1cda263…fe73c7` |
| Zero-byte attachment | PASS in the claim flow — 0 bytes and the exact empty SHA-256 |
| 20 controlled exports | PASS — 20 messages and 20 references; exactly 10 found/hashed and 10 missing |
| Missing-reference recovery text | PASS — names the ten gaps and tells the user to choose the folder or retain the finding |
| HTML receipt | PASS — first and twentieth messages present |
| CSV receipt | PASS — header plus 20 data rows |
| JSON receipt | PASS — 20 messages, 20 attachments, 10 found, 10 missing |
| Real persistence boundary | PASS — IndexedDB contains metadata but no controlled message bodies or attachment bytes |
| Clear report cancel/confirm | PASS — cancel retained the report; confirm removed `latest` |
| Demo reset | PASS — restored 4 messages and 2 hashed attachments |
| Demo isolation and exit | PASS — no IndexedDB, localStorage, or sessionStorage; Start for real opened an empty real workspace |

The brief's 20-export success scenario had 100% observed mismatch precision for the controlled fixture: all ten supplied matches were found and all ten absent references were flagged.

The missed-leverage check found no justified AI step. Local import, folder reconciliation, hashes, and portable receipts satisfy the useful workflow; sending private archive content to a model would weaken the product's stated privacy posture.

## Deployment identity

The live deployment matches the available `main` production build byte for byte. It cannot be said to match the missing requested candidate.

| Artifact | SHA-256 (local and live) |
| --- | --- |
| `index.html` | `89d97a9bf30f8b6733b58bd9f41c36338620b39e9e3d1da9f30bfb6abfd93af0` |
| `assets/index-ymypWK1f.js` | `f22e09f3bb5c48b6e2ae6b9bece8f4ddd686357a7f82aaec132e7c83fe1db292` |
| `assets/index-C5GLBEx9.css` | `415448edfb3a4cebbf47e6edf05973da10faf24be19922563f0e9941632d2679` |
| `sw.js` | `5054d478bb3aaef507225a9e139a953ab2330770b713fcf99569d8fea4241fe2` |
| `manifest.webmanifest` | `0a90b55b8aa5dc757eced5ab02d601d92ace2a3c02094532c180969e17216e32` |
| `hero-notebook.webp` | `cb97fbdf1cfcbcb917db3b4c7721a2f18829c8fc181ef6ea4fda481ea7ed9ccc` |

## Privacy, network, headers, and routes

The complete live invalid-input, nested-attachment, 20-export, persistence, export, and clear flow made four page requests: the document, local hashed JS, local hashed CSS, and local hero image. All were HTTPS and same-origin. No archive bytes, analytics, fonts, AI, billing, identity, provider, or other third-party requests occurred. The demo replacement/reset/exit flow created no browser storage.

The live response sends a same-origin CSP with `frame-ancestors 'none'`, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, strict referrer policy, and a restrictive Permissions Policy. Root HTML and `sw.js` are `no-cache`. Hashed JS/CSS and the hero image are one-year immutable.

`/`, `/demo`, `/privacy/`, `/terms/`, `robots.txt`, and `sitemap.xml` return 200. An unknown route returns the designed HTML with HTTP 404. Every non-404 product link discovered by the crawl returned 200.

There is no backend, authentication, product-unlock call, payment flow, or server-side endpoint. Rate-limit/429, persistence-concurrency, health/build endpoint, and Microsoft Entra checks are therefore not applicable.

## PWA and offline

- Chromium parsed the live manifest with no errors. It declares standalone display and 192/512 maskable icons.
- The live worker controlled the demo and used cache `archive-audit-v3`.
- With the network disabled, `/?demo=1` reloaded with HTTP 200 and retained the completed 4-message/2-attachment audit.
- In an isolated production-build simulation, changing the worker cache to `archive-audit-v4-qa` displayed **“An offline update is ready.”** Choosing **Refresh now** activated the waiting worker, removed v3, created v4, reloaded, and retained the completed demo.

## Accessibility and responsive review

Axe 4.10.2 found zero serious or critical violations on the live demo, Privacy, Terms, and real 404 response in desktop light and 390 px dark/reduced-motion contexts. Each route has `lang`, one `h1`, `main`, header, footer, no page overflow, and labelled inputs. The live home and demo have no visible interactive target below 44×44 px. The ledger is keyboard focusable and scrollable. Focus uses a visible 3 px outline. Reduced-motion collapses transitions/animations to 0.01 ms.

Two manual findings remain outside axe and the existing automated checks:

1. On cold `/privacy/`, `/terms/`, and the 404 response, Tab focuses **Skip to main content**, but Enter changes only the URL hash; focus becomes `<body>`, not `<main>`. Home correctly focuses `<main>`. The legal/404 `<main>` elements lack the focusability used by the app shell.
2. On the 404 response, **Return to Archive Audit** measures 197.9×20 CSS px at desktop and mobile, below the contract's 44 px minimum. The home/demo, legal navigation, and controls meet 44 px.

The Privacy page also instructs users to choose **“Clear local audit summary”**, but the actual control is labelled **“Clear local report.”** The action works, but the documentation does not use the product's own control name.

## Performance

Fresh mobile Lighthouse evidence is in [`lighthouse-live-root.json`](verification-evidence/lighthouse-live-root.json).

| Category or metric | Result |
| --- | ---: |
| Performance | 99 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.8 s |
| LCP | 1.1 s |
| TBT | 120 ms |
| CLS | 0 |
| Initial transfer | 63 KiB |
| Third-party bytes | 0 |

Bundle budgets pass: JavaScript 19.83 KB raw / 7.83 KB gzip, CSS 9.52 KB raw / 2.96 KB gzip, hero WebP 48.97 KB, and no downloaded fonts.

Factory verifier evidence, including full-page desktop/mobile captures, is under [`verify-url-live/`](verification-evidence/verify-url-live/).

## Defects by severity

| Severity | Finding |
| --- | --- |
| Critical / release-blocking | Requested candidate `3e56ef195918c350468a6e7291f2812318fd600b` is absent from the clone and GitHub, so it cannot be verified or matched to live. |
| High / release-blocking | Skip links on Privacy, Terms, and 404 do not move keyboard focus to main content, violating the non-negotiable keyboard baseline. |
| Medium / release-blocking | The 404 page's sole recovery link is only 20 px tall, below the required 44 px touch target. |
| Low | Privacy documentation names a control that does not exist; the UI says “Clear local report.” |

## Release recommendation

Do not release or attest candidate `3e56ef195918c350468a6e7291f2812318fd600b`. Push an exact candidate SHA, repair and test the legal/404 keyboard focus path and 404 recovery target, align the Privacy control name, then rerun independent verification. The currently live deployment is functional and matches available `main`, but that does not substitute for candidate provenance.
