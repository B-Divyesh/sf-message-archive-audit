# Archive Audit verification 6 handoff

## Status

**FAIL — candidate is deployed correctly but must not be released.**

- Candidate: `63c54620751a6c8c3da5b1b86ef067db08708959`
- URL: <https://message-archive-audit.sociobot.in>
- Work order: `message-archive-audit-verify-6`
- Full evidence: [verification-6.md](verification-6.md)

`origin/main` points to the requested candidate. Six core live artifacts are
byte-identical to the local production build, so the previous deployment-only
failure is resolved. Independent live inputs found release-blocking receipt
accuracy defects:

1. A valid RFC 2231 continued attachment filename is silently omitted and the
   audit reports zero attachments.
2. One selected folder file is counted as verifying two separate same-name
   attachment references.
3. A selected attachment-folder file without a parsed message reference is
   absent from the visible ledger and HTML/CSV receipts.
4. Valid UTF-8 RFC 2047 Q-encoded subject/sender text is corrupted.

These failures prevent the product from meeting the brief's attachment-
preserving inventory and reliable local receipt job.

## Verification performed

- `.factory/claims.json`: present; all seven exact commands pass after `npm ci`.
- `npm ci`: pass, 60 packages and 0 vulnerabilities.
- `npm test`: pass, 15 tests.
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run build`: pass; `dist/` produced.
- `npm run test:e2e`: pass, 14 tests.
- `node --check public/sw.js`: pass.
- Factory live URL verifier: pass, no console/page errors.
- Live desktop and 390 px dark/reduced-motion checks: pass outside the receipt
  defects; no overflow or undersized visible controls.
- Axe: zero serious/critical findings on demo, Privacy, Terms, and real 404.
- Keyboard skip/focus and ledger navigation: pass.
- Privacy request log: 16/16 requests were same-origin HTTPS GETs; no third-
  party or upload requests.
- Headers, routes, caching, and real HTTP 404: pass.
- Offline reload and simulated service-worker update/refresh: pass.
- Lighthouse mobile repeat: 96 performance, 100 accessibility, 100 best
  practices, 100 SEO; LCP 1.05 s, CLS 0, 64.25 KB transferred.
- Bundle budgets: 7.83 KB gzip JS, 2.96 KB gzip CSS, 48.97 KB hero.

This is a static PWA with no backend, authentication, unlock/payment call, or
server API. Rate-limit/429, backend concurrency/persistence, health/build
identity, Entra sign-in, and package-consumer checks do not apply.

## How to reproduce

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

The exact live observations and request log are in
`verification-evidence-6/live-independent-results.json`. Screenshots for each
failure and fresh Lighthouse/URL-verifier output are in
`verification-evidence-6/`.

## Required next steps

Add standards-compliant RFC 2231 filename continuation and charset-aware RFC
2047 Q decoding. Reconcile folder files without reusing one physical file for
multiple distinct references, preserve folder-relative identity, and include
all selected folder files in HTML, CSV, JSON, and the visible ledger with clear
matched/unmatched/ambiguous status. Add claim-tagged regression fixtures, then
rerun independent verification.
