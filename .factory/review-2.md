# Adversarial first-read review 2 — Archive Audit

- Target: `https://message-archive-audit.sociobot.in`
- Reviewed: 2026-08-29 UTC
- Repository HEAD: `de802caacd6dc8b6b6772d7da5413d7d2838a725`
- Verdict: **FAIL**

This is a full review from fresh browser contexts, not a diff review. No blocking defect was reproduced: the first screen is clear, the demo is immediately useful and isolated, all seven registered claim tests pass, unknown routes return the designed 404, and the local quality gates pass. The verdict is still FAIL because eight minor findings remain. Under the requested standard, any finding prevents PASS.

## Cold first read

Fresh Chromium contexts opened the deployed root at 390×844 and 1440×900 before scrolling.

| Question | First-screen answer | Exact text that supplied it |
| --- | --- | --- |
| What does this do? | It checks an email export before access ends and records saved messages and attachments. | “Check an email export before access ends” |
| For whom? | People leaving an account or device. | “For people leaving an account or device who need a clear record of saved messages and attachments.” |
| What should I click first? | Open the completed sample audit. | “Try it with sample data” and “The sample opens a complete audit. No setup is needed.” |

All three answers are present without scrolling on both viewports. The phone shows the primary action at about y=308, followed by the real-data action and all three facts. There was no load console error in the normal fresh contexts. This check passes.

## Findings

### Blocking

None.

### Minor

#### F-2-1 — Missing-file detection is an unlisted claim

- Exact locations: root metadata, “Check EML and MBOX exports, hash attachments, **find missing files**, and save a local receipt”; landing “How it works,” “Check message counts, named attachments, **missing files**, and file hashes (SHA-256).”
- Evidence: `.factory/claims.json` has no claim whose text promises missing-file detection. `@claim:mime-audit` does not assert a missing reference, and `@claim:receipt-exports` does not assert that the product detects one. A separate untagged regression happens to exercise missing states, but that does not satisfy the one-listed-claim/one-tagged-test contract.
- Why it matters: finding missing attachment files is a core outcome a visitor may rely on, yet it is absent from the auditable claim registry.
- Concrete fix: add a `missing-attachment-detection` entry and one `@claim:missing-attachment-detection` test. From a clean context, select a message that names an attachment and a folder that omits it; assert the missing count, row status, and exported receipt. Alternatively, remove “find missing files” and “missing files” from public copy.

#### F-2-2 — The README’s folder-inventory visibility promise is unlisted

- Exact location: README, “Every selected folder file remains visible with its relative path and match status.”
- Evidence: `receipt-exports` promises inclusion in receipts, not visibility in the product UI. Its tagged test does not assert that every chosen folder path and match status is shown. The untagged duplicate/orphan test is not a registered claim test.
- Why it matters: a person auditing a directory may rely on seeing unreferenced files, not merely receiving them in a download.
- Concrete fix: register `folder-inventory` and assert one matched, one ambiguous, and one unreferenced relative path and status in the visible ledger. If UI visibility is not contractual, rewrite the README to the already registered receipt claim.

#### F-2-3 — The no-telemetry promise is not registered or adequately covered by `local-only`

- Exact location: `/privacy/`, “The app makes no analytics, advertising, account, or payment requests.”
- Evidence: `local-only` promises that message/attachment bytes stay on-device and its tagged test only requires requests to be same-origin. A same-origin analytics or account request would still pass that test.
- Why it matters: this is a separate privacy promise. A visitor could rely on it even when no source bytes are uploaded.
- Concrete fix: add `no-telemetry` to `.factory/claims.json`. Its tagged Playwright flow should cover landing, demo, a real audit, and exports, and assert that every request is an expected static same-origin GET with no analytics, account, billing, advertising, or AI endpoint. The current deployed flow passed that stronger manual request-log check.

#### F-2-4 — Reset and deletion controls are unregistered claims

