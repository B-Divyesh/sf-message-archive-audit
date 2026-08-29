# Adversarial first-read review 4 — Archive Audit

- Target: <https://message-archive-audit.sociobot.in>
- Reviewed: 2026-08-29 UTC
- Repository HEAD before this review commit: `6538501dbaec9505b932ab11adfe79cc4d4d8e96`
- Verdict: **PASS**

This was a full rereview from fresh browser contexts and a clean clone, not a diff-only check. No blocking or minor finding remains. The deployed site is clear on first read, its sample is an isolated working product state, and its published claims have passing sandbox tests.

## Cold first read

Fresh cacheless Chromium contexts opened the deployed root before scrolling at 390×844 and 1440×900.

| Required question | Answer available on the first screen | Exact text |
| --- | --- | --- |
| What does it do? | Checks an email export before access ends. | “Check an email export before access ends” |
| For whom? | People leaving an account or device who need a record. | “For people leaving an account or device who need a clear record of saved messages and attachments.” |
| What should I click first? | Open a completed sample audit. | “Try it with sample data” and “The sample opens a complete audit. No setup is needed.” |

All three answers were visible without scrolling on both viewports. On the phone, the action was visible at the first screen and the header retained direct **Demo** and **Privacy** links. There were no console errors.

## Findings

None. There are no `F-4-k` findings of any severity.

## Copy audit

Counts use whitespace-delimited words. Hyphenated terms, paths, file formats, and code identifiers count as one word. Punctuation does not add a word. The landing and README contain no sentence over 22 words, banned marketing wording, unexplained first-use jargon, inconsistent core terminology, information-free heading, or non-result-naming action.

### Landing-page sentences

| # | Sentence | Words | Result |
| ---: | --- | ---: | --- |
| 1 | Check an email export before access ends | 7 | Direct h1 |
| 2 | For people leaving an account or device who need a clear record of saved messages and attachments. | 17 | Audience and outcome |
| 3 | The sample opens a complete audit. | 6 | `demo-no-setup` |
| 4 | No setup is needed. | 4 | `demo-no-setup` |
| 5 | Files stay on this device. | 5 | `local-only` |
| 6 | Works offline after the first visit. | 6 | `offline-reload` |
| 7 | Free. | 1 | `free-use` |
| 8 | No account. | 2 | `free-use` |
| 9 | A field notebook with an envelope and attachment photographs ready for checking. | 12 | Useful image alternative |
| 10 | Reads EML message files and MBOX email collections. | 8 | `mime-audit` |
| 11 | It does not decrypt mail or access email providers. | 9 | `scope-limits` |
| 12 | Choose EML message files or MBOX email collections and an optional attachment folder. | 13 | Direct instruction |
| 13 | Check message counts, named attachments, missing files, and file hashes (SHA-256). | 11 | `mime-audit`, `missing-attachment-detection` |
| 14 | Save a complete HTML, CSV, or JSON receipt beside the email export. | 12 | `receipt-exports` |
| 15 | Files stay in this browser. | 5 | `local-only` |
| 16 | A real audit saves a local audit summary until you clear it. | 12 | `report-persistence`, `clear-report` |
| 17 | Demo audit summaries stay in memory. | 6 | `local-only` |
| 18 | A downloaded receipt lists only the files you select. | 8 | `scope-limits` |
| 19 | Check email exports before account or device access ends. | 9 | Footer purpose statement |

The remaining headings name their sections: **Choose an email export**, **Make a receipt in three steps**, and **File storage and audit limits**. Actions name results: **Try it with sample data**, **Check your own export**, **Audit selected files**, **Save HTML receipt**, **Export CSV**, **Export JSON**, **Reset demo**, **Start for real**, and **Clear local report**.

### README sentences

