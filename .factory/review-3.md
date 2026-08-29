# Adversarial first-read review 3 — Archive Audit

- Target: <https://message-archive-audit.sociobot.in>
- Reviewed: 2026-08-29 UTC
- Repository HEAD: `6a8e99c993358100ec26378c9bcec0a83dfc6763`
- Verdict: **FAIL**

This was a full fresh review of the deployed product and clean candidate clone. The first read, completed sample, registered tests, exports, offline flow, route behavior, metadata, accessibility, and visual identity pass. It fails because demo mode writes a real local-storage key. A phone visitor also loses the required Privacy header link with no replacement navigation.

## Cold first read

Fresh Chromium contexts opened `/` at 390×844 and 1440×900 before scrolling. On both screens the answers were immediately available:

| Question | Answer from first screen | Exact text |
| --- | --- | --- |
| What does this do? | Check an email export before access ends. | “Check an email export before access ends” |
| For whom? | People leaving an account or device who need an evidence record. | “For people leaving an account or device who need a clear record of saved messages and attachments.” |
| What should I click first? | Open the sample audit. | “Try it with sample data” |

The mobile primary action was visible without scrolling, was 44px or taller, and the page width was exactly 390px with no horizontal overflow. This first-read check passes.

## Findings

### Blocking

#### F-3-1 — Demo mode persists a real color preference

- **Location / exact promise:** live `/?demo=1` banner: “Demo — sample data, nothing is saved.” The demo also exposes **Use dark color theme**. Source: `src/main.ts:155-156` and `src/main.ts:288-291`.
- **Reproduction:** in a fresh browser context, load `/?demo=1`. `localStorage` is initially empty. Click **Use dark color theme**. It becomes `{ "archive-audit-theme": "dark" }`. Click **Start for real**; `/` opens with that same key and the dark theme still applied.
- **Why this blocks:** the demo sandbox must not read or write real storage. `archive-audit-theme` is an ordinary production key, not a `demo:` namespace key, and the result survives leaving the demo. The claim test `@claim:local-only` passes only because it does not operate the demo’s theme control; it therefore fails to prove the banner’s “nothing is saved” promise for the whole demo flow.
- **Concrete fix:** while the demo banner is present, keep color state in memory or in a `demo:`-prefixed key and do not read or write `archive-audit-theme`. Extend `@claim:local-only` (or add one claim test) to click the theme control, inspect both local storage and IndexedDB, leave demo, and prove that real storage is byte-for-byte unchanged.

### Minor

#### F-3-2 — The phone header removes Privacy without a replacement menu

- **Location / evidence:** at 390px the visible header contains the wordmark, **Demo**, and the theme button, but no **Privacy** link. `src/style.css:598-605` sets both the second navigation link (**How it works**) and third link (**Privacy**) to `display: none`. The desktop header does contain Privacy.
- **Why this matters:** the required shared header navigation includes Privacy. On the phone—the explicitly reviewed first-use viewport—a visitor reading “Files stay on this device” has no policy link in the header and must scroll to the footer to find it.
- **Concrete fix:** keep **Privacy** visible at this width, or replace the hidden links with a keyboard-operable menu containing **How it works** and **Privacy**. Add a 390px browser assertion that the header offers a Privacy link.

## Copy audit

Counts use whitespace-delimited tokens; punctuation does not add a word; a hyphenated term, format, version, or path is one token. No audited sentence exceeds 22 words. EML/MBOX are defined as file types before use, SHA-256 is introduced as a file hash, and IndexedDB follows “browser storage.” No banned marketing adjective, undefined metaphor heading, inconsistent product term, or non-result primary action was found.

### Landing-page sentences

