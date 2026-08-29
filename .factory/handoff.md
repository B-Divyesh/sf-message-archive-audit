# Polish 1 handoff — Archive Audit

## Status

**PASS.** Repair commit: `ebac50c6782759a5132c05160489e3a10cb172f4` (`fix: complete review-one polish`). It was pushed to `origin/main` and deployed as Azure Static Web Apps deployment `42abc230-4c5c-47bd-877e-9acf85e7dae5`.

## What changed

- The first-screen sample action now opens the isolated `/?demo=1` sandbox. The completed audit is positioned after route load, and its sticky demo banner keeps reset and exit controls visible.
- The static host rewrites only the known `/demo` route. Unknown paths now receive the designed `404.html` with HTTP 404.
- Route navigation focuses and announces the destination heading. Legal and 404 documents use the same header/footer content, theme control, metadata, and focus behavior as the app shell.
- Copy consistently uses **email export**, **local audit summary**, and **downloaded receipt**. README and landing technical labels were rewritten in plain first-use terms.
- Added the `demo-no-setup` claim and browser assertion. The landing page no longer creates an empty real IndexedDB database before a real audit.

## Verification

Fresh clone: `/tmp/archive-audit-clean.ygj3CB` after `git clone /work/repo`, then `npm ci`.

All individual claim commands passed:

```text
npm run test:e2e -- --grep @claim:mime-audit
npm run test:e2e -- --grep @claim:local-only
npm run test:e2e -- --grep @claim:offline-reload
npm run test:e2e -- --grep @claim:receipt-exports
npm run test:e2e -- --grep @claim:report-persistence
npm run test:e2e -- --grep @claim:free-use
npm run test:e2e -- --grep @claim:demo-no-setup
```

The same clean clone also passed `npm test` (13 tests), `npm run lint`, `npm run build` (creates `dist/`; initial JS 7.77 KB gzip and CSS 2.93 KB gzip), and `npm run test:e2e` (14 tests). The browser suite includes AxeBuilder checks with no serious or critical violations on demo, Privacy, Terms, and 404.

Live verification passed on 2026-08-29:

- `/opt/fleet/lib/verify-url.sh 'https://message-archive-audit.sociobot.in/?demo=1' .factory/evidence/live-demo` returned HTTP 200, 647 ms load, no console errors, `lang=en`, one h1, main landmark, and no missing image alt or unlabeled button.
- `https://message-archive-audit.sociobot.in/missing-review-link` returned **404** and the designed “Page not found” document.
- A cold Playwright check verified live demo viewport visibility, Home → Privacy → Back heading focus and announcements, and legal/404 metadata.
- Screenshots: `.factory/evidence/live-demo/viewport-390.png` and `.factory/evidence/live-demo/viewport-1440.png`.

## Run locally

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
```

Use `/?demo=1` for the isolated sample. `/demo` remains a direct route. Deploy `dist/` with `public/staticwebapp.config.json` at the deployment root.

## Known gaps

None.
