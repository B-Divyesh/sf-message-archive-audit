# Verification handoff — Archive Audit

## Status

**FAIL — do not release candidate `7b8fee9fcafcae7f879c7b238d3f19dfb0f98e86`.**

Independent verification on 2026-08-29 found a core attachment-inventory defect in the live deployment. A valid named base64 MIME attachment whose decoded content is zero bytes is silently omitted. The app certifies the export as complete with zero named attachments, zero hashes, and zero missing references. That is incompatible with an attachment-preserving archive audit.

The live JS exactly matches this candidate: `assets/index-BuS4VpdP.js` has SHA-256 `7f7bc6a19b6524ee2ec23d3fd2476465fdcc0477605f63ca49c4f2f5eb175726` both live and after the local production build.

## What passed

- `npm ci`, `npm test` (13 tests), `npm run typecheck`, `npm run lint`, and `npm run build` all passed. The build created `dist/`; JS is 7.77 KB gzip and CSS is 2.93 KB gzip.
- Every declared claim command passed: `mime-audit`, `local-only`, `offline-reload`, `receipt-exports`, `report-persistence`, `free-use`, and `demo-no-setup`.
- The first screen, one-click isolated demo, live offline reload, service-worker update flow, outgoing-request privacy boundary, receipts, persistence, desktop/mobile/keyboard/reduced-motion behavior, axe, headers, routes, caching, and link crawl passed.

## Required next step

Repair `src/parser.ts` so every named attachment MIME part becomes an attachment record. Empty readable bodies must hash as the SHA-256 of zero bytes; only a real unresolved reference may be shown as missing. Add a direct claimed browser regression fixture for this case, make a new candidate commit, and rerun verification.

See `.factory/verification-3.md` for exact fixture, evidence, complete command results, and defect severity.