| # | Sentence | Words | Result |
| ---: | --- | ---: | --- |
| 1 | For people leaving an account or device who need a clear record of saved messages and attachments. | 17 | Pass |
| 2 | The sample opens a complete audit. | 6 | `demo-no-setup` |
| 3 | No setup is needed. | 4 | `demo-no-setup` |
| 4 | Files stay on this device. | 5 | `local-only` |
| 5 | Works offline after the first visit. | 6 | `offline-reload` |
| 6 | Free. | 1 | `free-use` |
| 7 | No account. | 2 | `free-use` |
| 8 | A field notebook with an envelope and attachment photographs ready for checking. | 12 | Useful image alternative |
| 9 | Reads EML message files and MBOX email collections. | 8 | `mime-audit` |
| 10 | It does not decrypt mail or access email providers. | 9 | `scope-limits` |
| 11 | Choose EML message files or MBOX email collections and an optional attachment folder. | 13 | Direct instruction |
| 12 | Check message counts, named attachments, missing files, and file hashes (SHA-256). | 11 | `mime-audit`, `missing-attachment-detection` |
| 13 | Save a complete HTML, CSV, or JSON receipt beside the email export. | 12 | `receipt-exports` |
| 14 | Files stay in this browser. | 5 | `local-only` |
| 15 | A real audit saves a local audit summary until you clear it. | 12 | `report-persistence`, `clear-report` |
| 16 | Demo audit summaries stay in memory. | 6 | `local-only`; F-3-1 exposes a separate persisted preference |
| 17 | A downloaded receipt lists only the files you select. | 8 | `scope-limits` |
| 18 | Check email exports before account or device access ends. | 9 | Direct product summary |

The headings (**Check an email export before access ends**, **Choose an email export**, **Make a receipt in three steps**, **File storage and audit limits**) name their content. Controls including **Try it with sample data**, **Check your own export**, **Audit selected files**, **Save HTML receipt**, **Export CSV**, **Export JSON**, **Reset demo**, and **Clear local report** name their outcomes. No landing copy rewrite is needed apart from fixing the false demo-storage condition in F-3-1.

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
| 16 | Demo state stays in memory and never reads or writes the real audit database. | 14 | `local-only`; F-3-1 is the untested local-storage escape |
| 17 | `npm run build` writes the static deployment to `dist/`. | 9 | Verified build instruction |
| 18 | The browser suite uses Playwright 1.58.2 and validates each listed claim in `.factory/claims.json`. | 13 | Verified |
| 19 | Archive Audit does not decrypt mail or access email providers. | 9 | `scope-limits` |
| 20 | A receipt lists only files you select. | 7 | `scope-limits` |
| 21 | See Privacy and Terms. | 4 | Direct links |
| 22 | The project is available under the MIT License. | 8 | Verified |
| 23 | Deploy `dist/` as a static site. | 6 | Deploy instruction |
| 24 | Keep `staticwebapp.config.json` at the deployment root so routes, security headers, and cache policies apply. | 14 | Deploy instruction |
| 25 | HTTPS is required for service workers. | 6 | Deploy requirement |

## Demo, privacy, and claims

- One click from `/` opened `/?demo=1` and put the completed receipt in the first viewport on both sizes. It showed four messages, two named/hashed attachments, and zero missing references.
- The persistent banner, **Reset demo**, and **Start for real** were present. Changing the sample then resetting it restored the bundled four-message report.
- Fresh-context request logs for root → demo contained only same-origin static GET requests. The service-worker-controlled demo reloaded successfully offline after a first online visit.
- The real `archive-audit` IndexedDB report stayed unchanged while the demo audit and reset ran. F-3-1 is a distinct local-storage violation, not an audit-report IndexedDB write.
- From a clean clone at `/tmp/archive-audit-review3.sJaDTc`, each exact command in `.factory/claims.json` passed independently: `mime-audit`, `local-only`, `offline-reload`, `receipt-exports`, `report-persistence`, `free-use`, `demo-no-setup`, `missing-attachment-detection`, `folder-inventory`, `no-telemetry`, `demo-reset`, `clear-report`, and `scope-limits`.
- The registered tests pass, but `local-only` is incomplete because it does not exercise every demo control. F-3-1 is therefore a behavior failure of the published sandbox promise, not a passing claim gate.

