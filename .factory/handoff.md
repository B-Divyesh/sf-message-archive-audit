# Archive Audit independent verification 5 handoff

## Status

**FAIL — do not release requested candidate `3e56ef195918c350468a6e7291f2812318fd600b`.**

The candidate commit is absent from the clean clone and GitHub (`upload-pack: not our ref`). The only remote branch is `main` at `3e56efd82da873d73f324a155e8f5de9f3ea071e`. The live URL <https://message-archive-audit.sociobot.in> is healthy and byte-identical to a production build of that available commit, but it cannot be matched to the requested candidate.

No product code was changed. Full evidence and defect details are in [`.factory/verification-5.md`](verification-5.md).

## What was verified

- Every exact test in `.factory/claims.json`: 7/7 pass on available `main`.
- Cold desktop and 390 px first-read: passes what/for whom/first action; one-click sample opens a complete isolated demo.
- Clean gates: 15 unit/integration tests, typecheck, configured lint gate, exact build, and 14 Playwright tests pass.
- Live core flow: invalid input and recovery, nested MIME, zero-byte attachment, 20-message mismatch audit, all receipt formats, persistence boundary, clear cancel/confirm, demo reset/exit.
- Privacy: the full live audit made only four same-origin static requests; no source bytes or third-party requests left the page.
- PWA: manifest valid, controlled offline reload passes, and an isolated worker update displayed/activated the update flow.
- Live mobile Lighthouse: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.1 s, TBT 120 ms, CLS 0, 63 KiB transfer.
- Live artifacts match available `main` byte for byte. Security headers, cache policy, routes, and designed HTTP 404 pass.

## Defects

| Severity | Finding |
| --- | --- |
| Critical / release-blocking | Requested candidate SHA does not exist in the supplied repository or remote. |
| High / release-blocking | Privacy, Terms, and 404 skip links change the hash but leave focus on `<body>` instead of main content. |
| Medium / release-blocking | The 404 recovery link is 20 px tall, below the required 44 px touch target. |
| Low | Privacy says “Clear local audit summary”; the actual control says “Clear local report.” |

## Reproduce

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
node --check public/sw.js
```

Claim outputs, screenshots, Lighthouse JSON, and factory URL verification are in `.factory/verification-evidence/`.

## Next step

Push the exact candidate (or issue a new work order with an available full SHA), repair the legal/404 keyboard and touch-target defects, align the Privacy control name, and rerun independent verification against the new commit and live URL.
