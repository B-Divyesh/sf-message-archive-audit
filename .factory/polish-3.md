# Polish 3 — cumulative finding closure

Target: <https://message-archive-audit.sociobot.in>  
Base review: `496678b243b22e889772b918c1cf4a900dfdf271`  
Repair source: `12fc36b82d47adc4f3382b3b3ce1ed86054472f7`

All review and polish reports were reread. Every identifier below is closed; no finding is deferred by severity.

| Finding | Change made or retained verified repair | Evidence |
| --- | --- | --- |
| F-1-1 | Retained the direct `?demo=1` sample route, sticky banner, deferred receipt reveal, and completed realistic sample. | `@claim:demo-no-setup`; [live 390px receipt](evidence/polish-3-live/demo-viewport-390.png); cold live check passed. |
| F-1-2 | Retained explicit `/demo` rewrite and Static Web Apps 404 override without a catch-all app fallback. | `static response policy`; live `GET /missing-polish-3` returned HTTP 404 with the designed page. |
| F-1-3 | Retained h1 focus and polite route announcements for app, legal, 404, and history return. | `route changes focus the destination heading and announce it`; fresh live focus/announcement check passed. |
| F-1-4 | Retained complete route-specific title, description, canonical, OG/Twitter, theme color, favicon, and Apple icon metadata. | `every public route has its own complete metadata and the deployment config preserves 404s`; fresh live metadata check. |
| F-1-5 | Retained the consistent wordmark, navigation, color control, footer links, Param Factory credit, and build label on app/legal/404/offline shells. | `keyboard entry, skip link, legal shells, and designed 404 remain operable`; live route shell check. |
| F-1-6 | Retained the registered one-click setup-free sample claim. | `@claim:demo-no-setup`; live completed-demo screenshots. |
| F-1-7 | Retained the terms **email export**, **local audit summary**, and **receipt** consistently. | `.factory/copy-audit.md`; README and live copy recheck. |
| F-1-8 | Retained plain first-use EML/MBOX and file-hash wording. | `.factory/copy-audit.md`; `@claim:mime-audit`. |
| F-1-9 | Retained short, single-purpose README sentences. | `.factory/copy-audit.md`; all audited sentences are at most 22 words. |
| F-1-10 | Retained `Page not found` as the direct 404 h1. | route/metadata browser test; live `/404` check. |
| F-2-1 | Retained registered missing-reference detection across metric, ledger, and CSV receipt. | `@claim:missing-attachment-detection`. |
| F-2-2 | Retained registered visible folder inventory for matched, ambiguous, and unreferenced paths. | `@claim:folder-inventory`. |
| F-2-3 | Retained request recording that permits only expected same-origin static GETs across landing, demo, real audit, and exports. | `@claim:no-telemetry`; fresh live request path check. |
| F-2-4 | Retained independently claimed demo reset and confirmed local-summary deletion. | `@claim:demo-reset`; `@claim:clear-report`. |
| F-2-5 | Retained supported-scope behavior: encrypted-style input fails, receipts describe selected files only, and no provider request occurs. | `@claim:scope-limits`; parser tests. |
| F-2-6 | Retained exact demo title, canonical, OG, and Twitter values. | route metadata browser test; live demo metadata check. |
| F-2-7 | Retained the direct `File storage and audit limits` heading. | `.factory/copy-audit.md`; live home check. |
| F-2-8 | Retained corrected whitespace-token counts and their stated convention. | `.factory/copy-audit.md`. |
| F-3-1 | Changed demo-theme handling to in-memory `demoThemeDark`; demo neither reads nor writes the production key. The strengthened claim starts with a real report and dark preference, exercises the demo control, leaves demo, and compares both localStorage and IndexedDB before/during/after. | `@claim:local-only`; live preference-isolation check; [live demo receipt](evidence/polish-3-live/demo-viewport-390.png). |
| F-3-2 | Kept the Privacy header link visible at 390px; only `How it works` collapses on the phone. | `desktop and 390px mobile have no overflow, undersized controls, or console errors`; [live 390px home](evidence/polish-3-live/home-viewport-390.png). |

## Verification summary

- Every one of the 13 declared claim commands passed independently in a clean clone.
- Clean-clone unit, type/lint, build, and full browser suite passed: 21 unit tests and 21 Playwright tests.
- Local URL check, Lighthouse (95/100/100/100), and Playwright Axe integration passed.
- The static deployment completed. A fresh live browser check passed on root, demo, Privacy, Terms, and 404; it also passed offline demo reload, theme isolation, mobile Privacy availability, route focus, and metadata checks.
