# Polish 2 — review finding closure

Target: `https://message-archive-audit.sociobot.in`  
Base reviewed: `e367011accc98439ea067ebff24546cf2a484271`

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Preserved the direct `?demo=1` route, sticky banner, reset action, and deferred completed-receipt reveal. | `@claim:demo-no-setup`; `@claim:demo-reset`; `e2e/app.spec.ts` mobile viewport assertion. |
| F-1-2 | Preserved explicit `/demo` routing and the Static Web Apps 404 override. | metadata/config browser test; `public/staticwebapp.config.json`. |
| F-1-3 | Preserved heading focus and polite route announcements for app, legal, and 404 routes. | `route changes focus the destination heading and announce it`. |
| F-1-4 | Preserved complete per-route metadata and added exact-value checks for the demo route. | `every public route has its own complete metadata and the deployment config preserves 404s`. |
| F-1-5 | Preserved the matching header/footer shell and updated the common build identity to `repair-6`. | keyboard/legal-shell browser test. |
| F-1-6 | Preserved the isolated one-click demo claim and its clean-context test. | `@claim:demo-no-setup`. |
| F-1-7 | Preserved the agreed terms: email export, local audit summary, and receipt. | `.factory/copy-audit.md`; README review. |
| F-1-8 | Preserved plain first-use EML/MBOX and file-hash wording. | `.factory/copy-audit.md`; `@claim:mime-audit`. |
| F-1-9 | Preserved short, single-purpose README sentences. | `.factory/copy-audit.md`. |
| F-1-10 | Preserved the direct `Page not found` heading. | metadata/keyboard browser tests. |
| F-2-1 | Registered `missing-attachment-detection` and tested its metric, visible ledger status, and CSV receipt. | `@claim:missing-attachment-detection`. |
| F-2-2 | Registered `folder-inventory` and tested visible matched, ambiguous, and unreferenced paths/statuses. | `@claim:folder-inventory`. |
| F-2-3 | Registered `no-telemetry`; the test records landing, demo, real audit, and exports and permits only expected same-origin static GETs. | `@claim:no-telemetry`. |
| F-2-4 | Registered reset and deletion separately, including reset after a changed demo and cancel/confirm/reload for local-report deletion. | `@claim:demo-reset`; `@claim:clear-report`. |
| F-2-5 | Registered `scope-limits`, rejected encrypted S/MIME-style mail in the parser, and asserted selected-file-only receipts and no cross-origin requests. | `@claim:scope-limits`; `src/parser.test.ts`. |
| F-2-6 | Route metadata now updates description, canonical, OG title/description/URL, and Twitter title/description for `?demo=1` and `/demo`. | exact metadata-value browser test. |
| F-2-7 | Replaced the generic limits heading with `File storage and audit limits`. | `.factory/copy-audit.md`; landing browser suite. |
| F-2-8 | Corrected the three counts and documented the whitespace-token convention. | `.factory/copy-audit.md`. |

## Verification

- `npm test`: 21 unit tests passed.
- `npm run lint`: passed.
- `npm run build`: passed; `dist/` produced; JavaScript is 23.85 kB raw / 8.99 kB gzip.
- `npm run test:e2e`: 21 browser tests passed, including all 13 registered claims.
- Every one of the 13 exact `.factory/claims.json` commands passed independently after `npm ci` in a fresh clone of `80e46b4`; the final clean clone at `053b5a1` then passed the complete unit, lint, build, and 21-test browser suite.
- Local cold-demo evidence: `.factory/evidence/polish-2-local/screenshot-desktop.png`, `.factory/evidence/polish-2-local/screenshot-mobile.png`, and `verify.json` (no console errors; title/lang/one h1/main/alt checks pass).
- Live evidence after deployment: `https://message-archive-audit.sociobot.in/?demo=1`; `.factory/evidence/polish-2-live/screenshot-desktop.png`, `.factory/evidence/polish-2-live/screenshot-mobile.png`, and `verify.json`. A fresh 390px browser confirmed banner, `4/2/2/0` metrics, visible results, exact demo OG/Twitter metadata, limits heading, Privacy h1 focus/announcement, and no console errors. `GET /missing-polish-2` returned the designed 404 with HTTP 404.