- Exact locations: demo banner button “Reset demo”; real report button “Clear local report”; `/privacy/`, “Use ‘Clear local report’ to remove a saved summary.”
- Evidence: `demo-no-setup` checks entry to the sample but not reset. `report-persistence` checks save/reload and source-body omission but not clearing. Untagged or independent tests do not make these statements registered claims.
- Why it matters: both actions promise destructive state changes. Their behavior should remain covered when storage code changes.
- Concrete fix: extend the relevant claim text and tagged tests, or add `demo-reset` and `clear-report`. Mutate the demo before reset; for clearing, test both cancel and confirm, reload, and assert that source files remain unchanged.

#### F-2-5 — Published scope limitations are absent from the claims registry

- Exact locations: landing, “It cannot read encrypted or provider-only stores” and “It cannot prove that a provider included every message”; README/Terms, “Archive Audit does not decrypt mail, recover missing messages, contact providers, or read proprietary message databases.”
- Evidence: no claim entry covers rejection of encrypted/proprietary input, absence of provider access, or the selected-file-only boundary.
- Why it matters: these are useful, honest limits, but they are still statements a visitor relies on. The registry cannot currently detect a regression that starts provider traffic or labels a partial selection as certified.
- Concrete fix: register a `scope-limits` claim. Test rejection of controlled encrypted/unsupported input and absence of provider requests. Rewrite the unverifiable certification sentence as the observable boundary “The receipt lists only the files you select,” then assert that boundary in the tagged test.

#### F-2-6 — Demo social metadata describes the home route

- Exact location: live `/demo` and `/?demo=1` after load. The document title is “Demo — Archive Audit” and the canonical is `/demo`, but `og:title` and `twitter:title` remain “Archive Audit — check an email export”; `og:url` remains the root URL.
- Code location: `src/main.ts:107-108` changes only `document.title` and the canonical. The metadata test checks element counts, not values.
- Why it matters: sharing the demo URL produces home-page identity instead of identifying the sample route, and route metadata contradicts itself.
- Concrete fix: set route-specific description, `og:title`, `og:description`, `og:url`, `twitter:title`, and `twitter:description` to the demo values. Update the route metadata test to assert exact values, not only presence.

#### F-2-7 — The privacy/limits h2 is a generic slogan, not a section name

- Exact location: landing h2, “Your files remain under your control.” The useful “Privacy and limits” text is only an eyebrow paragraph, so it is absent from the heading outline.
- Why it matters: the h2 could appear on any local-first product and does not tell a screen-reader heading list that the section also explains audit limits.
- Concrete fix: use the h2 “File storage and audit limits.” Keep the supporting sentences below it.

#### F-2-8 — The repository copy audit contains three incorrect word counts

- Exact location: `.factory/copy-audit.md`. It records 16 words for the 17-word audience sentence, 12 for the 13-word “Choose EML…” sentence, and 10 for the 11-word “Check message counts…” sentence.
- Why it matters: none crosses the 22-word cap, but the required audit artifact is not reproducible as written.
- Concrete fix: change those counts to 17, 13, and 11 and state the token-counting convention used.

## Copy audit

Counts below treat a whitespace-delimited hyphenated term, version, path, or file format as one word. Punctuation does not add a word. No sentence exceeds 22 words, and no banned marketing adjective appears.

### Landing-page sentences

