# Adversarial first-read review 1 — Archive Audit

**Target:** `https://message-archive-audit.sociobot.in`  
**Reviewed:** 2026-08-29 UTC  
**Repository HEAD:** `6c1d18c`  
**Verdict:** **FAIL**

This is a full rereview, not a diff review. The product has a clear, distinctive notebook visual treatment and its core parsing, exports, privacy boundary, offline reload, and registered claim tests work. It still has blocking demo and routing failures, plus the findings below. A PASS is not possible while any remain.

## Cold first read

Fresh cacheless Chromium sessions were opened at 390×844 and 1440×900 before scrolling. On both screens, the reviewer could answer all three required questions:

- **What it does:** checks an email export and makes an audit record of messages and attachments before access ends.
- **For whom:** people leaving an account or device.
- **What to click first:** **Try it with sample data**.

The exact first-screen copy that made this clear was: “Check an email export before access ends”; “For people leaving an account or device who need a clear record of saved messages and attachments.”; and “Try it with sample data.” This first-read check passes. The primary button is visible and 44px or larger on the phone. The first screen has no horizontal overflow or console errors.

## Findings

### Blocking

#### F-1-1 — The sample action does not show the completed sample in its first screen

**Location / evidence:** live `/demo`, entered by clicking the home-screen **Try it with sample data** at 390×844. The demo banner is visible and the audit completes, but after navigation `scrollY` is `0` and `#results` begins at `2008px`, well below the 844px viewport. The visitor sees the marketing hero again, not “Archive inventory complete,” the metrics, or the sample ledger. `src/main.ts` calls `results.scrollIntoView()` in `loadDemo()`, but the completed page navigation resets the viewport afterwards.

**Why this fails:** the demo contract requires the first screen after one click to already show the product being used with realistic sample data. The exact promise “The sample opens a complete audit. No setup is needed.” is not fulfilled in the visible first screen. This is also the remaining, half-fixed portion of the earlier demo finding.

**Concrete fix:** make `/demo` render or scroll to the completed receipt after the initial layout/navigation has settled (for example, defer the scroll until the next animation frame after the route has loaded), and add a live-style Playwright assertion that `#results` intersects the viewport immediately after clicking the home action at 390px and desktop. Keep the demo banner visible with the results.

#### F-1-2 — Unknown deep links return the ordinary app with HTTP 200 instead of the designed 404

**Location / evidence:** `GET /missing-review-link` on the live domain returns `200 text/html` and renders the home app. `GET /404` correctly returns `404`, but `public/staticwebapp.config.json` sends arbitrary navigation paths to `/index.html`, while `src/main.ts` only distinguishes `/demo` from the home app.

**Why this fails:** a visitor following or typing a broken internal URL is told they are on the product home page rather than that the page does not exist. This is broken routing and is not a real site-wide 404.

**Concrete fix:** configure known application routes (`/` and `/demo`) and unknown-path handling so unknown routes return the designed `404.html` with HTTP 404, or add an explicit client route guard plus host configuration that preserves a 404 response. Add a crawl/request test for an arbitrary nonexistent path, asserting both status 404 and the “Page not found” page.

#### F-1-3 — Route changes do not move focus to the new h1 or announce the destination

**Location / evidence:** on the live site, clicking **Privacy** from `/` loads `/privacy/`; immediately afterwards `document.activeElement` is `BODY`, the h1 is “Your archive stays on this device,” and the document has no `[aria-live]` region. Going Back to `/` likewise leaves focus on `BODY`. The same omission is visible in the static legal documents.

**Why this fails:** keyboard and screen-reader users receive neither the required focus placement nor an announced destination after a route change.

**Concrete fix:** use a shared route-change helper (or page-load script for the static documents) that focuses the page h1 with `tabindex="-1"` and writes the destination into an `aria-live="polite"` status region. Add browser tests for Home → Privacy → Back, asserting h1 focus and the announcement each time.

### Minor

#### F-1-4 — Legal and 404 routes do not meet the required per-route metadata contract

**Location / evidence:** live `/privacy/` and `/terms/` have titles, descriptions, canonicals, and an SVG favicon, but no Open Graph metadata, Twitter card metadata, apple-touch icon, or theme color. Live `/404` has no description, canonical, Open Graph/Twitter metadata, favicon, apple-touch icon, or theme color.

