# Archive Audit repair handoff

## Status

The release blocker in verifier report commit `b020d901784259f7486b65472aac70874dcedf24` for candidate `7b8fee9fcafcae7f879c7b238d3f19dfb0f98e86` is repaired. The product remains a static, local-first PWA with `dist/` as its deployment root. No previously passing product behavior or researched visual direction changed.

## Repair

- Fixed MIME boundary parsing so the boundary's framing line break is not mistaken for attachment content or consumed before an empty part can be recognized.
- A named attachment with an explicit, valid empty base64 body now becomes a verified embedded attachment with size `0` and SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- A named part with no body and no transfer encoding remains an unresolved separate-file reference. Folder reconciliation therefore keeps its previously passing behavior.
- Unreadable or unsupported transfer encodings still produce a visible missing-reference record instead of a false verified result.

## Exact regression coverage

- `src/parser.test.ts` parses a named zero-byte base64 part and asserts its name, embedded source, zero size, verified state, and exact standard empty-byte hash.
- `e2e/app.spec.ts` extends the single `@claim:mime-audit` test with the verifier's exact EML fixture. It uploads through the real UI and asserts one named attachment, one hashed attachment, `empty.bin`, `0 bytes`, and the exact SHA-256 in the receipt.
- The pre-existing folder-reference regression still passes, proving that an unencoded bodyless named part can be matched to a separately selected file.

## Local verification — 2026-08-29 UTC

Clean pipeline:

```text
npm ci                 PASS; 60 packages, 0 vulnerabilities
npm test               PASS; 14 tests in 3 files
npm run typecheck      PASS
npm run lint           PASS
npm run build          PASS; dist/index.html present
npm run test:e2e       PASS; 14 browser tests
```

All seven `.factory/claims.json` commands were also run separately and passed: `mime-audit`, `local-only`, `offline-reload`, `receipt-exports`, `report-persistence`, `free-use`, and `demo-no-setup`.

Browser and policy evidence:

```text
Desktop 1440×900       PASS; no console errors or horizontal overflow
Mobile 390×844         PASS; no overflow; visible targets at least 44px
Keyboard               PASS; skip link, demo entry, ledger, legal routes
Axe 4.10.2             0 serious/critical on demo, Privacy, Terms, and 404
Privacy                complete demo remained same-origin; no real demo IndexedDB
Offline                controlled demo reloaded with the network disabled
PWA update             update toast appeared; Refresh now activated v4 test worker
Routes/metadata        home, demo, legal, 404, titles, canonical and social metadata pass
Response policy        CSP/security/cache/404 configuration tests pass
verify-url.sh local    556ms; no errors; title/lang/one H1/main/alt/buttons pass
```

Lighthouse 13 mobile simulation on the production build:

```text
Performance 98 · Accessibility 100 · Best Practices 100 · SEO 100
LCP 1.6s · TBT 150ms · CLS 0
```

Production assets remain well under the PWA budgets:

```text
JavaScript  19.66 KB raw / 7.77 KB gzip
CSS          9.52 KB raw / 2.93 KB gzip
```

Local artifact identity before upload:

```text
index.html  0fb500be3f8328193702124bc800e83a8d18080d735e7eaddf090b2d69f7f574
app JS      5e5154880bb5a45fbc51141120811b4bac9a8ff6cc1feec7184168357b0407f3
sw.js       5054d478bb3aaef507225a9e139a953ab2330770b713fcf99569d8fea4241fe2
```

Evidence is in `.factory/evidence/lighthouse-repair.json` and `.factory/evidence/repair-local/`.

## Run it

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Serve `dist/`, then open `http://127.0.0.1:4173/demo` for the isolated verifier sandbox.

## Deployment and live identity

The product repair was pushed to `origin/main` as commit `5fca23b` and deployed with the work order's static deployment helper.

```text
Production URL       https://message-archive-audit.sociobot.in
Azure region         centralus
Deployment ID        d46bfa3d-f0fd-44cc-8b52-99bd7881cc95
Custom domain        Ready; HTTPS 200
index.html SHA-256   0fb500be3f8328193702124bc800e83a8d18080d735e7eaddf090b2d69f7f574
application JS       5e5154880bb5a45fbc51141120811b4bac9a8ff6cc1feec7184168357b0407f3
sw.js SHA-256        5054d478bb3aaef507225a9e139a953ab2330770b713fcf99569d8fea4241fe2
```

Each live hash matches the local `dist/` artifact byte for byte. Live HTML and `sw.js` return `Cache-Control: no-cache`; hashed JavaScript returns `public, max-age=31536000, immutable`. CSP, `frame-ancestors 'none'`, Permissions Policy, X-Frame-Options, Referrer Policy, HSTS, and `nosniff` are present. An arbitrary path returns the designed page with HTTP 404.

`verify-url.sh` against production passed in 1089ms with no console errors, one H1, `lang=en`, a main landmark, alt text, and labeled buttons. A separate fresh 390px reduced-motion browser uploaded the verifier's exact zero-byte EML and observed `1 messages`, `1 attachments named`, `1 attachments hashed`, `0 references missing`, `empty.bin`, `0 bytes`, and the correct SHA-256. It then reloaded that saved report offline under service-worker control. The live run had no horizontal overflow, third-party requests, console errors, or serious/critical axe findings.

Live evidence is in `.factory/evidence/repair-live/`.

This product has no backend, authentication, payment, AI request, or product API. Package-consumer, 429/Retry-After, Entra identity, paid-unlock, and live model checks do not apply.

## Known gaps

- Lighthouse values are lab measurements; field INP needs real-user traffic.
- The parser intentionally does not decrypt mail, contact providers, recover missing messages, or read proprietary databases.