| # | Sentence | Words | Result |
| ---: | --- | ---: | --- |
| 1 | For people leaving an account or device who need a clear record of saved messages and attachments. | 17 | Pass |
| 2 | The sample opens a complete audit. | 6 | Covered by `demo-no-setup` |
| 3 | No setup is needed. | 4 | Covered by `demo-no-setup` |
| 4 | Files stay on this device. | 5 | Covered by `local-only` |
| 5 | Works offline after the first visit. | 6 | Covered by `offline-reload` |
| 6 | Free. | 1 | Covered by `free-use` |
| 7 | No account. | 2 | Covered by `free-use` |
| 8 | A field notebook with an envelope and attachment photographs ready for checking. | 12 | Useful image alternative |
| 9 | Reads EML message files and MBOX email collections. | 8 | Covered by `mime-audit` |
| 10 | It cannot read encrypted or provider-only stores. | 7 | F-2-5 |
| 11 | Choose EML message files or MBOX email collections and an optional attachment folder. | 13 | Pass |
| 12 | Check message counts, named attachments, missing files, and file hashes (SHA-256). | 11 | F-2-1 |
| 13 | Save a complete HTML, CSV, or JSON receipt beside the email export. | 12 | Covered by `receipt-exports` |
| 14 | Files stay in this browser. | 5 | Covered by `local-only` |
| 15 | A real audit saves a local audit summary until you clear it. | 12 | Persistence covered; clearing is F-2-4 |
| 16 | Demo audit summaries stay in memory. | 6 | Covered by `local-only` |
| 17 | A downloaded receipt inventories selected files. | 6 | Covered by `receipt-exports` |
| 18 | It cannot prove that a provider included every message. | 9 | F-2-5 |
| 19 | Check email exports before account or device access ends. | 9 | Pass |

### Landing headings, labels, and actions

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | Direct action |
| Archive Audit | 2 | Product wordmark |
| Demo | 1 | Direct route label |
| How it works | 3 | Direct section label |
| Privacy | 1 | Direct route label |
| Use dark color theme | 4 | Direct control name |
| Local email archive check | 4 | Informative label |
| Check an email export before access ends | 7 | Clear h1 |
| Try it with sample data | 5 | Result-naming action |
| Check your own export | 4 | Result-naming action |
| Original generated notebook study | 4 | Asset provenance |
| New audit | 2 | Direct label |
| Choose an email export | 4 | Direct h2 |
| Email exports | 2 | Direct field label |
| EML message files or MBOX email collections | 7 | Input description |
| Attachment folder optional | 3 | Direct field label |
| Choose files from the exported attachment folder | 7 | Direct instruction |
| Audit selected files | 3 | Result-naming button |
| How it works | 3 | Direct label |
| Make a receipt in three steps | 6 | Direct h2 |
| Privacy and limits | 3 | Useful text, but not the heading element |
| Your files remain under your control | 7 | F-2-7 |
| Privacy / Terms / Built by Param Factory | 1 / 1 / 4 | Direct footer labels |
| Original generated artwork · Build repair-5 | 5 | Provenance and build identity |

Terminology is consistent: **email export** is the input, **audit** is the operation, **local audit summary** is saved metadata, and **receipt** is the downloaded output. EML and MBOX are introduced as message files and email collections; SHA-256 is introduced as a file hash; IndexedDB follows “browser storage.” No unresolved jargon, metaphor, mood heading other than F-2-7, or non-result action label was found.

### README sentences