| # | Sentence | Words | Result |
| ---: | --- | ---: | --- |
| 1 | Archive Audit checks email exports before account or device access ends. | 11 | Product summary |
| 2 | It is for people who need a clear record of saved messages and attachments. | 14 | Audience |
| 3 | It reads EML message files and MBOX email collections in the browser. | 12 | `mime-audit` |
| 4 | It counts messages and checks named attachment files. | 8 | `mime-audit`, `missing-attachment-detection` |
| 5 | It hashes readable attachments as file hashes (SHA-256). | 8 | `mime-audit` |
| 6 | Every selected folder file remains visible with its relative path and match status. | 13 | `folder-inventory` |
| 7 | It exports HTML, CSV, and JSON receipts. | 7 | `receipt-exports` |
| 8 | Messages without attachments remain in every receipt. | 7 | `receipt-exports` |
| 9 | Message and attachment bytes stay on the device. | 8 | `local-only` |
| 10 | A real audit stores a local audit summary in browser storage (IndexedDB). | 12 | `report-persistence` |
| 11 | That summary survives reload until cleared. | 6 | `report-persistence`, `clear-report` |
| 12 | The complete audit and every receipt format are free and need no account. | 13 | `free-use` |
| 13 | The installed app works offline after the first visit. | 9 | `offline-reload` |
| 14 | Open `/?demo=1`, `/demo`, or choose “Try it with sample data.” | 10 | Direct instruction |
| 15 | The sample contains two EML message files and one MBOX email collection. | 12 | Demo fixture |
| 16 | Demo state stays in memory and never reads or writes the real audit database. | 14 | `local-only` |
| 17 | `npm run build` writes the static deployment to `dist/`. | 9 | Verified build instruction |
| 18 | The browser suite uses Playwright 1.58.2 and validates each listed claim in `.factory/claims.json`. | 13 | Verified |
| 19 | Archive Audit does not decrypt mail or access email providers. | 9 | `scope-limits` |
| 20 | A receipt lists only files you select. | 7 | `scope-limits` |
| 21 | See Privacy and Terms. | 4 | Direct links |
| 22 | The project is available under the MIT License. | 8 | Verified |
| 23 | Deploy `dist/` as a static site. | 6 | Direct instruction |
| 24 | Keep `staticwebapp.config.json` at the deployment root so routes, security headers, and cache policies apply. | 14 | Direct instruction |
| 25 | HTTPS is required for service workers. | 6 | Direct requirement |

**Terminology check:** the selected input is an **email export**; the operation is an **audit**; locally stored metadata is a **local audit summary**; a downloaded output is a **receipt**. EML and MBOX are defined on first use, and SHA-256 is identified as a file hash.

## Demo, sandbox, privacy, and claims

- One click on **Try it with sample data** opened `/?demo=1`. At both 390px and desktop, `#results` intersected the first post-click viewport and showed **Archive inventory complete**, four messages, two named attachments, two hashed attachments, and zero missing references.
- The persistent banner stated “Demo — sample data, nothing is saved” and exposed **Reset demo** and **Start for real**. The registered reset test changed the sample and confirmed that reset restored the bundled four-message audit.
- A live fresh-context check pre-populated the real `archive-audit-theme` value, entered demo, used its theme control, and left demo. Local storage remained byte-for-byte unchanged and no `archive-audit` IndexedDB database appeared. This confirms the earlier demo-theme regression is fixed.
- The Playwright request log for root, demo, legal navigation, and the service-worker cache flow contained only same-origin static GETs. No analytics, advertising, account, payment, AI, provider, font-CDN, or upload request occurred.
- The offline-reload claim test opened the demo online, waited for service-worker control, disabled the network, reloaded, and retained the completed sample audit.

Every exact command listed in `.factory/claims.json` was invoked separately in a clean clone at `/tmp/archive-audit-review4.qAFq7E` after `npm ci`. All 13 passed:

`mime-audit`, `local-only`, `offline-reload`, `receipt-exports`, `report-persistence`, `free-use`, `demo-no-setup`, `missing-attachment-detection`, `folder-inventory`, `no-telemetry`, `demo-reset`, `clear-report`, and `scope-limits`.

The clean clone also passed `npm test` (21 tests), `npm run lint`, `npm run build` (produced `dist/`), and `npm run test:e2e` (21 Playwright tests; final status `passed`). No claim-like landing, legal-page, result, or README sentence lacked a corresponding claim entry and observable test coverage.

## Earlier-history recheck