## Earlier-history recheck

Every earlier review and polish report plus the prior handoff was read. The earlier findings below were retested live and in source; none is reopened under its earlier identifier.

| Earlier finding | Current result |
| --- | --- |
| F-1-1 completed sample below first screen | Fixed: results intersected both fresh viewports after one click. |
| F-1-2 unknown deep links returned home with 200 | Fixed: `/missing-review-3` returned the designed 404 with HTTP 404. |
| F-1-3 route focus and announcement absent | Fixed: Home → Privacy → Back focused each destination h1 and announced it. |
| F-1-4 incomplete non-root metadata | Fixed: root, demo, Privacy, Terms, and 404 all had title, description, canonical, OG/Twitter data, favicon, Apple icon, and theme color. |
| F-1-5 inconsistent shell | Fixed across routes: wordmark, shared navigation structure, footer links, Param Factory credit, and build label are present. F-3-2 is the separate phone-only visibility gap. |
| F-1-6 unlisted setup-free demo promise | Fixed: `demo-no-setup` exists and passed. |
| F-1-7 inconsistent archive terms | Fixed: **email export**, **local audit summary**, and **receipt** are used consistently. |
| F-1-8 unexplained jargon | Fixed by plain first-use definitions. |
| F-1-9 overlong README sentence | Fixed: every README sentence is at most 14 words. |
| F-1-10 metaphorical 404 h1 | Fixed: the h1 is “Page not found.” |
| F-2-1 missing-file claim | Fixed: `missing-attachment-detection` passed. |
| F-2-2 folder inventory claim | Fixed: `folder-inventory` passed. |
| F-2-3 no-telemetry claim | Fixed: `no-telemetry` passed. |
| F-2-4 reset and deletion claim coverage | Fixed: `demo-reset` and `clear-report` passed. |
| F-2-5 scope-limit coverage | Fixed: `scope-limits` passed. |
| F-2-6 demo social metadata | Fixed: `/demo` and `?demo=1` carried Demo title, description, canonical, OG, and Twitter values. |
| F-2-7 generic privacy h2 | Fixed: “File storage and audit limits” is the h2. |
| F-2-8 incorrect copy-audit counts | Fixed in the previous repair artifact. |

## Structure, accessibility, and identity

- `/`, `/demo`, `/?demo=1`, `/privacy/`, `/terms/`, and `/404` have the expected route-specific titles, one h1, main landmark, plain description, canonical, OG/Twitter data, icons, and theme color. Unknown paths return the designed 404 with HTTP 404.
- Crawled internal links and fragment targets resolved. Home → Privacy → Back restored focus to each h1 and populated the polite route announcement.
- Fresh mobile Axe scans of root, demo, Privacy, Terms, and 404 found zero violations. There were no console errors except the browser’s expected failed-resource message for the intentional 404 navigation.
- The ruled-paper surface, generated notebook art, Georgia/evidence-label typography, ink palette, stamp treatment, and reduced-motion fallback are distinct and product-specific rather than a generic SaaS template.
- F-3-2 is the remaining structure exception.

## Missed leverage

No omitted AI, sync, import, or export is required by this job. The tool already imports the relevant local EML/MBOX files, reconciles an optional attachment folder, and exports portable HTML, CSV, and JSON receipts. Sending private message archives to an AI gateway or adding sync would conflict with the local-only purpose. No decorative AI feature or embedded provider key was found.

## What would make this perfect

Make every demo interaction—including theme changes—ephemeral and separately namespaced, then prove it in the local-only browser claim. Keep Privacy reachable from the 390px header through a visible link or accessible menu. Rerun all claims from a clean clone and the live sandbox checks; a PASS requires both findings to be absent.
