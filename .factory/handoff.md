# Archive Audit polish 3 handoff — PASS

## Outcome

Repair source commit: `12fc36b82d47adc4f3382b3b3ce1ed86054472f7` (`fix: isolate demo preferences and mobile privacy nav`). It is pushed to `origin/main` and deployed as the static PWA at <https://message-archive-audit.sociobot.in>.

Demo color selection now exists only in page memory. Demo never reads or writes the production `archive-audit-theme` preference, and exiting demo restores the real preference unchanged. The 390px header keeps an accessible Privacy link. The PWA cache and manifest were versioned for the repaired build (`repair-7`).

## Exact verification evidence

- Clean clone: `/tmp/message-archive-audit-polish3.vZX7p9` from `12fc36b`; `npm ci` completed with 0 vulnerabilities.
- Every exact command in `.factory/claims.json` passed independently: `mime-audit`, `local-only`, `offline-reload`, `receipt-exports`, `report-persistence`, `free-use`, `demo-no-setup`, `missing-attachment-detection`, `folder-inventory`, `no-telemetry`, `demo-reset`, `clear-report`, and `scope-limits`.
- Same clean clone: `npm test` passed (21 tests), `npm run lint` passed, `npm run build` produced `dist/`, and `npm run test:e2e` passed (21 browser tests). Production JS is 23.87 kB raw / 9.00 kB gzip; CSS is 9.57 kB raw / 2.95 kB gzip.
- Local demo URL check: [verify.json](evidence/polish-3-local/verify.json), [390px completed demo](evidence/polish-3-local/demo-viewport-390.png), and [1440px completed demo](evidence/polish-3-local/demo-viewport-1440.png). It found no console errors, one h1, `lang=en`, main, valid image alternatives, and no unlabeled buttons.
- Local Lighthouse on `/?demo=1`: [lighthouse.json](evidence/polish-3-local/lighthouse.json) — Performance 95, Accessibility 100, Best Practices 100, SEO 100.
- Local Playwright Axe integration: `public routes have no Axe accessibility violations and the ledger is keyboard scrollable` passed with zero violations.
- Deployment command: `/opt/fleet/lib/deploy-static.sh message-archive-audit /work/repo/dist`; live root served build `repair-7` at 2026-08-29 22:37 UTC.
- Cold live demo URL check: <https://message-archive-audit.sociobot.in/?demo=1>; [verify.json](evidence/polish-3-live/verify.json), [390px completed demo](evidence/polish-3-live/demo-viewport-390.png), [1440px completed demo](evidence/polish-3-live/demo-viewport-1440.png), and [390px home](evidence/polish-3-live/home-viewport-390.png).
- A fresh live Playwright recheck passed: cold root/demo at 1440px and 390px, completed demo receipt in the first viewport, production-theme isolation, route titles/metadata, real HTTP 404, focus/announcements, offline demo reload, and zero Axe violations on root, demo, Privacy, Terms, and 404.

## Run and deploy

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
```

Deploy `dist/` with `public/staticwebapp.config.json` at its root. Use `/?demo=1` for the isolated sample route.

## Known gaps

None.
