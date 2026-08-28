# Archive Audit handoff

## Delivered

- Offline-first Vite/TypeScript PWA for standard MIME EML and text MBOX exports.
- Local message inventory, embedded attachment decoding and SHA-256 hashing.
- Optional attachment-folder inventory; named attachment references are called out when absent and shown as separately found when a matching filename exists.
- Portable HTML receipt, CSV and JSON downloads. A compact report survives refresh in IndexedDB and can be cleared; selected source bytes are never persisted by the app.
- Responsive notebook-style interface, dark treatment, keyboard-visible focus, skip link, semantic landmarks, PWA manifest/icons/service worker, update toast, `/privacy/`, `/terms/`, and optional Sociobot one-time license restore/verification flow.
- Generated original visual at `assets/src/hero-notebook.png`, with retained prompt metadata, and an optimised 48 KB `public/hero-notebook.webp` used in the app. Its source/provenance is recorded in `design.md`.

## Verify

```sh
npm install
npm test
npm run build
npm run test:e2e
```

`npm run build` produces `dist/index.html` at the deploy root.

Verification completed 2026-08-28:

- `npm test`: 2 parser tests passing.
- `npm run build`: passing; initial application JS is 6.30 KB gzip and CSS 2.81 KB gzip.
- `npm run test:e2e`: passing at 390×844; loads and audits a sample message, uses `context.setOffline(true)`, asserts no console errors, title and main heading.
- Lighthouse local run: Performance 98, Accessibility 100; LCP 1.7 s, TBT 170 ms, CLS 0.

## Known limits / next steps

- The inspector deliberately supports only standard MIME EML and text MBOX. It cannot decrypt mail, access providers, recover missing messages, or parse proprietary message databases.
- A separate folder reference is matched by filename because an external MIME reference has no source bytes to hash. Embedded attachments are hashed precisely.
- The one-time checkout has no hard-coded product ID; it uses the required product slug endpoint and shows hosted checkout pricing when the factory registration is live.