| # | Sentence | Words | Result |
| ---: | --- | ---: | --- |
| 1 | Archive Audit checks email exports before account or device access ends. | 11 | Pass |
| 2 | It is for people who need a clear record of saved messages and attachments. | 14 | Pass |
| 3 | It reads EML message files and MBOX email collections in the browser. | 12 | Covered by `mime-audit` |
| 4 | It counts messages and checks named attachment files. | 8 | Counts covered; missing-file outcome is F-2-1 where stated elsewhere |
| 5 | It hashes readable attachments as file hashes (SHA-256). | 8 | Covered by `mime-audit` |
| 6 | Every selected folder file remains visible with its relative path and match status. | 13 | F-2-2 |
| 7 | It exports HTML, CSV, and JSON receipts. | 7 | Covered by `receipt-exports` |
| 8 | Messages without attachments remain in every receipt. | 7 | Covered by `receipt-exports` |
| 9 | Message and attachment bytes stay on the device. | 8 | Covered by `local-only` |
| 10 | A real audit stores a local audit summary in browser storage (IndexedDB). | 12 | Covered by `report-persistence` |
| 11 | That summary survives reload until cleared. | 6 | Persistence covered; clearing is F-2-4 |
| 12 | The complete audit and every receipt format are free and need no account. | 13 | Covered by `free-use` |
| 13 | The installed app works offline after the first visit. | 9 | Covered by `offline-reload` |
| 14 | Open `/?demo=1`, `/demo`, or choose “Try it with sample data.” | 10 | Direct instruction |
| 15 | The sample contains two EML message files and one MBOX email collection. | 12 | Confirmed in demo fixture |
| 16 | Demo state stays in memory and never reads or writes the real audit database. | 14 | Covered by `local-only` |
| 17 | `npm run build` writes the static deployment to `dist/`. | 9 | Confirmed by clean build |
| 18 | The browser suite uses Playwright 1.58.2 and validates each listed claim in `.factory/claims.json`. | 13 | Version and listed tests confirmed |
| 19 | Archive Audit does not decrypt mail, recover missing messages, contact providers, or read proprietary message databases. | 16 | F-2-5 |
| 20 | A receipt inventories selected files; it does not certify that a provider supplied every message. | 15 | F-2-5 |
| 21 | See Privacy and Terms. | 4 | Direct links |
| 22 | The project is available under the MIT License. | 8 | Confirmed by `LICENSE` |
| 23 | Deploy `dist/` as a static site. | 6 | Direct instruction |
| 24 | Keep `staticwebapp.config.json` at the deployment root so routes, security headers, and cache policies apply. | 14 | Direct deploy instruction |
| 25 | HTTPS is required for service workers. | 6 | Direct deploy requirement |

README headings are **Archive Audit** (2), **Try the isolated demo** (4), **Run and verify** (3), **Limits** (1), and **Deploy** (1). Each names its section. No sentence exceeds 22 words.

## Demo, sandbox, privacy, and offline checks

- One click on **Try it with sample data** opened `/?demo=1`. After load (about 1.1 seconds in both checks), `#results` began at y≈64 and intersected the first viewport at 390×844 and 1440×900.
- The first demo screen showed “Archive inventory complete,” 4 messages, 2 named attachments, 2 hashed attachments, and 0 missing references.
- The sticky banner said “Demo — sample data, nothing is saved” and exposed **Reset demo** and **Start for real**.
- The demo was changed to a one-message report, then **Reset demo** restored four messages and removed the changed subject.
- A real report was saved before entering the demo. After demo use, reset, and **Start for real**, the serialized real report was byte-for-byte unchanged and restored on the home page.
- The live demo request log contained no cross-origin request. The broader recorded live flow contained only same-origin GETs. This confirms current behavior, while F-2-3 concerns registry coverage.
- After one online visit and service-worker control, the deployed demo reloaded offline with its completed four-message result.

The one-click demo, banner, sample realism, reset behavior, real-data isolation, request behavior, and offline path pass.

## Claims gate

The exact command in every `.factory/claims.json` entry was run independently after `npm ci` in a clean local clone of `de802ca`.

| Claim ID | Result | Observable evidence |
| --- | --- | --- |
| `mime-audit` | PASS | 4-message demo plus EML/MBOX, MIME filename/header, zero-byte and nested attachment checks |
| `local-only` | PASS | Requests remained on-origin; no real database was created in the fresh demo context |
| `offline-reload` | PASS | Controlled demo reloaded with network disabled |
| `receipt-exports` | PASS | HTML, CSV, and JSON contents were inspected |
| `report-persistence` | PASS | Metadata restored after reload without the controlled body marker |
| `free-use` | PASS | All receipt actions available without account or purchase |
| `demo-no-setup` | PASS | One click from a clean 390px home page showed results in the viewport |

No declared claim test failed. F-2-1 through F-2-5 list claim-like copy that is absent from the registry or stronger than its tagged assertion.

## Earlier-history recheck

I read `.factory/review-1.md`, `.factory/polish-1.md`, the existing `.factory/handoff.md`, and the verification report linked by that handoff. Every earlier review finding was checked in deployed behavior and source.

