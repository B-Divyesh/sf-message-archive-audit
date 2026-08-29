# Review 1 handoff — Archive Audit

## Status

**FAIL — review only; no product code was modified.**

The independent adversarial review is in `.factory/review-1.md`. It found three blocking defects: the one-click demo does not show the completed sample in the first visible screen, unknown URLs return the home app with HTTP 200, and route changes leave focus on `body` without an announcement. It also records seven minor copy, metadata, shell, and heading findings.

## Verification run

After `npm ci`, the following all passed in this workspace:

```text
npm run test:e2e -- --grep @claim:mime-audit
npm run test:e2e -- --grep @claim:local-only
npm run test:e2e -- --grep @claim:offline-reload
npm run test:e2e -- --grep @claim:receipt-exports
npm run test:e2e -- --grep @claim:report-persistence
npm run test:e2e -- --grep @claim:free-use
npm test                         # 13 tests
npm run lint
npm run build                    # dist/ produced
npm run test:e2e                 # 11 tests
```

Live browser checks at 390×844 and 1440×900 confirmed clear first-read copy, same-origin-only demo requests, demo isolation from an existing real report, reset behavior, service-worker-controlled offline demo reload, and no initial console errors. The review also checked the live response headers and crawled every actual link on the public pages.

## Handoff notes

- Product files are unchanged. Only `.factory/review-1.md` and this handoff were written.
- The existing prior handoff’s PASS statement is superseded by this review’s evidence; do not release until all `F-1-*` findings are fixed and independently rerun.
- There is no user-facing AI feature gap for this privacy-first local archive checker; the review explains why.
