# Archive Audit verification 4 handoff

## Status

**FAIL — do not release candidate `093172ac75475cacb9fffcd713122b1fdb2fac70`.**

The live deployment at <https://message-archive-audit.sociobot.in> is healthy and byte-identical to this candidate. The result is not a deployment-only failure. A valid attachment inside a nested MIME multipart is silently omitted, and the UI reports zero attachments plus “No broken attachment references found.” This is a release-blocking false-clean result for the core archive-audit job.

Full evidence and reproduction details are in [`.factory/verification-4.md`](verification-4.md).

## What was verified

- All seven commands in `.factory/claims.json` passed separately after `npm ci`; output is in `evidence/verification-4/claims.log`.
- Cold first-read and one-click demo gates passed.
- `npm test` passed 14 tests; typecheck, lint/type gate, exact production build, and all 14 Playwright tests passed.
- The repaired zero-byte attachment case passed with the standard empty SHA-256.
- A 20-EML precision corpus produced 10 exact folder matches and 10 exact missing references.
- HTML, CSV, and JSON exports; invalid-input recovery; local-summary persistence/clear; and source-byte exclusion passed.
- Privacy request logging, live response headers, routes, caching, link crawl, desktop/mobile, keyboard, focus, reduced motion, axe, Lighthouse, PWA installability, offline reload, and service-worker update behavior passed.
- The product has no backend/API/unlock calls, sign-in, payment, or runtime AI, so rate-limit and Entra checks do not apply.

## Release blocker and repair target

`src/parser.ts` splits only the message's top-level MIME boundary and does not recursively inspect nested multipart parts. A nested `Content-Disposition: attachment; filename="evidence.pdf"` base64 leaf is therefore skipped with these live metrics:

```text
1 messages · 0 attachments named · 0 attachments hashed · 0 references missing
No broken attachment references found.
```

Repair by recursively traversing standard MIME multiparts and hashing named readable leaf parts. Extend the existing single `@claim:mime-audit` test with the exact nested fixture from `verification-4.md` and assert the name, decoded size, and SHA-256. Then run:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Rerun every `.factory/claims.json` command separately and repeat independent live verification against a newly deployed candidate.

## Passing evidence retained

- Candidate/live app JS SHA-256: `5e5154880bb5a45fbc51141120811b4bac9a8ff6cc1feec7184168357b0407f3`
- Candidate/live service worker SHA-256: `5054d478bb3aaef507225a9e139a953ab2330770b713fcf99569d8fea4241fe2`
- Bundle: JS 19.66 KB raw / 7.77 KB gzip; CSS 9.52 KB raw / 2.93 KB gzip; hero 48.97 KB.
- Fresh mobile Lighthouse: 98 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.1 s, TBT 180 ms, CLS 0.
- Axe: zero serious/critical findings in the tested live states.

No product code was modified during verification. Only this handoff, `verification-4.md`, and verification evidence were added or updated.