| Earlier finding | Live and code confirmation | Status |
| --- | --- | --- |
| F-1-1 demo result below the first screen | Results intersect the first viewport after load on mobile and desktop; deferred scroll logic and tagged test exist. | Fixed |
| F-1-2 unknown links rendered home with 200 | `/missing-review-2` returns the designed 404 with HTTP 404; config uses `responseOverrides`. | Fixed |
| F-1-3 route focus/announcement absent | Home → Privacy focuses its h1 and announces “Privacy — Archive Audit”; Back focuses the home h1 and announces it. | Fixed |
| F-1-4 route metadata incomplete | Privacy, Terms, and 404 have the required metadata and assets. The new demo-value mismatch is F-2-6, not a regression of the cited routes. | Fixed |
| F-1-5 shells inconsistent | Wordmark, nav structure, theme control, footer links, Param Factory credit, and build identity are present across routes. | Fixed |
| F-1-6 no-setup claim unlisted | `demo-no-setup` exists and its exact command passes. | Fixed |
| F-1-7 inconsistent input/report terms | Landing and README consistently use email export, local audit summary, and receipt. | Fixed |
| F-1-8 unexplained jargon | First-use wording now explains EML/MBOX and file hashes; IndexedDB follows browser storage. | Fixed |
| F-1-9 README sentence over 22 words | The former 26-word sentence is split; every current README sentence is at most 16 words. | Fixed |
| F-1-10 metaphorical 404 h1 | The h1 is “Page not found.” | Fixed |

No earlier finding is unfixed, half-fixed, or regressed, so no F-1 identifier is reopened as blocking.

## Structure, accessibility, and identity

- Titles pass the route pattern: root “Archive Audit — check an email export,” Demo/Privacy/Terms route titles, and “Page not found — Archive Audit.” Each checked route has one h1, `lang="en"`, a main landmark, description, canonical, OG/Twitter tags, favicon, Apple icon, and theme color. F-2-6 concerns the demo values, not missing elements.
- The root, demo, Privacy, Terms, robots, sitemap, manifest, icons, and social image resolve. Every discovered internal link and fragment resolves as intended; the deliberate 404 route returns 404.
- Home → Privacy → Back restores the correct page and focuses/announces each destination h1.
- The 404 is designed in the notebook style and links home. Header/footer landmarks and Privacy/Terms links are present across the site.
- Factory `verify-url.sh` passed with no console errors, one h1, `lang`, main, image alternatives, and labeled buttons.
- Axe CLI 4.10.3 found zero violations on Home, Demo, Privacy, and Terms. Separate live dark/reduced-motion checks found no serious/critical Axe result, no 390px overflow, and animation durations no longer than 0.01 ms. The full Playwright suite checks keyboard access and 44px targets.
- The warm ruled-paper surface, generated notebook art, ink palette, serif/monospace evidence styling, stamp shapes, and restrained motion match `.factory/design.md` and are visibly distinct from a generic SaaS template.

## Full local gates

From the clean clone:

- `npm test`: PASS — 20 tests.
- `npm run lint`: PASS.
- `npm run build`: PASS — `dist/` produced; app JavaScript 23.24 kB raw / 8.78 kB gzip.
- `npm run test:e2e`: PASS — 15 tests.
- `npx @axe-core/cli` against four live routes: PASS — zero violations.
- `/opt/fleet/lib/verify-url.sh` against the live root: PASS.

## Missed leverage

No missing AI, sync, import, or export feature is implied strongly enough to add. The tool already accepts the standard local EML/MBOX inputs, reconciles an optional attachment folder, and exports three portable receipt formats. Sending private archive content to an AI gateway would conflict with the local-only job and would add no necessary step. Sync would create the same privacy conflict. No provider key or decorative AI feature is present.

## What would make this perfect

Register and directly test every public claim family, especially missing-file detection, visible folder inventory, no telemetry, state reset/deletion, and scope limits. Give `/demo` exact route-specific social metadata, replace the generic privacy h2 with “File storage and audit limits,” and correct the three counts in `.factory/copy-audit.md`. Then rerun this entire review from a clean clone and fresh deployed browser contexts. A PASS requires zero remaining findings and no untested claim.
