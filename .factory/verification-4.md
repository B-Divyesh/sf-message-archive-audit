# Independent product verification 4 — FAIL

**Candidate:** `093172ac75475cacb9fffcd713122b1fdb2fac70`

**Live URL:** <https://message-archive-audit.sociobot.in>

**Verified:** 2026-08-29 UTC from a clean working tree

**Work order:** `message-archive-audit-verify-4`

## Verdict

**FAIL — do not release.** The deployment is healthy and byte-identical to the candidate. The repaired zero-byte attachment case now passes, but a valid attachment inside a nested MIME multipart is silently omitted. The app reports a clean archive with zero attachments and no broken references. That is a false-clean result in the core archive-audit job.

No product code was changed during verification.

## Mandatory first checks

`.factory/claims.json` exists with seven entries. After `npm ci`, every declared command was run separately against the product demo and passed. The captured output is in [`claims.log`](evidence/verification-4/claims.log).

| Claim | Exact command | Result |
| --- | --- | --- |
| MIME audit | `npm run test:e2e -- --grep @claim:mime-audit` | PASS |
| Local-only | `npm run test:e2e -- --grep @claim:local-only` | PASS |
| Offline reload | `npm run test:e2e -- --grep @claim:offline-reload` | PASS |
| Receipt exports | `npm run test:e2e -- --grep @claim:receipt-exports` | PASS |
| Report persistence | `npm run test:e2e -- --grep @claim:report-persistence` | PASS |
| Free use | `npm run test:e2e -- --grep @claim:free-use` | PASS |
| Demo without setup | `npm run test:e2e -- --grep @claim:demo-no-setup` | PASS |

The cold live first-read also passes. The headline says **“Check an email export before access ends.”** The next sentence identifies people leaving an account or device. **“Try it with sample data”** is the prominent first action, and its adjacent copy says that a complete audit opens without setup. One click opens the completed sample with the persistent demo banner, Reset demo, and Start for real.

## Release blocker

### Critical — nested MIME attachments receive a false clean audit

A fresh live browser uploaded this valid standard MIME structure:

```text
Content-Type: multipart/mixed; boundary="outer"

--outer
Content-Type: multipart/related; boundary="inner"

--inner
Content-Type: text/plain

See attached evidence.
--inner
Content-Type: application/pdf; name="evidence.pdf"
Content-Disposition: attachment; filename="evidence.pdf"
Content-Transfer-Encoding: base64

cHJvb2Y=
--inner--
--outer--
```

Expected: one named, readable attachment; decoded size 5 bytes; SHA-256 `c1cda26362828b69266512052b97cb3729e3b052e4ade47c0a1e3383defe73c7`; no missing reference.

Observed live:

```text
1 messages
0 attachments named
0 attachments hashed
0 references missing
No broken attachment references found.
Message ledger: No attachment
```

The same omission was reproduced with an inline named image inside the nested multipart. This is not an encrypted or proprietary store. Nested MIME multipart structures are standard EML, and the product explicitly claims to count and hash readable MIME attachments.

The source explains the behavior: `parseEml` reads only the top-level boundary at `src/parser.ts:82-86`, iterates only those immediate parts, and skips a multipart container without a filename at line 97. It never descends into that part's boundary. The tagged `mime-audit` test covers only top-level attachment parts, so it passes while the public claim is false for a normal format case.

Required repair: parse MIME parts recursively, retaining the transfer encoding and filename semantics at each leaf. Add this exact fixture to the single `@claim:mime-audit` test and assert the attachment count, name, byte count, and SHA-256.

## Clean checkout and automation

| Check | Result | Evidence |
| --- | --- | --- |
| Initial checkout | PASS | Clean `main`; HEAD exactly `093172ac75475cacb9fffcd713122b1fdb2fac70` |
| `npm ci` | PASS | 60 packages; 0 vulnerabilities |
| `npm test` | PASS | 14 tests in 3 files |
| `npm run typecheck` | PASS | `tsc -b --pretty false` |
| `npm run lint` | PASS | configured TypeScript gate passed |
| `npm run build` | PASS | `dist/` created |
| `npm run test:e2e` | PASS | all 14 Playwright tests |
| `node --check public/sw.js` | PASS | valid worker syntax |
| Factory URL check | PASS | [`verify.json`](evidence/verification-4/verify.json); 685 ms, no errors, title/lang/h1/main/alt/buttons pass |

The production build is below every static budget: JavaScript 19.66 KB raw / 7.77 KB gzip, CSS 9.52 KB raw / 2.93 KB gzip, hero WebP 48.97 KB, and no font downloads.

## Deployment identity