Every `review-*`, `polish-*`, and existing handoff document was read. Each earlier finding was verified against both the live site and the current code.

| Earlier finding | Current verification | Status |
| --- | --- | --- |
| F-1-1 completed sample below first screen | Demo result intersects first viewport at 390px and desktop; deferred result reveal remains in `loadDemo()`. | Fixed |
| F-1-2 unknown URL rendered home with 200 | `/review-4-missing` returned the designed page with HTTP 404. | Fixed |
| F-1-3 route focus/announcement absent | Home → Privacy → Back focused each h1 and populated the polite announcer. | Fixed |
| F-1-4 incomplete route metadata | Root, demo, Privacy, Terms, and 404 have descriptions, canonical, OG/Twitter values, icons, and theme color. | Fixed |
| F-1-5 inconsistent shared shell | Header/footer content, privacy/terms links, Param Factory credit, and build label match across app, legal, and 404 pages. | Fixed |
| F-1-6 unregistered setup-free sample promise | `demo-no-setup` is declared and passed. | Fixed |
| F-1-7 inconsistent archive terms | Live and README use email export, local audit summary, and receipt consistently. | Fixed |
| F-1-8 unexplained jargon | EML/MBOX and file hash receive plain first-use wording. | Fixed |
| F-1-9 overlong README sentence | All 25 README sentences are at most 14 words. | Fixed |
| F-1-10 metaphorical 404 heading | Live h1 is “Page not found.” | Fixed |
| F-2-1 missing-file claim absent | `missing-attachment-detection` passed. | Fixed |
| F-2-2 folder inventory claim absent | `folder-inventory` passed. | Fixed |
| F-2-3 no-telemetry claim absent | `no-telemetry` passed with a request log. | Fixed |
| F-2-4 reset/clear behavior unclaimed | `demo-reset` and `clear-report` passed. | Fixed |
| F-2-5 scope limits unclaimed | `scope-limits` passed. | Fixed |
| F-2-6 demo metadata described home | `/demo` and `?demo=1` now use Demo title, description, canonical, and OG data. | Fixed |
| F-2-7 generic privacy heading | Live heading is “File storage and audit limits.” | Fixed |
| F-2-8 copy-audit counts incorrect | Current counts match the stated whitespace convention. | Fixed |
| F-3-1 demo persisted real theme | Demo uses in-memory `demoThemeDark`; live storage-isolation retest passed. | Fixed |
| F-3-2 phone hid Privacy | At 390px, the visible header includes Privacy. | Fixed |

## Structure, accessibility, and identity

- `/`, `/demo`, `/?demo=1`, `/privacy/`, `/terms/`, `/404`, and an arbitrary unknown URL were checked live. Each normal route has its required title pattern, exactly one h1, a main landmark, `lang="en"`, description, canonical, OG/Twitter data, favicon, Apple touch icon, and theme color. Unknown paths return the designed 404 with HTTP 404.
- The active-address, reload, back-button, focus, and polite-announcement behavior works for the tested route transitions. The designed 404 supplies a clear return-home action.
- Crawling all ordinary same-origin links discovered in the root, demo, Privacy, Terms, and 404 shells produced successful responses. The 404 page's own skip fragment correctly remains a fragment on its intentional 404 document.
- The clean browser suite includes Axe checks with zero violations, keyboard entry, mobile targets/overflow, and reduced motion. Fresh mobile and desktop page loads produced no console errors.
- The warm ruled-paper field-notebook surface, serif/monospace pairing, original notebook artwork, verification stamp, and restrained motion are visibly specific to an archive-audit task. They do not resemble a generic SaaS hero or card template.

## Missed leverage

No missing AI, sync, import, or export requirement was found. The product already imports the local EML/MBOX formats implied by the job, reconciles an optional attachment folder, and exports HTML, CSV, and JSON receipts. Sending private email archives to an AI service or adding sync would conflict with the stated local-only purpose. No decorative AI feature or embedded provider key was found.

## What would make this perfect

Keep the current standards intact as the parser and service worker evolve: retain the one-click in-memory demo, preserve its storage-isolation request test, and rerun every registered claim from a clean clone for each release. There is no identified product change required for acceptance in this round.