**Why this matters:** shared links to these routes have incomplete previews, and the route set does not consistently identify the product.

**Concrete fix:** give each document its own plain description, canonical, `og:title`/`og:description`/`og:image`/`og:url`, Twitter equivalents, `/icons/icon.svg`, `/icons/icon-192.png`, and the notebook `theme-color`. Add a metadata test that visits every public route.

#### F-1-5 — Header and footer are not consistent across routes

**Location / evidence:** the app shell header (`src/main.ts`) has Demo, How it works, Privacy, and the theme control; the legal documents replace How it works and the theme control with Terms. The app footer says “Built by Param Factory”; the Privacy, Terms, and 404 footers omit it. The 404 footer also omits Privacy and Terms.

**Why this matters:** navigation changes shape between pages, and the required shared shell is not actually shared.

**Concrete fix:** generate the legal and 404 shells from the same header/footer markup or an equivalent static template. Keep the wordmark, Demo, How it works, Privacy, theme control where applicable, Privacy/Terms, “Built by Param Factory,” and build identity consistent on every route.

#### F-1-6 — “No setup is needed” is an unlisted, untested claim

**Location / exact quote:** home landing, immediately below the primary actions: “The sample opens a complete audit. No setup is needed.” `.factory/claims.json` has no claim entry for setup-free demo entry; `free-use` only asserts free exports and no account/purchase.

**Why this matters:** the claims registry says all visitor-relevant statements are testable. This sentence promises a result a visitor can rely on, yet it has no claim ID or direct clean-state assertion. It is additionally misleading until F-1-1 is fixed.

**Concrete fix:** after F-1-1, add a `demo-no-setup` claim and test from a fresh context that the home action needs no account, upload, configuration, or prior storage and shows the completed report in the viewport. Otherwise replace the sentence with copy that has no unproved promise.

#### F-1-7 — The product uses two names for the same input and two unclear names for stored/output records

**Location / exact quotes:** the hero says “email export”; the workspace heading says “Choose your message export”; the README alternates the same terms. The landing then says “A real audit stores only its report” but asks the visitor to “Save a complete … receipt,” without explaining the distinction.

**Why this matters:** a first-time visitor has to infer whether an email export differs from a message export, and whether a report differs from a receipt.

**Concrete fix:** use **email export** everywhere for the selected input. Use **saved audit summary** for the local metadata and **downloaded receipt** for the HTML/CSV/JSON output, or explicitly define the current terms once.

#### F-1-8 — Landing and README introduce unexplained technical jargon

**Location / exact quotes:** landing: “Reads standard MIME EML and text MBOX.” and “Check message counts, named attachments, missing files, and SHA-256 hashes.” README repeats MIME, MBOX, “base64,” “7-bit,” “SHA-256,” and “IndexedDB” without a plain-language first use.

**Why this matters:** these implementation labels do not tell a cold visitor what to choose or what a hash proves.

**Concrete fix:** write “Reads EML message files and MBOX email collections” on first use; write “file hashes (SHA-256)” where the technical value must be retained; remove base64/7-bit from visitor copy or parenthetically describe them as readable attachment encodings; and write “browser storage” before “IndexedDB” in technical documentation.

#### F-1-9 — One README sentence exceeds the 22-word cap and bundles four separate jobs

**Location / exact quote:** README paragraph 2 (26 words): “It counts messages, hashes readable base64 and 7-bit attachments with SHA-256, checks named files against an optional attachment folder, and exports HTML, CSV, and JSON receipts.”

**Why this matters:** it is difficult to parse on a first read and adds unnecessary encoding jargon.

**Concrete fix:** replace it with: “It counts messages and checks named attachment files. It hashes readable attachments. It exports HTML, CSV, and JSON receipts.”

#### F-1-10 — The 404 h1 is a metaphor instead of the direct page purpose

**Location / exact quote:** live `/404`, h1: “This page is not in the archive.”

**Why this matters:** the required heading rule is that a heading says what its section/page is. A page-not-found heading is more useful when direct, especially in browser history and screen-reader heading lists.

**Concrete fix:** change the h1 to “Page not found” and keep “The address does not match a page here.” as the explanatory sentence.

## Copy audit

Word counts treat a hyphenated term and a code identifier as one word. Navigation labels, headings, and controls are audited after the sentence lists.

### Landing-page sentences

