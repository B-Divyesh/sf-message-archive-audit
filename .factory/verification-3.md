# Independent verification 3 — FAIL

**Candidate:** `7b8fee9fcafcae7f879c7b238d3f19dfb0f98e86`  
**Live URL:** <https://message-archive-audit.sociobot.in>  
**Verified:** 2026-08-29 UTC, from a clean working tree  
**Work order:** `message-archive-audit-verify-3`

## Verdict

**FAIL — do not release.** The deployed product is current (not a deployment-only failure), and it passes its declared automation and most product checks. A valid zero-byte base64 MIME attachment is silently omitted from the audit. The app reports zero named attachments, zero hashes, zero missing references, and a successful inventory. This is a boundary-value failure in the core job: attachment-preserving local verification.

No product code was changed during this verification.

## Mandatory first checks

`.factory/claims.json` exists with seven entries. After `npm ci`, every declared command was run separately through the supplied Playwright demo entry point and passed.

| Claim | Exact command | Result |
| --- | --- | --- |
| MIME audit | `npm run test:e2e -- --grep @claim:mime-audit` | PASS |
| Local-only | `npm run test:e2e -- --grep @claim:local-only` | PASS |
| Offline reload | `npm run test:e2e -- --grep @claim:offline-reload` | PASS |
| Receipt exports | `npm run test:e2e -- --grep @claim:receipt-exports` | PASS |
| Report persistence | `npm run test:e2e -- --grep @claim:report-persistence` | PASS |
| Free use | `npm run test:e2e -- --grep @claim:free-use` | PASS |
| Demo no setup | `npm run test:e2e -- --grep @claim:demo-no-setup` | PASS |

Cold live first-read at 1440px and 390px also passes: “Check an email export before access ends” states the job; the next sentence names people leaving an account or device; and the prominent **Try it with sample data** action says a complete audit opens with no setup. The live action produces the persistent demo banner and completed receipt in one click.

## Release-blocking audit defect

### Critical — valid zero-byte MIME attachment is omitted

Against the live deployment, a fresh browser uploaded this valid EML (a base64 attachment with an empty decoded byte sequence):

```text
From: QA <qa@example.test>
Subject: Zero byte attachment
Date: Thu, 01 Aug 2026 12:00:00 +0000
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary=z

--z
Content-Type: application/octet-stream; name="empty.bin"
Content-Disposition: attachment; filename="empty.bin"
Content-Transfer-Encoding: base64

--z--
```

Expected: one named attachment, one readable attachment hash, and SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (the standard hash of zero bytes).

Observed live receipt: **1 message, 0 attachments named, 0 attachments hashed, 0 references missing**, plus “No broken attachment references found.” The ledger labels the message “No attachment.” The same loss occurs for a named MIME part with no encoded body, which is also silently omitted instead of being represented as a missing/reference finding.

Root cause is evident in `src/parser.ts`: attachment creation is inside `if (body.length > 0)`, so a named MIME part with an empty body reaches neither the successful decode/hash path nor the fallback missing-reference record. This violates the `mime-audit` copy claim (“hashes readable base64 … MIME attachments”) and the researched brief’s attachment-preserving inventory requirement. The existing claim test covers only nonempty attachments, so it does not prove the full claim.

**Required repair:** create an attachment record whenever a named attachment MIME part exists. Decode/hash an empty readable body as zero bytes; only classify it as an unresolved reference when the format genuinely indicates an external/unreadable reference. Add a tagged claim regression test that uploads the exact fixture and asserts the name, count, and empty-byte SHA-256 in the receipt.

## Clean checkout and automated checks

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | 60 packages installed; 0 vulnerabilities reported |
| `npm test` | PASS | 13 tests in 3 files |
| `npm run typecheck` | PASS | `tsc -b --pretty false` |
| `npm run lint` | PASS | configured TypeScript lint/type gate |
| `npm run build` | PASS | `dist/` created; JS 19.64 KB raw / 7.77 KB gzip, CSS 9.52 KB raw / 2.93 KB gzip |
| Browser suite | PASS | All 14 tests were run: first 9 individually (seven claim tests plus invalid-input and formula/folder tests), remaining 5 together; all passed |

## Live identity, privacy, PWA, and product checks

- The live page loads `assets/index-BuS4VpdP.js`. Its SHA-256 is `7f7bc6a19b6524ee2ec23d3fd2476465fdcc0477605f63ca49c4f2f5eb175726`, exactly matching `npm run build` from candidate `7b8fee9`. This is a candidate behavior defect, not a stale deployment.
- Full live demo request log: 32 requests, all origin `https://message-archive-audit.sociobot.in`; no analytics, providers, accounts, or third-party resources. The local-only claim also passed and verified no real IndexedDB database in demo mode.
- A controlled live demo acquired service-worker control and reloaded offline with HTTP 200, title `Demo — Archive Audit`, and “Archive inventory complete” visible. A separate isolated local server using the candidate production build delivered a synthetic new `sw.js`; the UI exposed “An offline update is ready,” **Refresh now** activated the waiting worker, and the cache changed from `archive-audit-v3` to `archive-audit-v4-qa`.
- Normal EML/MBOX demo behavior, HTML/CSV/JSON downloads (including no-attachment messages), local summary reload, malformed/empty input recovery, external-folder hash matching, and formula-neutralized CSV behavior pass in the shipped suite. Independent live checks also confirmed empty selection and malformed MBOX receive clear errors.
- This is a static PWA. There are no product server endpoints, unlock calls, authentication flows, or request allowance to exercise; therefore 429/Retry-After and Entra checks do not apply.

## Accessibility, responsive, security, routes, and caching

- Axe 4.10.2 found 0 serious/critical violations on live demo, Privacy, Terms, and designed arbitrary-path 404.
- Live desktop 1440px and 390px reduced-motion checks found no horizontal overflow. At 390px the primary link had a 3px ochre focus outline, Tab reached the visible skip link, Enter focused `<main>`, and the completed demo receipt began at 64px in an 844px viewport. No console/page errors occurred on normal root/demo/legal loads.
- `lang=en`, a single h1, main landmark, titles, alt text, local manifest/icons, CSP, `X-Content-Type-Options`, `X-Frame-Options`, restrictive permissions policy, HSTS, and referrer policy are live. All crawled product links returned 200; an arbitrary unknown path returned designed HTTP 404.
- Live hashed JS is `Cache-Control: public, max-age=31536000, immutable`; `sw.js` and HTML are `no-cache`. Bundle budgets pass. No third-party fonts/scripts are used.

## Defects by severity

| Severity | Finding |
| --- | --- |
| Critical / release-blocking | Named zero-byte MIME attachments disappear and are certified as no attachment / no gap. |
| High | None found beyond the release blocker. |
| Medium | None found. |
| Low | None found. |

## Release recommendation

Do not promote `7b8fee9`. Repair zero-byte named MIME-part handling, add a direct claimed regression test, produce a new candidate, then rerun independent verification. All other observed deployment, privacy, PWA, accessibility, and bundle checks may be reused only after the parser repair is validated.
