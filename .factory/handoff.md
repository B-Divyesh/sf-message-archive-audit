# Archive Audit review 3 handoff — FAIL

## Outcome

The reviewer made no product-code changes. The deployed product is clear on first read and its registered tests pass, but it is not ready for acceptance: demo mode can persist `archive-audit-theme` in real local storage, and the 390px header hides Privacy without a replacement menu.

## Verification completed

- Fresh live Chromium checks at 390×844 and 1440×900: cold landing, one-click sample, reset, real-data isolation, routing, metadata, request log, and offline behavior.
- Fresh clean clone at `/tmp/archive-audit-review3.sJaDTc`: `npm ci`; all 13 exact claim commands; `npm test` (21 passed); `npm run lint`; `npm run build` (created `dist/`); and `npm run test:e2e` (21 passed).
- Fresh mobile Axe checks on root, demo, Privacy, Terms, and 404: zero violations. Root/demo/Privacy/Terms had no console errors; 404 only emitted its expected HTTP-404 resource message.

## Known gaps

- **F-3-1 blocking:** demo theme toggle writes the real `archive-audit-theme` key and the preference survives **Start for real**. Make demo preferences in-memory or `demo:`-namespaced and add an interaction-level storage-isolation assertion.
- **F-3-2 minor:** CSS hides the Privacy header link at 390px without an accessible replacement. Keep it visible or provide a menu.

## Review artifact

The full evidence, copy audit, historical recheck, and concrete fixes are in [review-3.md](review-3.md).