| # | Sentence | Words | Result |
| --- | --- | ---: | --- |
| 1 | For people leaving an account or device who need a clear record of saved messages and attachments. | 17 | Pass |
| 2 | The sample opens a complete audit. | 6 | F-1-6 until separately claimed and F-1-1 is fixed |
| 3 | No setup is needed. | 4 | F-1-6 |
| 4 | Files stay on this device. | 5 | Covered by `local-only` |
| 5 | Works offline after the first visit. | 6 | Covered by `offline-reload` |
| 6 | Free. | 1 | Covered by `free-use` |
| 7 | No account. | 2 | Covered by `free-use` |
| 8 | Choose files from the exported attachment folder. | 7 | Pass |
| 9 | Reads standard MIME EML and text MBOX. | 7 | F-1-8 |
| 10 | It cannot read encrypted or provider-only stores. | 7 | Pass; useful limit |
| 11 | Choose EML or MBOX exports and an optional attachment folder. | 10 | F-1-7/F-1-8 |
| 12 | Check message counts, named attachments, missing files, and SHA-256 hashes. | 10 | F-1-8 |
| 13 | Save a complete HTML, CSV, or JSON receipt beside the source export. | 12 | Pass after F-1-7 terminology is resolved |
| 14 | Archive bytes stay in this browser. | 6 | Covered by `local-only`; prefer “files” over “bytes” |
| 15 | A real audit stores only its report until you clear it. | 11 | F-1-7 terminology |
| 16 | Demo reports stay in memory. | 5 | Covered by `local-only`; F-1-7 terminology |
| 17 | The receipt inventories selected files. | 5 | Pass |
| 18 | It cannot prove that a provider included every message. | 9 | Pass; useful limit |
| 19 | Check email exports before account or device access ends. | 9 | Pass |
| 20 | Original generated artwork. | 3 | Provenance label; no user-action copy |

### README sentences

| # | Sentence | Words | Result |
| --- | --- | ---: | --- |
| 1 | Archive Audit checks email exports before account or device access ends. | 11 | Pass |
| 2 | It is for people who need a clear record of saved messages and attachments. | 14 | Pass |
| 3 | It reads standard MIME EML and text MBOX files in the browser. | 12 | F-1-8 |
| 4 | It counts messages, hashes readable base64 and 7-bit attachments with SHA-256, checks named files against an optional attachment folder, and exports HTML, CSV, and JSON receipts. | 26 | F-1-9 and F-1-8 |
| 5 | Messages without attachments remain in every receipt. | 7 | Covered by `receipt-exports` |
| 6 | Message and attachment bytes stay on the device. | 8 | Covered by `local-only` |
| 7 | A real audit stores only report metadata in IndexedDB, and that report survives reload until cleared. | 16 | F-1-7/F-1-8; persistence is covered by `report-persistence` |
| 8 | The complete audit and every receipt format are free and need no account. | 13 | Covered by `free-use` |
| 9 | The installed app works offline after the first visit. | 9 | Covered by `offline-reload` |
| 10 | Open `/demo` or choose “Try it with sample data.” | 9 | Pass |
| 11 | The sample contains two EML files and a two-message MBOX. | 10 | F-1-8 |
| 12 | Demo state stays in memory and never reads or writes the real report database. | 14 | Covered by `local-only`; F-1-7 terminology |
| 13 | `npm run build` writes the static deployment to `dist/`. | 9 | Pass for deployer documentation |
| 14 | The browser suite uses Playwright 1.58.2 and validates every claim in `.factory/claims.json`. | 12 | F-1-6 means this is presently overbroad |
| 15 | Archive Audit does not decrypt mail, recover missing messages, contact providers, or read proprietary message databases. | 16 | Pass; useful limit |
| 16 | A receipt inventories selected files; it does not certify that a provider supplied every message. | 15 | Pass |
| 17 | See Privacy and Terms. | 4 | Pass |
| 18 | The project is available under the MIT License. | 8 | Pass |
| 19 | Deploy `dist/` as a static site. | 6 | Pass for deployer documentation |
| 20 | Keep `staticwebapp.config.json` at the deployment root so routes, security headers, and cache policies apply. | 14 | Pass for deployer documentation |
| 21 | HTTPS is required for service workers. | 6 | Pass for deployer documentation |

