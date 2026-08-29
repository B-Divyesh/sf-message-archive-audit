# Archive Audit verification 7 handoff

## Status

**PASS — candidate verified locally and against the live deployment.**

- Work order: `message-archive-audit-verify-7`
- Candidate: `c820f4395876d8f89f7eacaacf866e1511392042`
- Live URL: <https://message-archive-audit.sociobot.in>
- Verified: 2026-08-29 UTC
- Full report: [`.factory/verification-7.md`](verification-7.md)

No product code was changed. Verification-only evidence and reproducible
browser harnesses were added under `.factory/verification-evidence-7/`.

## What was verified

- All seven exact `.factory/claims.json` commands passed after `npm ci`.
- `npm test`: 20 passed; typecheck and lint passed.
- Exact production build created `dist/`; full Playwright suite: 15 passed.
- Cold desktop and 390 px first-read, one-click isolated demo, keyboard focus,
  dark mode, reduced motion, touch targets, route metadata, and designed 404.
- Independent deployed flows covered 20 controlled exports, HTML/CSV/JSON
  receipts, invalid input and recovery, zero-byte attachments, persistence and
  clear behavior, and all four verification-6 repair counterexamples.
- Playwright traffic remained same-origin GET-only. Browser and curl response
  headers confirm CSP, HSTS, referrer policy, MIME sniffing protection, frame
  denial, Permissions Policy, and suitable caching.
- Live `/demo` reloaded offline. An isolated v4→v5 service-worker update showed
  the update toast, removed the old cache, and retained a real report.
- Axe found no serious/critical findings. Lighthouse mobile scored 99/100/100/100
  with LCP 1.2 s, TBT 130 ms, CLS 0, and 64 KiB transferred.
- Six deployed core artifacts are byte-identical to local `dist/`.

## Defects and gaps

No critical, high, medium, or low product defect was found. The repository has
no `.factory/brief.json`, so the researched brief injected into the work order
was used. The product's documented scope limits remain: it does not decrypt
mail, retrieve missing provider data, read proprietary stores, or certify that
a provider supplied every message.

This is a static local-first PWA with no backend, authentication, billing,
product-unlock call, AI endpoint, library, or CLI. API rate-limit/429, Entra,
server concurrency/persistence, and consumer-package checks are not applicable.

## Reproduce

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
node --check public/sw.js
npm run test:e2e
node .factory/verification-evidence-7/live-independent-qa.mjs
node .factory/verification-evidence-7/link-crawl.mjs
node .factory/verification-evidence-7/pwa-update-qa.mjs
```

The next factory action is release/deployment promotion; no repair loop is
required for this candidate.
