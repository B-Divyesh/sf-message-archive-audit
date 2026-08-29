# Archive Audit repair 5 handoff

## Status

**PASS — repaired, pushed, deployed, and verified live.**

- Work order: `message-archive-audit-repair-5`
- Verifier report commit: `3d5c3eb890a8c8832549a8675d399db79bdb4653`
- Repaired candidate: `57be0ef5f1e93244b2fa79bd12d76cf148b60d3e`
- Repaired source candidate: `63c54620751a6c8c3da5b1b86ef067db08708959`
- Deployment: Azure Static Web Apps, production deployment `675d506b-ea6d-400c-b5d9-6b27fe0778c4`
- Live URL: <https://message-archive-audit.sociobot.in>
- Verified: 2026-08-29 UTC

The repository did not contain `.factory/brief.json` at the report commit. The
product contract in `AGENTS.md`, the verifier report, the existing design
thesis, and all previously passing behavior were preserved.

## Release-blocking findings repaired

| Verifier finding | Root cause | Repair and exact regression |
| --- | --- | --- |
| RFC 2231 continued filename was omitted | Header parsing stopped at the first folded line, and MIME parameter parsing handled only one parameter segment. | Header unfolding now keeps continuation lines. RFC 2231 numbered and encoded segments are assembled and charset-decoded. Unit and `@claim:mime-audit` browser fixtures assert `quarterly report.pdf`, 5 bytes, and its exact SHA-256. |
| One folder file satisfied two same-name references | Reconciliation independently searched the full file list for every reference. | Reconciliation now groups by name, consumes each physical file at most once, marks duplicate-name assignments ambiguous, and leaves excess references missing. Unit and browser tests assert one ambiguous reference, one missing reference, and one physical hash. |
| Unreferenced selected folder files disappeared | Folder files existed only in the JSON data and were not receipt rows. | Every selected file now retains its folder-relative path, hash, and matched/unmatched/ambiguous state. The visible ledger and HTML, CSV, and JSON receipts all include the inventory. Claim-level receipt tests inspect all three downloads. |
| UTF-8 Q-encoded metadata became mojibake | Q-decoded octets were converted directly to JavaScript characters. | RFC 2047 Q words are decoded to bytes and then through the declared charset. Unit and live browser fixtures assert `Café receipt` and `José Archive`. |

Saved reports from the previous schema are normalized on restore, re-reconciled,
and given folder paths and current review states. The installed PWA cache moved
from `archive-audit-v3` to `archive-audit-v4`; all public route build labels now
show `repair-5`.

## Clean local verification

The final clean sequence was:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
node --check public/sw.js
npm run test:e2e
```

Results:

- `npm ci`: 60 packages installed, 0 vulnerabilities.
- Unit/integration: 20 passed in 3 files.
- Typecheck and lint: passed.
- Production build: passed and produced `dist/`.
- Full Playwright 1.58.2 suite: 15 passed.
- Each of the seven commands in `.factory/claims.json` was also run separately;
  each selected exactly one tagged test and passed.
- Static PWA package/consumer installation is not applicable.

The production bundle is 23.24 KB JavaScript raw / 8.78 KB gzip, 9.60 KB CSS
raw / 2.96 KB gzip, and 48.97 KB for the hero image. Local mobile Lighthouse
12.8.2 scored 97 performance, 100 accessibility, 100 best practices, and 100
SEO; FCP was 1.0 s, LCP 1.7 s, TBT 190 ms, CLS 0, and transfer was 62 KiB.

## Browser, accessibility, privacy, and PWA evidence

- Desktop 1440×900 and mobile 390×844 were exercised with the repaired folder
  inventory. Mobile had no page overflow and no visible target under 44×44 px.
- Keyboard skip navigation moved focus to `main`; both scrollable ledgers are
  keyboard focusable.
- Axe 4.10.2 reported zero serious or critical findings on the repaired result
  in desktop light and mobile dark/reduced-motion modes. The complete suite also
  covers the demo, Privacy, Terms, and 404 pages.
- Reduced-motion animation duration was 0.01 ms. There were no console or page
  errors.
- The live repair flow made HTTPS `GET` requests only to the product origin.
  No message, attachment, hash, analytics, font, billing, AI, or identity
  request left the origin.
- Offline `/demo` reload restored the four-message completed audit from
  `archive-audit-v4`.
- A real local service-worker update from v4 to a test v5 displayed “An offline
  update is ready,” activated through “Refresh now,” removed the old cache, and
  preserved the completed report. Evidence is in
  `evidence/repair-5-local/pwa-update.json`.
- Local URL verification loaded in 536 ms with one h1, `lang=en`, a main
  landmark, complete image alternatives, labeled buttons, and no errors.

Evidence is under `.factory/evidence/repair-5-local/` and
`.factory/evidence/repair-5-live/`, including desktop/mobile screenshots,
Lighthouse JSON, URL-verifier output, and live repair observations.

## Live deployment and identity

Factory URL verification loaded the production root in 597 ms with no console
errors. Live Lighthouse 12.8.2 scored 96 performance, 100 accessibility, 100
best practices, and 100 SEO; FCP was 0.8 s, LCP 1.1 s, TBT 230 ms, CLS 0, and
transfer was 62 KiB.

The deployed build is byte-identical to local `dist/`:

| Artifact | Local and live SHA-256 |
| --- | --- |
| `index.html` | `99c5d943de54712d00f1238006b44fc487675672ca696514bcb3122f972c6501` |
| `assets/index-BdmCWYZZ.js` | `c8ed31b97d51f25da3bafe47bb7a36e64620ca46346950de68dfc15844245103` |
| `assets/index-DhpJzuom.css` | `f20e3774c890f2779493150ac62cc3ac5f1e1d2929feb1534d58fed71480d9c9` |
| `sw.js` | `98872fe7e5c0ce89fc652cba77cece361157dc460788ae6ddfb8895faaeaff87` |
| `manifest.webmanifest` | `5f6103d3d3e83eaa5d2a23f954ba3f1c6097207a59a011f171f7564b046126f8` |
| `hero-notebook.webp` | `cb97fbdf1cfcbcb917db3b4c7721a2f18829c8fc181ef6ea4fda481ea7ed9ccc` |

`/`, `/demo`, `/privacy/`, `/terms/`, the manifest, and `robots.txt` returned
200; an unknown route returned the designed page with HTTP 404. Root and worker
responses use `no-cache`; hashed assets use one-year `immutable` caching.
Production responses include the declared CSP with `frame-ancestors 'none'`,
HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, the strict
referrer policy, and the restrictive Permissions Policy.

## Known limits and next steps

No release-blocking gap remains from verification 6. Product limits remain as
documented: Archive Audit does not decrypt mail, recover missing messages, read
provider-only stores, or certify that a provider supplied every message. This
static local-first PWA has no backend, authentication, payment, AI, or external
API, so backend response, rate-limit, Entra, billing, and live API checks do not
apply. The next factory action is independent verification of this candidate.
