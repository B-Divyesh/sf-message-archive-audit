# Polish 1 — review finding closure

Target: `https://message-archive-audit.sociobot.in`  
Repair: `ebac50c6782759a5132c05160489e3a10cb172f4`

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | The home action now opens `/?demo=1`; completed demo results are positioned after load and the banner is sticky. | `@claim:demo-no-setup`; [live 390 screenshot](evidence/live-demo/viewport-390.png); cold live demo check. |
| F-1-2 | Removed catch-all navigation fallback and added only the explicit `/demo` rewrite; unknown paths use the 404 override. | `static response policy`; live `GET /missing-review-link` = 404. |
| F-1-3 | Added route announcers and heading focus for app, legal, and 404 routes, including history return. | `route changes focus the destination heading and announce it`; live Home → Privacy → Back check. |
| F-1-4 | Added description, canonical, Open Graph, Twitter, favicon, Apple icon, and theme metadata to Privacy, Terms, and 404. | `every public route has its own complete metadata and the deployment config preserves 404s`; live route checks. |
| F-1-5 | Matched legal/404 header and footer content to the app shell, including Demo, How it works, Privacy, theme control, legal links, Param Factory, and build label. | `keyboard entry, skip link, legal shells, and designed 404 remain operable`; live legal navigation check. |
| F-1-6 | Registered `demo-no-setup` in claims and added a clean-context, visible-result test. | `npm run test:e2e -- --grep @claim:demo-no-setup`; live demo screenshot. |
| F-1-7 | Replaced mixed input labels with **email export** and separated **local audit summary** from a downloaded **receipt**. | `.factory/copy-audit.md`; README and live landing review. |
| F-1-8 | Rewrote first-use file wording as EML message files/MBOX email collections and explained hashes as file hashes. | `.factory/copy-audit.md`; live landing and README review. |
| F-1-9 | Split the long README feature sentence into short, single-job sentences. | `.factory/copy-audit.md`; README review (all reviewed feature sentences ≤22 words). |
| F-1-10 | Changed the 404 heading to “Page not found.” | `keyboard entry, skip link, legal shells, and designed 404 remain operable`; live 404 body check. |

## Earlier findings rechecked

The review reports no earlier `review-*` or `polish-*` files. Its historical recheck items remain covered by the clean-clone claim suite: parsing and hash handling (`mime-audit`), storage isolation (`local-only`), offline reload (`offline-reload`), complete exports and formula protection (`receipt-exports` plus regression test), persistence (`report-persistence`), free use (`free-use`), keyboard/mobile/Axe checks, and the static response policy test.

Live evidence is retained in `.factory/evidence/live-demo/`; source-controlled local visual checks are `.factory/evidence/demo-390.png` and `.factory/evidence/demo-1440.png`.