Headings are mostly direct and controls name their outcomes: **Try it with sample data**, **Check your own export**, **Audit selected files**, **Save HTML receipt**, **Export CSV**, and **Export JSON** pass. F-1-10 is the exception. There are no marketing-adjective, generic-gradient, or mood-heading findings on the landing page. The visual system is visibly product-specific: ruled paper, serif/monospace evidence labels, and the original notebook artwork match `.factory/design.md` rather than a generic SaaS template.

## Demo, privacy, offline, and claims

- The live demo banner is present: “Demo — sample data, nothing is saved,” with **Reset demo** and **Start for real**.
- A live sandbox boundary check first saved a real `real.eml` report, then entered `/demo` and reset it. The stored real report was byte-for-byte unchanged. The demo produced 4 messages, 2 named/hashed attachments, and 0 missing references. Its requests were only same-origin: document, app JS/CSS, and local hero image.
- A fresh live demo acquired service-worker control and reloaded offline with “Archive inventory complete” visible and no console errors.
- The registered claim commands were run individually after `npm ci` and all passed: `mime-audit`, `local-only`, `offline-reload`, `receipt-exports`, `report-persistence`, and `free-use`. `npm test` (13), `npm run lint`, `npm run build`, and the full `npm run test:e2e` suite (11) also passed.
- No AI capability is needed for this local evidence-checking job. Importing EML/MBOX, attachment-folder reconciliation, and three receipt exports are present; adding a gateway AI feature would send sensitive archive context and would not be an implied missing capability.

The demo’s isolation, reset action, real-data protection, request log, and offline behavior pass. F-1-1 is specifically its first-visible-result failure.

## Structure and crawl

All actual links discovered on `/`, `/demo`, `/privacy/`, `/terms/`, and `/404` resolve successfully (or use page fragments); no linked URL is dead. The root and demo have one h1, `main`, `lang=en`, descriptive title, canonical, Open Graph/Twitter metadata, favicon, apple-touch icon, and no load console errors. Privacy and Terms have one h1, `main`, title, description, canonical, and favicon. The 404 is designed and returns 404 only at its explicit URL. F-1-2 through F-1-5 identify the remaining route contract defects.

The live root has restrictive same-origin CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, and restrictive permissions policy. Hashed JS has immutable one-year caching. These checks pass.

## Earlier-history recheck

There are no prior `.factory/review-*.md` or `.factory/polish-*.md` files. I read `.factory/verification.md`, `.factory/verification-2.md`, and the prior handoff, and checked every earlier defect against live behavior and source.

| Earlier finding | Current confirmation |
| --- | --- |
| Missing claims registry/tests | Fixed: six entries exist and each declared command passed. |
| Unclear first screen / missing demo | First-screen wording and demo isolation are fixed; the required first-visible completed sample remains unfixed as F-1-1. |
| Broken service worker / offline reload | Fixed: live controlled demo reloads offline. |
| Invalid mail certified / 7-bit attachment false missing | Fixed by parser tests and current browser suite. |
| HTML/CSV omitted no-attachment messages | Fixed by receipt export claim test. |
| Keyboard-inaccessible ledger | Fixed: the table region is focusable and Axe check passes. |
| Dead paid checkout / unsupported paid promise | Fixed: no paid offer or checkout link remains. |
| Demo wrote real IndexedDB | Fixed: live real-report-before/demo/reset check left real storage unchanged. |
| Folder hashes absent from HTML/CSV | Fixed by the current export regression test. |
| CSV formula injection | Fixed by the current export regression test. |
| 390px overflow / undersized controls | Fixed: current 390px and desktop suite passes. |
| Missing root metadata and explicit 404 | Root metadata is fixed and `/404` is designed; unknown URLs remain broken as F-1-2, and non-root route metadata remains F-1-4. |
| Missing security headers | Fixed: CSP, framing, referrer, MIME, and permissions headers are live. |
| Short cache lifetime for hashed assets | Fixed: live JS is `public, max-age=31536000, immutable`. |
| Legal pages lacked a shell | Header/footer landmarks now exist, but they are not the same shared shell; see F-1-5. |

## What would make this perfect

Make the demo land directly on a visibly completed receipt, return a real 404 for every unknown path, and implement announced h1 focus on every route transition. Then finish the shared metadata/shell and plain-copy repairs, register the no-setup promise as a claim, and rerun this entire checklist. At that point the product would be clear, tryable, privacy-honest, and structurally complete for a first-time phone visitor.
