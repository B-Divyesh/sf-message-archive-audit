# Archive Audit polish 2 handoff

## Outcome

Polish round 2 closes F-2-1 through F-2-8 and rechecks every F-1 finding. The product remains a local-first static PWA with its handwritten-notebook visual system. No paid, tracking, provider, or AI integration was added.

## Changes

- Added seven public claims and seven isolated tagged browser tests for missing files, folder inventory, no telemetry, demo reset, clearing a local report, and scope limits.
- Made `/demo` social metadata route-specific, including Open Graph and Twitter fields.
- Made encrypted S/MIME-style mail fail clearly instead of being treated as readable mail.
- Replaced the generic privacy heading, corrected the copy-audit counting convention and counts, and updated the catalog description.

See [polish-2.md](polish-2.md) for the finding-by-finding mapping.

## Exact verification

- Fresh clone (`80e46b48db48e21ccfa445ce66d13cc842409374`): `npm ci`, then every exact command in `.factory/claims.json` passed independently (14 claims).
- Fresh clone (`053b5a12893c27c8793b3abd7c0d26c12739840c`): `npm test` (21), `npm run lint`, `npm run build`, and `npm run test:e2e` (21) all passed.
- Build output: `dist/` exists; JavaScript is 23.85 kB raw / 8.99 kB gzip.
- Playwright Axe integration found zero violations on Demo, Privacy, Terms, and 404. The suite also checks keyboard operation, visible route focus/announcements, 390px overflow, 44px targets, reduced motion, offline reload, and no console errors.
- Local cold demo: [desktop screenshot](evidence/polish-2-local/screenshot-desktop.png), [mobile screenshot](evidence/polish-2-local/screenshot-mobile.png), and [basic route check](evidence/polish-2-local/verify.json). The route check reports `Demo — Archive Audit`, `lang=en`, one h1, main landmark, image alt text, and no console errors.

## Deployment and final live check

Pending the final push/deployment step for commit `053b5a12893c27c8793b3abd7c0d26c12739840c`; append the deployed URL evidence after the static work-order deployment completes.
