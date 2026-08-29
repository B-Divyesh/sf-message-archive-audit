# Archive Audit repair handoff

## Status

**PASS — independently verified 2026-08-29 UTC for candidate `8df79782b25505f318d26b1b5f5f3374722fbf9d` at https://message-archive-audit.sociobot.in.**

Independent verification is recorded in `.factory/verification-2.md`. It reran every claim command from a clean checkout, the local suite/build, live deployment parity, live privacy/offline/update/accessibility/responsive checks, and the 20-message attachment-reference precision case. No Critical, Major, or Minor defects remain. The repaired static PWA keeps the researched artifact class and `dist/` deployment root.

## Repairs

- Added `.factory/claims.json` with six claims. Every listed command passes from the isolated `/demo` or a fresh real workspace.
- Replaced the metaphorical first screen with “Check an email export before access ends,” a named audience, one prominent sample action, and privacy/offline/price facts.
- Added `/demo`, its persistent banner, reset and real-work actions, realistic EML/MBOX samples, and memory-only isolation. Demo code never opens the real IndexedDB database.
- Rebuilt `sw.js`: valid syntax, versioned cache, hashed-build asset discovery, old-cache cleanup, offline navigation fallback, controlled update prompt, and explicit offline page.
- Rejects empty, nonsense, and separator-free MBOX input. The parser now handles base64, 7-bit, 8-bit/binary, and quoted-printable attachment bodies, plus safe filename decoding.
- Complete receipt rows now include messages with no attachments. Separately supplied attachment files carry their SHA-256 and byte size into HTML, CSV, and JSON.
- CSV cells beginning with `=`, `+`, `-`, or `@` are neutralized before quoting.
- The result ledger is a named, focusable scroll region. Axe reports no serious or critical issue after sample data loads.
- Removed the dead, unimplemented paid offer. The core audit and every export remain free; no billing claim or broken checkout link remains.
- Removed 390px overflow and raised visible controls and links to at least 44×44 CSS pixels.
- Added canonical/Open Graph/Twitter metadata, favicon links, a 1200×630 original-art social card, `robots.txt`, `sitemap.xml`, `/404`, and a shared site shell for Privacy and Terms.
- Added Static Web Apps CSP, framing, permissions, referrer and MIME headers; immutable hashed-asset caching; no-cache app shell/service worker rules; and a real 404 response override.
- Added visible build identity `repair-1`, exact demo/copy documentation, and updated README instructions.

## Regression coverage

- `src/parser.test.ts`: invalid EML/MBOX rejection; two-message MBOX; base64, 7-bit, and quoted-printable decoding; malformed filename safety; folder reconciliation.
- `src/exports.test.ts`: no-attachment receipt rows, folder hashes in portable receipts, and spreadsheet formula neutralization.
- `src/config.test.ts`: response security policy, immutable caching, and 404 configuration.
- `e2e/app.spec.ts`: all six claims, offline reload, demo storage/network isolation, every receipt download, persistence without body storage, invalid-file trust state, folder hashing, CSV injection, axe, keyboard, 390px and desktop layout, touch targets, legal shells, 404, and console errors.

## Local verification evidence — 2026-08-29 UTC

Clean pipeline:

```text
npm ci                 60 packages installed; 0 vulnerabilities
npm test               13 passed in 3 files
npm run lint           PASS (TypeScript project check)
npm run build          PASS; dist/index.html present
npm run test:e2e       11 passed
```

Production asset sizes:

```text
JS   18.53 KB raw / 7.44 KB gzip
CSS   9.46 KB raw / 2.91 KB gzip
Hero 48.97 KB WebP
Social card 25.17 KB WebP
```

Every `.factory/claims.json` command was also run alone and passed: `mime-audit`, `local-only`, `offline-reload`, `receipt-exports`, `report-persistence`, and `free-use`.

Browser and accessibility evidence:

```text
Desktop 1440×900       PASS; no console errors or horizontal overflow
Mobile 390×844         PASS; no horizontal overflow; visible targets >=44px
Keyboard               PASS; skip link, demo entry, report controls, and ledger
Reduced motion         CSS motion collapsed; no continuous nonessential motion
Axe 4.10.2             0 serious/critical on demo results, Privacy, Terms, 404
Privacy request log    same-origin requests only through the complete demo flow
Demo IndexedDB check   no archive-audit database created
Offline                controlled /demo reload passed with network disabled
Service worker         node --check PASS; cache/update behavior covered in browser
verify-url.sh local    load 535ms; errors []; title/lang/H1/main/alt labels PASS
```

Lighthouse 12.8.2 mobile simulation:

```text
Performance 100 · Accessibility 100 · Best Practices 100 · SEO 100
FCP 0.9s · LCP 1.7s · TBT 0ms · CLS 0
```

## Run it

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
```

Use `http://127.0.0.1:4173/demo` after serving `dist/` for the verifier sandbox.

## Deployment and live identity

Deployed with the work order’s static deployment helper to Azure Static Web Apps in `centralus`.

```text
Production URL       https://message-archive-audit.sociobot.in
Deployment ID        45ecccdd-ebea-474b-ad44-c607d806264d
Product commit       a3d4093
Custom domain        Ready; HTTPS 200
index.html SHA-256   ae6fe0741c4b03425ff19f871be0b96e557981c9c0a63b0affe354eb4900ac97
application JS hash  e04f824fc12f6f21f5fbd22495342bd58793da8f468a2d40c7ad6a344adb40e9
sw.js SHA-256        66ed048deffb2bd091f9ccda5bcb542d6dd0407d873ad7dd096dcf75cf28c030
```

Each live hash matched the local `dist/` artifact byte for byte. Live response checks found `Cache-Control: no-cache` on HTML and `sw.js`, plus `public, max-age=31536000, immutable` on hashed assets. CSP, `frame-ancestors 'none'`, Permissions Policy, X-Frame-Options, Referrer Policy, and `nosniff` are present.

Live route checks:

```text
/demo              200 text/html
/privacy/          200 text/html
/terms/            200 text/html
/404               404 text/html; designed Archive Audit page
/robots.txt        200 text/plain
/sitemap.xml       200 text/xml
unknown static URL 404 text/html; designed Archive Audit page
```

`verify-url.sh` against production passed in 644ms with no console errors, one H1, `lang=en`, main landmark, alt text, and labeled buttons. A fresh 390px live browser loaded four demo messages, reported no overflow, no external requests, zero serious/critical axe issues, acquired a service-worker controller, and reloaded the completed demo offline with no console or page errors.

## Known gaps

- Lighthouse values are lab measurements; field INP is unavailable before real-user traffic.
- The parser intentionally does not decrypt mail, contact providers, recover missing messages, or read proprietary databases.