This is a product defect, not stale deployment or a deployment-only failure. Local `dist/` and live responses match byte for byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `0fb500be3f8328193702124bc800e83a8d18080d735e7eaddf090b2d69f7f574` |
| `assets/index-Ctj8Y4-3.js` | `5e5154880bb5a45fbc51141120811b4bac9a8ff6cc1feec7184168357b0407f3` |
| `assets/index-C5GLBEx9.css` | `415448edfb3a4cebbf47e6edf05973da10faf24be19922563f0e9941632d2679` |
| `sw.js` | `5054d478bb3aaef507225a9e139a953ab2330770b713fcf99569d8fea4241fe2` |
| `manifest.webmanifest` | `0a90b55b8aa5dc757eced5ab02d601d92ace2a3c02094532c180969e17216e32` |
| `hero-notebook.webp` | `cb97fbdf1cfcbcb917db3b4c7721a2f18829c8fc181ef6ea4fda481ea7ed9ccc` |

## End-to-end behavior

Independent live checks used fresh Chromium contexts.

| Case | Result |
| --- | --- |
| Empty selection | PASS — announced “Choose at least one .eml or .mbox file” |
| Nonsense EML | PASS — rejected; no inventory stamp |
| Recovery after invalid input | PASS — a valid file completed in the same session |
| Zero-byte base64 attachment | PASS — `empty.bin`, 0 bytes, exact empty SHA-256 |
| 20 controlled EML references | PASS — 20 messages, 20 references, 10 found/hashed, 10 missing |
| HTML/CSV/JSON receipts | PASS — 20 rows/messages; first and last messages present; folder hash present |
| Local persistence | PASS — summary restored after reload; source body and attachment bytes absent from IndexedDB |
| Clear local report | PASS — confirmed deletion left no latest report |
| Nested standard MIME attachment | **FAIL — silently omitted and reported clean** |

The missed-leverage check found no justified AI feature. Local import, attachment-folder reconciliation, and portable receipts are the useful implied capabilities; sending archive content to a model would weaken the privacy posture.

## Privacy, network, and response policy

The complete live demo and Reset demo made four page requests: `/demo`, the hashed JS, the hashed CSS, and the local hero image. Every request was HTTPS and same-origin. There were no analytics, third-party scripts/fonts, account calls, provider calls, or archive uploads. Demo mode created no IndexedDB database and no localStorage keys.

Browser response headers included the same-origin CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, strict referrer policy, restrictive Permissions Policy, and HSTS. Root HTML and `sw.js` are no-cache; hashed JS/CSS and product images are one-year immutable. `/privacy/`, `/terms/`, `robots.txt`, and `sitemap.xml` return 200. An unknown path returns the designed page with HTTP 404. All discovered product links resolve.

This product has no backend, product-unlock/API calls, payment, sign-in, or authentication. Rate-limit/429 and Sociobot Entra checks are therefore not applicable.

## PWA and offline

- Chromium parsed the live manifest with no errors and reported no installability errors.
- The live worker was activated and controlling `/demo`; the cache was `archive-audit-v3`.
- After the browser was put offline, `/demo` reloaded with HTTP 200, the demo title, and the completed audit.
- An isolated same-origin update simulation served a changed worker. The app showed **“An offline update is ready.”** Choosing **Refresh now** activated the waiting worker, removed the v3 cache, created the v4 test cache, reloaded, and retained the completed demo.

## Accessibility, mobile, and performance

- Axe 4.10.2: 0 serious/critical findings on live demo in light desktop and dark 390px reduced-motion modes, plus Privacy, Terms, and the designed 404.
- Desktop 1440×900 and mobile 390×844 had no horizontal page overflow, console errors, page errors, or visible targets below 44×44 px.
- Keyboard-only: Tab exposed and focused the skip link; Enter moved focus to main; demo navigation worked; the message ledger is keyboard-scrollable.
- Focus is a visible 3 px ochre outline. Its calculated contrast is 5.55:1 in light mode and 10.16:1 in dark mode.
- Text/controls remained present without page overflow at a 720 CSS-pixel viewport with 2× device scale, the 200% equivalent of a 1440-pixel display.
- Reduced-motion mode was active and collapsed the stamp animation to 0.01 ms.

Fresh mobile Lighthouse evidence is in [`lighthouse.json`](evidence/verification-4/lighthouse.json):

| Category or metric | Result |
| --- | --- |
| Performance | 98 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.9 s |
| LCP | 1.1 s |
| TBT | 180 ms |
| CLS | 0 |
| Initial transfer | 62.9 KB; 0 third-party bytes |

Desktop and mobile screenshots are retained in `.factory/evidence/verification-4/`.

## Defects by severity

| Severity | Finding |
| --- | --- |
| Critical / release-blocking | Standard nested MIME attachment parts are silently omitted, producing a false clean audit. The `mime-audit` claim test does not cover the claimed format boundary. |
| High | None found beyond the release blocker. |
| Medium | None found. |
| Low | None found. |

## Release recommendation

Do not promote candidate `093172ac75475cacb9fffcd713122b1fdb2fac70`. Implement recursive MIME multipart traversal, add the exact nested fixture to the tagged claim test, and rerun independent verification on a new candidate. All other observed deployment, privacy, offline, accessibility, responsive, export, and performance checks passed.
